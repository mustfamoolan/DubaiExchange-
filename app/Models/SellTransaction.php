<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SellTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'reference_number',
        'dollar_amount',
        'exchange_rate',
        'iqd_amount',
        'commission',
        'total_amount',
        'balance_change',
        'previous_balance',
        'new_balance',
        'notes',
        'entered_by'
    ];

    protected $casts = [
        'dollar_amount' => 'decimal:2',
        'exchange_rate' => 'decimal:4',
        'iqd_amount' => 'decimal:2',
        'commission' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'balance_change' => 'decimal:2',
        'previous_balance' => 'decimal:2',
        'new_balance' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Relationship with User
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Generate unique reference number for sell transactions
    public static function generateReferenceNumber()
    {
        do {
            $reference = 'SELL' . date('Ymd') . sprintf('%03d', rand(100, 999));
        } while (static::where('reference_number', $reference)->exists());

        return $reference;
    }

    // Calculate commission based on amount (1% default)
    public static function calculateCommission($iqd_amount)
    {
        return $iqd_amount * 0.01; // 1% من المبلغ بالدينار العراقي
    }
}
