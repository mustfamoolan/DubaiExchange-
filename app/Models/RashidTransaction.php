<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RashidTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'reference_number',
        'transaction_type',
        'amount',
        'commission',
        'total_with_commission',
        'balance_change',
        'previous_balance',
        'new_balance',
        'notes',
        'entered_by'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'commission' => 'decimal:2',
        'total_with_commission' => 'decimal:2',
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

    // Scopes
    public function scopeCharges($query)
    {
        return $query->where('transaction_type', 'charge');
    }

    public function scopePayments($query)
    {
        return $query->where('transaction_type', 'payment');
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    // Generate unique reference number
    public static function generateReferenceNumber()
    {
        do {
            $reference = 'RAS' . date('Ymd') . sprintf('%04d', rand(1000, 9999));
        } while (static::where('reference_number', $reference)->exists());

        return $reference;
    }

    // Calculate commission based on amount and type
    public static function calculateCommission($amount, $type)
    {
        // You can define commission rates here
        // For now, let's use a simple 1% commission
        return $amount * 0.01;
    }
}
