<?php

namespace App\Services;

use App\Models\CashBalance;
use App\Models\OpeningBalance;
use Illuminate\Support\Facades\DB;

class CashBalanceService
{
    /**
     * الحصول على الرصيد النقدي الحالي لمستخدم محدد
     */
    public static function getCurrentBalance(int $userId): float
    {
        return CashBalance::getCurrentBalance($userId);
    }

    /**
     * تهيئة الرصيد النقدي المركزي من الرصيد الافتتاحي (naqa)
     */
    public static function initializeFromOpeningBalance(int $userId): void
    {
        $openingBalance = OpeningBalance::where('user_id', $userId)->first();
        $naqaBalance = $openingBalance ? $openingBalance->naqa : 0;

        // إذا لم يكن هناك رصيد مركزي لهذا المستخدم، نبدأ من الرصيد الافتتاحي
        $cashBalance = CashBalance::where('user_id', $userId)->first();
        if (!$cashBalance) {
            CashBalance::setOpeningBalance($userId, $naqaBalance);
        }
    }

    /**
     * تحديث الرصيد النقدي بعد المعاملة
     */
    public static function updateAfterTransaction(
        int $userId,
        float $previousBalance,
        float $balanceChange,
        string $transactionType,
        string $source,
        int $transactionId,
        float $transactionAmount,
        string $notes = null
    ): float {
        $newBalance = $previousBalance + $balanceChange;

        CashBalance::updateBalance(
            $userId,
            $newBalance,
            $transactionType,
            $source,
            $transactionId,
            $transactionAmount,
            $notes
        );

        return $newBalance;
    }

    /**
     * تحديث الرصيد لمعاملات الشحن والدفع (Banking)
     */
    public static function updateForBankingTransaction(
        int $userId,
        string $transactionType, // 'charge' or 'payment'
        float $amount, // المبلغ الأساسي فقط
        float $commission, // العمولة منفصلة
        string $source, // 'zain_cash', 'rafidain', 'rashid', 'super_key'
        int $transactionId,
        string $notes = null
    ): array {
        $previousBalance = self::getCurrentBalance($userId);

        // المنطق الصحيح:
        if ($transactionType === 'charge') {
            // الشحن: زيادة الرصيد النقدي (بالمبلغ الأساسي) + زيادة العمولة
            $balanceChange = $amount + $commission;
        } else { // payment
            // الدفع: نقص الرصيد النقدي (بالمبلغ الأساسي) + زيادة العمولة
            $balanceChange = -$amount + $commission;
        }

        $newBalance = self::updateAfterTransaction(
            $userId,
            $previousBalance,
            $balanceChange,
            $transactionType,
            $source,
            $transactionId,
            $amount + $commission,
            $notes
        );

        return [
            'previous_balance' => $previousBalance,
            'new_balance' => $newBalance,
            'balance_change' => $balanceChange
        ];
    }    /**
     * تحديث الرصيد لمعاملات البيع
     */
    public static function updateForSellTransaction(
        int $userId,
        float $totalIQD,
        int $transactionId,
        string $notes = null
    ): array {
        $previousBalance = self::getCurrentBalance($userId);

        // البيع: نستلم نقدية مقابل الدولار، فيزيد الرصيد النقدي
        $balanceChange = $totalIQD;

        $newBalance = self::updateAfterTransaction(
            $userId,
            $previousBalance,
            $balanceChange,
            'sell',
            'currency_exchange',
            $transactionId,
            $totalIQD,
            $notes
        );

        return [
            'previous_balance' => $previousBalance,
            'new_balance' => $newBalance,
            'balance_change' => $balanceChange
        ];
    }

    /**
     * تحديث الرصيد لمعاملات الشراء
     */
    public static function updateForBuyTransaction(
        int $userId,
        float $totalIQD,
        int $transactionId,
        string $notes = null
    ): array {
        $previousBalance = self::getCurrentBalance($userId);

        // الشراء: نعطي نقدية مقابل الدولار، فينقص الرصيد النقدي
        $balanceChange = -$totalIQD;

        $newBalance = self::updateAfterTransaction(
            $userId,
            $previousBalance,
            $balanceChange,
            'buy',
            'currency_exchange',
            $transactionId,
            $totalIQD,
            $notes
        );

        return [
            'previous_balance' => $previousBalance,
            'new_balance' => $newBalance,
            'balance_change' => $balanceChange
        ];
    }

    /**
     * تحديث الرصيد لمعاملات الصرف
     */
    public static function updateForExchangeTransaction(
        int $userId,
        float $amount,
        int $transactionId,
        string $notes = null
    ): array {
        $previousBalance = self::getCurrentBalance($userId);

        // الصرف: نعطي نقدية، فينقص الرصيد النقدي
        $balanceChange = -$amount;

        $newBalance = self::updateAfterTransaction(
            $userId,
            $previousBalance,
            $balanceChange,
            'exchange',
            'exchange',
            $transactionId,
            $amount,
            $notes
        );

        return [
            'previous_balance' => $previousBalance,
            'new_balance' => $newBalance,
            'balance_change' => $balanceChange
        ];
    }

    /**
     * تحديث الرصيد لمعاملات القبض
     */
    public static function updateForReceiveTransaction(
        int $userId,
        float $amountInIQD,
        int $transactionId,
        string $notes = null
    ): array {
        $previousBalance = self::getCurrentBalance($userId);

        // القبض: نستلم نقدية، فيزيد الرصيد النقدي
        $balanceChange = $amountInIQD;

        $newBalance = self::updateAfterTransaction(
            $userId,
            $previousBalance,
            $balanceChange,
            'receive',
            'receive',
            $transactionId,
            $amountInIQD,
            $notes
        );

        return [
            'previous_balance' => $previousBalance,
            'new_balance' => $newBalance,
            'balance_change' => $balanceChange
        ];
    }

    /**
     * تحديث الرصيد لمعاملات السافرين
     */
    public static function updateForTravelerTransaction(
        int $userId,
        float $totalIqdAmount,
        int $transactionId,
        string $notes = null
    ): array {
        $previousBalance = self::getCurrentBalance($userId);

        // معاملة السافرين: نستلم نقدية مقابل الدولار، فيزيد الرصيد النقدي
        $balanceChange = $totalIqdAmount;

        $newBalance = self::updateAfterTransaction(
            $userId,
            $previousBalance,
            $balanceChange,
            'traveler',
            'traveler_exchange',
            $transactionId,
            $totalIqdAmount,
            $notes
        );

        return [
            'previous_balance' => $previousBalance,
            'new_balance' => $newBalance,
            'balance_change' => $balanceChange
        ];
    }

    /**
     * تعيين الرصيد الافتتاحي لمستخدم محدد
     */
    public static function setOpeningBalance(int $userId, float $openingBalance): void
    {
        CashBalance::setOpeningBalance($userId, $openingBalance);
    }

    /**
     * الحصول على إحصائيات سريعة لمستخدم محدد
     */
    public static function getQuickStats(int $userId): array
    {
        return CashBalance::getQuickStats($userId);
    }

    /**
     * إضافة رصيد افتتاحي فقط إذا لم يكن موجوداً لمستخدم محدد
     * يستخدم الرصيد النقدي من OpeningBalance إذا لم يكن محدد
     */
    public static function initializeIfNotExists(int $userId, float $openingBalance = 0): void
    {
        $cashBalance = CashBalance::where('user_id', $userId)->first();
        if (!$cashBalance) {
            if ($userId) {
                self::initializeFromOpeningBalance($userId);
            } else {
                self::setOpeningBalance($userId, $openingBalance);
            }
        }
    }
}
