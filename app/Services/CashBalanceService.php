<?php

namespace App\Services;

use App\Models\CashBalance;
use App\Models\OpeningBalance;
use Illuminate\Support\Facades\DB;

class CashBalanceService
{
    /**
     * الحصول على الرصيد النقدي الحالي
     */
    public static function getCurrentBalance(): float
    {
        return CashBalance::getCurrentBalance();
    }

    /**
     * تهيئة الرصيد النقدي المركزي من الرصيد الافتتاحي (naqa)
     */
    public static function initializeFromOpeningBalance(int $userId): void
    {
        $openingBalance = OpeningBalance::where('user_id', $userId)->first();
        $naqaBalance = $openingBalance ? $openingBalance->naqa : 0;

        // إذا لم يكن هناك رصيد مركزي، نبدأ من الرصيد الافتتاحي
        $cashBalance = CashBalance::first();
        if (!$cashBalance) {
            CashBalance::setOpeningBalance($naqaBalance);
        }
    }

    /**
     * تحديث الرصيد النقدي بعد المعاملة
     */
    public static function updateAfterTransaction(
        float $previousBalance,
        float $balanceChange,
        int $userId,
        string $transactionType,
        string $source,
        int $transactionId,
        float $transactionAmount,
        string $notes = null
    ): float {
        $newBalance = $previousBalance + $balanceChange;

        CashBalance::updateBalance(
            $newBalance,
            $userId,
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
        string $transactionType, // 'charge' or 'payment'
        float $amount, // المبلغ الأساسي فقط
        float $commission, // العمولة منفصلة
        int $userId,
        string $source, // 'zain_cash', 'rafidain', 'rashid', 'super_key'
        int $transactionId,
        string $notes = null
    ): array {
        $previousBalance = self::getCurrentBalance();

        // المنطق الصحيح:
        if ($transactionType === 'charge') {
            // الشحن: زيادة الرصيد النقدي (بالمبلغ الأساسي) + زيادة العمولة
            $balanceChange = $amount + $commission;
        } else { // payment
            // الدفع: نقص الرصيد النقدي (بالمبلغ الأساسي) + زيادة العمولة
            $balanceChange = -$amount + $commission;
        }

        $newBalance = self::updateAfterTransaction(
            $previousBalance,
            $balanceChange,
            $userId,
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
        float $totalIQD,
        int $userId,
        int $transactionId,
        string $notes = null
    ): array {
        $previousBalance = self::getCurrentBalance();

        // البيع: نستلم نقدية مقابل الدولار، فيزيد الرصيد النقدي
        $balanceChange = $totalIQD;

        $newBalance = self::updateAfterTransaction(
            $previousBalance,
            $balanceChange,
            $userId,
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
        float $totalIQD,
        int $userId,
        int $transactionId,
        string $notes = null
    ): array {
        $previousBalance = self::getCurrentBalance();

        // الشراء: نعطي نقدية مقابل الدولار، فينقص الرصيد النقدي
        $balanceChange = -$totalIQD;

        $newBalance = self::updateAfterTransaction(
            $previousBalance,
            $balanceChange,
            $userId,
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
        float $amount,
        int $userId,
        int $transactionId,
        string $notes = null
    ): array {
        $previousBalance = self::getCurrentBalance();

        // الصرف: نعطي نقدية، فينقص الرصيد النقدي
        $balanceChange = -$amount;

        $newBalance = self::updateAfterTransaction(
            $previousBalance,
            $balanceChange,
            $userId,
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
        float $amountInIQD,
        int $userId,
        int $transactionId,
        string $notes = null
    ): array {
        $previousBalance = self::getCurrentBalance();

        // القبض: نستلم نقدية، فيزيد الرصيد النقدي
        $balanceChange = $amountInIQD;

        $newBalance = self::updateAfterTransaction(
            $previousBalance,
            $balanceChange,
            $userId,
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
     * تعيين الرصيد الافتتاحي
     */
    public static function setOpeningBalance(float $openingBalance): void
    {
        CashBalance::setOpeningBalance($openingBalance);
    }

    /**
     * الحصول على إحصائيات سريعة
     */
    public static function getQuickStats(): array
    {
        return CashBalance::getQuickStats();
    }

    /**
     * إضافة رصيد افتتاحي فقط إذا لم يكن موجوداً
     * يستخدم الرصيد النقدي من OpeningBalance إذا لم يكن محدد
     */
    public static function initializeIfNotExists(int $userId = null, float $openingBalance = 0): void
    {
        if (!CashBalance::first()) {
            if ($userId) {
                self::initializeFromOpeningBalance($userId);
            } else {
                self::setOpeningBalance($openingBalance);
            }
        }
    }
}
