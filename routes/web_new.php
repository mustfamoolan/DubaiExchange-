<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\OpeningBalanceController;
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
        return Inertia::render('Admin/Customers');
    })->name('admin.customers');

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
    Route::get('/dashboard', function () {
        if (!session('logged_in') || session('user_type') !== 'employee') {
            return redirect()->route('login');
        }
        return Inertia::render('Employee/Dashboard');
    })->name('employee.dashboard');

    Route::get('/sell', function () {
        if (!session('logged_in') || session('user_type') !== 'employee') {
            return redirect()->route('login');
        }
        return Inertia::render('Employee/Sell');
    })->name('employee.sell');

    Route::get('/buy', function () {
        if (!session('logged_in') || session('user_type') !== 'employee') {
            return redirect()->route('login');
        }
        return Inertia::render('Employee/Buy');
    })->name('employee.buy');

    Route::get('/receive', function () {
        if (!session('logged_in') || session('user_type') !== 'employee') {
            return redirect()->route('login');
        }
        return Inertia::render('Employee/Receive');
    })->name('employee.receive');

    Route::get('/exchange', function () {
        if (!session('logged_in') || session('user_type') !== 'employee') {
            return redirect()->route('login');
        }
        return Inertia::render('Employee/Exchange');
    })->name('employee.exchange');

    Route::get('/rashid-bank', function () {
        if (!session('logged_in') || session('user_type') !== 'employee') {
            return redirect()->route('login');
        }
        return Inertia::render('Employee/RashidBank');
    })->name('employee.rashid-bank');

    Route::get('/rafidain-bank', function () {
        if (!session('logged_in') || session('user_type') !== 'employee') {
            return redirect()->route('login');
        }
        return Inertia::render('Employee/RafidainBank');
    })->name('employee.rafidain-bank');

    Route::get('/zain-cash', function () {
        if (!session('logged_in') || session('user_type') !== 'employee') {
            return redirect()->route('login');
        }
        return Inertia::render('Employee/ZainCash');
    })->name('employee.zain-cash');

    Route::get('/super-key', function () {
        if (!session('logged_in') || session('user_type') !== 'employee') {
            return redirect()->route('login');
        }
        return Inertia::render('Employee/SuperKey');
    })->name('employee.super-key');

    Route::get('/travelers', function () {
        if (!session('logged_in') || session('user_type') !== 'employee') {
            return redirect()->route('login');
        }
        return Inertia::render('Employee/Travelers');
    })->name('employee.travelers');

    Route::get('/balance', function () {
        if (!session('logged_in') || session('user_type') !== 'employee') {
            return redirect()->route('login');
        }
        return Inertia::render('Employee/Balance');
    })->name('employee.balance');

    Route::get('/transactions', function () {
        if (!session('logged_in') || session('user_type') !== 'employee') {
            return redirect()->route('login');
        }
        return Inertia::render('Employee/Transactions');
    })->name('employee.transactions');

    Route::get('/closing-balance', function () {
        if (!session('logged_in') || session('user_type') !== 'employee') {
            return redirect()->route('login');
        }
        return Inertia::render('Employee/ClosingBalance');
    })->name('employee.closing-balance');
});
