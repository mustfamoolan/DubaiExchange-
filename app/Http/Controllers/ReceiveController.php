<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ReceiveTransaction;
use App\Models\User;
use App\Models\OpeningBalance;
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
            'openingBalance' => $currentNaqaBalance,
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
            'exchange_rate' => 'required|numeric|min:0.01',
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
            $amountInIqd = $request->amount * $request->exchange_rate;

            $newBalance = $currentBalance + $amountInIqd;

            // Create transaction record
            $transaction = ReceiveTransaction::create([
                'user_id' => $sessionUser['id'],
                'document_number' => $request->documentNumber,
                'received_from' => $request->receivedFrom,
                'amount' => $request->amount,
                'currency' => $request->currency,
                'exchange_rate' => $request->exchange_rate,
                'amount_in_iqd' => $amountInIqd,
                'description' => $request->description,
                'beneficiary' => $request->beneficiary,
                'receiver_name' => $sessionUser['name'],
                'previous_balance' => $currentBalance,
                'new_balance' => $newBalance,
                'notes' => $request->notes,
                'entered_by' => $sessionUser['name']
            ]);

            // إنشاء معاملة عميل إذا تم اختيار عميل
            if ($request->selectedCustomer && isset($request->selectedCustomer['id'])) {
                $customer = \App\Models\Customer::find($request->selectedCustomer['id']);
                if ($customer) {
                    // تحديد نوع المعاملة والعملة
                    $transactionType = 'payment'; // دفع (العميل دفع للصرافة)

                    // تحديد المبلغ حسب العملة
                    $amountIqd = 0;
                    $amountUsd = 0;

                    if ($request->currency === 'دينار عراقي') {
                        $amountIqd = $request->amount;
                    } elseif ($request->currency === 'دولار أمريكي') {
                        $amountUsd = $request->amount;
                    } else {
                        // للعملات الأخرى، تحويل إلى دينار عراقي
                        $amountIqd = $amountInIqd;
                    }

                    \App\Models\CustomerTransaction::create([
                        'customer_id' => $customer->id,
                        'user_id' => $sessionUser['id'],
                        'transaction_code' => \App\Models\CustomerTransaction::generateTransactionCode(),
                        'type' => $transactionType,
                        'amount_iqd' => $amountIqd,
                        'amount_usd' => $amountUsd,
                        'description' => 'سند قبض رقم: ' . $request->documentNumber . ' - ' . ($request->description ?: 'بدون وصف'),
                        'reference_number' => $request->documentNumber,
                        'currency' => $request->currency,
                        'exchange_rate' => $request->exchange_rate,
                        'notes' => $request->notes
                    ]);

                    // إعادة حساب رصيد العميل
                    $customer->updateBalances();
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
