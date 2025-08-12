<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\OpeningBalance;
use App\Models\User;
use Inertia\Inertia;

class EmployeeController extends Controller
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

    public function dashboard()
    {
        $sessionUser = $this->checkAuth();
        if ($sessionUser instanceof \Illuminate\Http\RedirectResponse) {
            return $sessionUser;
        }

        return Inertia::render('Employee/Dashboard', [
            'auth' => [
                'sessionUser' => $sessionUser
            ]
        ]);
    }

    public function openingBalance()
    {
        $sessionUser = $this->checkAuth();
        if ($sessionUser instanceof \Illuminate\Http\RedirectResponse) {
            return $sessionUser;
        }

        // البحث عن الرصيد الافتتاحي للموظف الحالي
        $openingBalance = null;
        if (isset($sessionUser['id'])) {
            $openingBalance = OpeningBalance::where('user_id', $sessionUser['id'])
                ->latest()
                ->first();
        }

        return Inertia::render('Employee/OpeningBalance', [
            'auth' => [
                'sessionUser' => $sessionUser
            ],
            'openingBalance' => $openingBalance
        ]);
    }

    public function sell()
    {
        $sessionUser = $this->checkAuth();
        if ($sessionUser instanceof \Illuminate\Http\RedirectResponse) {
            return $sessionUser;
        }

        return Inertia::render('Employee/Sell', [
            'auth' => [
                'sessionUser' => $sessionUser
            ]
        ]);
    }

    public function buy()
    {
        $sessionUser = $this->checkAuth();
        if ($sessionUser instanceof \Illuminate\Http\RedirectResponse) {
            return $sessionUser;
        }

        return Inertia::render('Employee/Buy', [
            'auth' => [
                'sessionUser' => $sessionUser
            ]
        ]);
    }

    public function receive()
    {
        $sessionUser = $this->checkAuth();
        if ($sessionUser instanceof \Illuminate\Http\RedirectResponse) {
            return $sessionUser;
        }

        return Inertia::render('Employee/Receive', [
            'auth' => [
                'sessionUser' => $sessionUser
            ]
        ]);
    }

    public function exchange()
    {
        $sessionUser = $this->checkAuth();
        if ($sessionUser instanceof \Illuminate\Http\RedirectResponse) {
            return $sessionUser;
        }

        return Inertia::render('Employee/Exchange', [
            'auth' => [
                'sessionUser' => $sessionUser
            ]
        ]);
    }

    public function rashidBank()
    {
        $sessionUser = $this->checkAuth();
        if ($sessionUser instanceof \Illuminate\Http\RedirectResponse) {
            return $sessionUser;
        }

        return Inertia::render('Employee/RashidBank', [
            'auth' => [
                'sessionUser' => $sessionUser
            ]
        ]);
    }

    public function rafidainBank()
    {
        $sessionUser = $this->checkAuth();
        if ($sessionUser instanceof \Illuminate\Http\RedirectResponse) {
            return $sessionUser;
        }

        return Inertia::render('Employee/RafidainBank', [
            'auth' => [
                'sessionUser' => $sessionUser
            ]
        ]);
    }

    public function zainCash()
    {
        $sessionUser = $this->checkAuth();
        if ($sessionUser instanceof \Illuminate\Http\RedirectResponse) {
            return $sessionUser;
        }

        return Inertia::render('Employee/ZainCash', [
            'auth' => [
                'sessionUser' => $sessionUser
            ]
        ]);
    }

    public function superKey()
    {
        $sessionUser = $this->checkAuth();
        if ($sessionUser instanceof \Illuminate\Http\RedirectResponse) {
            return $sessionUser;
        }

        return Inertia::render('Employee/SuperKey', [
            'auth' => [
                'sessionUser' => $sessionUser
            ]
        ]);
    }

    public function travelers()
    {
        $sessionUser = $this->checkAuth();
        if ($sessionUser instanceof \Illuminate\Http\RedirectResponse) {
            return $sessionUser;
        }

        return Inertia::render('Employee/Travelers', [
            'auth' => [
                'sessionUser' => $sessionUser
            ]
        ]);
    }

    public function balance()
    {
        $sessionUser = $this->checkAuth();
        if ($sessionUser instanceof \Illuminate\Http\RedirectResponse) {
            return $sessionUser;
        }

        return Inertia::render('Employee/Balance', [
            'auth' => [
                'sessionUser' => $sessionUser
            ]
        ]);
    }

    public function transactions()
    {
        $sessionUser = $this->checkAuth();
        if ($sessionUser instanceof \Illuminate\Http\RedirectResponse) {
            return $sessionUser;
        }

        return Inertia::render('Employee/Transactions', [
            'auth' => [
                'sessionUser' => $sessionUser
            ]
        ]);
    }

    public function closingBalance()
    {
        $sessionUser = $this->checkAuth();
        if ($sessionUser instanceof \Illuminate\Http\RedirectResponse) {
            return $sessionUser;
        }

        return Inertia::render('Employee/ClosingBalance', [
            'auth' => [
                'sessionUser' => $sessionUser
            ]
        ]);
    }
}
