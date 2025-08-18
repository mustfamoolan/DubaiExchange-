<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Customer;
use App\Models\CustomerTransaction;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EmployeeCustomerController extends Controller
{
    /**
     * التحقق من بيانات الجلسة وإرجاع بيانات المستخدم
     */
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

    /**
     * عرض صفحة العملاء الرئيسية
     */
    public function index()
    {
        $sessionUser = $this->checkAuth();
        if ($sessionUser instanceof \Illuminate\Http\RedirectResponse) {
            return $sessionUser;
        }
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

        return Inertia::render('Employee/Customers', [
            'customers' => $customers
        ]);
    }

    /**
     * إنشاء عميل جديد
     */
    public function store(Request $request)
    {
        $sessionUser = $this->checkAuth();
        if ($sessionUser instanceof \Illuminate\Http\RedirectResponse) {
            return $sessionUser;
        }

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
            ->when($query, function ($q) use ($query) {
                $q->where(function ($subQ) use ($query) {
                    $subQ->where('name', 'like', '%' . $query . '%')
                          ->orWhere('phone', 'like', '%' . $query . '%')
                          ->orWhere('customer_code', 'like', '%' . $query . '%');
                });
            })
            ->limit(50)
            ->get()
            ->map(function ($customer) {
                return [
                    'id' => $customer->id,
                    'customer_code' => $customer->customer_code,
                    'name' => $customer->name,
                    'phone' => $customer->phone,
                    'email' => $customer->email,
                    'current_iqd_balance' => $customer->current_iqd_balance ?? 0,
                    'current_usd_balance' => $customer->current_usd_balance ?? 0,
                    'remaining_balance' => $customer->remaining_balance ?? 0,
                    'is_active' => $customer->is_active
                ];
            });

        return response()->json([
            'success' => true,
            'customers' => $customers
        ]);
    }

    /**
     * عرض كشف حساب عميل
     */
    public function show($id)
    {
        $sessionUser = $this->checkAuth();
        if ($sessionUser instanceof \Illuminate\Http\RedirectResponse) {
            return $sessionUser;
        }
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

        return Inertia::render('Employee/CustomerStatement', [
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
        $sessionUser = $this->checkAuth();
        if ($sessionUser instanceof \Illuminate\Http\RedirectResponse) {
            return $sessionUser;
        }
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
        $sessionUser = $this->checkAuth();
        if ($sessionUser instanceof \Illuminate\Http\RedirectResponse) {
            return $sessionUser;
        }
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
        $sessionUser = $this->checkAuth();
        if ($sessionUser instanceof \Illuminate\Http\RedirectResponse) {
            return $sessionUser;
        }
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

    /**
     * API: البحث في العملاء
     */
    public function apiSearch(Request $request)
    {
        $customers = Customer::where('is_active', true)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($customer) {
                return [
                    'id' => $customer->id,
                    'customer_code' => $customer->customer_code,
                    'name' => $customer->name,
                    'phone' => $customer->phone,
                    'current_iqd_balance' => $customer->current_iqd_balance ?? 0,
                    'current_usd_balance' => $customer->current_usd_balance ?? 0,
                    'created_at' => $customer->created_at->format('Y-m-d'),
                ];
            });

        return response()->json([
            'success' => true,
            'customers' => $customers
        ]);
    }

    /**
     * API: إنشاء عميل جديد
     */
    public function apiStore(Request $request)
    {
        try {
            // تسجيل البيانات المستلمة للتشخيص
            \Log::info('API Store Customer Request:', $request->all());

            // التحقق من وجود العميل مسبقاً
            $existingCustomer = Customer::where('phone', $request->phone)->first();
            if ($existingCustomer) {
                return response()->json([
                    'success' => false,
                    'message' => 'رقم الهاتف موجود مسبقاً للعميل: ' . $existingCustomer->name
                ], 422);
            }

            $request->validate([
                'name' => 'required|string|max:255',
                'phone' => 'required|string',
                'opening_balance_iqd' => 'nullable|numeric',
                'opening_balance_usd' => 'nullable|numeric',
            ], [
                'name.required' => 'اسم العميل مطلوب',
                'name.max' => 'اسم العميل يجب أن يكون أقل من 255 حرف',
                'phone.required' => 'رقم الهاتف مطلوب',
                'opening_balance_iqd.numeric' => 'الرصيد الافتتاحي بالدينار العراقي يجب أن يكون رقم',
                'opening_balance_usd.numeric' => 'الرصيد الافتتاحي بالدولار يجب أن يكون رقم',
            ]);

            // تحضير البيانات
            $iqd_balance = floatval($request->opening_balance_iqd ?: 0);
            $usd_balance = floatval($request->opening_balance_usd ?: 0);

            \Log::info('Creating customer with data:', [
                'name' => $request->name,
                'phone' => $request->phone,
                'iqd_balance' => $iqd_balance,
                'usd_balance' => $usd_balance
            ]);

            $customer = Customer::create([
                'customer_code' => Customer::generateCustomerCode(),
                'name' => $request->name,
                'phone' => $request->phone,
                'iqd_opening_balance' => $iqd_balance,
                'usd_opening_balance' => $usd_balance,
                'current_iqd_balance' => $iqd_balance,
                'current_usd_balance' => $usd_balance,
                'is_active' => true
            ]);

            // تسجيل نجاح العملية
            \Log::info('Customer created successfully:', ['customer_id' => $customer->id]);

            // إعادة تحميل العميل للحصول على البيانات المحدثة
            $customer->refresh();

            // تحديث الكائن ليشمل البيانات المطلوبة للواجهة
            $customerData = [
                'id' => $customer->id,
                'customer_code' => $customer->customer_code,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'remaining_balance_iqd' => $customer->current_iqd_balance ?? $iqd_balance,
                'remaining_balance_usd' => $customer->current_usd_balance ?? $usd_balance,
                'created_at' => $customer->created_at->format('Y-m-d'),
            ];

            return response()->json([
                'success' => true,
                'message' => 'تم إنشاء العميل بنجاح',
                'customer' => $customerData
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation Error:', [
                'errors' => $e->errors(),
                'request_data' => $request->all()
            ]);

            // إرجاع الخطأ الأول فقط لتسهيل الفهم
            $firstError = collect($e->errors())->flatten()->first();

            return response()->json([
                'success' => false,
                'message' => $firstError,
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Customer Creation Error:', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ غير متوقع: ' . $e->getMessage()
            ], 500);
        }
    }
}
