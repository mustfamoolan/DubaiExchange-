<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_code',
        'name',
        'phone',
        'iqd_opening_balance',
        'usd_opening_balance',
        'current_iqd_balance',
        'current_usd_balance',
        'is_active',
        'notes'
    ];

    protected $casts = [
        'iqd_opening_balance' => 'decimal:2',
        'usd_opening_balance' => 'decimal:2',
        'current_iqd_balance' => 'decimal:2',
        'current_usd_balance' => 'decimal:2',
        'is_active' => 'boolean'
    ];

    /**
     * العلاقة مع معاملات العميل
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(CustomerTransaction::class);
    }

    /**
     * توليد رمز العميل الأوتوماتيكي
     */
    public static function generateCustomerCode(): string
    {
        $lastCustomer = self::latest('id')->first();
        $nextNumber = $lastCustomer ? $lastCustomer->id + 1 : 1;
        return 'C' . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);
    }

    /**
     * حساب إجمالي المبالغ المستلمة
     */
    public function getTotalReceivedAttribute(): array
    {
        $iqd = $this->transactions()
            ->where('transaction_type', 'received')
            ->where('currency_type', 'iqd')
            ->sum('amount');

        $usd = $this->transactions()
            ->where('transaction_type', 'received')
            ->where('currency_type', 'usd')
            ->sum('amount');

        return [
            'iqd' => $iqd,
            'usd' => $usd
        ];
    }

    /**
     * حساب إجمالي المبالغ المسلمة
     */
    public function getTotalDeliveredAttribute(): array
    {
        $iqd = $this->transactions()
            ->where('transaction_type', 'delivered')
            ->where('currency_type', 'iqd')
            ->sum('amount');

        $usd = $this->transactions()
            ->where('transaction_type', 'delivered')
            ->where('currency_type', 'usd')
            ->sum('amount');

        return [
            'iqd' => $iqd,
            'usd' => $usd
        ];
    }

    /**
     * حساب الرصيد المتبقي
     */
    public function getRemainingBalanceAttribute(): array
    {
        $received = $this->total_received;
        $delivered = $this->total_delivered;

        return [
            'iqd' => $this->iqd_opening_balance + $received['iqd'] - $delivered['iqd'],
            'usd' => $this->usd_opening_balance + $received['usd'] - $delivered['usd']
        ];
    }

    /**
     * تحديث أرصدة العميل
     */
    public function updateBalances()
    {
        $received = $this->total_received;
        $delivered = $this->total_delivered;

        $this->update([
            'current_iqd_balance' => $this->iqd_opening_balance + $received['iqd'] - $delivered['iqd'],
            'current_usd_balance' => $this->usd_opening_balance + $received['usd'] - $delivered['usd']
        ]);
    }
}
