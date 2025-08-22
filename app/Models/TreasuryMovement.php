<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class TreasuryMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'treasury_date',
        'movement_type',
        'employee_id',
        'employee_name',
        'transaction_type',
        'reference_number',

        // المبالغ المحولة
        'amount_naqa',
        'amount_rafidain',
        'amount_rashid',
        'amount_zain_cash',
        'amount_super_key',
        'amount_usd_cash',

        // الأرصدة قبل الحركة
        'balance_before_naqa',
        'balance_before_rafidain',
        'balance_before_rashid',
        'balance_before_zain_cash',
        'balance_before_super_key',
        'balance_before_usd_cash',

        // الأرصدة بعد الحركة
        'balance_after_naqa',
        'balance_after_rafidain',
        'balance_after_rashid',
        'balance_after_zain_cash',
        'balance_after_super_key',
        'balance_after_usd_cash',

        'profit_loss_amount',
        'exchange_rate_used',
        'description',
        'notes',
        'status',
        'processed_by'
    ];

    protected $casts = [
        'amount_naqa' => 'decimal:2',
        'amount_rafidain' => 'decimal:2',
        'amount_rashid' => 'decimal:2',
        'amount_zain_cash' => 'decimal:2',
        'amount_super_key' => 'decimal:2',
        'amount_usd_cash' => 'decimal:2',

        'balance_before_naqa' => 'decimal:2',
        'balance_before_rafidain' => 'decimal:2',
        'balance_before_rashid' => 'decimal:2',
        'balance_before_zain_cash' => 'decimal:2',
        'balance_before_super_key' => 'decimal:2',
        'balance_before_usd_cash' => 'decimal:2',

        'balance_after_naqa' => 'decimal:2',
        'balance_after_rafidain' => 'decimal:2',
        'balance_after_rashid' => 'decimal:2',
        'balance_after_zain_cash' => 'decimal:2',
        'balance_after_super_key' => 'decimal:2',
        'balance_after_usd_cash' => 'decimal:2',

        'profit_loss_amount' => 'decimal:2',
        'exchange_rate_used' => 'decimal:2',
        'treasury_date' => 'date',
    ];

    /**
     * احسب إجمالي المبلغ المحول
     */
    public function getTotalAmountAttribute()
    {
        return $this->amount_naqa +
               $this->amount_rafidain +
               $this->amount_rashid +
               $this->amount_zain_cash +
               $this->amount_super_key +
               ($this->amount_usd_cash * $this->exchange_rate_used);
    }

    /**
     * علاقة مع الخزنة الرئيسية
     */
    public function treasury()
    {
        return $this->belongsTo(MainTreasury::class, 'treasury_date', 'treasury_date');
    }

    /**
     * علاقة مع الموظف
     */
    public function employee()
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    /**
     * نطاقات للاستعلامات
     */
    public function scopeDistributions($query)
    {
        return $query->where('movement_type', 'distribution');
    }

    public function scopeReturns($query)
    {
        return $query->where('movement_type', 'return');
    }

    public function scopeForDate($query, $date)
    {
        return $query->where('treasury_date', $date);
    }

    public function scopeForEmployee($query, $employeeId)
    {
        return $query->where('employee_id', $employeeId);
    }

    public function scopeProfits($query)
    {
        return $query->where('profit_loss_amount', '>', 0);
    }

    public function scopeLosses($query)
    {
        return $query->where('profit_loss_amount', '<', 0);
    }

    /**
     * هل هذه الحركة ربح؟
     */
    public function isProfitable()
    {
        return $this->profit_loss_amount > 0;
    }

    /**
     * هل هذه الحركة خسارة؟
     */
    public function isLoss()
    {
        return $this->profit_loss_amount < 0;
    }

    /**
     * نوع الحركة بالعربية
     */
    public function getMovementTypeArabicAttribute()
    {
        return $this->movement_type === 'distribution' ? 'توزيع' : 'إرجاع';
    }

    /**
     * حالة الربح/الخسارة بالعربية
     */
    public function getProfitLossStatusAttribute()
    {
        if ($this->profit_loss_amount > 0) {
            return 'ربح';
        } elseif ($this->profit_loss_amount < 0) {
            return 'خسارة';
        } else {
            return 'متعادل';
        }
    }
}
