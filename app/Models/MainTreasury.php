<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class MainTreasury extends Model
{
    use HasFactory;

    protected $table = 'main_treasury';

    protected $fillable = [
        'current_naqa',
        'current_rafidain',
        'current_rashid',
        'current_zain_cash',
        'current_super_key',
        'current_usd_cash',
        'current_exchange_rate',
        'total_iqd',
        'total_usd_in_iqd',
        'grand_total',
        'treasury_date',
        'status',
        'created_by',
        'updated_by',
        'notes'
    ];

    protected $casts = [
        'current_naqa' => 'decimal:2',
        'current_rafidain' => 'decimal:2',
        'current_rashid' => 'decimal:2',
        'current_zain_cash' => 'decimal:2',
        'current_super_key' => 'decimal:2',
        'current_usd_cash' => 'decimal:2',
        'current_exchange_rate' => 'decimal:2',
        'total_iqd' => 'decimal:2',
        'total_usd_in_iqd' => 'decimal:2',
        'grand_total' => 'decimal:2',
        'treasury_date' => 'date',
        'last_updated' => 'datetime',
    ];

    protected $dates = [
        'treasury_date',
        'last_updated'
    ];

    /**
     * احسب إجمالي الدينار العراقي
     */
    public function calculateTotalIQD()
    {
        return $this->current_naqa +
               $this->current_rafidain +
               $this->current_rashid +
               $this->current_zain_cash +
               $this->current_super_key;
    }

    /**
     * احسب إجمالي الدولار محولاً للدينار
     */
    public function calculateUSDInIQD()
    {
        return $this->current_usd_cash * $this->current_exchange_rate;
    }

    /**
     * احسب الإجمالي العام
     */
    public function calculateGrandTotal()
    {
        return $this->calculateTotalIQD() + $this->calculateUSDInIQD();
    }

    /**
     * حدث الإجماليات
     */
    public function updateTotals()
    {
        $this->total_iqd = $this->calculateTotalIQD();
        $this->total_usd_in_iqd = $this->calculateUSDInIQD();
        $this->grand_total = $this->calculateGrandTotal();
        $this->last_updated = now();
        $this->save();
    }

    /**
     * احصل على الخزنة النشطة
     */
    public static function getActive()
    {
        return self::where('status', 'active')->first();
    }

    /**
     * إنشاء خزنة جديدة أو احصل على الموجودة
     */
    public static function createOrGetToday()
    {
        $today = now()->format('Y-m-d');

        $treasury = self::where('treasury_date', $today)
                       ->where('status', 'active')
                       ->first();

        if (!$treasury) {
            $treasury = self::create([
                'treasury_date' => $today,
                'status' => 'active',
                'created_by' => session('user_name', 'النظام'),
                'current_exchange_rate' => 1400
            ]);
        }

        return $treasury;
    }

    /**
     * علاقة مع حركات الخزنة
     */
    public function movements()
    {
        return $this->hasMany(TreasuryMovement::class, 'treasury_date', 'treasury_date');
    }

    /**
     * نطاقات للاستعلامات
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeForDate($query, $date)
    {
        return $query->where('treasury_date', $date);
    }
}
