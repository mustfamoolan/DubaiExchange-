<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\RafidainTransaction;
use App\Models\User;
use App\Models\OpeningBalance;
use App\Services\CashBalanceService;
use Illuminate\Support\Facades\DB;

class RafidainBankController extends Controller
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

    // Display the Rafidain Bank page
    public function index()
    {
        $sessionUser = $this->getSessionUser();
        if (!$sessionUser) {
            return redirect()->route('login')->with('error', 'جلسة العمل منتهية الصلاحية');
        }

        // Initialize central cash balance if not exists
        CashBalanceService::initializeIfNotExists($sessionUser['id']);

        // Get current central cash balance
        $currentCashBalance = CashBalanceService::getCurrentBalance($sessionUser['id']);

        // Get user's opening balance for Rafidain Bank
        $openingBalance = OpeningBalance::where('user_id', $sessionUser['id'])->first();
        $rafidainBalance = $openingBalance ? $openingBalance->rafidain : 0;

        // Calculate current balance based on transactions
        $totalCharges = RafidainTransaction::where('user_id', $sessionUser['id'])
            ->where('transaction_type', 'charge')
            ->sum('amount');

        $totalPayments = RafidainTransaction::where('user_id', $sessionUser['id'])
            ->where('transaction_type', 'payment')
            ->sum('amount');

        $currentBalance = $rafidainBalance - $totalCharges + $totalPayments;

        // Get recent transactions
        $transactions = RafidainTransaction::where('user_id', $sessionUser['id'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Calculate totals for quick report
        $totalOperations = RafidainTransaction::where('user_id', $sessionUser['id'])->count();

        return Inertia::render('Employee/RafidainBank', [
            'user' => $sessionUser,
            'currentBalance' => $currentBalance,
            'currentCashBalance' => $currentCashBalance,
            'transactions' => $transactions,
            'openingBalance' => $rafidainBalance,
            'openingCashBalance' => $currentCashBalance, // Pass current cash balance as opening
            'quickReport' => [
                'charges' => $totalCharges,
                'payments' => $totalPayments,
                'operations' => $totalOperations
            ]
        ]);
    }

    // Process a charge transaction
    // Handle charge transaction
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
            $amount = $request->amount;
            $commission = $request->commission ?? 0;
            $notes = $request->notes;

            // Calculate current balance before transaction
            $openingBalance = OpeningBalance::where('user_id', $sessionUser['id'])->first();
            $rafidainBalance = $openingBalance ? $openingBalance->rafidain : 0;

            $totalCharges = RafidainTransaction::where('user_id', $sessionUser['id'])
                ->where('transaction_type', 'charge')
                ->sum('amount');

            $totalPayments = RafidainTransaction::where('user_id', $sessionUser['id'])
                ->where('transaction_type', 'payment')
                ->sum('amount');

            $previousBalance = $rafidainBalance - $totalCharges + $totalPayments;
            $newBalance = $previousBalance - $amount; // شحن ينقص من رصيد المصرف

            // Create transaction record
            $transaction = RafidainTransaction::create([
                'user_id' => $sessionUser['id'],
                'reference_number' => $request->reference_number,
                'transaction_type' => 'charge',
                'amount' => $amount,
                'commission' => $commission,
                'total_with_commission' => $amount + $commission,
                'balance_change' => -$amount, // شحن ينقص من رصيد المصرف
                'previous_balance' => $previousBalance,
                'new_balance' => $newBalance,
                'customer_name' => $sessionUser['name'],
                'phone_number' => null,
                'notes' => $notes,
                'entered_by' => $sessionUser['name']
            ]);

            // Update central cash balance using banking transaction logic
            $cashBalanceData = CashBalanceService::updateForBankingTransaction(
                $sessionUser['id'], // user_id
                'charge',           // transaction type
                $amount,           // amount (bank balance decreases)
                $commission,       // commission (added to cash)
                'rafidain_bank',   // source
                $transaction->id,  // transaction_id
                $notes             // notes
            );

            // Get updated report
            $updatedTotalCharges = RafidainTransaction::where('user_id', $sessionUser['id'])
                ->where('transaction_type', 'charge')
                ->sum('amount');
            $updatedTotalPayments = RafidainTransaction::where('user_id', $sessionUser['id'])
                ->where('transaction_type', 'payment')
                ->sum('amount');
            $totalOperations = RafidainTransaction::where('user_id', $sessionUser['id'])->count();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'تم الشحن بنجاح',
                'transaction' => $transaction,
                'new_balance' => $newBalance,
                'new_cash_balance' => $cashBalanceData['new_balance'],
                'updated_report' => [
                    'charges' => $updatedTotalCharges,
                    'payments' => $updatedTotalPayments,
                    'operations' => $totalOperations
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء معالجة الشحن: ' . $e->getMessage()
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
            $amount = $request->amount;
            $commission = $request->commission ?? 0;
            $notes = $request->notes;

            // Check current cash balance for payment
            $currentCashBalance = CashBalanceService::getCurrentBalance($sessionUser['id']);
            $totalNeeded = $amount + $commission;

            if ($currentCashBalance < $totalNeeded) {
                return response()->json([
                    'success' => false,
                    'message' => 'الرصيد النقدي غير كافي لإجراء هذه العملية'
                ], 400);
            }

            // Calculate current balance before transaction
            $openingBalance = OpeningBalance::where('user_id', $sessionUser['id'])->first();
            $rafidainBalance = $openingBalance ? $openingBalance->rafidain : 0;

            $totalCharges = RafidainTransaction::where('user_id', $sessionUser['id'])
                ->where('transaction_type', 'charge')
                ->sum('amount');

            $totalPayments = RafidainTransaction::where('user_id', $sessionUser['id'])
                ->where('transaction_type', 'payment')
                ->sum('amount');

            $previousBalance = $rafidainBalance - $totalCharges + $totalPayments;
            $newBalance = $previousBalance + $amount; // دفع يزيد رصيد المصرف

            // Create transaction record
            $transaction = RafidainTransaction::create([
                'user_id' => $sessionUser['id'],
                'reference_number' => $request->reference_number,
                'transaction_type' => 'payment',
                'amount' => $amount,
                'commission' => $commission,
                'total_with_commission' => $amount + $commission,
                'balance_change' => +$amount, // دفع يزيد رصيد المصرف
                'previous_balance' => $previousBalance,
                'new_balance' => $newBalance,
                'customer_name' => $sessionUser['name'],
                'phone_number' => null,
                'notes' => $notes,
                'entered_by' => $sessionUser['name']
            ]);

            // Update central cash balance using banking transaction logic
            $cashBalanceData = CashBalanceService::updateForBankingTransaction(
                $sessionUser['id'], // user_id
                'payment',          // transaction type
                $amount,           // amount (bank balance increases)
                $commission,       // commission (taken from cash)
                'rafidain_bank',   // source
                $transaction->id,  // transaction_id
                $notes             // notes
            );

            // Get updated report
            $updatedTotalCharges = RafidainTransaction::where('user_id', $sessionUser['id'])
                ->where('transaction_type', 'charge')
                ->sum('amount');
            $updatedTotalPayments = RafidainTransaction::where('user_id', $sessionUser['id'])
                ->where('transaction_type', 'payment')
                ->sum('amount');
            $totalOperations = RafidainTransaction::where('user_id', $sessionUser['id'])->count();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'تم الدفع بنجاح',
                'transaction' => $transaction,
                'new_balance' => $newBalance,
                'new_cash_balance' => $cashBalanceData['new_balance'],
                'updated_report' => [
                    'charges' => $updatedTotalCharges,
                    'payments' => $updatedTotalPayments,
                    'operations' => $totalOperations
                ]
            ]);        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء معالجة الدفع: ' . $e->getMessage()
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
        $transactions = RafidainTransaction::where('user_id', $sessionUser['id'])
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
            $chargeTransactions = RafidainTransaction::where('user_id', $sessionUser['id'])
                ->where('transaction_type', 'charge')
                ->get();

            // Get all payment transactions
            $paymentTransactions = RafidainTransaction::where('user_id', $sessionUser['id'])
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
            $rafidainBalance = $openingBalance ? $openingBalance->rafidain : 0;

            // Calculate current balance
            $currentBalance = $rafidainBalance - $totalCharges + $totalPayments;

            return response()->json([
                'success' => true,
                'report' => [
                    'opening_balance' => $rafidainBalance,
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
