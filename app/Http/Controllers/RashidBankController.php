<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\RashidTransaction;
use App\Models\User;
use App\Models\OpeningBalance;
use App\Models\ReceiveTransaction;
use App\Models\ExchangeTransaction;
use App\Models\SellTransaction;
use App\Models\BuyTransaction;
use App\Models\ZainCashTransaction;
use App\Models\RafidainTransaction;
use App\Models\SuperKeyTransaction;
use App\Services\CashBalanceService;
use Illuminate\Support\Facades\DB;

class RashidBankController extends Controller
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

    // Display the Rashid Bank page
    public function index()
    {
        $sessionUser = $this->checkAuth();
        if ($sessionUser instanceof \Illuminate\Http\RedirectResponse) {
            return $sessionUser;
        }

        // تهيئة الرصيد النقدي المركزي من الرصيد الافتتاحي إذا لم يكن موجوداً
        CashBalanceService::initializeIfNotExists($sessionUser['id']);

        // الحصول على الرصيد النقدي المركزي
        $currentCashBalance = CashBalanceService::getCurrentBalance($sessionUser['id']);

        // Get user's opening balance for Rashid Bank
        $openingBalance = OpeningBalance::where('user_id', $sessionUser['id'])->first();
        $rashidBalance = $openingBalance ? $openingBalance->rashid : 0;
        $openingCashBalance = $openingBalance ? $openingBalance->naqa : 0;

        // Calculate current balance based on transactions
        $totalCharges = RashidTransaction::where('user_id', $sessionUser['id'])
            ->where('transaction_type', 'charge')
            ->sum('amount'); // فقط المبلغ، ليس العمولة

        $totalPayments = RashidTransaction::where('user_id', $sessionUser['id'])
            ->where('transaction_type', 'payment')
            ->sum('amount'); // فقط المبلغ، ليس العمولة

        $currentBalance = $rashidBalance - $totalCharges + $totalPayments;

        // Get recent transactions
        $transactions = RashidTransaction::where('user_id', $sessionUser['id'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Calculate totals for quick report (all operations, not just today)
        $totalChargesAmount = $totalCharges; // already calculated above
        $totalPaymentsAmount = $totalPayments; // already calculated above
        $totalOperations = RashidTransaction::where('user_id', $sessionUser['id'])->count();

        return Inertia::render('Employee/RashidBank', [
            'user' => $sessionUser,
            'currentBalance' => $currentBalance,
            'currentCashBalance' => $currentCashBalance, // الرصيد النقدي المركزي
            'openingCashBalance' => $openingCashBalance, // الرصيد النقدي الافتتاحي
            'transactions' => $transactions,
            'openingBalance' => $rashidBalance,
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
        $sessionUser = $this->getSessionUser();
        if (!$sessionUser) {
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
            $rashidBalance = $openingBalance ? $openingBalance->rashid : 0;

            $totalCharges = RashidTransaction::where('user_id', $sessionUser['id'])
                ->where('transaction_type', 'charge')
                ->sum('amount');

            $totalPayments = RashidTransaction::where('user_id', $sessionUser['id'])
                ->where('transaction_type', 'payment')
                ->sum('amount');

            $previousBalance = $rashidBalance - $totalCharges + $totalPayments;
            $amount = $request->amount;
            $commission = $request->commission ?? RashidTransaction::calculateCommission($amount, 'charge');
            $totalWithCommission = $amount + $commission;
            $newBalance = $previousBalance - $amount; // نقص المبلغ من الرصيد المصرفي عند الشحن

            // Create transaction record
            $transaction = RashidTransaction::create([
                'user_id' => $sessionUser['id'],
                'reference_number' => $request->reference_number,
                'transaction_type' => 'charge',
                'amount' => $amount,
                'commission' => $commission,
                'total_with_commission' => $totalWithCommission,
                'balance_change' => -$amount, // نقص المبلغ من الرصيد المصرفي
                'previous_balance' => $previousBalance,
                'new_balance' => $newBalance,
                'notes' => $request->notes,
                'entered_by' => $sessionUser['name']
            ]);

            // تحديث الرصيد النقدي المركزي
            $cashBalanceData = CashBalanceService::updateForBankingTransaction(
                $sessionUser['id'], // معرف المستخدم
                'charge', // نوع العملية
                $amount, // المبلغ الأساسي
                $commission, // العمولة
                'rashid_bank',
                $transaction->id,
                $request->notes
            );

            DB::commit();

            // إعادة حساب التقارير بعد العملية الجديدة
            $updatedTotalCharges = RashidTransaction::where('user_id', $sessionUser['id'])
                ->where('transaction_type', 'charge')
                ->sum('amount');

            $updatedTotalPayments = RashidTransaction::where('user_id', $sessionUser['id'])
                ->where('transaction_type', 'payment')
                ->sum('amount');

            $updatedTotalOperations = RashidTransaction::where('user_id', $sessionUser['id'])->count();

            return response()->json([
                'success' => true,
                'message' => 'تم إجراء عملية الشحن بنجاح',
                'transaction' => $transaction,
                'new_balance' => $newBalance,
                'new_cash_balance' => $cashBalanceData['new_balance'], // الرصيد النقدي المركزي المحدث
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
        $sessionUser = $this->getSessionUser();
        if (!$sessionUser) {
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
            $rashidBalance = $openingBalance ? $openingBalance->rashid : 0;

            $totalCharges = RashidTransaction::where('user_id', $sessionUser['id'])
                ->where('transaction_type', 'charge')
                ->sum('amount');

            $totalPayments = RashidTransaction::where('user_id', $sessionUser['id'])
                ->where('transaction_type', 'payment')
                ->sum('amount');

            $previousBalance = $rashidBalance - $totalCharges + $totalPayments;
            $amount = $request->amount;
            $commission = $request->commission ?? RashidTransaction::calculateCommission($amount, 'payment');
            $totalWithCommission = $amount + $commission;

            // التحقق من الرصيد النقدي المركزي بدلاً من رصيد المصرف
            $currentCashBalance = CashBalanceService::getCurrentBalance($sessionUser['id']);
            if ($currentCashBalance < $totalWithCommission) {
                return response()->json([
                    'success' => false,
                    'message' => 'الرصيد النقدي المركزي غير كافي لإجراء هذه العملية. المطلوب: ' . number_format($totalWithCommission) . ' د.ع، المتوفر: ' . number_format($currentCashBalance) . ' د.ع'
                ], 400);
            }

            $newBalance = $previousBalance + $amount; // زيادة المبلغ للرصيد المصرفي عند الدفع

            // Create transaction record
            $transaction = RashidTransaction::create([
                'user_id' => $sessionUser['id'],
                'reference_number' => $request->reference_number,
                'transaction_type' => 'payment',
                'amount' => $amount,
                'commission' => $commission,
                'total_with_commission' => $totalWithCommission,
                'balance_change' => +$amount, // زيادة المبلغ للرصيد المصرفي
                'previous_balance' => $previousBalance,
                'new_balance' => $newBalance,
                'notes' => $request->notes,
                'entered_by' => $sessionUser['name']
            ]);

            // تحديث الرصيد النقدي المركزي
            $cashBalanceData = CashBalanceService::updateForBankingTransaction(
                $sessionUser['id'], // معرف المستخدم
                'payment', // نوع العملية
                $amount, // المبلغ الأساسي
                $commission, // العمولة
                'rashid_bank',
                $transaction->id,
                $request->notes
            );

            DB::commit();

            // إعادة حساب التقارير بعد العملية الجديدة
            $updatedTotalCharges = RashidTransaction::where('user_id', $sessionUser['id'])
                ->where('transaction_type', 'charge')
                ->sum('amount');

            $updatedTotalPayments = RashidTransaction::where('user_id', $sessionUser['id'])
                ->where('transaction_type', 'payment')
                ->sum('amount');

            $updatedTotalOperations = RashidTransaction::where('user_id', $sessionUser['id'])->count();

            return response()->json([
                'success' => true,
                'message' => 'تم إجراء عملية الدفع بنجاح',
                'transaction' => $transaction,
                'new_balance' => $newBalance,
                'new_cash_balance' => $cashBalanceData['new_balance'], // الرصيد النقدي المركزي المحدث
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
        $sessionUser = $this->getSessionUser();
        if (!$sessionUser) {
            return response()->json(['error' => 'User not authenticated'], 401);
        }

        $perPage = $request->get('per_page', 20);
        $transactions = RashidTransaction::where('user_id', $sessionUser['id'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json($transactions);
    }

    // Get detailed report
    public function getDetailedReport(Request $request)
    {
        $sessionUser = $this->getSessionUser();
        if (!$sessionUser) {
            return response()->json(['error' => 'User not authenticated'], 401);
        }

        try {
            // Get all charge transactions
            $chargeTransactions = RashidTransaction::where('user_id', $sessionUser['id'])
                ->where('transaction_type', 'charge')
                ->get();

            // Get all payment transactions
            $paymentTransactions = RashidTransaction::where('user_id', $sessionUser['id'])
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
            $rashidBalance = $openingBalance ? $openingBalance->rashid : 0;

            // Calculate current balance
            $currentBalance = $rashidBalance - $totalCharges + $totalPayments;

            return response()->json([
                'success' => true,
                'report' => [
                    'opening_balance' => $rashidBalance,
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
