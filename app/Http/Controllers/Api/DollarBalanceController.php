<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DollarBalanceService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DollarBalanceController extends Controller
{
    /**
     * الحصول على الرصيد الحالي للدولار
     */
    public function getCurrentBalance(): JsonResponse
    {
        // التحقق من تسجيل الدخول
        if (!session('logged_in') || session('user_type') !== 'employee') {
            return response()->json(['error' => 'غير مصرح'], 401);
        }

        $sessionUser = session('user_data');
        if (!$sessionUser) {
            return response()->json(['error' => 'لم يتم العثور على بيانات المستخدم'], 401);
        }

        try {
            $currentBalance = DollarBalanceService::getCurrentBalance($sessionUser['id']);

            return response()->json([
                'success' => true,
                'current_balance' => $currentBalance,
                'user_id' => $sessionUser['id']
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'خطأ في جلب الرصيد: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * الحصول على إحصائيات رصيد الدولار
     */
    public function getStats(Request $request): JsonResponse
    {
        // التحقق من تسجيل الدخول
        if (!session('logged_in') || session('user_type') !== 'employee') {
            return response()->json(['error' => 'غير مصرح'], 401);
        }

        $sessionUser = session('user_data');
        if (!$sessionUser) {
            return response()->json(['error' => 'لم يتم العثور على بيانات المستخدم'], 401);
        }

        try {
            $date = $request->get('date', null);
            $stats = DollarBalanceService::getBalanceStats($sessionUser['id'], $date);
            $currentBalance = DollarBalanceService::getCurrentBalance($sessionUser['id']);

            return response()->json([
                'success' => true,
                'current_balance' => $currentBalance,
                'stats' => $stats,
                'date' => $date ?: today()->toDateString()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'خطأ في جلب الإحصائيات: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * الحصول على تاريخ المعاملات
     */
    public function getHistory(Request $request): JsonResponse
    {
        // التحقق من تسجيل الدخول
        if (!session('logged_in') || session('user_type') !== 'employee') {
            return response()->json(['error' => 'غير مصرح'], 401);
        }

        $sessionUser = session('user_data');
        if (!$sessionUser) {
            return response()->json(['error' => 'لم يتم العثور على بيانات المستخدم'], 401);
        }

        try {
            $limit = $request->get('limit', 50);
            $history = DollarBalanceService::getTransactionHistory($sessionUser['id'], $limit);

            return response()->json([
                'success' => true,
                'history' => $history,
                'count' => $history->count()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'خطأ في جلب التاريخ: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * تهيئة رصيد الدولار
     */
    public function initializeBalance(): JsonResponse
    {
        // التحقق من تسجيل الدخول
        if (!session('logged_in') || session('user_type') !== 'employee') {
            return response()->json(['error' => 'غير مصرح'], 401);
        }

        $sessionUser = session('user_data');
        if (!$sessionUser) {
            return response()->json(['error' => 'لم يتم العثور على بيانات المستخدم'], 401);
        }

        try {
            DollarBalanceService::initializeIfNotExists($sessionUser['id']);
            $currentBalance = DollarBalanceService::getCurrentBalance($sessionUser['id']);

            return response()->json([
                'success' => true,
                'message' => 'تم تهيئة رصيد الدولار بنجاح',
                'current_balance' => $currentBalance
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'خطأ في تهيئة الرصيد: ' . $e->getMessage()
            ], 500);
        }
    }
}
