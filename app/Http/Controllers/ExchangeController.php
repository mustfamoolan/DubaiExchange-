<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ExchangeTransaction;
use App\Models\User;
use App\Models\OpeningBalance;
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
     * حساب الرصيد الحالي للموظف حسب العملة
     */
    private function getEmployeeCurrentBalance($userId, $currency = 'iqd')
    {
        $openingBalance = OpeningBalance::where('user_id', $userId)->first();

        if ($currency === 'usd') {
            // حساب رصيد الدولار
            $openingUsd = $openingBalance ? $openingBalance->usd_cash : 0;

            // حساب إجمالي المستلم بالدولار (من سندات القبض)
            $totalReceivedUsd = \App\Models\ReceiveTransaction::where('user_id', $userId)
                ->where('currency', 'usd')
                ->sum('amount'); // الكمية الأصلية بالدولار

            // حساب إجمالي المصروف بالدولار
            $totalExchangedUsd = ExchangeTransaction::where('user_id', $userId)
                ->where('currency_type', 'usd')
                ->sum('amount');

            return $openingUsd + $totalReceivedUsd - $totalExchangedUsd;
        } else {
            // حساب رصيد الدينار العراقي (النقدي)
            $openingIqd = $openingBalance ? $openingBalance->naqa : 0;

            // حساب إجمالي المستلم بالدينار (من سندات القبض)
            // نأخذ amount_in_iqd التي تحتوي على المبلغ محولاً للدينار
            $totalReceivedIqd = \App\Models\ReceiveTransaction::where('user_id', $userId)
                ->sum('amount_in_iqd');

            // حساب إجمالي المصروف بالدينار
            $totalExchangedIqd = ExchangeTransaction::where('user_id', $userId)
                ->where(function($query) {
                    $query->where('currency_type', 'iqd')
                          ->orWhereNull('currency_type'); // للمعاملات القديمة
                })
                ->sum('amount');

            return $openingIqd + $totalReceivedIqd - $totalExchangedIqd;
        }
    }    /**
     * التحقق من كفاية رصيد العميل
     */
    private function checkCustomerBalance($customerId, $amount, $currency)
    {
        $customer = \App\Models\Customer::find($customerId);
        if (!$customer) {
            return false;
        }

        $currentBalance = $currency === 'usd'
            ? $customer->remaining_balance_usd
            : $customer->remaining_balance_iqd;

        return $currentBalance >= $amount;
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

        // حساب الأرصدة الحالية للموظف
        $currentIqdBalance = $this->getEmployeeCurrentBalance($sessionUser['id'], 'iqd');
        $currentUsdBalance = $this->getEmployeeCurrentBalance($sessionUser['id'], 'usd');

        // الحصول على الرصيد الافتتاحي النقدي (للعرض فقط)
        $openingBalance = OpeningBalance::where('user_id', $sessionUser['id'])->first();
        $openingNaqaBalance = $openingBalance ? $openingBalance->naqa : 0;

        // حساب إجمالي المستلم (من سندات القبض) - للعرض في التقرير
        $totalReceived = \App\Models\ReceiveTransaction::where('user_id', $sessionUser['id'])
            ->sum('amount_in_iqd');

        // حساب إجمالي المصروف - للعرض في التقرير
        $totalExchanged = ExchangeTransaction::where('user_id', $sessionUser['id'])
            ->sum('amount');

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
            'total_received' => $totalReceived,
            'current_iqd_balance' => $currentIqdBalance,
            'current_usd_balance' => $currentUsdBalance
        ];

        return Inertia::render('Employee/Exchange', [
            'user' => $sessionUser,
            'currentBalance' => $currentIqdBalance, // للتوافق مع الكود الحالي
            'currentIqdBalance' => $currentIqdBalance,
            'currentUsdBalance' => $currentUsdBalance,
            'openingBalance' => $openingNaqaBalance,
            'transactions' => $transactions,
            'quickReport' => $quickReport
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
            'currency' => 'nullable|string|in:iqd,usd',
            'description' => 'required|string|max:1000',
            'exchangeType' => 'required|string|in:customer,general',
            'selectedCustomer' => 'nullable|array'
        ]);

        DB::beginTransaction();

        try {
            $currencyType = $request->currency ?: 'iqd';
            $amount = $request->amount;

            // التحقق من رصيد الموظف حسب نوع العملة
            $employeeCurrentBalance = $this->getEmployeeCurrentBalance($sessionUser['id'], $currencyType);

            if ($employeeCurrentBalance < $amount) {
                return response()->json([
                    'success' => false,
                    'message' => 'رصيد الموظف غير كافي لإجراء هذه العملية' .
                               ' (الرصيد الحالي: ' . number_format($employeeCurrentBalance, 2) .
                               ' ' . strtoupper($currencyType) . ')'
                ], 400);
            }

            // إذا كان صرف لعميل، التحقق من رصيد العميل
            if ($request->exchangeType === 'customer' && $request->selectedCustomer && isset($request->selectedCustomer['id'])) {
                $customerId = $request->selectedCustomer['id'];

                if (!$this->checkCustomerBalance($customerId, $amount, $currencyType)) {
                    $customer = \App\Models\Customer::find($customerId);
                    $customerBalance = $currencyType === 'usd'
                        ? $customer->remaining_balance_usd
                        : $customer->remaining_balance_iqd;

                    return response()->json([
                        'success' => false,
                        'message' => 'رصيد العميل غير كافي لإجراء هذه العملية' .
                                   ' (الرصيد الحالي: ' . number_format($customerBalance, 2) .
                                   ' ' . strtoupper($currencyType) . ')'
                    ], 400);
                }
            }

            // حساب الرصيد الجديد للموظف
            $newEmployeeBalance = $employeeCurrentBalance - $amount;

            // Create transaction record
            $transaction = ExchangeTransaction::create([
                'user_id' => $sessionUser['id'],
                'invoice_number' => $request->invoiceNumber,
                'amount' => $amount,
                'currency_type' => $currencyType,
                'description' => $request->description,
                'paid_to' => $request->paidTo ?? null,
                'previous_balance' => $employeeCurrentBalance,
                'new_balance' => $newEmployeeBalance,
                'entered_by' => $sessionUser['name'],
                'notes' => $request->notes ?? null
            ]);

            // إنشاء معاملة عميل فقط إذا كان نوع الصرف "لعميل"
            if ($request->exchangeType === 'customer' && $request->selectedCustomer && isset($request->selectedCustomer['id'])) {
                $customer = \App\Models\Customer::find($request->selectedCustomer['id']);
                if ($customer) {
                    // تحديد نوع المعاملة (الصرافة دفعت للعميل)
                    $transactionType = 'delivered'; // تسليم (الصرافة دفعت للعميل)

                    \App\Models\CustomerTransaction::create([
                        'customer_id' => $customer->id,
                        'user_id' => $sessionUser['id'],
                        'transaction_code' => \App\Models\CustomerTransaction::generateTransactionCode(),
                        'transaction_type' => $transactionType,
                        'currency_type' => $currencyType,
                        'amount' => $amount,
                        'exchange_rate' => 1, // سعر الصرف 1 لأن المبلغ محدد بالعملة المطلوبة مباشرة
                        'description' => 'سند صرف رقم: ' . $request->invoiceNumber . ' - ' . ($request->description ?: 'بدون وصف') . ' (' . strtoupper($currencyType) . ')',
                        'notes' => $request->notes,
                        'transaction_date' => now()
                    ]);

                    // إعادة حساب رصيد العميل
                    $customer->updateBalances();
                }
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

            // حساب الأرصدة المحدثة
            $updatedIqdBalance = $this->getEmployeeCurrentBalance($sessionUser['id'], 'iqd');
            $updatedUsdBalance = $this->getEmployeeCurrentBalance($sessionUser['id'], 'usd');

            return response()->json([
                'success' => true,
                'message' => 'تم إجراء عملية الصرف بنجاح',
                'transaction' => $transaction,
                'new_balance' => $newEmployeeBalance,
                'currency_type' => $currencyType,
                'updated_report' => [
                    'exchanged_today' => $updatedExchangedToday,
                    'operations' => $updatedOperations,
                    'total_exchanged' => $updatedTotalExchanged,
                    'current_iqd_balance' => $updatedIqdBalance,
                    'current_usd_balance' => $updatedUsdBalance
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
