<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ExchangeTransaction;
use App\Models\User;
use App\Models\OpeningBalance;
use App\Services\CashBalanceService;
use App\Services\DollarBalanceService;
use Illuminate\Support\Facades\DB;

class ExchangeController extends Controller
{
    // Helper method to get session user
    private function getSessionUser()
    {
        // التحقق من تسجيل الدخول
        if (!session('logged_in') || session('user_type') !== 'employee') {
            return null;
        }

        $sessionUser = session('user_data');

        // التحقق من وجود بيانات المستخدم
        if (!$sessionUser) {
            return null;
        }

        return $sessionUser;
    }

    /**
     * التحقق من الصلاحية وإرجاع redirect إذا لم تكن صحيحة
     */
    private function checkAuth()
    {
        $sessionUser = $this->getSessionUser();
        if (!$sessionUser) {
            return redirect()->route('login')->with('error', 'جلسة العمل منتهية الصلاحية');
        }
        return $sessionUser;
    }

    // Display the Exchange page
    public function index()
    {
        $sessionUser = $this->checkAuth();
        if ($sessionUser instanceof \Illuminate\Http\RedirectResponse) {
            return $sessionUser;
        }

        // تهيئة الرصيد النقدي المركزي من الرصيد الافتتاحي إذا لم يكن موجوداً
        CashBalanceService::initializeIfNotExists($sessionUser['id']);

        // تهيئة الرصيد المركزي للدولار من الرصيد الافتتاحي إذا لم يكن موجوداً
        DollarBalanceService::initializeIfNotExists($sessionUser['id']);

        // الحصول على الرصيد النقدي المركزي
        $currentCashBalance = CashBalanceService::getCurrentBalance($sessionUser['id']);

        // الحصول على الرصيد المركزي للدولار
        $currentCentralDollarBalance = DollarBalanceService::getCurrentBalance($sessionUser['id']);

        // الحصول على الرصيد الافتتاحي النقدي
        $openingBalance = OpeningBalance::where('user_id', $sessionUser['id'])->first();
        $currentNaqaBalance = $openingBalance ? $openingBalance->naqa : 0;
        $openingCashBalance = $currentNaqaBalance; // استخدام الرصيد الافتتاحي للموظف

        // حساب إجمالي المستلم (من سندات القبض)
        $totalReceived = \App\Models\ReceiveTransaction::where('user_id', $sessionUser['id'])
            ->sum('amount_in_iqd');

        // حساب إجمالي المصروف
        $totalExchanged = ExchangeTransaction::where('user_id', $sessionUser['id'])
            ->sum('amount');

        // حساب الرصيد الحالي
        $currentBalance = $currentNaqaBalance + $totalReceived - $totalExchanged;

        // الحصول على المعاملات الأخيرة
        $transactions = ExchangeTransaction::where('user_id', $sessionUser['id'])
            ->latest()
            ->take(10)
            ->get();

        // إعداد التقرير السريع
        $quickReport = [
            'exchanged_today' => ExchangeTransaction::where('user_id', $sessionUser['id'])
                ->whereDate('created_at', today())
                ->sum('amount'),
            'operations' => ExchangeTransaction::where('user_id', $sessionUser['id'])
                ->whereDate('created_at', today())
                ->count(),
            'total_exchanged' => $totalExchanged,
            'total_received' => $totalReceived // إضافة إجمالي المستلم
        ];

        return Inertia::render('Employee/Exchange', [
            'user' => $sessionUser,
            'currentBalance' => $currentBalance,
            'openingBalance' => $currentNaqaBalance,
            'transactions' => $transactions,
            'quickReport' => $quickReport,
            'currentCashBalance' => $currentCashBalance,
            'currentCentralDollarBalance' => $currentCentralDollarBalance,
            'openingCashBalance' => $openingCashBalance
        ]);
    }

