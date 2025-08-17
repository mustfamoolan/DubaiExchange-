<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DollarBalanceHistory extends Model
{
    use HasFactory;

    protected $table = 'dollar_balance_history';

    protected $fillable = [
        'user_id',
        'transaction_type',
        'amount',
        'previous_balance',
        'new_balance',
        'transaction_reference',
        'notes'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'previous_balance' => 'decimal:2',
        'new_balance' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
