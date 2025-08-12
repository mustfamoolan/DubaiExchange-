<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReceiveTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'document_number',
        'received_from',
        'amount',
        'currency',
        'exchange_rate',
        'amount_in_iqd',
        'description',
        'beneficiary',
        'receiver_name',
        'previous_balance',
        'new_balance',
        'notes',
        'entered_by'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'exchange_rate' => 'decimal:4',
        'amount_in_iqd' => 'decimal:2',
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

    // Scope للحصول على معاملات عملة معينة
    public function scopeByCurrency($query, $currency)
    {
        return $query->where('currency', $currency);
    }

    // الحصول على نص العملة
    public function getCurrencyTextAttribute()
    {
        return $this->currency;
    }

    // تنسيق المبلغ
    public function getFormattedAmountAttribute()
    {
        return number_format($this->amount, 0) . ' ' . $this->currency;
    }

    // تنسيق التاريخ
    public function getFormattedDateAttribute()
    {
        return $this->created_at->format('Y-m-d H:i');
    }
}
