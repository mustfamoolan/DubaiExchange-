<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * عرض قائمة الموظفين
     */
    public function index()
    {
        $employees = User::where('user_type', 'employee')
            ->select('id', 'name', 'phone', 'is_active', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'phone' => $user->phone,
                    'isActive' => $user->is_active,
                    'createdAt' => $user->created_at->format('Y-m-d'),
                ];
            });

        return Inertia::render('Admin/Employees', [
            'employees' => $employees
        ]);
    }

    /**
     * إنشاء موظف جديد
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|unique:users,phone|regex:/^07[0-9]{9}$/',
            'password' => 'required|string|min:6|confirmed',
        ], [
            'name.required' => 'اسم الموظف مطلوب',
            'phone.required' => 'رقم الهاتف مطلوب',
            'phone.unique' => 'رقم الهاتف مستخدم مسبقاً',
            'phone.regex' => 'رقم الهاتف يجب أن يبدأ بـ 07 ويكون 11 رقم',
            'password.required' => 'كلمة المرور مطلوبة',
            'password.min' => 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
            'password.confirmed' => 'تأكيد كلمة المرور غير متطابق',
        ]);

        $user = User::create([
            'name' => $request->name,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'user_type' => 'employee',
            'is_active' => true,
        ]);

        return back()->with('success', 'تم إضافة الموظف بنجاح');
    }

    /**
     * تغيير حالة الموظف (نشط/معطل)
     */
    public function toggleStatus($id)
    {
        $user = User::findOrFail($id);

        // التأكد من أنه موظف وليس أدمن
        if ($user->user_type !== 'employee') {
            return back()->with('error', 'لا يمكن تعديل حالة المدير');
        }

        $user->update([
            'is_active' => !$user->is_active
        ]);

        $status = $user->is_active ? 'تم تفعيل' : 'تم تعطيل';
        return back()->with('success', $status . ' الموظف بنجاح');
    }

    /**
     * عرض تفاصيل الموظف
     */
    public function show($id)
    {
        $employee = User::where('id', $id)
            ->where('user_type', 'employee')
            ->with(['openingBalances' => function ($query) {
                $query->latest('opening_date');
            }])
            ->first();

        if (!$employee) {
            return redirect()->route('admin.employees')->with('error', 'الموظف غير موجود');
        }

        // الحصول على آخر رصيد افتتاحي
        $latestBalance = $employee->openingBalances->first();

        // تحضير بيانات الأرصدة الافتتاحية
        $openingBalances = null;
        if ($latestBalance) {
            $openingBalances = [
                'id' => $latestBalance->id,
                'opening_date' => $latestBalance->opening_date->format('Y-m-d'),
                'status' => $latestBalance->status,
                'statusText' => $latestBalance->status_text,
                'statusColor' => $latestBalance->status_color,
                'naqa' => (float) $latestBalance->naqa,
                'rafidain' => (float) $latestBalance->rafidain,
                'rashid' => (float) $latestBalance->rashid,
                'zain_cash' => (float) $latestBalance->zain_cash,
                'super_key' => (float) $latestBalance->super_key,
                'usd_cash' => (float) $latestBalance->usd_cash,
                'exchange_rate' => (float) $latestBalance->exchange_rate,
                'total_iqd' => (float) $latestBalance->total_iqd,
                'grand_total' => (float) $latestBalance->grand_total,
                'notes' => $latestBalance->notes,
            ];
        }

        return Inertia::render('Admin/EmployeeDetails', [
            'employee' => [
                'id' => $employee->id,
                'name' => $employee->name,
                'phone' => $employee->phone,
                'isActive' => $employee->is_active,
                'createdAt' => $employee->created_at->format('Y-m-d'),
                'hasOpeningBalance' => $employee->openingBalances->count() > 0,
            ],
            'openingBalances' => $openingBalances
        ]);
    }

    /**
     * تحديث بيانات الموظف
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        // التأكد من أنه موظف وليس أدمن
        if ($user->user_type !== 'employee') {
            return back()->with('error', 'لا يمكن تعديل بيانات المدير');
        }

        // قواعد التحقق
        $rules = [
            'name' => 'required|string|max:255',
            'phone' => [
                'required',
                'string',
                'regex:/^07[0-9]{9}$/',
                Rule::unique('users')->ignore($user->id),
            ],
        ];

        // إضافة قواعد كلمة المرور إذا تم إدخالها
        if ($request->filled('password')) {
            $rules['password'] = 'string|min:6|confirmed';
        }

        $request->validate($rules, [
            'name.required' => 'اسم الموظف مطلوب',
            'phone.required' => 'رقم الهاتف مطلوب',
            'phone.unique' => 'رقم الهاتف مستخدم مسبقاً',
            'phone.regex' => 'رقم الهاتف يجب أن يبدأ بـ 07 ويكون 11 رقم',
            'password.min' => 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
            'password.confirmed' => 'تأكيد كلمة المرور غير متطابق',
        ]);

        // بناء البيانات للتحديث
        $updateData = [
            'name' => $request->name,
            'phone' => $request->phone,
        ];

        // إضافة كلمة المرور إذا تم تغييرها
        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        $user->update($updateData);

        return back()->with('success', 'تم تحديث بيانات الموظف بنجاح');
    }

    /**
     * حذف الموظف
     */
    public function destroy($id)
    {
        $user = User::findOrFail($id);

        // التأكد من أنه موظف وليس أدمن
        if ($user->user_type !== 'employee') {
            return back()->with('error', 'لا يمكن حذف المدير');
        }

        // التحقق من عدم وجود أرصدة افتتاحية أو معاملات مرتبطة
        if ($user->openingBalances()->count() > 0) {
            return back()->with('error', 'لا يمكن حذف الموظف لأن له أرصدة افتتاحية مسجلة');
        }

        // يمكن إضافة فحوصات أخرى للمعاملات هنا لاحقاً
        // if ($user->transactions()->count() > 0) {
        //     return back()->with('error', 'لا يمكن حذف الموظف لأن له معاملات مسجلة');
        // }

        $userName = $user->name;
        $user->delete();

        return back()->with('success', "تم حذف الموظف {$userName} بنجاح");
    }
}
