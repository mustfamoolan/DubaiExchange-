<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Customer;
use App\Models\CustomerTransaction;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CustomerController extends Controller
{
    /**
     * عرض صفحة العملاء الرئيسية
     */
    public function index()
    {
        $customers = Customer::withCount('transactions')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($customer) {
                return [
                    'id' => $customer->id,
                    'customer_code' => $customer->customer_code,
                    'name' => $customer->name,
                    'phone' => $customer->phone,
                    'iqd_opening_balance' => $customer->iqd_opening_balance,
                    'usd_opening_balance' => $customer->usd_opening_balance,
                    'current_iqd_balance' => $customer->current_iqd_balance,
                    'current_usd_balance' => $customer->current_usd_balance,
                    'is_active' => $customer->is_active,
                    'transactions_count' => $customer->transactions_count,
                    'created_at' => $customer->created_at->format('Y-m-d'),
                ];
            });

        return Inertia::render('Admin/Customers', [
            'customers' => $customers
        ]);
    }

    /**
     * إنشاء عميل جديد
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|unique:customers,phone|regex:/^07[0-9]{9}$/',
            'iqd_opening_balance' => 'required|numeric',
            'usd_opening_balance' => 'required|numeric',
            'notes' => 'nullable|string|max:1000'
        ], [
            'name.required' => 'اسم العميل مطلوب',
            'phone.required' => 'رقم الهاتف مطلوب',
            'phone.unique' => 'رقم الهاتف مستخدم مسبقاً',
            'phone.regex' => 'رقم الهاتف يجب أن يبدأ بـ 07 ويكون 11 رقم',
            'iqd_opening_balance.required' => 'الرصيد الافتتاحي دينار مطلوب',
            'iqd_opening_balance.numeric' => 'الرصيد الافتتاحي دينار يجب أن يكون رقم',
            'usd_opening_balance.required' => 'الرصيد الافتتاحي دولار مطلوب',
            'usd_opening_balance.numeric' => 'الرصيد الافتتاحي دولار يجب أن يكون رقم',
        ]);

        $customer = Customer::create([
            'customer_code' => Customer::generateCustomerCode(),
            'name' => $request->name,
            'phone' => $request->phone,
            'iqd_opening_balance' => $request->iqd_opening_balance,
            'usd_opening_balance' => $request->usd_opening_balance,
            'current_iqd_balance' => $request->iqd_opening_balance,
            'current_usd_balance' => $request->usd_opening_balance,
            'notes' => $request->notes,
            'is_active' => true
        ]);

        return back()->with('success', 'تم إضافة العميل بنجاح - رمز العميل: ' . $customer->customer_code);
    }

    /**
     * البحث عن العملاء
     */
    public function search(Request $request)
    {
        $query = $request->get('query');

        $customers = Customer::where('is_active', true)
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', '%' . $query . '%')
                  ->orWhere('phone', 'like', '%' . $query . '%')
                  ->orWhere('customer_code', 'like', '%' . $query . '%');
            })
            ->limit(10)
            ->get()
            ->map(function ($customer) {
                return [
                    'id' => $customer->id,
                    'customer_code' => $customer->customer_code,
                    'name' => $customer->name,
                    'phone' => $customer->phone,
                    'remaining_balance' => $customer->remaining_balance
                ];
            });

        return response()->json($customers);
    }

    /**
     * عرض كشف حساب عميل
     */
    public function show($id)
    {
        $customer = Customer::with(['transactions' => function ($query) {
            $query->with('user:id,name')->orderBy('transaction_date', 'desc');
        }])->findOrFail($id);

        $transactions = $customer->transactions->map(function ($transaction) {
            return [
                'id' => $transaction->id,
                'transaction_code' => $transaction->transaction_code,
                'transaction_type' => $transaction->transaction_type,
                'transaction_type_text' => $transaction->transaction_type_text,
                'currency_type' => $transaction->currency_type,
                'currency_type_text' => $transaction->currency_type_text,
                'amount' => $transaction->amount,
                'exchange_rate' => $transaction->exchange_rate,
                'description' => $transaction->description,
                'notes' => $transaction->notes,
                'transaction_date' => $transaction->transaction_date->format('Y-m-d H:i'),
                'employee_name' => $transaction->user->name,
                'created_at' => $transaction->created_at->format('Y-m-d H:i')
            ];
        });

        return Inertia::render('Admin/CustomerStatement', [
            'customer' => [
                'id' => $customer->id,
                'customer_code' => $customer->customer_code,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'iqd_opening_balance' => $customer->iqd_opening_balance,
                'usd_opening_balance' => $customer->usd_opening_balance,
                'current_iqd_balance' => $customer->current_iqd_balance,
                'current_usd_balance' => $customer->current_usd_balance,
                'total_received' => $customer->total_received,
                'total_delivered' => $customer->total_delivered,
                'remaining_balance' => $customer->remaining_balance,
                'is_active' => $customer->is_active,
                'notes' => $customer->notes,
                'created_at' => $customer->created_at->format('Y-m-d')
            ],
            'transactions' => $transactions
        ]);
    }

    /**
     * تعديل بيانات العميل
     */
    public function update(Request $request, $id)
    {
        $customer = Customer::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|regex:/^07[0-9]{9}$/|unique:customers,phone,' . $customer->id,
            'iqd_opening_balance' => 'required|numeric',
            'usd_opening_balance' => 'required|numeric',
            'notes' => 'nullable|string|max:1000'
        ], [
            'name.required' => 'اسم العميل مطلوب',
            'phone.required' => 'رقم الهاتف مطلوب',
            'phone.unique' => 'رقم الهاتف مستخدم مسبقاً',
            'phone.regex' => 'رقم الهاتف يجب أن يبدأ بـ 07 ويكون 11 رقم',
            'iqd_opening_balance.required' => 'الرصيد الافتتاحي دينار مطلوب',
            'iqd_opening_balance.numeric' => 'الرصيد الافتتاحي دينار يجب أن يكون رقم',
            'usd_opening_balance.required' => 'الرصيد الافتتاحي دولار مطلوب',
            'usd_opening_balance.numeric' => 'الرصيد الافتتاحي دولار يجب أن يكون رقم',
        ]);

        $customer->update([
            'name' => $request->name,
            'phone' => $request->phone,
            'iqd_opening_balance' => $request->iqd_opening_balance,
            'usd_opening_balance' => $request->usd_opening_balance,
            'notes' => $request->notes
        ]);

        // إعادة حساب الرصيد الحالي
        $this->recalculateBalance($customer);

        return back()->with('success', 'تم تحديث بيانات العميل بنجاح');
    }

    /**
     * تفعيل/تعطيل العميل
     */
    public function toggleStatus($id)
    {
        $customer = Customer::findOrFail($id);
        $customer->update(['is_active' => !$customer->is_active]);

        $status = $customer->is_active ? 'تم تفعيل' : 'تم تعطيل';
        return back()->with('success', $status . ' العميل بنجاح');
    }

    /**
     * حذف العميل
     */
    public function destroy($id)
    {
        $customer = Customer::findOrFail($id);

        if ($customer->transactions()->count() > 0) {
            return back()->with('error', 'لا يمكن حذف العميل لأن له معاملات مسجلة');
        }

        $customerName = $customer->name;
        $customer->delete();

        return back()->with('success', "تم حذف العميل {$customerName} بنجاح");
    }

    /**
     * إعادة حساب الرصيد
     */
    private function recalculateBalance(Customer $customer)
    {
        $received = $customer->total_received;
        $delivered = $customer->total_delivered;

        $customer->update([
            'current_iqd_balance' => $customer->iqd_opening_balance + $received['iqd'] - $delivered['iqd'],
            'current_usd_balance' => $customer->usd_opening_balance + $received['usd'] - $delivered['usd']
        ]);
    }
}
