<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TransactionLogController extends Controller
{
    /**
     * عرض سجل الحركات العام مع الفلاتر والبحث
     */
    public function index(Request $request)
    {
        // 1. جلب قائمة الموظفين للفلاتر
        $employees = User::where('user_type', 'employee')
            ->orderBy('name')
            ->get(['id', 'name']);

        // 2. تجميع الحركات من كافة الجداول باستخدام Union
        // ملاحظة: نقوم بتوحيد الأعمدة لضمان عمل الـ Union بشكل صحيح
        
        $query = $this->buildUnifiedQuery($request);

        // 3. الترقيم (Pagination)
        $transactions = $query->paginate(20)->withQueryString();

        // 4. أنواع العمليات المتاحة للفلاتر
        $operationTypes = [
            ['id' => 'buy', 'name' => 'شراء دولار'],
            ['id' => 'sell', 'name' => 'بيع دولار'],
            ['id' => 'exchange', 'name' => 'سند صرف'],
            ['id' => 'receive', 'name' => 'سند قبض'],
            ['id' => 'zain_cash_charge', 'name' => 'شحن زين كاش'],
            ['id' => 'zain_cash_payment', 'name' => 'دفع زين كاش'],
            ['id' => 'rafidain_charge', 'name' => 'شحن رافدين'],
            ['id' => 'rafidain_payment', 'name' => 'دفع رافدين'],
            ['id' => 'rashid_charge', 'name' => 'شحن رشيد'],
            ['id' => 'rashid_payment', 'name' => 'دفع رشيد'],
            ['id' => 'super_key_charge', 'name' => 'شحن سوبر كي'],
            ['id' => 'super_key_payment', 'name' => 'دفع سوبر كي'],
            ['id' => 'distribution', 'name' => 'توزيع (خزنة)'],
            ['id' => 'return', 'name' => 'إرجاع (خزنة)'],
            ['id' => 'traveler', 'name' => 'مسافرين'],
        ];

        return Inertia::render('Admin/TransactionLog', [
            'transactions' => $transactions,
            'employees' => $employees,
            'operationTypes' => $operationTypes,
            'filters' => $request->only(['employee_id', 'type', 'search', 'date_from', 'date_to'])
        ]);
    }

    /**
     * بناء الاستعلام الموحد لكافة جداول الحركات
     */
    private function buildUnifiedQuery(Request $request)
    {
        // مصفوفة الجداول والأعمدة الخاصة بها
        $tables = [
            'buy_transactions' => [
                'type' => "'buy'",
                'amount' => 'iqd_amount',
                'currency' => "'IQD'",
                'ref' => 'reference_number',
                'profit' => 'commission'
            ],
            'sell_transactions' => [
                'type' => "'sell'",
                'amount' => 'iqd_amount',
                'currency' => "'IQD'",
                'ref' => 'reference_number',
                'profit' => 'commission'
            ],
            'exchange_transactions' => [
                'type' => "'exchange'",
                'amount' => 'amount',
                'currency' => 'currency',
                'ref' => 'invoice_number',
                'profit' => '0'
            ],
            'receive_transactions' => [
                'type' => "'receive'",
                'amount' => 'amount',
                'currency' => 'currency',
                'ref' => 'document_number',
                'profit' => '0'
            ],
            'zain_cash_transactions' => [
                'type' => "CONCAT('zain_cash_', transaction_type)",
                'amount' => 'amount',
                'currency' => "'IQD'",
                'ref' => 'reference_number',
                'profit' => 'commission'
            ],
            'rafidain_transactions' => [
                'type' => "CONCAT('rafidain_', transaction_type)",
                'amount' => 'amount',
                'currency' => "'IQD'",
                'ref' => 'reference_number',
                'profit' => 'commission'
            ],
            'rashid_transactions' => [
                'type' => "CONCAT('rashid_', transaction_type)",
                'amount' => 'amount',
                'currency' => "'IQD'",
                'ref' => 'reference_number',
                'profit' => 'commission'
            ],
            'super_key_transactions' => [
                'type' => "CONCAT('super_key_', transaction_type)",
                'amount' => 'amount',
                'currency' => "'IQD'",
                'ref' => 'reference_number',
                'profit' => 'commission'
            ],
            'traveler_transactions' => [
                'type' => "'traveler'",
                'amount' => 'iqd_amount',
                'currency' => "'IQD'",
                'ref' => 'receipt_number',
                'profit' => '0'
            ],
        ];

        $queries = [];

        foreach ($tables as $tableName => $cols) {
            $opTypeExpr = strpos($cols['type'], "'") !== false ? $cols['type'] : "$tableName." . $cols['type'];
            
            $q = DB::table($tableName)
                ->join('users', "$tableName.user_id", '=', 'users.id')
                ->select(
                    "$tableName.id",
                    "users.name as employee_name",
                    "$tableName.user_id as employee_id",
                    DB::raw("$opTypeExpr as op_type"),
                    "$tableName." . $cols['ref'] . " as reference",
                    "$tableName." . $cols['amount'] . " as amount",
                    DB::raw($cols['currency'] . " as currency"),
                    DB::raw($cols['profit'] . " as profit"),
                    "$tableName.previous_balance",
                    "$tableName.new_balance",
                    "$tableName.notes",
                    "$tableName.created_at"
                );
            
            $this->applyFilters($q, $request, $tableName, $cols['type'], $cols['ref'], 'user_id');
            $queries[] = $q;
        }

        // إضافة حركات الخزنة (توزيع وإرجاع)
        $treasuryQuery = DB::table('treasury_movements')
            ->join('users', 'treasury_movements.employee_id', '=', 'users.id')
            ->select(
                'treasury_movements.id',
                'users.name as employee_name',
                'treasury_movements.employee_id',
                'treasury_movements.movement_type as op_type',
                'treasury_movements.reference_number as reference',
                DB::raw('(amount_naqa + amount_rafidain + amount_rashid + amount_zain_cash + amount_super_key) as amount'),
                DB::raw("'IQD' as currency"),
                'treasury_movements.profit_loss_amount as profit',
                'treasury_movements.balance_before_naqa as previous_balance',
                'treasury_movements.balance_after_naqa as new_balance',
                'treasury_movements.notes',
                'treasury_movements.created_at'
            );
        
        $this->applyFilters($treasuryQuery, $request, 'treasury_movements', 'movement_type', 'reference_number', 'employee_id');
        $queries[] = $treasuryQuery;

        // دمج كافة الاستعلامات
        $finalQuery = array_shift($queries);
        foreach ($queries as $q) {
            $finalQuery->unionAll($q);
        }

        // ترتيب النتائج النهائية
        return DB::table(DB::raw("({$finalQuery->toSql()}) as combined_logs"))
            ->mergeBindings($finalQuery)
            ->orderBy('created_at', 'desc');
    }

    /**
     * تطبيق الفلاتر على الاستعلام
     */
    private function applyFilters($query, Request $request, $table, $typeValueOrCol, $refColName, $userColName)
    {
        if ($request->filled('employee_id')) {
            $query->where("$table.$userColName", $request->employee_id);
        }

        if ($request->filled('type')) {
            // إذا كانت القيمة ممررة كـ Raw، نحتاج لتطويعها
            if (strpos($typeValueOrCol, "'") !== false) {
                $query->where(DB::raw($typeValueOrCol), $request->type);
            } else {
                $query->where("$table.$typeValueOrCol", $request->type);
            }
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($table, $search, $refColName) {
                $q->where("$table.$refColName", 'LIKE', "%$search%")
                  ->orWhere("$table.notes", 'LIKE', "%$search%");
            });
        }

        if ($request->filled('date_from')) {
            $query->where("$table.created_at", '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where("$table.created_at", '<=', $request->date_to . ' 23:59:59');
        }
    }
}
