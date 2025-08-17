<?php

use App\Http\Controllers\Api\CashBalanceController;
use App\Http\Controllers\Api\DollarBalanceController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// مسارات الرصيد النقدي المركزي - تستخدم session middleware
Route::middleware(['web'])->group(function () {
    Route::prefix('cash-balance')->group(function () {
        Route::get('/current', [CashBalanceController::class, 'getCurrentBalance']);
        Route::get('/stats', [CashBalanceController::class, 'getStats']);
        Route::post('/initialize', [CashBalanceController::class, 'initializeBalance']);
    });

    // مسارات رصيد الدولار المركزي
    Route::prefix('employee/dollar-balance')->group(function () {
        Route::get('/current', [DollarBalanceController::class, 'getCurrentBalance']);
        Route::get('/stats', [DollarBalanceController::class, 'getStats']);
        Route::get('/history', [DollarBalanceController::class, 'getHistory']);
        Route::post('/initialize', [DollarBalanceController::class, 'initializeBalance']);
    });
});
