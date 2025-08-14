<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\OpeningBalanceController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\RafidainBankController;
use App\Http\Controllers\RashidBankController;
use App\Http\Controllers\ZainCashController;
use App\Http\Controllers\SuperKeyController;
use App\Http\Controllers\SellController;
use App\Http\Controllers\BuyController;
use App\Http\Controllers\ReceiveController;
use App\Http\Controllers\ExchangeController;
use App\Http\Controllers\ThermalReceiptController;
use Inertia\Inertia;

// توجيه الصفحة الرئيسية إلى صفحة تسجيل الدخول
Route::get('/', [AuthController::class, 'showLoginForm'])->name('home');

// مسارات تسجيل الدخول
Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->name('login.attempt');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// مسار إنشاء أدمن للاختبار
Route::post('/create-admin', [AuthController::class, 'createAdmin'])->name('create.admin');

// مسارات الأدمن
Route::prefix('admin')->group(function () {
    Route::get('/dashboard', function () {
        // التحقق من تسجيل الدخول
        if (!session('logged_in') || session('user_type') !== 'admin') {
            return redirect()->route('login');
        }
        return Inertia::render('Admin/Dashboard');
    })->name('admin.dashboard');

    // مسارات الأرصدة الافتتاحية
    Route::get('/opening-balance', function () {
        // التحقق من تسجيل الدخول
        if (!session('logged_in') || session('user_type') !== 'admin') {
            return redirect()->route('login');
        }
        return app(OpeningBalanceController::class)->index();
    })->name('admin.opening-balance');

    Route::get('/opening-balance/{user}', function ($user) {
        // التحقق من تسجيل الدخول
        if (!session('logged_in') || session('user_type') !== 'admin') {
            return redirect()->route('login');
        }
        return app(OpeningBalanceController::class)->show(\App\Models\User::findOrFail($user));
    })->name('opening-balance.show');

    Route::post('/opening-balance', function () {
        // التحقق من تسجيل الدخول
        if (!session('logged_in') || session('user_type') !== 'admin') {
            return redirect()->route('login');
        }
        return app(OpeningBalanceController::class)->store(request());
    })->name('opening-balance.store');

    Route::patch('/opening-balance/{openingBalance}', function ($openingBalance) {
        // التحقق من تسجيل الدخول
        if (!session('logged_in') || session('user_type') !== 'admin') {
            return redirect()->route('login');
        }
        return app(OpeningBalanceController::class)->update(\App\Models\OpeningBalance::findOrFail($openingBalance), request());
    })->name('opening-balance.update');

    Route::patch('/opening-balance/{openingBalance}/deactivate', function ($openingBalance) {
        // التحقق من تسجيل الدخول
        if (!session('logged_in') || session('user_type') !== 'admin') {
            return redirect()->route('login');
        }
        return app(OpeningBalanceController::class)->deactivate(\App\Models\OpeningBalance::findOrFail($openingBalance));
    })->name('opening-balance.deactivate');

    Route::patch('/opening-balance/{openingBalance}/activate', function ($openingBalance) {
        // التحقق من تسجيل الدخول
        if (!session('logged_in') || session('user_type') !== 'admin') {
            return redirect()->route('login');
        }
        return app(OpeningBalanceController::class)->activate(\App\Models\OpeningBalance::findOrFail($openingBalance));
    })->name('opening-balance.activate');

    Route::patch('/opening-balance/{openingBalance}/status', function ($openingBalance) {
        // التحقق من تسجيل الدخول
        if (!session('logged_in') || session('user_type') !== 'admin') {
            return redirect()->route('login');
        }
        return app(OpeningBalanceController::class)->updateStatus(\App\Models\OpeningBalance::findOrFail($openingBalance));
    })->name('opening-balance.update-status');

    // مسارات إدارة الموظفين
    Route::get('/employees', function () {
        if (!session('logged_in') || session('user_type') !== 'admin') {
            return redirect()->route('login');
        }
        return app(UserController::class)->index();
    })->name('admin.employees');

    Route::post('/employees', function () {
        if (!session('logged_in') || session('user_type') !== 'admin') {
            return redirect()->route('login');
        }
        return app(UserController::class)->store(request());
    })->name('admin.employees.store');

    Route::patch('/employees/{id}/toggle-status', function ($id) {
        if (!session('logged_in') || session('user_type') !== 'admin') {
            return redirect()->route('login');
        }
        return app(UserController::class)->toggleStatus($id);
    })->name('admin.employees.toggle');

    Route::get('/employees/{id}', function ($id) {
        if (!session('logged_in') || session('user_type') !== 'admin') {
            return redirect()->route('login');
        }
        return app(UserController::class)->show($id);
    })->name('admin.employees.details');

    Route::put('/employees/{id}', function ($id) {
        if (!session('logged_in') || session('user_type') !== 'admin') {
            return redirect()->route('login');
        }
        return app(UserController::class)->update(request(), $id);
    })->name('admin.employees.update');

    Route::delete('/employees/{id}', function ($id) {
        if (!session('logged_in') || session('user_type') !== 'admin') {
            return redirect()->route('login');
        }
        return app(UserController::class)->destroy($id);
    })->name('admin.employees.delete');

    Route::get('/operations', function () {
        // التحقق من تسجيل الدخول
        if (!session('logged_in') || session('user_type') !== 'admin') {
            return redirect()->route('login');
        }
        return Inertia::render('Admin/Operations');
    })->name('admin.operations');

    Route::get('/customers', function () {
        // التحقق من تسجيل الدخول
        if (!session('logged_in') || session('user_type') !== 'admin') {
            return redirect()->route('login');
        }
        return app(App\Http\Controllers\CustomerController::class)->index();
    })->name('admin.customers');

    Route::post('/customers', function () {
        if (!session('logged_in') || session('user_type') !== 'admin') {
            return redirect()->route('login');
        }
        return app(App\Http\Controllers\CustomerController::class)->store(request());
    })->name('admin.customers.store');

    Route::get('/customers/search', function () {
        if (!session('logged_in') || session('user_type') !== 'admin') {
            return redirect()->route('login');
        }
        return app(App\Http\Controllers\CustomerController::class)->search(request());
    })->name('admin.customers.search');

    Route::get('/customers/{id}', function ($id) {
        if (!session('logged_in') || session('user_type') !== 'admin') {
            return redirect()->route('login');
        }
        return app(App\Http\Controllers\CustomerController::class)->show($id);
    })->name('admin.customers.show');

    Route::put('/customers/{id}', function ($id) {
        if (!session('logged_in') || session('user_type') !== 'admin') {
            return redirect()->route('login');
        }
        return app(App\Http\Controllers\CustomerController::class)->update(request(), $id);
    })->name('admin.customers.update');

    Route::patch('/customers/{id}/toggle-status', function ($id) {
        if (!session('logged_in') || session('user_type') !== 'admin') {
            return redirect()->route('login');
        }
        return app(App\Http\Controllers\CustomerController::class)->toggleStatus($id);
    })->name('admin.customers.toggle');

    Route::delete('/customers/{id}', function ($id) {
        if (!session('logged_in') || session('user_type') !== 'admin') {
            return redirect()->route('login');
        }
        return app(App\Http\Controllers\CustomerController::class)->destroy($id);
    })->name('admin.customers.delete');

    Route::get('/transaction-log', function () {
        // التحقق من تسجيل الدخول
        if (!session('logged_in') || session('user_type') !== 'admin') {
            return redirect()->route('login');
        }
        return Inertia::render('Admin/TransactionLog');
    })->name('admin.transaction-log');

    Route::get('/reports', function () {
        // التحقق من تسجيل الدخول
        if (!session('logged_in') || session('user_type') !== 'admin') {
            return redirect()->route('login');
        }
        return Inertia::render('Admin/Reports');
    })->name('admin.reports');

    Route::get('/settings', function () {
        // التحقق من تسجيل الدخول
        if (!session('logged_in') || session('user_type') !== 'admin') {
            return redirect()->route('login');
        }
        return Inertia::render('Admin/Settings');
    })->name('admin.settings');
});

