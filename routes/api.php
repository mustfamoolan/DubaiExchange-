<?php

use App\Http\Controllers\Api\CashBalanceController;
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

// مسارات الرصيد النقدي المركزي
Route::middleware(['auth'])->group(function () {
    Route::prefix('cash-balance')->group(function () {
        Route::get('/current', [CashBalanceController::class, 'getCurrentBalance']);
        Route::get('/stats', [CashBalanceController::class, 'getStats']);
        Route::post('/initialize', [CashBalanceController::class, 'initializeBalance']);
    });
});
