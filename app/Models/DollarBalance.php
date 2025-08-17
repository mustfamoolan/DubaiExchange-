<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DollarBalance extends Model
{
    use HasFactory;

    protected $table = 'dollar_balance';

    protected $fillable = [
        'user_id',
        'current_balance',
        'opening_balance'
    ];

    protected $casts = [
        'current_balance' => 'decimal:2',
        'opening_balance' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}