// مسارات الموظفين
Route::prefix('employee')->group(function () {
    Route::get('/dashboard', [EmployeeController::class, 'dashboard'])->name('employee.dashboard');
    Route::get('/opening-balance', [EmployeeController::class, 'openingBalance'])->name('employee.opening-balance');
    Route::get('/sell', [SellController::class, 'index'])->name('employee.sell');
    Route::post('/sell', [SellController::class, 'sell'])->name('employee.sell.transaction');
    Route::get('/sell/transactions', [SellController::class, 'getTransactions'])->name('employee.sell.transactions');
    Route::get('/sell/detailed-report', [SellController::class, 'getDetailedReport'])->name('employee.sell.detailed-report');
    Route::get('/buy', [BuyController::class, 'index'])->name('employee.buy');
    Route::post('/buy', [BuyController::class, 'buy'])->name('employee.buy.transaction');
    Route::get('/buy/transactions', [BuyController::class, 'getTransactions'])->name('employee.buy.transactions');
    Route::get('/buy/detailed-report', [BuyController::class, 'getDetailedReport'])->name('employee.buy.detailed-report');
    Route::get('/receive', [ReceiveController::class, 'index'])->name('employee.receive');
    Route::post('/receive', [ReceiveController::class, 'store'])->name('employee.receive.store');
    Route::get('/receive/detailed-report', [ReceiveController::class, 'getDetailedReport'])->name('employee.receive.detailed-report');
    Route::get('/exchange', [EmployeeController::class, 'exchange'])->name('employee.exchange');
    Route::get('/rashid-bank', [RashidBankController::class, 'index'])->name('employee.rashid-bank');
    Route::get('/rafidain-bank', [RafidainBankController::class, 'index'])->name('employee.rafidain-bank');
    Route::get('/zain-cash', [ZainCashController::class, 'index'])->name('employee.zain-cash');
    Route::get('/super-key', [SuperKeyController::class, 'index'])->name('employee.super-key');
    Route::get('/travelers', [EmployeeController::class, 'travelers'])->name('employee.travelers');
    Route::get('/balance', [EmployeeController::class, 'balance'])->name('employee.balance');
    Route::get('/transactions', [EmployeeController::class, 'transactions'])->name('employee.transactions');
    Route::get('/closing-balance', [EmployeeController::class, 'closingBalance'])->name('employee.closing-balance');
});

