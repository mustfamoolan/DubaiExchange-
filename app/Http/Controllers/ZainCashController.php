<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ZainCashTransaction;
use App\Models\User;
use App\Models\OpeningBalance;
use App\Models\ReceiveTransaction;
use App\Models\ExchangeTransaction;
use App\Models\SellTransaction;
use App\Models\BuyTransaction;
use App\Models\RafidainTransaction;
use App\Models\RashidTransaction;
use App\Models\SuperKeyTransaction;
use Illuminate\Support\Facades\DB;

class ZainCashController extends Controller
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

    // Display the Zain Cash page
    public function index()
    {
        $sessionUser = $this->checkAuth();
        if ($sessionUser instanceof \Illuminate\Http\RedirectResponse) {
            return $sessionUser;
        }

        // Get user's opening balance for Zain Cash
        $openingBalance = OpeningBalance::where('user_id', $sessionUser['id'])->first();
        $zainCashBalance = $openingBalance ? $openingBalance->zain_cash : 0;
        $currentNaqaBalance = $openingBalance ? $openingBalance->naqa : 0;

        // حساب الرصيد النقدي الحالي الموحد (نقا + رافدين + راشد + زين كاش + سوبر كي)
        // حساب إجمالي المستلم (من سندات القبض)
        $totalReceived = \App\Models\ReceiveTransaction::where('user_id', $sessionUser['id'])
            ->sum('amount_in_iqd');

        // حساب إجمالي المصروف (من سندات الصرف)
        $totalExchanged = \App\Models\ExchangeTransaction::where('user_id', $sessionUser['id'])
            ->sum('amount');

        // حساب الرصيد النقدي الحالي الموحد
        $currentCashBalance = $currentNaqaBalance + $totalReceived - $totalExchanged;

        // Calculate current balance based on transactions
        $totalCharges = ZainCashTransaction::where('user_id', $sessionUser['id'])
            ->where('transaction_type', 'charge')
            ->sum('amount'); // فقط المبلغ، ليس العمولة

        $totalPayments = ZainCashTransaction::where('user_id', $sessionUser['id'])
            ->where('transaction_type', 'payment')
            ->sum('amount'); // فقط المبلغ، ليس العمولة

        $currentBalance = $zainCashBalance + $totalCharges - $totalPayments;

        // Get recent transactions
        $transactions = ZainCashTransaction::where('user_id', $sessionUser['id'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Calculate totals for quick report (all operations, not just today)
        $totalChargesAmount = $totalCharges; // already calculated above
        $totalPaymentsAmount = $totalPayments; // already calculated above
        $totalOperations = ZainCashTransaction::where('user_id', $sessionUser['id'])->count();

        return Inertia::render('Employee/ZainCash', [
            'user' => $sessionUser,
            'currentBalance' => $currentBalance,
            'currentCashBalance' => $currentCashBalance, // الرصيد النقدي الحالي الموحد
            'transactions' => $transactions,
            'openingBalance' => $zainCashBalance,
            'quickReport' => [
                'charges' => $totalChargesAmount,
                'payments' => $totalPaymentsAmount,
                'operations' => $totalOperations
            ]
        ]);
    }

    // Process a charge transaction
    public function charge(Request $request)
    {
        $sessionUser = $this->checkAuth();
        if ($sessionUser instanceof \Illuminate\Http\RedirectResponse) {
            return response()->json(['error' => 'User not authenticated'], 401);
        }

        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'commission' => 'nullable|numeric|min:0',
            'reference_number' => 'required|string',
            'notes' => 'nullable|string|max:1000'
        ]);

        DB::beginTransaction();

        try {
            // Get current balance from opening balance + transactions
            $openingBalance = OpeningBalance::where('user_id', $sessionUser['id'])->first();
            $zainCashBalance = $openingBalance ? $openingBalance->zain_cash : 0;

            $totalCharges = ZainCashTransaction::where('user_id', $sessionUser['id'])
                ->where('transaction_type', 'charge')
                ->sum('amount');

            $totalPayments = ZainCashTransaction::where('user_id', $sessionUser['id'])
                ->where('transaction_type', 'payment')
                ->sum('amount');

            $previousBalance = $zainCashBalance + $totalCharges - $totalPayments;
            $amount = $request->amount;
            $commission = $request->commission ?? ZainCashTransaction::calculateCommission($amount, 'charge');
            $totalWithCommission = $amount + $commission;
            $newBalance = $previousBalance + $amount; // زيادة المبلغ للرصيد المصرفي عند الشحن

            // Create transaction record
            $transaction = ZainCashTransaction::create([
                'user_id' => $sessionUser['id'],
                'reference_number' => $request->reference_number,
                'transaction_type' => 'charge',
                'amount' => $amount,
                'commission' => $commission,
                'total_with_commission' => $totalWithCommission,
                'balance_change' => +$amount, // زيادة المبلغ إلى الرصيد المصرفي
                'previous_balance' => $previousBalance,
                'new_balance' => $newBalance,
                'notes' => $request->notes,
                'entered_by' => $sessionUser['name']
            ]);

            DB::commit();

            // إعادة حساب التقارير بعد العملية الجديدة
            $updatedTotalCharges = ZainCashTransaction::where('user_id', $sessionUser['id'])
                ->where('transaction_type', 'charge')
                ->sum('amount');

            $updatedTotalPayments = ZainCashTransaction::where('user_id', $sessionUser['id'])
                ->where('transaction_type', 'payment')
                ->sum('amount');

            $updatedTotalOperations = ZainCashTransaction::where('user_id', $sessionUser['id'])->count();

            // حساب الرصيد النقدي الموحد الحالي (مع العمليات الجديدة)
            $updatedReceiveTotal = ReceiveTransaction::where('user_id', $sessionUser['id'])->sum('amount');
            $updatedExchangeTotal = ExchangeTransaction::where('user_id', $sessionUser['id'])->sum('amount');
            $updatedSellTotal = SellTransaction::where('user_id', $sessionUser['id'])->sum('total_amount');
            $updatedBuyTotal = BuyTransaction::where('user_id', $sessionUser['id'])->sum('total_amount');

            // حساب إجمالي العمولات من جميع المصارف (تزيد الرصيد النقدي)
            $updatedZainCommissions = ZainCashTransaction::where('user_id', $sessionUser['id'])->sum('commission');
            $updatedRafidainCommissions = RafidainTransaction::where('user_id', $sessionUser['id'])->sum('commission');
            $updatedRashidCommissions = RashidTransaction::where('user_id', $sessionUser['id'])->sum('commission');
            $updatedSuperKeyCommissions = SuperKeyTransaction::where('user_id', $sessionUser['id'])->sum('commission');

            $totalCommissions = $updatedZainCommissions + $updatedRafidainCommissions + $updatedRashidCommissions + $updatedSuperKeyCommissions;

            // حساب المبالغ الأساسية للشحن والدفع من جميع المصارف
            $updatedZainCharges = ZainCashTransaction::where('user_id', $sessionUser['id'])->where('transaction_type', 'charge')->sum('amount');
            $updatedZainPayments = ZainCashTransaction::where('user_id', $sessionUser['id'])->where('transaction_type', 'payment')->sum('amount');
            $updatedRafidainCharges = RafidainTransaction::where('user_id', $sessionUser['id'])->where('transaction_type', 'charge')->sum('amount');
            $updatedRafidainPayments = RafidainTransaction::where('user_id', $sessionUser['id'])->where('transaction_type', 'payment')->sum('amount');
            $updatedRashidCharges = RashidTransaction::where('user_id', $sessionUser['id'])->where('transaction_type', 'charge')->sum('amount');
            $updatedRashidPayments = RashidTransaction::where('user_id', $sessionUser['id'])->where('transaction_type', 'payment')->sum('amount');
            $updatedSuperKeyCharges = SuperKeyTransaction::where('user_id', $sessionUser['id'])->where('transaction_type', 'charge')->sum('amount');
            $updatedSuperKeyPayments = SuperKeyTransaction::where('user_id', $sessionUser['id'])->where('transaction_type', 'payment')->sum('amount');

            $totalCharges = $updatedZainCharges + $updatedRafidainCharges + $updatedRashidCharges + $updatedSuperKeyCharges;
            $totalPayments = $updatedZainPayments + $updatedRafidainPayments + $updatedRashidPayments + $updatedSuperKeyPayments;

            // حساب الرصيد النقدي الأساسي من opening_balance
            $totalCashBalance = OpeningBalance::where('user_id', $sessionUser['id'])->sum('naqa');

            // حساب الرصيد النقدي المحدث
            $updatedCurrentCashBalance = $totalCashBalance + $updatedReceiveTotal + $updatedSellTotal + $totalPayments + $totalCommissions
                                       - $updatedExchangeTotal - $updatedBuyTotal - $totalCharges;

            return response()->json([
                'success' => true,
                'message' => 'تم إجراء عملية الشحن بنجاح',
                'transaction' => $transaction,
                'new_balance' => $newBalance,
                'new_cash_balance' => $updatedCurrentCashBalance, // الرصيد النقدي المحدث
                'updated_report' => [
                    'charges' => $updatedTotalCharges,
                    'payments' => $updatedTotalPayments,
                    'operations' => $updatedTotalOperations
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

    // Process a payment transaction
    public function payment(Request $request)
    {
        $sessionUser = $this->checkAuth();
        if ($sessionUser instanceof \Illuminate\Http\RedirectResponse) {
            return response()->json(['error' => 'User not authenticated'], 401);
        }

        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'commission' => 'nullable|numeric|min:0',
            'reference_number' => 'required|string',
            'notes' => 'nullable|string|max:1000'
        ]);

        DB::beginTransaction();

        try {
            // Get current balance from opening balance + transactions
            $openingBalance = OpeningBalance::where('user_id', $sessionUser['id'])->first();
            $zainCashBalance = $openingBalance ? $openingBalance->zain_cash : 0;

            $totalCharges = ZainCashTransaction::where('user_id', $sessionUser['id'])
                ->where('transaction_type', 'charge')
                ->sum('amount');

            $totalPayments = ZainCashTransaction::where('user_id', $sessionUser['id'])
                ->where('transaction_type', 'payment')
                ->sum('amount');

            $previousBalance = $zainCashBalance + $totalCharges - $totalPayments;
            $amount = $request->amount;
            $commission = $request->commission ?? ZainCashTransaction::calculateCommission($amount, 'payment');
            $totalWithCommission = $amount + $commission;

            // Check if user has sufficient balance (فقط للمبلغ الأساسي)
            if ($previousBalance < $amount) {
                return response()->json([
                    'success' => false,
                    'message' => 'الرصيد غير كافي لإجراء هذه العملية'
                ], 400);
            }

            $newBalance = $previousBalance - $amount; // نقص المبلغ من الرصيد المصرفي عند الدفع

            // Create transaction record
            $transaction = ZainCashTransaction::create([
                'user_id' => $sessionUser['id'],
                'reference_number' => $request->reference_number,
                'transaction_type' => 'payment',
                'amount' => $amount,
                'commission' => $commission,
                'total_with_commission' => $totalWithCommission,
                'balance_change' => -$amount, // نقص المبلغ من الرصيد المصرفي
                'previous_balance' => $previousBalance,
                'new_balance' => $newBalance,
                'notes' => $request->notes,
                'entered_by' => $sessionUser['name']
            ]);

            DB::commit();

            // إعادة حساب التقارير بعد العملية الجديدة
            $updatedTotalCharges = ZainCashTransaction::where('user_id', $sessionUser['id'])
                ->where('transaction_type', 'charge')
                ->sum('amount');

            $updatedTotalPayments = ZainCashTransaction::where('user_id', $sessionUser['id'])
                ->where('transaction_type', 'payment')
                ->sum('amount');

            $updatedTotalOperations = ZainCashTransaction::where('user_id', $sessionUser['id'])->count();

            // حساب الرصيد النقدي الموحد الحالي (مع العمليات الجديدة)
            $updatedReceiveTotal = ReceiveTransaction::where('user_id', $sessionUser['id'])->sum('amount');
            $updatedExchangeTotal = ExchangeTransaction::where('user_id', $sessionUser['id'])->sum('amount');
            $updatedSellTotal = SellTransaction::where('user_id', $sessionUser['id'])->sum('total_amount');
            $updatedBuyTotal = BuyTransaction::where('user_id', $sessionUser['id'])->sum('total_amount');

            // حساب إجمالي العمولات من جميع المصارف (تزيد الرصيد النقدي)
            $updatedZainCommissions = ZainCashTransaction::where('user_id', $sessionUser['id'])->sum('commission');
            $updatedRafidainCommissions = RafidainTransaction::where('user_id', $sessionUser['id'])->sum('commission');
            $updatedRashidCommissions = RashidTransaction::where('user_id', $sessionUser['id'])->sum('commission');
            $updatedSuperKeyCommissions = SuperKeyTransaction::where('user_id', $sessionUser['id'])->sum('commission');

            $totalCommissions = $updatedZainCommissions + $updatedRafidainCommissions + $updatedRashidCommissions + $updatedSuperKeyCommissions;

            // حساب المبالغ الأساسية للشحن والدفع من جميع المصارف
            $updatedZainCharges = ZainCashTransaction::where('user_id', $sessionUser['id'])->where('transaction_type', 'charge')->sum('amount');
            $updatedZainPayments = ZainCashTransaction::where('user_id', $sessionUser['id'])->where('transaction_type', 'payment')->sum('amount');
            $updatedRafidainCharges = RafidainTransaction::where('user_id', $sessionUser['id'])->where('transaction_type', 'charge')->sum('amount');
            $updatedRafidainPayments = RafidainTransaction::where('user_id', $sessionUser['id'])->where('transaction_type', 'payment')->sum('amount');
            $updatedRashidCharges = RashidTransaction::where('user_id', $sessionUser['id'])->where('transaction_type', 'charge')->sum('amount');
            $updatedRashidPayments = RashidTransaction::where('user_id', $sessionUser['id'])->where('transaction_type', 'payment')->sum('amount');
            $updatedSuperKeyCharges = SuperKeyTransaction::where('user_id', $sessionUser['id'])->where('transaction_type', 'charge')->sum('amount');
            $updatedSuperKeyPayments = SuperKeyTransaction::where('user_id', $sessionUser['id'])->where('transaction_type', 'payment')->sum('amount');

            $totalCharges = $updatedZainCharges + $updatedRafidainCharges + $updatedRashidCharges + $updatedSuperKeyCharges;
            $totalPayments = $updatedZainPayments + $updatedRafidainPayments + $updatedRashidPayments + $updatedSuperKeyPayments;

            // حساب الرصيد النقدي الأساسي من opening_balance
            $totalCashBalance = OpeningBalance::where('user_id', $sessionUser['id'])->sum('naqa');

            // حساب الرصيد النقدي المحدث
            $updatedCurrentCashBalance = $totalCashBalance + $updatedReceiveTotal + $updatedSellTotal + $totalPayments + $totalCommissions
                                       - $updatedExchangeTotal - $updatedBuyTotal - $totalCharges;

            return response()->json([
                'success' => true,
                'message' => 'تم إجراء عملية الدفع بنجاح',
                'transaction' => $transaction,
                'new_balance' => $newBalance,
                'new_cash_balance' => $updatedCurrentCashBalance, // الرصيد النقدي المحدث
                'updated_report' => [
                    'charges' => $updatedTotalCharges,
                    'payments' => $updatedTotalPayments,
                    'operations' => $updatedTotalOperations
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

    // Get transaction history
    public function getTransactions(Request $request)
    {
        $sessionUser = $this->checkAuth();
        if ($sessionUser instanceof \Illuminate\Http\RedirectResponse) {
            return response()->json(['error' => 'User not authenticated'], 401);
        }

        $perPage = $request->get('per_page', 20);
        $transactions = ZainCashTransaction::where('user_id', $sessionUser['id'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json($transactions);
    }

    // Get detailed report
    public function getDetailedReport(Request $request)
    {
        $sessionUser = $this->checkAuth();
        if ($sessionUser instanceof \Illuminate\Http\RedirectResponse) {
            return response()->json(['error' => 'User not authenticated'], 401);
        }

        try {
            // Get all charge transactions
            $chargeTransactions = ZainCashTransaction::where('user_id', $sessionUser['id'])
                ->where('transaction_type', 'charge')
                ->get();

            // Get all payment transactions
            $paymentTransactions = ZainCashTransaction::where('user_id', $sessionUser['id'])
                ->where('transaction_type', 'payment')
                ->get();

            // Calculate totals
            $totalCharges = $chargeTransactions->sum('amount');
            $totalPayments = $paymentTransactions->sum('amount');
            $totalCommission = $chargeTransactions->sum('commission') + $paymentTransactions->sum('commission');
            $chargeCount = $chargeTransactions->count();
            $paymentCount = $paymentTransactions->count();
            $totalOperations = $chargeCount + $paymentCount;

            // Get opening balance
            $openingBalance = OpeningBalance::where('user_id', $sessionUser['id'])->first();
            $zainCashBalance = $openingBalance ? $openingBalance->zain_cash : 0;

            // Calculate current balance
            $currentBalance = $zainCashBalance + $totalCharges - $totalPayments;

            return response()->json([
                'success' => true,
                'report' => [
                    'opening_balance' => $zainCashBalance,
                    'current_balance' => $currentBalance,
                    'total_charges' => $totalCharges,
                    'total_payments' => $totalPayments,
                    'total_commission' => $totalCommission,
                    'charge_count' => $chargeCount,
                    'payment_count' => $paymentCount,
                    'total_operations' => $totalOperations,
                    'charge_transactions' => $chargeTransactions,
                    'payment_transactions' => $paymentTransactions
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء جلب التقرير: ' . $e->getMessage()
            ], 500);
        }
    }
}
