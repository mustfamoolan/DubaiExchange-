<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CustomerTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_code',
        'customer_id',
        'user_id',
        'transaction_type',
        'currency_type',
        'amount',
        'exchange_rate',
        'description',
        'notes',
        'transaction_date'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'exchange_rate' => 'decimal:4',
        'transaction_date' => 'datetime'
    ];

    /**
     * العلاقة مع العميل
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * العلاقة مع الموظف
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * توليد رقم المعاملة الأوتوماتيكي
     */
    public static function generateTransactionCode(): string
    {
        $lastTransaction = self::latest('id')->first();
        $nextNumber = $lastTransaction ? $lastTransaction->id + 1 : 1;
        return 'CT' . date('Ymd') . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * نص نوع المعاملة
     */
    public function getTransactionTypeTextAttribute(): string
    {
        return match($this->transaction_type) {
            'received' => 'مستلم',
            'delivered' => 'مسلم',
            default => 'غير محدد'
        };
    }

    /**
     * نص نوع العملة
     */
    public function getCurrencyTypeTextAttribute(): string
    {
        return match($this->currency_type) {
            'iqd' => 'دينار عراقي',
            'usd' => 'دولار أمريكي',
            default => 'غير محدد'
        };
    }
}
