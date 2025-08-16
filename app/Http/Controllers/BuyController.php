<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\BuyTransaction;
use App\Models\User;
use App\Models\OpeningBalance;
use Illuminate\Support\Facades\DB;

class BuyController extends Controller
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

    // Display the Buy page
    public function index()
    {
        $sessionUser = $this->checkAuth();
        if ($sessionUser instanceof \Illuminate\Http\RedirectResponse) {
            return $sessionUser;
        }

        // Get user's opening balance
        $openingBalance = OpeningBalance::where('user_id', $sessionUser['id'])->first();
        $dollarBalance = $openingBalance ? $openingBalance->usd_cash : 0;
        $iqd_cash = $openingBalance ? $openingBalance->total_iqd : 0; // استخدام total_iqd بدلاً من iqd_cash
        $exchangeRate = $openingBalance ? $openingBalance->exchange_rate : 1500;

        // حساب الرصيد النقدي الموحد (نقا + رافدين + راشد + زين كاش + سوبر كي)
        $totalCashBalance = ($openingBalance ? $openingBalance->naqa : 0) +
                           ($openingBalance ? $openingBalance->rafidain : 0) +
                           ($openingBalance ? $openingBalance->rashid : 0) +
                           ($openingBalance ? $openingBalance->zain_cash : 0) +
                           ($openingBalance ? $openingBalance->super_key : 0);

        // Calculate total dollars bought (زيادة في الدولار)
        $totalDollarsBought = BuyTransaction::where('user_id', $sessionUser['id'])
            ->sum('dollar_amount');

        // Calculate total IQD spent (المبلغ الأساسي فقط بدون العمولة)
        $totalIQDSpent = BuyTransaction::where('user_id', $sessionUser['id'])
            ->sum('iqd_amount'); // المبلغ الأساسي فقط

        // Calculate current balances
        $currentDollarBalance = $dollarBalance + $totalDollarsBought; // زيادة الدولار

        // للرصيد الحالي نستخدم المبلغ الكلي (مع العمولة)
        $totalAmountWithCommission = BuyTransaction::where('user_id', $sessionUser['id'])
            ->sum('total_amount');
        $currentIQDBalance = $iqd_cash - $totalAmountWithCommission; // نقص الدينار العراقي

        // حساب الرصيد النقدي الحالي (ينقص بسبب شراء الدولارات)
        $currentCashBalance = $totalCashBalance - $totalAmountWithCommission;

        // Get recent transactions
        $transactions = BuyTransaction::where('user_id', $sessionUser['id'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Calculate totals for quick report
        $totalOperations = BuyTransaction::where('user_id', $sessionUser['id'])->count();

        return Inertia::render('Employee/Buy', [
            'user' => $sessionUser,
            'currentDollarBalance' => $currentDollarBalance, // الرصيد الحالي بالدولار
            'currentIQDBalance' => $currentIQDBalance, // الرصيد الحالي بالدينار العراقي
            'currentCashBalance' => $currentCashBalance, // الرصيد النقدي الحالي
            'openingDollarBalance' => $dollarBalance, // الرصيد الافتتاحي بالدولار
            'openingIQDBalance' => $dollarBalance * $exchangeRate, // الرصيد الافتتاحي بالدينار العراقي
            'openingCashBalance' => $totalCashBalance, // الرصيد النقدي الافتتاحي
            'exchangeRate' => $exchangeRate,
            'transactions' => $transactions,
            'quickReport' => [
                'charges' => $totalIQDSpent, // المبالغ المنصرفة
                'payments' => 0, // لا توجد مدفوعات في الشراء
                'operations' => $totalOperations,
                'dollars_bought' => $totalDollarsBought
            ]
        ]);
    }

    // Process a buy transaction
    public function buy(Request $request)
    {
        $sessionUser = $this->checkAuth();
        if ($sessionUser instanceof \Illuminate\Http\RedirectResponse) {
            return response()->json(['error' => 'User not authenticated'], 401);
        }

        $request->validate([
            'dollarAmount' => 'required|numeric|min:0.01',
            'exchangeRate' => 'required|numeric|min:0.01',
            'commission' => 'nullable|numeric|min:0',
            'documentNumber' => 'required|string',
            'notes' => 'nullable|string|max:1000'
        ]);

        DB::beginTransaction();

        try {
            // Get current balance from opening balance
            $openingBalance = OpeningBalance::where('user_id', $sessionUser['id'])->first();
            $dollarBalance = $openingBalance ? $openingBalance->usd_cash : 0;
            $iqd_cash = $openingBalance ? $openingBalance->total_iqd : 0; // إضافة المتغير المفقود
            $exchangeRateOpening = $openingBalance ? $openingBalance->exchange_rate : 1500;

            // حساب الرصيد النقدي الموحد (نقا + رافدين + راشد + زين كاش + سوبر كي)
            $totalCashBalance = ($openingBalance ? $openingBalance->naqa : 0) +
                               ($openingBalance ? $openingBalance->rafidain : 0) +
                               ($openingBalance ? $openingBalance->rashid : 0) +
                               ($openingBalance ? $openingBalance->zain_cash : 0) +
                               ($openingBalance ? $openingBalance->super_key : 0);

            // Calculate total dollars bought previously
            $totalDollarsBought = BuyTransaction::where('user_id', $sessionUser['id'])
                ->sum('dollar_amount');

            // Calculate current dollar balance
            $currentDollarBalance = $dollarBalance + $totalDollarsBought;

            $dollarAmount = $request->dollarAmount;
            $exchangeRate = $request->exchangeRate;
            $iqd_amount = $dollarAmount * $exchangeRate; // المبلغ بالدينار العراقي
            $commission = $request->commission ?? BuyTransaction::calculateCommission($iqd_amount);
            $totalAmount = $iqd_amount + $commission; // المبلغ الكلي

            // التحقق من توفر الرصيد الكافي بالدولار (المطلوب شراؤه)
            if ($dollarAmount <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'يرجى إدخال مبلغ صحيح بالدولار'
                ], 400);
            }

            // Calculate new balances after transaction
            $newDollarBalance = $currentDollarBalance + $dollarAmount; // زيادة الدولار

            // Create transaction record
            $transaction = BuyTransaction::create([
                'user_id' => $sessionUser['id'],
                'reference_number' => $request->documentNumber,
                'customer_name' => null, // إزالة اسم العميل
                'iqd_amount' => $iqd_amount,
                'exchange_rate' => $exchangeRate,
                'dollar_amount' => $dollarAmount,
                'commission' => $commission,
                'total_amount' => $totalAmount,
                'balance_change' => $dollarAmount, // زيادة في الدولار
                'previous_balance' => $currentDollarBalance,
                'new_balance' => $newDollarBalance,
                'notes' => $request->notes,
                'entered_by' => $sessionUser['name']
            ]);

            DB::commit();

            // إعادة حساب التقارير بعد العملية الجديدة
            $updatedTotalIQDSpent = BuyTransaction::where('user_id', $sessionUser['id'])
                ->sum('iqd_amount'); // المبلغ الأساسي فقط للتقرير

            // للرصيد الحالي نستخدم المبلغ الكلي (مع العمولة)
            $updatedTotalAmountWithCommission = BuyTransaction::where('user_id', $sessionUser['id'])
                ->sum('total_amount');

            $updatedTotalDollarsBought = BuyTransaction::where('user_id', $sessionUser['id'])
                ->sum('dollar_amount');

            $updatedTotalOperations = BuyTransaction::where('user_id', $sessionUser['id'])->count();
            $updatedCurrentIQDBalance = $iqd_cash - $updatedTotalAmountWithCommission;

            // حساب الرصيد النقدي المحدث
            $updatedCurrentCashBalance = $totalCashBalance - $updatedTotalAmountWithCommission;

            return response()->json([
                'success' => true,
                'message' => 'تم إجراء عملية الشراء بنجاح',
                'transaction' => $transaction,
                'new_dollar_balance' => $newDollarBalance,
                'new_iqd_balance' => $updatedCurrentIQDBalance,
                'new_cash_balance' => $updatedCurrentCashBalance, // الرصيد النقدي المحدث
                'updated_report' => [
                    'charges' => $updatedTotalIQDSpent,
                    'payments' => 0,
                    'operations' => $updatedTotalOperations,
                    'dollars_bought' => $updatedTotalDollarsBought
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
        $transactions = BuyTransaction::where('user_id', $sessionUser['id'])
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
            // Get all buy transactions
            $buyTransactions = BuyTransaction::where('user_id', $sessionUser['id'])->get();

            // Calculate totals
            $totalIQDSpent = $buyTransactions->sum('total_amount');
            $totalDollarsBought = $buyTransactions->sum('dollar_amount');
            $totalCommission = $buyTransactions->sum('commission');
            $totalOperations = $buyTransactions->count();

            // Get opening balance
            $openingBalance = OpeningBalance::where('user_id', $sessionUser['id'])->first();
            $dollarBalance = $openingBalance ? $openingBalance->usd_cash : 0;
            $iqd_cash = $openingBalance ? $openingBalance->total_iqd : 0; // استخدام total_iqd

            // Calculate current balances
            $currentDollarBalance = $dollarBalance + $totalDollarsBought;
            $currentIQDBalance = $iqd_cash - $totalIQDSpent;

            return response()->json([
                'success' => true,
                'report' => [
                    'opening_dollar_balance' => $dollarBalance,
                    'opening_iqd_balance' => $iqd_cash,
                    'current_dollar_balance' => $currentDollarBalance,
                    'current_iqd_balance' => $currentIQDBalance,
                    'total_iqd_spent' => $totalIQDSpent,
                    'total_dollars_bought' => $totalDollarsBought,
                    'total_commission' => $totalCommission,
                    'total_operations' => $totalOperations,
                    'buy_transactions' => $buyTransactions
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
