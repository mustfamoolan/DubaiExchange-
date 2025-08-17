<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ReceiveTransaction;
use App\Models\User;
use App\Models\OpeningBalance;
use App\Services\CashBalanceService;
use App\Services\DollarBalanceService;
use Illuminate\Support\Facades\DB;

class ReceiveController extends Controller
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

    // Display the Receive page
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
        $openingDollarBalance = $openingBalance ? $openingBalance->usd_cash : 0;

        // حساب إجمالي الدولار المقبوض
        $totalDollarsReceived = ReceiveTransaction::where('user_id', $sessionUser['id'])
            ->where('currency', 'دولار أمريكي')
            ->sum('amount');

        // حساب الرصيد الحالي للدولار
        $currentDollarBalance = $openingDollarBalance + $totalDollarsReceived;

        // حساب إجمالي المستلم (من سندات القبض)
        $totalReceived = ReceiveTransaction::where('user_id', $sessionUser['id'])
            ->sum('amount_in_iqd');

        // حساب إجمالي المصروف (من سندات الصرف)
        $totalExchanged = \App\Models\ExchangeTransaction::where('user_id', $sessionUser['id'])
            ->sum('amount');

        // حساب الرصيد الحالي الموحد
        $currentBalance = $currentNaqaBalance + $totalReceived - $totalExchanged;

        // حساب المبلغ المستلم اليوم (بالدينار العراقي)
        $todayReceived = ReceiveTransaction::where('user_id', $sessionUser['id'])
            ->whereDate('created_at', today())
            ->sum('amount_in_iqd');

        // الحصول على المعاملات الأخيرة
        $transactions = ReceiveTransaction::where('user_id', $sessionUser['id'])
            ->latest()
            ->take(10)
            ->get();

        // إعداد التقرير السريع
        $quickReport = [
            'received_today' => $todayReceived,
            'operations' => ReceiveTransaction::where('user_id', $sessionUser['id'])
                ->whereDate('created_at', today())
                ->count(),
            'total_received' => $totalReceived,
            'total_exchanged' => $totalExchanged // إضافة إجمالي المصروف للعرض الموحد
        ];

        return Inertia::render('Employee/Receive', [
            'user' => $sessionUser,
            'currentBalance' => $currentBalance,
            'currentCashBalance' => $currentCashBalance, // الرصيد النقدي المركزي
            'currentCentralDollarBalance' => $currentCentralDollarBalance, // الرصيد المركزي للدولار
            'currentDollarBalance' => $currentDollarBalance, // رصيد الدولار الحالي
            'openingBalance' => $currentNaqaBalance,
            'openingCashBalance' => $currentNaqaBalance, // الرصيد النقدي الافتتاحي
            'openingDollarBalance' => $openingDollarBalance, // رصيد الدولار الافتتاحي
            'transactions' => $transactions,
            'quickReport' => $quickReport
        ]);
    }

    // Process a receive transaction
    public function store(Request $request)
    {
        $sessionUser = $this->checkAuth();
        if ($sessionUser instanceof \Illuminate\Http\RedirectResponse) {
            return response()->json(['error' => 'User not authenticated'], 401);
        }

        $request->validate([
            'documentNumber' => 'required|string',
            'receivedFrom' => 'required|string|max:255',
            'selectedCustomer' => 'nullable|array',
            'amount' => 'required|numeric|min:0.01',
            'currency' => 'required|string|max:100',
            'exchange_rate' => 'nullable|numeric|min:0.01', // جعل سعر الصرف اختياري
            'description' => 'nullable|string|max:1000',
            'beneficiary' => 'required|string|max:255',
            'notes' => 'nullable|string|max:1000'
        ]);

        DB::beginTransaction();

        try {
            // الحصول على الرصيد الافتتاحي النقدي
            $openingBalance = OpeningBalance::where('user_id', $sessionUser['id'])->first();
            $currentNaqaBalance = $openingBalance ? $openingBalance->naqa : 0;

            // حساب إجمالي المستلم (من سندات القبض)
            $totalReceived = ReceiveTransaction::where('user_id', $sessionUser['id'])
                ->sum('amount_in_iqd');

            // حساب إجمالي المصروف (من سندات الصرف)
            $totalExchanged = \App\Models\ExchangeTransaction::where('user_id', $sessionUser['id'])
                ->sum('amount');

            // حساب الرصيد الحالي الموحد
            $currentBalance = $currentNaqaBalance + $totalReceived - $totalExchanged;

            // حساب المبلغ بالدينار العراقي
            // للدولار الأمريكي: المبلغ يبقى كما هو (لا يحول لدينار)
            // للدينار العراقي: المبلغ يبقى كما هو
            // للعملات الأخرى: يحول حسب سعر الصرف
            if ($request->currency === 'دولار أمريكي') {
                $amountInIqd = 0; // للدولار، لا نضيف للرصيد النقدي
            } else {
                $exchangeRate = $request->exchange_rate ?? 1;
                $amountInIqd = $request->amount * $exchangeRate;
            }

            $newBalance = $currentBalance + $amountInIqd;

            // Create transaction record
            $transaction = ReceiveTransaction::create([
                'user_id' => $sessionUser['id'],
                'document_number' => $request->documentNumber,
                'received_from' => $request->receivedFrom,
                'amount' => $request->amount,
                'currency' => $request->currency,
                'exchange_rate' => $request->exchange_rate ?? 1,
                'amount_in_iqd' => $amountInIqd,
                'description' => $request->description,
                'beneficiary' => $request->beneficiary,
                'receiver_name' => $sessionUser['name'],
                'previous_balance' => $currentBalance,
                'new_balance' => $newBalance,
                'notes' => $request->notes,
                'entered_by' => $sessionUser['name']
            ]);

            // تحديث الرصيد النقدي المركزي (فقط للعملات غير الدولار)
            $cashBalanceData = null;
            if ($request->currency !== 'دولار أمريكي') {
                $cashBalanceData = CashBalanceService::updateForReceiveTransaction(
                    $sessionUser['id'], // معرف المستخدم
                    $amountInIqd, // المبلغ بالدينار العراقي
                    $transaction->id,
                    $request->notes
                );
            } else {
                // للدولار، نحتاج الحصول على الرصيد الحالي فقط
                $cashBalanceData = ['new_balance' => CashBalanceService::getCurrentBalance($sessionUser['id'])];
            }

            // إنشاء معاملة عميل إذا تم اختيار عميل
            if ($request->selectedCustomer && isset($request->selectedCustomer['id'])) {
                $customer = \App\Models\Customer::find($request->selectedCustomer['id']);
                if ($customer) {
                    // تحديد نوع المعاملة والعملة
                    $transactionType = 'payment'; // دفع (العميل دفع للصرافة)

                    // تحديد المبلغ والعملة حسب نوع المعاملة
                    if ($request->currency === 'دولار أمريكي') {
                        $amount = $request->amount; // المبلغ الأصلي بالدولار
                        $currencyType = 'usd';
                    } else {
                        // للعملات الأخرى، المبلغ بالدينار العراقي
                        $amount = $amountInIqd;
                        $currencyType = 'iqd';
                    }

                    \App\Models\CustomerTransaction::create([
                        'customer_id' => $customer->id,
                        'user_id' => $sessionUser['id'],
                        'transaction_code' => \App\Models\CustomerTransaction::generateTransactionCode(),
                        'transaction_type' => 'received', // تم الاستلام من العميل
                        'currency_type' => $currencyType,
                        'amount' => $amount,
                        'exchange_rate' => $request->exchange_rate ?? 1,
                        'description' => 'سند قبض رقم: ' . $request->documentNumber . ' - ' . ($request->description ?: 'بدون وصف'),
                        'notes' => $request->notes,
                        'transaction_date' => now()
                    ]);

                    // إعادة حساب رصيد العميل
                    $customer->updateBalances();
                }
            }

            // تحديث رصيد الدولار إذا كان القبض بالدولار
            $newDollarBalance = null;
            $dollarBalanceData = null;
            if ($request->currency === 'دولار أمريكي') {
                // تحديث الرصيد المركزي للدولار
                $dollarBalanceData = DollarBalanceService::updateForReceiveTransaction(
                    $sessionUser['id'],
                    $request->amount,
                    $transaction->id,
                    $request->notes
                );

                $openingBalance = OpeningBalance::where('user_id', $sessionUser['id'])->first();
                if ($openingBalance) {
                    $openingBalance->usd_cash += $request->amount;
                    $openingBalance->save();
                    $newDollarBalance = $openingBalance->usd_cash;
                }
            }

            DB::commit();

            // إعادة حساب التقارير بعد العملية الجديدة مع الرصيد الموحد
            $updatedTodayReceived = ReceiveTransaction::where('user_id', $sessionUser['id'])
                ->whereDate('created_at', today())
                ->sum('amount_in_iqd');

            $updatedOperations = ReceiveTransaction::where('user_id', $sessionUser['id'])
                ->whereDate('created_at', today())
                ->count();

            $updatedTotalReceived = ReceiveTransaction::where('user_id', $sessionUser['id'])
                ->sum('amount_in_iqd');

            $updatedTotalExchanged = \App\Models\ExchangeTransaction::where('user_id', $sessionUser['id'])
                ->sum('amount');

            return response()->json([
                'success' => true,
                'message' => 'تم حفظ سند القبض بنجاح',
                'transaction' => $transaction,
                'new_balance' => $newBalance,
                'new_cash_balance' => $cashBalanceData['new_balance'], // الرصيد النقدي المركزي المحدث
                'new_central_dollar_balance' => $dollarBalanceData ? $dollarBalanceData['new_balance'] : DollarBalanceService::getCurrentBalance($sessionUser['id']), // الرصيد المركزي للدولار
                'new_dollar_balance' => $newDollarBalance, // رصيد الدولار المحدث
                'updated_report' => [
                    'received_today' => $updatedTodayReceived,
                    'operations' => $updatedOperations,
                    'total_received' => $updatedTotalReceived,
                    'total_exchanged' => $updatedTotalExchanged
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء حفظ سند القبض: ' . $e->getMessage()
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

        $transactions = ReceiveTransaction::where('user_id', $sessionUser['id'])
            ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->orderBy('created_at', 'desc')
            ->get();

        $summary = [
            'total_amount' => $transactions->sum('amount'),
            'total_amount_iqd' => $transactions->sum('amount_in_iqd'),
            'total_transactions' => $transactions->count(),
            'currencies' => $transactions->groupBy('currency')->map(function ($group) {
                return [
                    'currency' => $group->first()->currency,
                    'total_amount' => $group->sum('amount'),
                    'total_amount_iqd' => $group->sum('amount_in_iqd'),
                    'count' => $group->count()
                ];
            })->values(),
            'beneficiaries' => $transactions->groupBy('beneficiary')->map(function ($group) {
                return [
                    'beneficiary' => $group->first()->beneficiary,
                    'total_amount' => $group->sum('amount'),
                    'total_amount_iqd' => $group->sum('amount_in_iqd'),
                    'count' => $group->count()
                ];
            })->values(),
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
