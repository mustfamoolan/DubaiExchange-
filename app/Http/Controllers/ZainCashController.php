<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ZainCashTransaction;
use App\Models\User;
use App\Models\OpeningBalance;
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

        // الحصول على الرصيد الافتتاحي النقدي
        $openingBalance = OpeningBalance::where('user_id', $sessionUser['id'])->first();
        $currentNaqaBalance = $openingBalance ? $openingBalance->naqa : 0;

        // حساب إجمالي المستلم (من سندات القبض)
        $totalReceived = \App\Models\ReceiveTransaction::where('user_id', $sessionUser['id'])
            ->sum('amount_in_iqd');

        // حساب إجمالي المصروف (من سندات الصرف)
        $totalExchanged = \App\Models\ExchangeTransaction::where('user_id', $sessionUser['id'])
            ->sum('amount');

        // حساب الرصيد النقدي الحالي (مثل سند القبض والصرف)
        $currentCashBalance = $currentNaqaBalance + $totalReceived - $totalExchanged;

        // Get user's opening balance for Zain Cash
        $zainCashBalance = $openingBalance ? $openingBalance->zain_cash : 0;

        // Calculate current balance based on transactions
        $totalCharges = ZainCashTransaction::where('user_id', $sessionUser['id'])
            ->where('transaction_type', 'charge')
            ->sum('amount'); // فقط المبلغ، ليس العمولة

        $totalPayments = ZainCashTransaction::where('user_id', $sessionUser['id'])
            ->where('transaction_type', 'payment')
            ->sum('amount'); // فقط المبلغ، ليس العمولة

        $currentBalance = $zainCashBalance - $totalCharges + $totalPayments;

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
            'currentCashBalance' => $currentCashBalance,
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

            $previousBalance = $zainCashBalance - $totalCharges + $totalPayments;
            $amount = $request->amount;
            $commission = $request->commission ?? ZainCashTransaction::calculateCommission($amount, 'charge');
            $totalWithCommission = $amount + $commission;
            $newBalance = $previousBalance - $amount; // نقص المبلغ فقط من رصيد زين كاش

            // إضافة المبلغ + العمولة للرصيد النقدي في opening_balances
            if ($openingBalance) {
                $openingBalance->naqa += ($amount + $commission); // إضافة المبلغ + العمولة للرصيد النقدي
                $openingBalance->save();
            }

            // Create transaction record
            $transaction = ZainCashTransaction::create([
                'user_id' => $sessionUser['id'],
                'reference_number' => $request->reference_number,
                'transaction_type' => 'charge',
                'amount' => $amount,
                'commission' => $commission,
                'total_with_commission' => $totalWithCommission,
                'balance_change' => -$amount, // نقص المبلغ فقط من الرصيد
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

            // حساب الرصيد النقدي المحدث (مثل سند القبض والصرف)
            $updatedOpeningBalance = OpeningBalance::where('user_id', $sessionUser['id'])->first();
            $updatedNaqaBalance = $updatedOpeningBalance ? $updatedOpeningBalance->naqa : 0;
            $updatedTotalReceived = \App\Models\ReceiveTransaction::where('user_id', $sessionUser['id'])->sum('amount_in_iqd');
            $updatedTotalExchanged = \App\Models\ExchangeTransaction::where('user_id', $sessionUser['id'])->sum('amount');
            $updatedCashBalance = $updatedNaqaBalance + $updatedTotalReceived - $updatedTotalExchanged;

            return response()->json([
                'success' => true,
                'message' => 'تم إجراء عملية الشحن بنجاح',
                'transaction' => $transaction,
                'new_balance' => $newBalance,
                'new_cash_balance' => $updatedCashBalance,
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

            $previousBalance = $zainCashBalance - $totalCharges + $totalPayments;
            $amount = $request->amount;
            $commission = $request->commission ?? ZainCashTransaction::calculateCommission($amount, 'payment');
            $totalWithCommission = $amount + $commission;

            // التحقق من كفاية الرصيد النقدي الحالي للتأثير الصافي (المبلغ - العمولة)
            $currentOpeningNaqa = $openingBalance ? $openingBalance->naqa : 0;
            $currentTotalReceived = \App\Models\ReceiveTransaction::where('user_id', $sessionUser['id'])->sum('amount_in_iqd');
            $currentTotalExchanged = \App\Models\ExchangeTransaction::where('user_id', $sessionUser['id'])->sum('amount');
            $currentCashBalance = $currentOpeningNaqa + $currentTotalReceived - $currentTotalExchanged;
            $netAmountFromCash = $amount - $commission; // التأثير الصافي على الرصيد النقدي

            if ($currentCashBalance < $netAmountFromCash) {
                return response()->json([
                    'success' => false,
                    'message' => 'الرصيد النقدي غير كافي لإجراء هذه العملية (المبلغ المطلوب: ' . number_format($netAmountFromCash) . ' د.ع)'
                ], 400);
            }            $newBalance = $previousBalance + $amount; // زيادة المبلغ إلى رصيد زين كاش

            // تحديث الرصيد النقدي: ننقص المبلغ ونضيف العمولة
            if ($openingBalance) {
                $openingBalance->naqa = $openingBalance->naqa - $amount + $commission;
                $openingBalance->save();
            }

            // Create transaction record
            $transaction = ZainCashTransaction::create([
                'user_id' => $sessionUser['id'],
                'reference_number' => $request->reference_number,
                'transaction_type' => 'payment',
                'amount' => $amount,
                'commission' => $commission,
                'total_with_commission' => $totalWithCommission,
                'balance_change' => $amount, // زيادة المبلغ إلى الرصيد
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

            // حساب الرصيد النقدي المحدث (مثل سند القبض والصرف)
            $updatedOpeningBalance = OpeningBalance::where('user_id', $sessionUser['id'])->first();
            $updatedNaqaBalance = $updatedOpeningBalance ? $updatedOpeningBalance->naqa : 0;
            $updatedTotalReceived = \App\Models\ReceiveTransaction::where('user_id', $sessionUser['id'])->sum('amount_in_iqd');
            $updatedTotalExchanged = \App\Models\ExchangeTransaction::where('user_id', $sessionUser['id'])->sum('amount');
            $updatedCashBalance = $updatedNaqaBalance + $updatedTotalReceived - $updatedTotalExchanged;

            return response()->json([
                'success' => true,
                'message' => 'تم إجراء عملية الدفع بنجاح',
                'transaction' => $transaction,
                'new_balance' => $newBalance,
                'new_cash_balance' => $updatedCashBalance,
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
            $currentBalance = $zainCashBalance - $totalCharges + $totalPayments;

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
