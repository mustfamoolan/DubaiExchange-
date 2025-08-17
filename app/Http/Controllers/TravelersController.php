<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\TravelerTransaction;
use App\Models\User;
use App\Models\OpeningBalance;
use App\Services\CashBalanceService;
use Illuminate\Support\Facades\DB;

class TravelersController extends Controller
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

    // Display the Travelers page
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

        // الحصول على الرصيد الافتتاحي النقدي
        $openingBalance = OpeningBalance::where('user_id', $sessionUser['id'])->first();
        $currentNaqaBalance = $openingBalance ? $openingBalance->naqa : 0;
        $openingCashBalance = $currentNaqaBalance; // استخدام الرصيد الافتتاحي للموظف

        // الحصول على المعاملات الأخيرة
        $transactions = TravelerTransaction::where('user_id', $sessionUser['id'])
            ->latest()
            ->take(10)
            ->get();

        // إعداد التقرير السريع
        $quickReport = [
            'today_total' => TravelerTransaction::where('user_id', $sessionUser['id'])
                ->whereDate('created_at', today())
                ->sum('total_iqd'),
            'today_operations' => TravelerTransaction::where('user_id', $sessionUser['id'])
                ->whereDate('created_at', today())
                ->count(),
            'total_amount' => TravelerTransaction::where('user_id', $sessionUser['id'])
                ->sum('total_iqd'),
            'total_operations' => TravelerTransaction::where('user_id', $sessionUser['id'])
                ->count()
        ];

        return Inertia::render('Employee/Travelers', [
            'user' => $sessionUser,
            'transactions' => $transactions,
            'quickReport' => $quickReport,
            'currentCashBalance' => $currentCashBalance,
            'openingCashBalance' => $openingCashBalance,
            'centralExchangeRate' => 1320 // سعر الصرف المركزي الثابت
        ]);
    }

    // Process a traveler transaction
    public function store(Request $request)
    {
        $sessionUser = $this->checkAuth();
        if ($sessionUser instanceof \Illuminate\Http\RedirectResponse) {
            return response()->json(['error' => 'User not authenticated'], 401);
        }

        $request->validate([
            'receiptNumber' => 'required|string',
            'tripNumber' => 'required|string',
            'fullName' => 'required|string|max:255',
            'usdAmount' => 'required|numeric|min:0.01',
            'iqdAmount' => 'required|numeric|min:1',
            'notes' => 'nullable|string|max:1000'
        ]);

        DB::beginTransaction();

        try {
            // الحصول على الرصيد النقدي المركزي الحالي
            $currentCashBalance = CashBalanceService::getCurrentBalance($sessionUser['id']);

            // سعر الصرف المركزي الثابت
            $centralExchangeRate = 1320;

            // حساب الإجمالي بالدينار العراقي
            $totalIqd = $request->usdAmount * $centralExchangeRate + $request->iqdAmount;

            // حساب الرصيد الحالي للموظف (للسجلات)
            $openingBalance = OpeningBalance::where('user_id', $sessionUser['id'])->first();
            $currentNaqaBalance = $openingBalance ? $openingBalance->naqa : 0;

            // حساب إجمالي معاملات المسافرين السابقة
            $totalTravelers = TravelerTransaction::where('user_id', $sessionUser['id'])
                ->sum('total_iqd');

            $previousBalance = $currentNaqaBalance + $totalTravelers;
            $newBalance = $previousBalance + $totalIqd;

            // Create transaction record
            $transaction = TravelerTransaction::create([
                'user_id' => $sessionUser['id'],
                'receipt_number' => $request->receiptNumber,
                'trip_number' => $request->tripNumber,
                'full_name' => $request->fullName,
                'usd_amount' => $request->usdAmount,
                'exchange_rate' => $centralExchangeRate,
                'iqd_amount' => $request->iqdAmount,
                'total_iqd' => $totalIqd,
                'previous_balance' => $previousBalance,
                'new_balance' => $newBalance,
                'entered_by' => $sessionUser['name'],
                'notes' => $request->notes ?? null
            ]);

            // تحديث الرصيد النقدي المركزي (إضافة المبلغ)
            $cashBalanceData = CashBalanceService::updateForTravelerTransaction(
                $sessionUser['id'],
                $totalIqd, // إضافة المبلغ للصندوق
                $transaction->id,
                $request->notes
            );

            $newCashBalance = $cashBalanceData['new_balance'];

            DB::commit();

            // إعادة حساب التقارير بعد العملية الجديدة
            $updatedTodayTotal = TravelerTransaction::where('user_id', $sessionUser['id'])
                ->whereDate('created_at', today())
                ->sum('total_iqd');

            $updatedTodayOperations = TravelerTransaction::where('user_id', $sessionUser['id'])
                ->whereDate('created_at', today())
                ->count();

            $updatedTotalAmount = TravelerTransaction::where('user_id', $sessionUser['id'])
                ->sum('total_iqd');

            $updatedTotalOperations = TravelerTransaction::where('user_id', $sessionUser['id'])
                ->count();

            return response()->json([
                'success' => true,
                'message' => 'تم إجراء معاملة المسافر بنجاح',
                'transaction' => $transaction,
                'new_balance' => $newBalance,
                'new_cash_balance' => $newCashBalance,
                'updated_report' => [
                    'today_total' => $updatedTodayTotal,
                    'today_operations' => $updatedTodayOperations,
                    'total_amount' => $updatedTotalAmount,
                    'total_operations' => $updatedTotalOperations
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

        $transactions = TravelerTransaction::where('user_id', $sessionUser['id'])
            ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->orderBy('created_at', 'desc')
            ->get();

        $summary = [
            'total_amount' => $transactions->sum('total_iqd'),
            'total_usd' => $transactions->sum('usd_amount'),
            'total_iqd_direct' => $transactions->sum('iqd_amount'),
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
