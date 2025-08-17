<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\SellTransaction;
use App\Models\User;
use App\Models\OpeningBalance;
use App\Services\CashBalanceService;
use App\Services\DollarBalanceService;
use Illuminate\Support\Facades\DB;

class SellController extends Controller
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

    // Display the Sell page
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

        // Get user's opening balance for Dollar sales
        $openingBalance = OpeningBalance::where('user_id', $sessionUser['id'])->first();
        $dollarBalance = $openingBalance ? $openingBalance->usd_cash : 0;
        $openingCashBalance = $openingBalance ? $openingBalance->naqa : 0;
        $exchangeRate = $openingBalance ? $openingBalance->exchange_rate : 1500;

        // حساب إجمالي المستلم (من سندات القبض)
        $totalReceived = \App\Models\ReceiveTransaction::where('user_id', $sessionUser['id'])
            ->sum('amount_in_iqd');

        // حساب إجمالي المصروف (من سندات الصرف)
        $totalExchanged = \App\Models\ExchangeTransaction::where('user_id', $sessionUser['id'])
            ->sum('amount');

        // حساب الرصيد النقدي الحالي الموحد (للعرض فقط)
        $currentBalance = $openingCashBalance + $totalReceived - $totalExchanged;

        // Calculate total dollars sold (نقص من الدولار)
        $totalDollarsSold = SellTransaction::where('user_id', $sessionUser['id'])
            ->sum('dollar_amount');

        // Calculate current dollar balance (الرصيد الافتتاحي - الدولار المباع)
        $currentDollarBalance = $dollarBalance - $totalDollarsSold;

        // Calculate IQD balance received from sales (المبالغ المحصلة بالدينار العراقي من البيع)
        $totalIQDReceived = SellTransaction::where('user_id', $sessionUser['id'])
            ->sum('iqd_amount');

        // Get recent transactions
        $transactions = SellTransaction::where('user_id', $sessionUser['id'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Calculate totals for quick report
        $totalOperations = SellTransaction::where('user_id', $sessionUser['id'])->count();

        return Inertia::render('Employee/Sell', [
            'user' => $sessionUser,
            'currentDollarBalance' => $currentDollarBalance, // الرصيد الحالي بالدولار
            'currentBalance' => $currentBalance, // الرصيد النقدي الحالي الموحد (للعرض فقط)
            'currentCashBalance' => $currentCashBalance, // الرصيد النقدي المركزي
            'currentCentralDollarBalance' => $currentCentralDollarBalance, // الرصيد المركزي للدولار
            'openingDollarBalance' => $dollarBalance, // الرصيد الافتتاحي بالدولار
            'openingBalance' => $openingCashBalance, // الرصيد الافتتاحي النقدي (للعرض فقط)
            'openingCashBalance' => $openingCashBalance, // الرصيد الافتتاحي النقدي
            'exchangeRate' => $exchangeRate,
            'transactions' => $transactions,
            'quickReport' => [
                'charges' => 0, // لا توجد شحن في البيع
                'payments' => $totalIQDReceived, // المبيعات بالدينار العراقي
                'operations' => $totalOperations,
                'dollars_sold' => $totalDollarsSold
            ]
        ]);
    }

    // Process a sell transaction
    public function sell(Request $request)
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
            $exchangeRateOpening = $openingBalance ? $openingBalance->exchange_rate : 1500;

            // Calculate total dollars sold (الدولار المباع مسبقاً)
            $totalDollarsSold = SellTransaction::where('user_id', $sessionUser['id'])
                ->sum('dollar_amount');

            // Calculate current dollar balance (الرصيد الحالي بالدولار)
            $currentDollarBalance = $dollarBalance - $totalDollarsSold;

            // التحقق من توفر الرصيد الكافي
            $dollarAmount = $request->dollarAmount;
            if ($dollarAmount > $currentDollarBalance) {
                return response()->json([
                    'success' => false,
                    'message' => 'الرصيد غير كافي. الرصيد المتاح: $' . number_format($currentDollarBalance, 2)
                ], 400);
            }

            $exchangeRate = $request->exchangeRate;
            $iqd_amount = $dollarAmount * $exchangeRate; // المبلغ بالدينار العراقي
            $commission = $request->commission ?? SellTransaction::calculateCommission($iqd_amount);
            $totalAmount = $iqd_amount + $commission; // المبلغ الكلي

            // Calculate new balances after transaction
            $newDollarBalance = $currentDollarBalance - $dollarAmount; // نقص الدولار

            // Create transaction record
            $transaction = SellTransaction::create([
                'user_id' => $sessionUser['id'],
                'reference_number' => $request->documentNumber,
                'dollar_amount' => $dollarAmount,
                'exchange_rate' => $exchangeRate,
                'iqd_amount' => $iqd_amount,
                'commission' => $commission,
                'total_amount' => $totalAmount,
                'balance_change' => -$dollarAmount, // نقص في الدولار
                'previous_balance' => $currentDollarBalance,
                'new_balance' => $newDollarBalance,
                'notes' => $request->notes,
                'entered_by' => $sessionUser['name']
            ]);

            // تحديث الرصيد النقدي المركزي
            $cashBalanceData = CashBalanceService::updateForSellTransaction(
                $sessionUser['id'], // معرف المستخدم
                $totalAmount, // المبلغ الكلي (بالدينار العراقي + العمولة)
                $transaction->id,
                $request->notes
            );

            // تحديث الرصيد المركزي للدولار
            $dollarBalanceData = DollarBalanceService::updateForSellTransaction(
                $sessionUser['id'], // معرف المستخدم
                $dollarAmount, // مبلغ الدولار المباع
                $transaction->id,
                $request->notes
            );

            DB::commit();

            // إعادة حساب التقارير بعد العملية الجديدة
            $updatedTotalIQDReceived = SellTransaction::where('user_id', $sessionUser['id'])
                ->sum('iqd_amount');

            $updatedTotalOperations = SellTransaction::where('user_id', $sessionUser['id'])->count();
            $updatedDollarsSold = SellTransaction::where('user_id', $sessionUser['id'])->sum('dollar_amount');

            // حساب الرصيد النقدي المحدث (للعرض فقط)
            $updatedOpeningBalance = OpeningBalance::where('user_id', $sessionUser['id'])->first();
            $updatedNaqaBalance = $updatedOpeningBalance ? $updatedOpeningBalance->naqa : 0;
            $updatedTotalReceived = \App\Models\ReceiveTransaction::where('user_id', $sessionUser['id'])->sum('amount_in_iqd');
            $updatedTotalExchanged = \App\Models\ExchangeTransaction::where('user_id', $sessionUser['id'])->sum('amount');
            $updatedCashBalance = $updatedNaqaBalance + $updatedTotalReceived - $updatedTotalExchanged;

            return response()->json([
                'success' => true,
                'message' => 'تم إجراء عملية البيع بنجاح',
                'transaction' => $transaction,
                'new_dollar_balance' => $newDollarBalance,
                'new_cash_balance' => $cashBalanceData['new_balance'], // الرصيد النقدي المركزي المحدث
                'new_central_dollar_balance' => $dollarBalanceData['new_balance'], // الرصيد المركزي للدولار المحدث
                'updated_report' => [
                    'charges' => 0,
                    'payments' => $updatedTotalIQDReceived,
                    'operations' => $updatedTotalOperations,
                    'dollars_sold' => $updatedDollarsSold
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
        $transactions = SellTransaction::where('user_id', $sessionUser['id'])
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
            // Get all sell transactions
            $sellTransactions = SellTransaction::where('user_id', $sessionUser['id'])->get();

            // Calculate totals
            $totalIQDReceived = $sellTransactions->sum('iqd_amount');
            $totalDollarsSold = $sellTransactions->sum('dollar_amount');
            $totalCommission = $sellTransactions->sum('commission');
            $totalOperations = $sellTransactions->count();

            // Get opening balance
            $openingBalance = OpeningBalance::where('user_id', $sessionUser['id'])->first();
            $dollarBalance = $openingBalance ? $openingBalance->usd_cash : 0;
            $exchangeRate = $openingBalance ? $openingBalance->exchange_rate : 1500;

            // Calculate current balances
            $currentDollarBalance = $dollarBalance - $totalDollarsSold;
            $currentIQDBalance = $totalIQDReceived;

            return response()->json([
                'success' => true,
                'report' => [
                    'opening_dollar_balance' => $dollarBalance,
                    'opening_iqd_balance' => $dollarBalance * $exchangeRate,
                    'current_dollar_balance' => $currentDollarBalance,
                    'current_iqd_balance' => $currentIQDBalance,
                    'total_iqd_received' => $totalIQDReceived,
                    'total_dollars_sold' => $totalDollarsSold,
                    'total_commission' => $totalCommission,
                    'total_operations' => $totalOperations,
                    'exchange_rate' => $exchangeRate,
                    'sell_transactions' => $sellTransactions
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
