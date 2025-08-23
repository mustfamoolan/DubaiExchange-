<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerAuth
{
    public function handle(Request $request, Closure $next)
    {
        if (!session('customer')) {
            return redirect()->route('customer.login');
        }

        // إضافة بيانات العميل إلى props للمشاركة مع React
        Inertia::share('auth.customer', session('customer'));

        return $next($request);
    }
}
