<?php

namespace App\Services;

use App\Models\DollarBalance;
use App\Models\DollarBalanceHistory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DollarBalanceService
{
    /**
     * تهيئة رصيد الدولار إذا لم يكن موجوداً
     */
    public static function initializeIfNotExists($userId)
    {
        $balance = DollarBalance::where('user_id', $userId)->first();

        if (!$balance) {
            // الحصول على الرصيد الافتتاحي من opening_balances
            $openingBalance = \App\Models\OpeningBalance::where('user_id', $userId)->first();
            $initialBalance = $openingBalance ? $openingBalance->usd_cash : 0;

            DollarBalance::create([
                'user_id' => $userId,
                'current_balance' => $initialBalance,
                'opening_balance' => $initialBalance
            ]);
        }
    }

    /**
     * الحصول على الرصيد الحالي للدولار
     */
    public static function getCurrentBalance($userId)
    {
        self::initializeIfNotExists($userId);

        $balance = DollarBalance::where('user_id', $userId)->first();
        return $balance ? $balance->current_balance : 0;
    }

    /**
     * تحديث الرصيد للشراء (زيادة الدولار)
     */
    public static function updateForBuyTransaction($userId, $dollarAmount, $transactionReference = null, $notes = null)
    {
        return self::updateBalance($userId, $dollarAmount, 'buy', $transactionReference, $notes);
    }

    /**
     * تحديث الرصيد للبيع (نقص الدولار)
     */
    public static function updateForSellTransaction($userId, $dollarAmount, $transactionReference = null, $notes = null)
    {
        return self::updateBalance($userId, -$dollarAmount, 'sell', $transactionReference, $notes);
    }

    /**
     * تحديث الرصيد للقبض بالدولار (زيادة الدولار)
     */
    public static function updateForReceiveTransaction($userId, $dollarAmount, $transactionReference = null, $notes = null)
    {
        return self::updateBalance($userId, $dollarAmount, 'receive', $transactionReference, $notes);
    }

    /**
     * تحديث الرصيد للصرف بالدولار (نقص الدولار)
     */
    public static function updateForExchangeTransaction($userId, $dollarAmount, $transactionReference = null, $notes = null)
    {
        return self::updateBalance($userId, -$dollarAmount, 'exchange', $transactionReference, $notes);
    }

    /**
     * تحديث الرصيد العام
     */
    private static function updateBalance($userId, $amount, $transactionType, $transactionReference = null, $notes = null)
    {
        return DB::transaction(function () use ($userId, $amount, $transactionType, $transactionReference, $notes) {
            self::initializeIfNotExists($userId);

            $balance = DollarBalance::where('user_id', $userId)->lockForUpdate()->first();

            if (!$balance) {
                throw new \Exception('لا يمكن العثور على رصيد الدولار للمستخدم');
            }

            $previousBalance = $balance->current_balance;
            $newBalance = $previousBalance + $amount;

            // التحقق من عدم وجود رصيد سالب (إلا في حالات خاصة)
            if ($newBalance < 0 && in_array($transactionType, ['sell', 'exchange'])) {
                throw new \Exception('الرصيد المتاح بالدولار غير كافي');
            }

            // تحديث الرصيد
            $balance->current_balance = $newBalance;
            $balance->save();

            // تسجيل المعاملة في التاريخ
            DollarBalanceHistory::create([
                'user_id' => $userId,
                'transaction_type' => $transactionType,
                'amount' => abs($amount),
                'previous_balance' => $previousBalance,
                'new_balance' => $newBalance,
                'transaction_reference' => $transactionReference,
                'notes' => $notes
            ]);

            Log::info("Dollar Balance Updated", [
                'user_id' => $userId,
                'transaction_type' => $transactionType,
                'amount' => $amount,
                'previous_balance' => $previousBalance,
                'new_balance' => $newBalance,
                'reference' => $transactionReference
            ]);

            return [
                'success' => true,
                'previous_balance' => $previousBalance,
                'new_balance' => $newBalance,
                'amount' => $amount
            ];
        });
    }

    /**
     * الحصول على تاريخ المعاملات
     */
    public static function getTransactionHistory($userId, $limit = 50)
    {
        return DollarBalanceHistory::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * الحصول على إحصائيات الرصيد
     */
    public static function getBalanceStats($userId, $date = null)
    {
        $query = DollarBalanceHistory::where('user_id', $userId);

        if ($date) {
            $query->whereDate('created_at', $date);
        } else {
            $query->whereDate('created_at', today());
        }

        $stats = [
            'total_bought' => $query->clone()->where('transaction_type', 'buy')->sum('amount'),
            'total_sold' => $query->clone()->where('transaction_type', 'sell')->sum('amount'),
            'total_received' => $query->clone()->where('transaction_type', 'receive')->sum('amount'),
            'total_exchanged' => $query->clone()->where('transaction_type', 'exchange')->sum('amount'),
            'transactions_count' => $query->count()
        ];

        return $stats;
    }
}
