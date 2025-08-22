<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MainTreasury;
use App\Models\TreasuryMovement;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class TreasuryController extends Controller
{
    /**
     * عرض صفحة الخزنة الرئيسية
     */
    public function index()
    {
        $treasury = MainTreasury::getActive() ?? MainTreasury::createOrGetToday();

        // إحصائيات اليوم
        $todayStats = [
            'total_distributions' => TreasuryMovement::forDate(now()->format('Y-m-d'))
                ->distributions()
                ->sum(DB::raw('amount_naqa + amount_rafidain + amount_rashid + amount_zain_cash + amount_super_key + (amount_usd_cash * exchange_rate_used)')),

            'total_returns' => TreasuryMovement::forDate(now()->format('Y-m-d'))
                ->returns()
                ->sum(DB::raw('amount_naqa + amount_rafidain + amount_rashid + amount_zain_cash + amount_super_key + (amount_usd_cash * exchange_rate_used)')),

            'total_profits' => TreasuryMovement::forDate(now()->format('Y-m-d'))
                ->profits()
                ->sum('profit_loss_amount'),

            'total_losses' => abs(TreasuryMovement::forDate(now()->format('Y-m-d'))
                ->losses()
                ->sum('profit_loss_amount')),
        ];        // آخر الحركات
        $recentMovements = TreasuryMovement::with('employee')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // قائمة الموظفين النشطين
        $employees = User::where('user_type', 'employee')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'phone']);

        return Inertia::render('Admin/Treasury/Index', [
            'treasury' => $treasury,
            'todayStats' => $todayStats,
            'recentMovements' => $recentMovements,
            'employees' => $employees
        ]);
    }

    /**
     * توزيع أموال على موظف
     */
    public function distribute(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:users,id',
            'transaction_type' => 'required|string',
            'amount_naqa' => 'nullable|numeric|min:0',
            'amount_rafidain' => 'nullable|numeric|min:0',
            'amount_rashid' => 'nullable|numeric|min:0',
            'amount_zain_cash' => 'nullable|numeric|min:0',
            'amount_super_key' => 'nullable|numeric|min:0',
            'amount_usd_cash' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'notes' => 'nullable|string'
        ]);

        DB::beginTransaction();

        try {
            $treasury = MainTreasury::getActive() ?? MainTreasury::createOrGetToday();
            $employee = User::findOrFail($request->employee_id);

            // التحقق من توفر الأموال
            $requiredAmounts = [
                'naqa' => $request->amount_naqa ?? 0,
                'rafidain' => $request->amount_rafidain ?? 0,
                'rashid' => $request->amount_rashid ?? 0,
                'zain_cash' => $request->amount_zain_cash ?? 0,
                'super_key' => $request->amount_super_key ?? 0,
                'usd_cash' => $request->amount_usd_cash ?? 0,
            ];

            // التحقق من الرصيد
            if ($treasury->current_naqa < $requiredAmounts['naqa'] ||
                $treasury->current_rafidain < $requiredAmounts['rafidain'] ||
                $treasury->current_rashid < $requiredAmounts['rashid'] ||
                $treasury->current_zain_cash < $requiredAmounts['zain_cash'] ||
                $treasury->current_super_key < $requiredAmounts['super_key'] ||
                $treasury->current_usd_cash < $requiredAmounts['usd_cash']) {

                return back()->withErrors(['error' => 'الرصيد غير كافي في الخزنة الرئيسية']);
            }

            // حفظ الأرصدة قبل التوزيع
            $balancesBefore = [
                'naqa' => $treasury->current_naqa,
                'rafidain' => $treasury->current_rafidain,
                'rashid' => $treasury->current_rashid,
                'zain_cash' => $treasury->current_zain_cash,
                'super_key' => $treasury->current_super_key,
                'usd_cash' => $treasury->current_usd_cash,
            ];

            // خصم المبالغ من الخزنة
            $treasury->current_naqa -= $requiredAmounts['naqa'];
            $treasury->current_rafidain -= $requiredAmounts['rafidain'];
            $treasury->current_rashid -= $requiredAmounts['rashid'];
            $treasury->current_zain_cash -= $requiredAmounts['zain_cash'];
            $treasury->current_super_key -= $requiredAmounts['super_key'];
            $treasury->current_usd_cash -= $requiredAmounts['usd_cash'];

            $treasury->updateTotals();

            // إنشاء حركة التوزيع
            $movement = TreasuryMovement::create([
                'treasury_date' => now()->format('Y-m-d'),
                'movement_type' => 'distribution',
                'employee_id' => $employee->id,
                'employee_name' => $employee->name,
                'transaction_type' => $request->transaction_type,
                'reference_number' => 'DIST-' . now()->format('Ymd-His'),

                'amount_naqa' => $requiredAmounts['naqa'],
                'amount_rafidain' => $requiredAmounts['rafidain'],
                'amount_rashid' => $requiredAmounts['rashid'],
                'amount_zain_cash' => $requiredAmounts['zain_cash'],
                'amount_super_key' => $requiredAmounts['super_key'],
                'amount_usd_cash' => $requiredAmounts['usd_cash'],

                'balance_before_naqa' => $balancesBefore['naqa'],
                'balance_before_rafidain' => $balancesBefore['rafidain'],
                'balance_before_rashid' => $balancesBefore['rashid'],
                'balance_before_zain_cash' => $balancesBefore['zain_cash'],
                'balance_before_super_key' => $balancesBefore['super_key'],
                'balance_before_usd_cash' => $balancesBefore['usd_cash'],

                'balance_after_naqa' => $treasury->current_naqa,
                'balance_after_rafidain' => $treasury->current_rafidain,
                'balance_after_rashid' => $treasury->current_rashid,
                'balance_after_zain_cash' => $treasury->current_zain_cash,
                'balance_after_super_key' => $treasury->current_super_key,
                'balance_after_usd_cash' => $treasury->current_usd_cash,

                'exchange_rate_used' => $treasury->current_exchange_rate,
                'description' => $request->description,
                'notes' => $request->notes,
                'status' => 'completed',
                'processed_by' => session('user_name', 'الإدارة')
            ]);

            DB::commit();

            return back()->with('success', 'تم توزيع الأموال بنجاح على الموظف');

        } catch (\Exception $e) {
            DB::rollback();
            return back()->withErrors(['error' => 'حدث خطأ أثناء التوزيع: ' . $e->getMessage()]);
        }
    }

    /**
     * استلام أموال من موظف (مع ربح/خسارة)
     */
    public function receive(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:users,id',
            'transaction_type' => 'required|string',
            'amount_naqa' => 'nullable|numeric|min:0',
            'amount_rafidain' => 'nullable|numeric|min:0',
            'amount_rashid' => 'nullable|numeric|min:0',
            'amount_zain_cash' => 'nullable|numeric|min:0',
            'amount_super_key' => 'nullable|numeric|min:0',
            'amount_usd_cash' => 'nullable|numeric|min:0',
            'profit_loss_amount' => 'required|numeric',
            'description' => 'nullable|string',
            'notes' => 'nullable|string'
        ]);

        DB::beginTransaction();

        try {
            $treasury = MainTreasury::getActive() ?? MainTreasury::createOrGetToday();
            $employee = User::findOrFail($request->employee_id);

            $returnedAmounts = [
                'naqa' => $request->amount_naqa ?? 0,
                'rafidain' => $request->amount_rafidain ?? 0,
                'rashid' => $request->amount_rashid ?? 0,
                'zain_cash' => $request->amount_zain_cash ?? 0,
                'super_key' => $request->amount_super_key ?? 0,
                'usd_cash' => $request->amount_usd_cash ?? 0,
            ];

            // حفظ الأرصدة قبل الاستلام
            $balancesBefore = [
                'naqa' => $treasury->current_naqa,
                'rafidain' => $treasury->current_rafidain,
                'rashid' => $treasury->current_rashid,
                'zain_cash' => $treasury->current_zain_cash,
                'super_key' => $treasury->current_super_key,
                'usd_cash' => $treasury->current_usd_cash,
            ];

            // إضافة المبالغ للخزنة
            $treasury->current_naqa += $returnedAmounts['naqa'];
            $treasury->current_rafidain += $returnedAmounts['rafidain'];
            $treasury->current_rashid += $returnedAmounts['rashid'];
            $treasury->current_zain_cash += $returnedAmounts['zain_cash'];
            $treasury->current_super_key += $returnedAmounts['super_key'];
            $treasury->current_usd_cash += $returnedAmounts['usd_cash'];

            $treasury->updateTotals();

            // إنشاء حركة الإرجاع
            $movement = TreasuryMovement::create([
                'treasury_date' => now()->format('Y-m-d'),
                'movement_type' => 'return',
                'employee_id' => $employee->id,
                'employee_name' => $employee->name,
                'transaction_type' => $request->transaction_type,
                'reference_number' => 'RET-' . now()->format('Ymd-His'),

                'amount_naqa' => $returnedAmounts['naqa'],
                'amount_rafidain' => $returnedAmounts['rafidain'],
                'amount_rashid' => $returnedAmounts['rashid'],
                'amount_zain_cash' => $returnedAmounts['zain_cash'],
                'amount_super_key' => $returnedAmounts['super_key'],
                'amount_usd_cash' => $returnedAmounts['usd_cash'],

                'balance_before_naqa' => $balancesBefore['naqa'],
                'balance_before_rafidain' => $balancesBefore['rafidain'],
                'balance_before_rashid' => $balancesBefore['rashid'],
                'balance_before_zain_cash' => $balancesBefore['zain_cash'],
                'balance_before_super_key' => $balancesBefore['super_key'],
                'balance_before_usd_cash' => $balancesBefore['usd_cash'],

                'balance_after_naqa' => $treasury->current_naqa,
                'balance_after_rafidain' => $treasury->current_rafidain,
                'balance_after_rashid' => $treasury->current_rashid,
                'balance_after_zain_cash' => $treasury->current_zain_cash,
                'balance_after_super_key' => $treasury->current_super_key,
                'balance_after_usd_cash' => $treasury->current_usd_cash,

                'profit_loss_amount' => $request->profit_loss_amount,
                'exchange_rate_used' => $treasury->current_exchange_rate,
                'description' => $request->description,
                'notes' => $request->notes,
                'status' => 'completed',
                'processed_by' => session('user_name', 'الإدارة')
            ]);

            DB::commit();

            $profitLossText = $request->profit_loss_amount > 0 ? 'ربح' : ($request->profit_loss_amount < 0 ? 'خسارة' : 'متعادل');
            return back()->with('success', "تم استلام الأموال بنجاح مع {$profitLossText} قدره " . abs($request->profit_loss_amount) . " دينار");

        } catch (\Exception $e) {
            DB::rollback();
            return back()->withErrors(['error' => 'حدث خطأ أثناء الاستلام: ' . $e->getMessage()]);
        }
    }

    /**
     * عرض تقرير الحركات
     */
    public function movements(Request $request)
    {
        $query = TreasuryMovement::with('employee');

        // تصفية حسب التاريخ
        if ($request->date_from) {
            $query->where('treasury_date', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->where('treasury_date', '<=', $request->date_to);
        }

        // تصفية حسب نوع الحركة
        if ($request->movement_type) {
            $query->where('movement_type', $request->movement_type);
        }

        // تصفية حسب الموظف
        if ($request->employee_id) {
            $query->where('employee_id', $request->employee_id);
        }

        $movements = $query->orderBy('created_at', 'desc')->paginate(20);

        $employees = User::where('role', 'employee')->get(['id', 'name']);

        return Inertia::render('Admin/Treasury/Movements', [
            'movements' => $movements,
            'employees' => $employees,
            'filters' => $request->only(['date_from', 'date_to', 'movement_type', 'employee_id'])
        ]);
    }

    /**
     * إضافة أموال للخزنة
     */
    public function addFunds(Request $request)
    {
        $request->validate([
            'naqa' => 'nullable|numeric|min:0',
            'rafidain' => 'nullable|numeric|min:0',
            'rashid' => 'nullable|numeric|min:0',
            'zain_cash' => 'nullable|numeric|min:0',
            'super_key' => 'nullable|numeric|min:0',
            'usd_cash' => 'nullable|numeric|min:0',
            'source_description' => 'required|string|max:255',
            'notes' => 'nullable|string|max:500'
        ]);

        // التأكد من وجود مبلغ واحد على الأقل
        $amounts = collect($request->only(['naqa', 'rafidain', 'rashid', 'zain_cash', 'super_key', 'usd_cash']))
            ->filter(function ($value) {
                return $value > 0;
            });

        if ($amounts->isEmpty()) {
            return back()->with('error', 'يجب إدخال مبلغ واحد على الأقل');
        }

        $treasury = MainTreasury::getActive() ?? MainTreasury::createOrGetToday();

        // حفظ الأرصدة السابقة للتتبع
        $beforeBalances = [
            'naqa' => $treasury->naqa_balance,
            'rafidain' => $treasury->rafidain_balance,
            'rashid' => $treasury->rashid_balance,
            'zain_cash' => $treasury->zain_cash_balance,
            'super_key' => $treasury->super_key_balance,
            'usd_cash' => $treasury->usd_cash_balance,
            'total_iqd' => $treasury->total_iqd,
            'total_usd' => $treasury->total_usd,
        ];

        // إضافة المبالغ للخزنة
        $treasury->naqa_balance += $request->naqa ?? 0;
        $treasury->rafidain_balance += $request->rafidain ?? 0;
        $treasury->rashid_balance += $request->rashid ?? 0;
        $treasury->zain_cash_balance += $request->zain_cash ?? 0;
        $treasury->super_key_balance += $request->super_key ?? 0;
        $treasury->usd_cash_balance += $request->usd_cash ?? 0;

        // تحديث الإجماليات
        $treasury->updateTotals();

        // تسجيل حركة الإيداع
        $movementData = $request->only(['naqa', 'rafidain', 'rashid', 'zain_cash', 'super_key', 'usd_cash']);

        // إضافة بيانات إضافية للحركة
        $movementData['movement_type'] = 'funds_addition';
        $movementData['source_description'] = $request->source_description;
        $movementData['notes'] = $request->notes;
        $movementData['total_iqd_amount'] = $treasury->total_iqd - $beforeBalances['total_iqd'];
        $movementData['total_usd_amount'] = $treasury->total_usd - $beforeBalances['total_usd'];
        $movementData['exchange_rate_used'] = $treasury->current_exchange_rate;
        $movementData['before_balance_iqd'] = $beforeBalances['total_iqd'];
        $movementData['after_balance_iqd'] = $treasury->total_iqd;
        $movementData['before_balance_usd'] = $beforeBalances['total_usd'];
        $movementData['after_balance_usd'] = $treasury->total_usd;

        $treasury->movements()->create($movementData);

        return back()->with('success', 'تم إضافة الأموال للخزنة بنجاح');
    }

    /**
     * تحديث سعر الصرف
     */
    public function updateExchangeRate(Request $request)
    {
        $request->validate([
            'exchange_rate' => 'required|numeric|min:0.01'
        ]);

        $treasury = MainTreasury::getActive() ?? MainTreasury::createOrGetToday();
        $treasury->current_exchange_rate = $request->exchange_rate;
        $treasury->updateTotals();

        return back()->with('success', 'تم تحديث سعر الصرف بنجاح');
    }
}
