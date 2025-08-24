<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CustomerDashboardController extends Controller
{
    public function index(Request $request)
    {
        $customerSession = session('customer');

        if (!$customerSession) {
            return redirect()->route('customer.login');
        }

        // جلب العميل من قاعدة البيانات مع الرصيد المحدث
        $customer = \App\Models\Customer::find($customerSession->id);

        if (!$customer) {
            return redirect()->route('customer.login');
        }

        // تحديث الرصيد الحالي بناءً على المعاملات
        $customer->updateBalances();

        // إعادة جلب البيانات بعد التحديث
        $customer = $customer->fresh();

        // جلب المعاملات للعميل
        $transactions = DB::table('customer_transactions')
            ->where('customer_id', $customer->id)
            ->orderBy('transaction_date', 'desc')
            ->get();

        // تحويل الكائن إلى مصفوفة للوصول السهل
        $customerArray = [
            'id' => $customer->id,
            'name' => $customer->name,
            'phone' => $customer->phone,
            'customer_code' => $customer->customer_code,
            'iqd_opening_balance' => $customer->iqd_opening_balance,
            'usd_opening_balance' => $customer->usd_opening_balance,
            'current_iqd_balance' => $customer->current_iqd_balance,
            'current_usd_balance' => $customer->current_usd_balance,
        ];

        return Inertia::render('Customer/Dashboard', [
            'customer' => $customerArray,
            'transactions' => $transactions
        ]);
    }
}
