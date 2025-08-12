<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function showLoginForm()
    {
        return Inertia::render('Auth/Login');
    }

    public function login(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
            'password' => 'required|string',
            'user_type' => 'required|in:admin,employee',
        ], [
            'phone.required' => 'رقم الهاتف مطلوب',
            'password.required' => 'كلمة المرور مطلوبة',
            'user_type.required' => 'نوع المستخدم مطلوب',
        ]);

        // البحث عن المستخدم برقم الهاتف ونوع المستخدم
        $user = User::where('phone', $request->phone)
            ->where('user_type', $request->user_type)
            ->first();

        // التحقق من وجود المستخدم وصحة كلمة المرور وأنه نشط
        if (!$user || !Hash::check($request->password, $user->password)) {
            return back()->withErrors([
                'error' => 'رقم الهاتف أو كلمة المرور غير صحيحة'
            ])->withInput($request->only('phone', 'user_type'));
        }

        if (!$user->is_active) {
            return back()->withErrors([
                'error' => 'حسابك معطل، يرجى التواصل مع الإدارة'
            ])->withInput($request->only('phone', 'user_type'));
        }

        // تسجيل الدخول
        Auth::login($user);

        // تخزين معلومات إضافية في الـ session
        session([
            'user_id' => $user->id,
            'user_name' => $user->name,
            'user_type' => $user->user_type,
            'user_phone' => $user->phone,
            'logged_in' => true,
            'user_data' => [
                'id' => $user->id,
                'name' => $user->name,
                'phone' => $user->phone,
                'user_type' => $user->user_type,
                'is_active' => $user->is_active
            ]
        ]);

        // التوجيه حسب نوع المستخدم
        if ($user->user_type === 'admin') {
            return redirect()->route('admin.dashboard');
        } else {
            // للموظف - نوجهه لصفحة الموظفين
            return redirect()->route('employee.dashboard');
        }
    }

    public function logout()
    {
        Auth::logout();
        session()->flush();
        return redirect()->route('login');
    }

    public function createAdmin(Request $request)
    {
        // إنشاء حساب أدمن (للاختبار فقط)
        $admin = User::create([
            'name' => 'أدمن النظام',
            'phone' => '07700000000',
            'password' => Hash::make('admin123'),
            'user_type' => 'admin',
            'is_active' => true,
        ]);

        return response()->json(['message' => 'تم إنشاء حساب الأدمن بنجاح']);
    }
}
