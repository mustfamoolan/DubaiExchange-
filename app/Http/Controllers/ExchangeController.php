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

        // الحصول على الرصيد الافتتاحي النقدي
        $openingBalance = OpeningBalance::where('user_id', $sessionUser['id'])->first();
        $currentNaqaBalance = $openingBalance ? $openingBalance->naqa : 0;

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
            'total_exchanged' => $totalExchanged
        ];

        return Inertia::render('Employee/Exchange', [
            'user' => $sessionUser,
            'currentBalance' => $currentBalance,
            'openingBalance' => $currentNaqaBalance,
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
            'description' => 'required|string|max:1000'
        ]);

        DB::beginTransaction();

        try {
            // حساب الرصيد الحالي
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

            // التحقق من كفاية الرصيد
            if ($newBalance < 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'الرصيد غير كافي لإجراء هذه العملية'
                ], 400);
            }

            // Create transaction record
            $transaction = ExchangeTransaction::create([
                'user_id' => $sessionUser['id'],
                'invoice_number' => $request->invoiceNumber,
                'amount' => $request->amount,
                'description' => $request->description,
                'previous_balance' => $previousBalance,
                'new_balance' => $newBalance,
                'entered_by' => $sessionUser['name'],
                'notes' => $request->notes ?? null
            ]);

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
