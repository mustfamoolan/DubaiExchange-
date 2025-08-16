<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CashBalanceService;
use Illuminate\Http\JsonResponse;

class CashBalanceController extends Controller
{
    /**
     * الحصول على الرصيد النقدي الحالي
     */
    public function getCurrentBalance(): JsonResponse
    {
        try {
            $currentBalance = CashBalanceService::getCurrentBalance();

            return response()->json([
                'success' => true,
                'current_balance' => $currentBalance
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في جلب الرصيد النقدي',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * الحصول على إحصائيات الرصيد النقدي
     */
    public function getStats(): JsonResponse
    {
        try {
            $stats = CashBalanceService::getQuickStats();

            return response()->json($stats);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في جلب إحصائيات الرصيد النقدي',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * تهيئة الرصيد الافتتاحي
     */
    public function initializeBalance(): JsonResponse
    {
        try {
            CashBalanceService::initializeIfNotExists(0);

            return response()->json([
                'success' => true,
                'message' => 'تم تهيئة الرصيد النقدي بنجاح'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في تهيئة الرصيد النقدي',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