// مسارات بنك الرافدين
Route::prefix('rafidain')->group(function () {
    Route::post('/charge', [RafidainBankController::class, 'charge'])->name('rafidain.charge');
    Route::post('/payment', [RafidainBankController::class, 'payment'])->name('rafidain.payment');
    Route::get('/transactions', [RafidainBankController::class, 'getTransactions'])->name('rafidain.transactions');
    Route::get('/detailed-report', [RafidainBankController::class, 'getDetailedReport'])->name('rafidain.detailed-report');
});

// مسارات بنك الرشيد
Route::prefix('rashid')->group(function () {
    Route::post('/charge', [RashidBankController::class, 'charge'])->name('rashid.charge');
    Route::post('/payment', [RashidBankController::class, 'payment'])->name('rashid.payment');
    Route::get('/transactions', [RashidBankController::class, 'getTransactions'])->name('rashid.transactions');
    Route::get('/detailed-report', [RashidBankController::class, 'getDetailedReport'])->name('rashid.detailed-report');
});

// مسارات بنك الرشيد
Route::prefix('rashid')->group(function () {
    Route::post('/charge', [RashidBankController::class, 'charge'])->name('rashid.charge');
    Route::post('/payment', [RashidBankController::class, 'payment'])->name('rashid.payment');
    Route::get('/transactions', [RashidBankController::class, 'getTransactions'])->name('rashid.transactions');
    Route::get('/detailed-report', [RashidBankController::class, 'getDetailedReport'])->name('rashid.detailed-report');
});

// مسارات زين كاش
Route::prefix('zain-cash')->group(function () {
    Route::post('/charge', [ZainCashController::class, 'charge'])->name('zain-cash.charge');
    Route::post('/payment', [ZainCashController::class, 'payment'])->name('zain-cash.payment');
    Route::get('/transactions', [ZainCashController::class, 'getTransactions'])->name('zain-cash.transactions');
    Route::get('/detailed-report', [ZainCashController::class, 'getDetailedReport'])->name('zain-cash.detailed-report');
});

// مسارات سوبر كي
Route::prefix('super-key')->group(function () {
    Route::post('/charge', [SuperKeyController::class, 'charge'])->name('super-key.charge');
    Route::post('/payment', [SuperKeyController::class, 'payment'])->name('super-key.payment');
    Route::get('/transactions', [SuperKeyController::class, 'getTransactions'])->name('super-key.transactions');
    Route::get('/detailed-report', [SuperKeyController::class, 'getDetailedReport'])->name('super-key.detailed-report');
});

// مسارات الفواتير الحرارية
Route::prefix('thermal-receipt')->group(function () {
    Route::post('/create', [ThermalReceiptController::class, 'createReceipt'])->name('thermal-receipt.create');
    Route::post('/create-sell', [ThermalReceiptController::class, 'createSellReceipt'])->name('thermal-receipt.create-sell');
    Route::post('/create-buy', [ThermalReceiptController::class, 'createBuyReceipt'])->name('thermal-receipt.create-buy');
    Route::post('/print/{receiptId}', [ThermalReceiptController::class, 'printReceipt'])->name('thermal-receipt.print');
    Route::get('/get/{receiptId}', [ThermalReceiptController::class, 'getReceiptForPrint'])->name('thermal-receipt.get');
    Route::get('/user-receipts', [ThermalReceiptController::class, 'getUserReceipts'])->name('thermal-receipt.user-receipts');
    Route::get('/stats', [ThermalReceiptController::class, 'getReceiptStats'])->name('thermal-receipt.stats');
});

// مسارات سندات القبض
Route::prefix('employee')->group(function () {
    Route::get('/receive', [ReceiveController::class, 'index'])->name('employee.receive');
    Route::post('/receive', [ReceiveController::class, 'store'])->name('employee.receive.store');
    Route::get('/receive/detailed-report', [ReceiveController::class, 'getDetailedReport'])->name('employee.receive.detailed-report');

    // مسارات سندات الصرف
    Route::get('/exchange', [ExchangeController::class, 'index'])->name('employee.exchange');
    Route::post('/exchange', [ExchangeController::class, 'store'])->name('employee.exchange.store');
    Route::get('/exchange/detailed-report', [ExchangeController::class, 'getDetailedReport'])->name('employee.exchange.detailed-report');
});

// مسارات API
Route::prefix('api')->group(function () {
    // API للعملاء
    Route::get('/customers/search', [CustomerController::class, 'apiSearch'])->name('api.customers.search');
    Route::post('/customers', [CustomerController::class, 'apiStore'])->name('api.customers.store');
});
