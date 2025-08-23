<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class CustomerAuthController extends Controller
{
    public function showLogin()
    {
        return Inertia::render('Customer/Auth/Login');
    }

    public function login(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
            'password' => 'required|string',
        ]);

        $customer = Customer::where('phone', $request->phone)->first();

        if (!$customer || !Hash::check($request->password, $customer->password)) {
            return back()->withErrors([
                'error' => 'رقم الهاتف أو كلمة المرور غير صحيحة'
            ]);
        }

        // حفظ بيانات العميل في session
        session(['customer' => $customer]);

        return redirect()->route('customer.dashboard');
    }

    public function logout()
    {
        session()->forget('customer');
        return redirect()->route('customer.login');
    }
}
