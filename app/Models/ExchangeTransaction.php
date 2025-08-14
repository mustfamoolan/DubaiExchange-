<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExchangeTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'invoice_number',
        'amount',
        'currency_type',
        'description',
        'paid_to',
        'previous_balance',
        'new_balance',
        'entered_by',
        'notes'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'previous_balance' => 'decimal:2',
        'new_balance' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // العلاقة مع المستخدم
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Scope للحصول على معاملات مستخدم معين
    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    // Scope للحصول على معاملات اليوم
    public function scopeToday($query)
    {
        return $query->whereDate('created_at', today());
    }

    // تنسيق التاريخ للعرض
    public function getFormattedDateAttribute()
    {
        return $this->created_at->format('Y-m-d H:i:s');
    }

    // تنسيق المبلغ للعرض
    public function getFormattedAmountAttribute()
    {
        return number_format($this->amount, 0) . ' د.ع';
    }
}
