<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CashBalance extends Model
{
    use HasFactory;

    protected $table = 'cash_balance';

    protected $fillable = [
        'user_id',
        'current_cash_balance',
        'opening_cash_balance',
        'last_updated_at',
        'last_updated_by',
        'last_transaction_type',
        'last_transaction_source',
        'last_transaction_id',
        'last_transaction_amount',
        'notes'
    ];

    protected $casts = [
        'current_cash_balance' => 'decimal:2',
        'opening_cash_balance' => 'decimal:2',
        'last_transaction_amount' => 'decimal:2',
        'last_updated_at' => 'datetime'
    ];

    /**
     * العلاقة مع المستخدم الذي يملك هذا الرصيد
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * العلاقة مع المستخدم الذي قام بآخر تحديث
     */
    public function lastUpdatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'last_updated_by');
    }

    /**
     * الحصول على الرصيد النقدي الحالي لمستخدم محدد
     */
    public static function getCurrentBalance(int $userId): float
    {
        $record = self::where('user_id', $userId)->first();
        return $record ? $record->current_cash_balance : 0;
    }

    /**
     * تحديث الرصيد النقدي لمستخدم محدد
     */
    public static function updateBalance(
        int $userId,
        float $newBalance,
        string $transactionType,
        string $transactionSource,
        int $transactionId,
        float $transactionAmount,
        string $notes = null
    ): void {
        $record = self::where('user_id', $userId)->first();

        if (!$record) {
            // إنشاء سجل جديد إذا لم يكن موجوداً
            self::create([
                'user_id' => $userId,
                'current_cash_balance' => $newBalance,
                'opening_cash_balance' => 0,
                'last_updated_at' => now(),
                'last_updated_by' => $userId,
                'last_transaction_type' => $transactionType,
                'last_transaction_source' => $transactionSource,
                'last_transaction_id' => $transactionId,
                'last_transaction_amount' => $transactionAmount,
                'notes' => $notes
            ]);
        } else {
            // تحديث السجل الموجود
            $record->update([
                'current_cash_balance' => $newBalance,
                'last_updated_at' => now(),
                'last_updated_by' => $userId,
                'last_transaction_type' => $transactionType,
                'last_transaction_source' => $transactionSource,
                'last_transaction_id' => $transactionId,
                'last_transaction_amount' => $transactionAmount,
                'notes' => $notes
            ]);
        }
    }

    /**
     * تعيين الرصيد الافتتاحي لمستخدم محدد
     */
    public static function setOpeningBalance(int $userId, float $openingBalance): void
    {
        $record = self::where('user_id', $userId)->first();

        if (!$record) {
            self::create([
                'user_id' => $userId,
                'current_cash_balance' => $openingBalance,
                'opening_cash_balance' => $openingBalance
            ]);
        } else {
            $record->update([
                'opening_cash_balance' => $openingBalance,
                'current_cash_balance' => $openingBalance
            ]);
        }
    }

    /**
     * الحصول على إحصائيات سريعة لمستخدم محدد
     */
    public static function getQuickStats(int $userId): array
    {
        $record = self::where('user_id', $userId)->first();

        if (!$record) {
            return [
                'current_balance' => 0,
                'opening_balance' => 0,
                'difference' => 0,
                'last_updated' => null,
                'last_transaction' => null
            ];
        }

        return [
            'current_balance' => $record->current_cash_balance,
            'opening_balance' => $record->opening_cash_balance,
            'difference' => $record->current_cash_balance - $record->opening_cash_balance,
            'last_updated' => $record->last_updated_at,
            'last_transaction' => [
                'type' => $record->last_transaction_type,
                'source' => $record->last_transaction_source,
                'amount' => $record->last_transaction_amount
            ]
        ];
    }
}
