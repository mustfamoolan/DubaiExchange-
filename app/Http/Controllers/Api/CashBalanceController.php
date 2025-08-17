<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CashBalanceService;
use Illuminate\Http\JsonResponse;

class CashBalanceController extends Controller
{
    // Helper method to get session user
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
     * الحصول على الرصيد النقدي الحالي للموظف الحالي
     */
    public function getCurrentBalance(): JsonResponse
    {
        try {
            $sessionUser = $this->getSessionUser();
            if (!$sessionUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'جلسة العمل منتهية الصلاحية'
                ], 401);
            }

            $currentBalance = CashBalanceService::getCurrentBalance($sessionUser['id']);

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
     * الحصول على إحصائيات الرصيد النقدي للموظف الحالي
     */
    public function getStats(): JsonResponse
    {
        try {
            $sessionUser = $this->getSessionUser();
            if (!$sessionUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'جلسة العمل منتهية الصلاحية'
                ], 401);
            }

            $stats = CashBalanceService::getQuickStats($sessionUser['id']);

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
     * تهيئة الرصيد الافتتاحي للموظف الحالي
     */
    public function initializeBalance(): JsonResponse
    {
        try {
            $sessionUser = $this->getSessionUser();
            if (!$sessionUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'جلسة العمل منتهية الصلاحية'
                ], 401);
            }

            CashBalanceService::initializeIfNotExists($sessionUser['id'], 0);

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
