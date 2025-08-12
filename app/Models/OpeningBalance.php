<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OpeningBalance extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'opening_date',
        'status',
        'naqa',
        'rafidain',
        'rashid',
        'zain_cash',
        'super_key',
        'usd_cash',
        'exchange_rate',
        'total_iqd',
        'total_usd_in_iqd',
        'grand_total',
        'closing_date',
        'closing_naqa',
        'closing_rafidain',
        'closing_rashid',
        'closing_zain_cash',
        'closing_super_key',
        'closing_usd_cash',
        'closing_exchange_rate',
        'closing_total',
        'notes',
        'created_by',
        'updated_by',
        'closed_by',
    ];

    protected $casts = [
        'opening_date' => 'date',
        'closing_date' => 'date',
        'naqa' => 'decimal:2',
        'rafidain' => 'decimal:2',
        'rashid' => 'decimal:2',
        'zain_cash' => 'decimal:2',
        'super_key' => 'decimal:2',
        'usd_cash' => 'decimal:2',
        'exchange_rate' => 'decimal:2',
        'total_iqd' => 'decimal:2',
        'total_usd_in_iqd' => 'decimal:2',
        'grand_total' => 'decimal:2',
        'closing_naqa' => 'decimal:2',
        'closing_rafidain' => 'decimal:2',
        'closing_rashid' => 'decimal:2',
        'closing_zain_cash' => 'decimal:2',
        'closing_super_key' => 'decimal:2',
        'closing_usd_cash' => 'decimal:2',
        'closing_exchange_rate' => 'decimal:2',
        'closing_total' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function calculateTotalIQD(): float
    {
        return $this->naqa + $this->rafidain + $this->rashid + $this->zain_cash + $this->super_key;
    }

    public function calculateTotalUSDInIQD(): float
    {
        return $this->usd_cash * $this->exchange_rate;
    }

    public function calculateGrandTotal(): float
    {
        return $this->calculateTotalIQD() + $this->calculateTotalUSDInIQD();
    }

    public function updateCalculatedTotals(): void
    {
        $this->total_iqd = $this->calculateTotalIQD();
        $this->total_usd_in_iqd = $this->calculateTotalUSDInIQD();
        $this->grand_total = $this->calculateGrandTotal();
    }

    public function getStatusTextAttribute(): string
    {
        return match($this->status) {
            'pending' => 'معلق',
            'active' => 'مفتوح',
            'closed' => 'مغلق',
            'retrieved' => 'مسترجع',
            'cancelled' => 'ملغي',
            default => 'غير محدد'
        };
    }

    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'pending' => 'bg-yellow-100 text-yellow-800',
            'active' => 'bg-green-100 text-green-800',
            'closed' => 'bg-blue-100 text-blue-800',
            'retrieved' => 'bg-purple-100 text-purple-800',
            'cancelled' => 'bg-red-100 text-red-800',
            default => 'bg-gray-100 text-gray-800'
        };
    }

    protected static function booted(): void
    {
        static::saving(function (OpeningBalance $openingBalance) {
            $openingBalance->updateCalculatedTotals();
        });
    }
}