    // Process an exchange transaction
    public function store(Request $request)
    {
        $sessionUser = $this->checkAuth();
        if ($sessionUser instanceof \Illuminate\Http\RedirectResponse) {
            return response()->json(['error' => 'User not authenticated'], 401);
        }

        $request->validate([
            'invoiceNumber' => 'required|string',
            'amount' => 'required|numeric|min:0.01',
            'currency' => 'required|string|in:دينار عراقي,دولار أمريكي',
            'description' => 'required|string|max:1000',
            'selectedCustomer' => 'nullable|array'
        ]);

        DB::beginTransaction();

        try {
            // المبلغ كما هو (بدون تحويل)
            $amountInIqd = $request->amount;

            // الحصول على الرصيد النقدي المركزي الحالي
            $currentCashBalance = CashBalanceService::getCurrentBalance($sessionUser['id']);

            // الحصول على الرصيد المركزي للدولار الحالي
            $currentCentralDollarBalance = DollarBalanceService::getCurrentBalance($sessionUser['id']);

            // التحقق من كفاية الرصيد المناسب
            if ($request->currency === 'دولار أمريكي') {
                // للدولار، نتحقق من الرصيد المركزي للدولار
                if ($currentCentralDollarBalance < $request->amount) {
                    return response()->json([
                        'success' => false,
                        'message' => 'الرصيد المركزي للدولار غير كافي لإجراء هذه العملية'
                    ], 400);
                }
            } else {
                // للدينار، نتحقق من الرصيد النقدي المركزي
                if ($currentCashBalance < $request->amount) {
                    return response()->json([
                        'success' => false,
                        'message' => 'الرصيد النقدي المركزي غير كافي لإجراء هذه العملية'
                    ], 400);
                }
            }

            // حساب الرصيد الحالي للموظف (للسجلات القديمة)
            $openingBalance = OpeningBalance::where('user_id', $sessionUser['id'])->first();
            $currentNaqaBalance = $openingBalance ? $openingBalance->naqa : 0;

            // حساب إجمالي المستلم
            $totalReceived = \App\Models\ReceiveTransaction::where('user_id', $sessionUser['id'])
                ->sum('amount_in_iqd');

            // حساب إجمالي المصروف
            $totalExchanged = ExchangeTransaction::where('user_id', $sessionUser['id'])
                ->sum('amount');

            $previousBalance = $currentNaqaBalance + $totalReceived - $totalExchanged;
            $newBalance = $previousBalance - $request->amount;

            // Create transaction record
            $transaction = ExchangeTransaction::create([
                'user_id' => $sessionUser['id'],
                'invoice_number' => $request->invoiceNumber,
                'amount' => $request->amount, // المبلغ
                'currency' => $request->currency,
                'exchange_rate' => 1,
                'original_amount' => $request->amount, // المبلغ الأصلي بالعملة المختارة
                'description' => $request->description,
                'paid_to' => $request->paidTo ?? null,
                'previous_balance' => $previousBalance,
                'new_balance' => $newBalance,
                'entered_by' => $sessionUser['name'],
                'notes' => $request->notes ?? null
            ]);

            // إنشاء معاملة عميل إذا تم اختيار عميل
            if ($request->selectedCustomer && isset($request->selectedCustomer['id'])) {
                $customer = \App\Models\Customer::find($request->selectedCustomer['id']);
                if ($customer) {
                    // تحديد نوع المعاملة (الصرافة دفعت للعميل)
                    $transactionType = 'delivered'; // تسليم (الصرافة دفعت للعميل)

                    // تحديد المبلغ والعملة
                    if ($request->currency === 'دولار أمريكي') {
                        $amount = $request->amount; // المبلغ الأصلي بالدولار
                        $currencyType = 'usd';
                    } else {
                        $amount = $request->amount; // المبلغ بالدينار العراقي
                        $currencyType = 'iqd';
                    }

                    \App\Models\CustomerTransaction::create([
                        'customer_id' => $customer->id,
                        'user_id' => $sessionUser['id'],
                        'transaction_code' => \App\Models\CustomerTransaction::generateTransactionCode(),
                        'transaction_type' => $transactionType,
                        'currency_type' => $currencyType,
                        'amount' => $amount,
                        'exchange_rate' => 1,
                        'description' => 'سند صرف رقم: ' . $request->invoiceNumber . ' - ' . ($request->description ?: 'بدون وصف'),
                        'notes' => $request->notes,
                        'transaction_date' => now()
                    ]);

                    // إعادة حساب رصيد العميل
                    $customer->updateBalances();
                }
            }

            // تحديث الرصيد المناسب
            if ($request->currency === 'دولار أمريكي') {
                // تحديث الرصيد المركزي للدولار
                $dollarBalanceData = DollarBalanceService::updateForExchangeTransaction(
                    $sessionUser['id'],
                    $request->amount, // المبلغ بالدولار
                    $transaction->id,
                    $request->notes
                );
                $newCentralDollarBalance = $dollarBalanceData['new_balance'];
                $newCashBalance = $currentCashBalance; // الرصيد النقدي لا يتغير
            } else {
                // تحديث الرصيد النقدي المركزي
                $cashBalanceData = CashBalanceService::updateForExchangeTransaction(
                    $sessionUser['id'],
                    $request->amount, // المبلغ بالدينار العراقي
                    $transaction->id,
                    $request->notes
                );
                $newCashBalance = $cashBalanceData['new_balance'];
                $newCentralDollarBalance = $currentCentralDollarBalance; // الرصيد للدولار لا يتغير
            }

            DB::commit();

            // إعادة حساب التقارير بعد العملية الجديدة
            $updatedExchangedToday = ExchangeTransaction::where('user_id', $sessionUser['id'])
                ->whereDate('created_at', today())
                ->sum('amount');

            $updatedOperations = ExchangeTransaction::where('user_id', $sessionUser['id'])
                ->whereDate('created_at', today())
                ->count();

            $updatedTotalExchanged = ExchangeTransaction::where('user_id', $sessionUser['id'])
                ->sum('amount');

            return response()->json([
                'success' => true,
                'message' => 'تم إجراء عملية الصرف بنجاح',
                'transaction' => $transaction,
                'new_balance' => $newBalance,
                'new_cash_balance' => $newCashBalance,
                'new_central_dollar_balance' => $newCentralDollarBalance,
                'updated_report' => [
                    'exchanged_today' => $updatedExchangedToday,
                    'operations' => $updatedOperations,
                    'total_exchanged' => $updatedTotalExchanged
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء إجراء العملية: ' . $e->getMessage()
            ], 500);
        }
    }

    // Get detailed report
    public function getDetailedReport(Request $request)
    {
        $sessionUser = $this->getSessionUser();
        if (!$sessionUser) {
            return response()->json(['error' => 'User not authenticated'], 401);
        }

        $startDate = $request->get('start_date', today()->toDateString());
        $endDate = $request->get('end_date', today()->toDateString());

        $transactions = ExchangeTransaction::where('user_id', $sessionUser['id'])
            ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->orderBy('created_at', 'desc')
            ->get();

        $summary = [
            'total_amount' => $transactions->sum('amount'),
            'total_transactions' => $transactions->count(),
        ];

        return response()->json([
            'success' => true,
            'transactions' => $transactions,
            'summary' => $summary,
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate
            ]
        ]);
    }
}
