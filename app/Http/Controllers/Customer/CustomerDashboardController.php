<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerDashboardController extends Controller
{
    public function index()
    {
        $customer = session('customer');

        if (!$customer) {
            return redirect()->route('customer.login');
        }

        return Inertia::render('Customer/Dashboard', [
            'customer' => $customer
        ]);
    }
}
