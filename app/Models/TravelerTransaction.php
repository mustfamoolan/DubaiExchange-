<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class TravelerTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'receipt_number',
        'trip_number',
        'full_name',
        'usd_amount',
        'exchange_rate',
        'iqd_amount',
        'total_iqd',
        'previous_balance',
        'new_balance',
        'entered_by',
        'notes'
    ];

    protected $casts = [
        'usd_amount' => 'decimal:2',
        'exchange_rate' => 'decimal:2',
        'iqd_amount' => 'decimal:2',
        'total_iqd' => 'decimal:2',
        'previous_balance' => 'decimal:2',
        'new_balance' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get the user that owns the transaction
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get formatted created date
     */
    public function getFormattedDateAttribute()
    {
        return $this->created_at->format('d/m/Y H:i');
    }
}
