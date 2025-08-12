<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ThermalReceipt extends Model
{
    use HasFactory;

    protected $fillable = [
        'receipt_number',
        'transaction_type',
        'service_type',
        'reference_number',
        'amount',
        'commission',
        'total_amount',
        'notes',
        'customer_phone',
        'employee_name',
        'user_id',
        'receipt_settings',
        'is_printed',
        'printed_at'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'commission' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'receipt_settings' => 'array',
        'is_printed' => 'boolean',
        'printed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // العلاقة مع المستخدم
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // توليد رقم فاتورة فريد
    public static function generateReceiptNumber($serviceType)
    {
        $prefix = match($serviceType) {
            'rafidain' => 'RAF',
            'rashid' => 'RAS',
            'zain_cash' => 'ZAI',
            'super_key' => 'SUP',
            'buy_usd' => 'BUY',
            'sell_usd' => 'SELL',
            'receive' => 'REC',
            'exchange' => 'EXC',
            default => 'REC'
        };

        do {
            $number = $prefix . 'R' . date('Ymd') . sprintf('%04d', rand(1000, 9999));
        } while (static::where('receipt_number', $number)->exists());

        return $number;
    }

    // الحصول على اسم الخدمة باللغة العربية
    public function getServiceNameAttribute()
    {
        return match($this->service_type) {
            'rafidain' => 'مصرف الرافدين',
            'rashid' => 'مصرف الرشيد',
            'zain_cash' => 'زين كاش',
            'super_key' => 'سوبر كي',
            'buy_usd' => 'شراء الدولار الأمريكي',
            'sell_usd' => 'بيع الدولار الأمريكي',
            'receive' => 'سند قبض',
            'exchange' => 'سند صرف',
            default => 'خدمة غير محددة'
        };
    }

    // الحصول على نوع المعاملة باللغة العربية
    public function getTransactionTypeNameAttribute()
    {
        return match($this->service_type) {
            'buy_usd' => 'شراء دولار',
            'sell_usd' => 'بيع دولار',
            'receive' => 'سند قبض',
            default => $this->transaction_type === 'charge' ? 'شحن' : 'دفع'
        };
    }

    // Scopes للبحث
    public function scopeByService($query, $serviceType)
    {
        return $query->where('service_type', $serviceType);
    }

    public function scopeByTransactionType($query, $type)
    {
        return $query->where('transaction_type', $type);
    }

    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeToday($query)
    {
        return $query->whereDate('created_at', today());
    }

    public function scopePrinted($query)
    {
        return $query->where('is_printed', true);
    }
}
