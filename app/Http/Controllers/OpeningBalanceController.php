<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\OpeningBalance;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class OpeningBalanceController extends Controller
{
    /**
     * عرض قائمة الموظفين والأرصدة الافتتاحية
     */
    public function index(): Response
    {
                $employees = User::where('user_type', 'employee')
            ->where('is_active', true)
            ->with(['openingBalances' => function ($query) {
                $query->latest('opening_date');
            }])
            ->get()
            ->map(function ($user) {
                $latestBalance = $user->openingBalances->first();

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'phone' => $user->phone,
                    'isActive' => $user->is_active,
                    'hasOpeningBalance' => $user->openingBalances->count() > 0,
                    'latestBalance' => $latestBalance ? [
                        'id' => $latestBalance->id,
                        'status' => $latestBalance->status,
                        'statusText' => $latestBalance->status_text,
                        'statusColor' => $latestBalance->status_color,
                        'opening_date' => $latestBalance->opening_date->format('Y-m-d'),
                        'grand_total' => $latestBalance->grand_total,
                    ] : null,
                    'totalBalances' => $user->openingBalances->count(),
                ];
            });

        return Inertia::render('Admin/EmployeesList', [
            'employees' => $employees
        ]);
    }

    /**
     * عرض تفاصيل الرصيد الافتتاحي لموظف محدد
     */
    public function show(User $user): Response
    {
        // التأكد من أن المستخدم موجود وليس أدمن
        if (!$user || $user->user_type === 'admin') {
            abort(404, 'الموظف غير موجود أو غير مخول للوصول إلى الأرصدة الافتتاحية');
        }

        // Debug: تسجيل بيانات المستخدم
        \Log::info('Opening Balance - User Data:', [
            'user_id' => $user->id,
            'user_name' => $user->name,
            'user_type' => $user->user_type,
            'session_logged_in' => session('logged_in'),
            'session_user_type' => session('user_type')
        ]);

        $openingBalances = $user->openingBalances()
            ->orderBy('opening_date', 'desc')
            ->get()
            ->map(function ($balance) {
                return [
                    'id' => $balance->id,
                    'opening_date' => $balance->opening_date->format('Y-m-d'),
                    'status' => $balance->status,
                    'statusText' => $balance->status_text,
                    'statusColor' => $balance->status_color,
                    'naqa' => $balance->naqa,
                    'rafidain' => $balance->rafidain,
                    'rashid' => $balance->rashid,
                    'zain_cash' => $balance->zain_cash,
                    'super_key' => $balance->super_key,
                    'usd_cash' => $balance->usd_cash,
                    'exchange_rate' => $balance->exchange_rate,
                    'grand_total' => $balance->grand_total,
                    'closing_date' => $balance->closing_date?->format('Y-m-d'),
                    'closing_total' => $balance->closing_total,
                    'created_by' => $balance->created_by,
                    'notes' => $balance->notes,
                ];
            });

        // Debug: تسجيل البيانات المرسلة
        \Log::info('Opening Balance - Response Data:', [
            'employee' => [
                'id' => $user->id,
                'name' => $user->name,
                'phone' => $user->phone,
                'user_type' => $user->user_type,
            ],
            'openingBalances_count' => $openingBalances->count()
        ]);

        return Inertia::render('Admin/OpeningBalance', [
            'employee' => [
                'id' => $user->id,
                'name' => $user->name,
                'phone' => $user->phone,
                'user_type' => $user->user_type,
            ],
            'openingBalances' => $openingBalances
        ]);
    }

    /**
     * حفظ رصيد افتتاحي جديد
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'opening_date' => 'required|date',
            'naqa' => 'nullable|numeric|min:0',
            'rafidain' => 'nullable|numeric|min:0',
            'rashid' => 'nullable|numeric|min:0',
            'zain_cash' => 'nullable|numeric|min:0',
            'super_key' => 'nullable|numeric|min:0',
            'usd_cash' => 'nullable|numeric|min:0',
            'exchange_rate' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        $user = User::findOrFail($request->user_id);

        $openingBalance = OpeningBalance::create([
            'user_id' => $request->user_id,
            'opening_date' => $request->opening_date,
            'status' => 'active',
            'naqa' => $request->naqa ?? 0,
            'rafidain' => $request->rafidain ?? 0,
            'rashid' => $request->rashid ?? 0,
            'zain_cash' => $request->zain_cash ?? 0,
            'super_key' => $request->super_key ?? 0,
            'usd_cash' => $request->usd_cash ?? 0,
            'exchange_rate' => $request->exchange_rate,
            'notes' => $request->notes,
            'created_by' => session('user_name', 'النظام'),
        ]);

        return back()->with('success', 'تم حفظ الرصيد الافتتاحي بنجاح');
    }

    /**
     * تحديث حالة الرصيد الافتتاحي
     */
    public function updateStatus(Request $request, OpeningBalance $openingBalance): RedirectResponse
    {
        $request->validate([
            'status' => 'required|in:pending,active,closed,retrieved,cancelled',
            'closing_date' => 'nullable|date',
            'closing_naqa' => 'nullable|numeric|min:0',
            'closing_rafidain' => 'nullable|numeric|min:0',
            'closing_rashid' => 'nullable|numeric|min:0',
            'closing_zain_cash' => 'nullable|numeric|min:0',
            'closing_super_key' => 'nullable|numeric|min:0',
            'closing_usd_cash' => 'nullable|numeric|min:0',
            'closing_exchange_rate' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        $updateData = [
            'status' => $request->status,
            'updated_by' => session('user_name', 'النظام'),
        ];

        if ($request->status === 'closed' && $request->closing_date) {
            $updateData = array_merge($updateData, [
                'closing_date' => $request->closing_date,
                'closing_naqa' => $request->closing_naqa ?? 0,
                'closing_rafidain' => $request->closing_rafidain ?? 0,
                'closing_rashid' => $request->closing_rashid ?? 0,
                'closing_zain_cash' => $request->closing_zain_cash ?? 0,
                'closing_super_key' => $request->closing_super_key ?? 0,
                'closing_usd_cash' => $request->closing_usd_cash ?? 0,
                'closing_exchange_rate' => $request->closing_exchange_rate ?? $openingBalance->exchange_rate,
                'closed_by' => session('user_name', 'النظام'),
            ]);

            // حساب الإجمالي عند الإغلاق
            $closing_total_iqd = ($request->closing_naqa ?? 0) +
                                ($request->closing_rafidain ?? 0) +
                                ($request->closing_rashid ?? 0) +
                                ($request->closing_zain_cash ?? 0) +
                                ($request->closing_super_key ?? 0);

            $closing_usd_in_iqd = ($request->closing_usd_cash ?? 0) * ($request->closing_exchange_rate ?? $openingBalance->exchange_rate);

            $updateData['closing_total'] = $closing_total_iqd + $closing_usd_in_iqd;
        }

        if ($request->notes) {
            $updateData['notes'] = $request->notes;
        }

        $openingBalance->update($updateData);

        return back()->with('success', 'تم تحديث حالة الرصيد بنجاح');
    }

    /**
     * تحديث رصيد افتتاحي موجود
     */
    public function update(OpeningBalance $openingBalance, Request $request): RedirectResponse
    {
        $request->validate([
            'opening_date' => 'required|date',
            'naqa' => 'nullable|numeric|min:0',
            'rafidain' => 'nullable|numeric|min:0',
            'rashid' => 'nullable|numeric|min:0',
            'zain_cash' => 'nullable|numeric|min:0',
            'super_key' => 'nullable|numeric|min:0',
            'usd_cash' => 'nullable|numeric|min:0',
            'exchange_rate' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        $openingBalance->update([
            'opening_date' => $request->opening_date,
            'naqa' => $request->naqa ?? 0,
            'rafidain' => $request->rafidain ?? 0,
            'rashid' => $request->rashid ?? 0,
            'zain_cash' => $request->zain_cash ?? 0,
            'super_key' => $request->super_key ?? 0,
            'usd_cash' => $request->usd_cash ?? 0,
            'exchange_rate' => $request->exchange_rate,
            'notes' => $request->notes,
            'updated_by' => session('user_name', 'النظام'),
        ]);

        return back()->with('success', 'تم تحديث الرصيد الافتتاحي بنجاح');
    }

    /**
     * إلغاء تفعيل الرصيد الافتتاحي
     */
    public function deactivate(OpeningBalance $openingBalance): RedirectResponse
    {
        // التحقق من أن الرصيد فعال
        if ($openingBalance->status !== 'active') {
            return back()->with('error', 'لا يمكن إلغاء تفعيل رصيد غير فعال');
        }

        $openingBalance->update([
            'status' => 'cancelled',
            'updated_by' => session('user_name', 'النظام'),
        ]);

        return back()->with('success', 'تم إلغاء تفعيل الرصيد بنجاح');
    }

    /**
     * تفعيل الرصيد الافتتاحي
     */
    public function activate(OpeningBalance $openingBalance): RedirectResponse
    {
        // التحقق من أن الرصيد غير فعال
        if ($openingBalance->status === 'active') {
            return back()->with('error', 'الرصيد فعال بالفعل');
        }

        // إلغاء تفعيل جميع الأرصدة الأخرى لنفس المستخدم
        OpeningBalance::where('user_id', $openingBalance->user_id)
            ->where('id', '!=', $openingBalance->id)
            ->where('status', 'active')
            ->update([
                'status' => 'cancelled',
                'updated_by' => session('user_name', 'النظام'),
            ]);

        $openingBalance->update([
            'status' => 'active',
            'updated_by' => session('user_name', 'النظام'),
        ]);

        return back()->with('success', 'تم تفعيل الرصيد بنجاح');
    }
}
