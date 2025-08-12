<?php

namespace App\Http\Controllers;

use App\Models\ThermalReceipt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ThermalReceiptController extends Controller
{
    /**
     * إنشاء فاتورة حرارية جديدة
     */
    public function createReceipt(Request $request)
    {
        $request->validate([
            'transaction_type' => 'required|in:charge,payment',
            'service_type' => 'required|in:rafidain,rashid,zain_cash,super_key,buy_usd,sell_usd,receive,exchange',
            'reference_number' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'commission' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'customer_phone' => 'nullable|string'
        ]);

        try {
            // حساب المبلغ الإجمالي
            $totalAmount = $request->amount + $request->commission;

            // إنشاء الفاتورة
            $receipt = ThermalReceipt::create([
                'receipt_number' => ThermalReceipt::generateReceiptNumber($request->service_type),
                'transaction_type' => $request->transaction_type,
                'service_type' => $request->service_type,
                'reference_number' => $request->reference_number,
                'amount' => $request->amount,
                'commission' => $request->commission,
                'total_amount' => $totalAmount,
                'notes' => $request->notes,
                'customer_phone' => $request->customer_phone,
                'employee_name' => Auth::user()->name,
                'user_id' => Auth::id(),
                'receipt_settings' => $this->getDefaultReceiptSettings(),
                'is_printed' => false
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم إنشاء الفاتورة بنجاح',
                'receipt' => $receipt,
                'receipt_data' => $this->formatReceiptData($receipt)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في إنشاء الفاتورة: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * طباعة الفاتورة وتحديث حالة الطباعة
     */
    public function printReceipt(Request $request, $receiptId)
    {
        try {
            $receipt = ThermalReceipt::findOrFail($receiptId);

            // تحديث حالة الطباعة
            $receipt->update([
                'is_printed' => true,
                'printed_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم تسجيل طباعة الفاتورة',
                'receipt_data' => $this->formatReceiptData($receipt)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في طباعة الفاتورة: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * الحصول على الفاتورة للطباعة
     */
    public function getReceiptForPrint($receiptId)
    {
        try {
            $receipt = ThermalReceipt::findOrFail($receiptId);

            return response()->json([
                'success' => true,
                'receipt_data' => $this->formatReceiptData($receipt)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'الفاتورة غير موجودة'
            ], 404);
        }
    }

    /**
     * تنسيق بيانات الفاتورة للطباعة
     */
    private function formatReceiptData($receipt)
    {
        return [
            'receipt_number' => $receipt->receipt_number,
            'service_name' => $receipt->service_name,
            'service_type' => $receipt->service_type,
            'transaction_type' => $receipt->transaction_type_name,
            'reference_number' => $receipt->reference_number,
            'amount' => number_format($receipt->amount, 0),
            'commission' => number_format($receipt->commission, 0),
            'total_amount' => number_format($receipt->total_amount, 0),
            'notes' => $receipt->notes,
            'customer_phone' => $receipt->customer_phone,
            'employee_name' => $receipt->employee_name,
            'date' => $receipt->created_at->format('Y-m-d'),
            'time' => $receipt->created_at->format('H:i'),
            'datetime_formatted' => $receipt->created_at->format('Y-m-d H:i'),
            'company_info' => $this->getCompanyInfo(),
            'service_config' => $this->getServiceConfig($receipt->service_type)
        ];
    }

    /**
     * الحصول على إعدادات الفاتورة الافتراضية
     */
    private function getDefaultReceiptSettings()
    {
        return [
            'paper_width' => '80mm',
            'font_size' => '12px',
            'show_logo' => true,
            'show_footer' => true,
            'auto_print' => false
        ];
    }

    /**
     * معلومات الشركة
     */
    private function getCompanyInfo()
    {
        return [
            'name' => 'دبي العملية للصرافة',
            'phone' => '07801234567',
            'address' => 'العراق - بغداد',
            'footer_text' => 'شكراً لكم لتعاملكم معنا'
        ];
    }

    /**
     * إعدادات الخدمة حسب النوع
     */
    private function getServiceConfig($serviceType)
    {
        return match($serviceType) {
            'rafidain' => [
                'color' => '#22c55e', // أخضر
                'icon' => '🏦',
                'prefix' => 'RAF'
            ],
            'rashid' => [
                'color' => '#3b82f6', // أزرق
                'icon' => '🏛️',
                'prefix' => 'RAS'
            ],
            'zain_cash' => [
                'color' => '#8b5cf6', // بنفسجي
                'icon' => '💳',
                'prefix' => 'ZAI'
            ],
            'super_key' => [
                'color' => '#eab308', // أصفر
                'icon' => '🔑',
                'prefix' => 'SUP'
            ],
            'buy_usd' => [
                'color' => '#06b6d4', // سماوي
                'icon' => '🛒',
                'prefix' => 'BUY'
            ],
            'sell_usd' => [
                'color' => '#f59e0b', // برتقالي
                'icon' => '💰',
                'prefix' => 'SELL'
            ],
            'receive' => [
                'color' => '#10b981', // أخضر
                'icon' => '📝',
                'prefix' => 'REC'
            ],
            'exchange' => [
                'color' => '#ef4444', // أحمر
                'icon' => '💸',
                'prefix' => 'EXC'
            ],
            default => [
                'color' => '#6b7280',
                'icon' => '📄',
                'prefix' => 'REC'
            ]
        };
    }

    /**
     * إنشاء فاتورة لعملية البيع
     */
    public function createSellReceipt(Request $request)
    {
        $request->validate([
            'reference_number' => 'required|string',
            'dollar_amount' => 'required|numeric|min:0',
            'exchange_rate' => 'required|numeric|min:0',
            'iqd_amount' => 'required|numeric|min:0',
            'commission' => 'required|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'customer_phone' => 'nullable|string'
        ]);

        try {
            // إنشاء الفاتورة
            $receipt = ThermalReceipt::create([
                'receipt_number' => ThermalReceipt::generateReceiptNumber('sell_usd'),
                'transaction_type' => 'payment', // البيع = دفع دولار واستلام دينار
                'service_type' => 'sell_usd',
                'reference_number' => $request->reference_number,
                'amount' => $request->iqd_amount, // المبلغ الأساسي بالدينار
                'commission' => $request->commission,
                'total_amount' => $request->total_amount,
                'notes' => $request->notes,
                'customer_phone' => $request->customer_phone,
                'employee_name' => session('user_data')['name'] ?? 'غير محدد',
                'user_id' => session('user_data')['id'] ?? 0,
                'receipt_settings' => array_merge($this->getDefaultReceiptSettings(), [
                    'dollar_amount' => $request->dollar_amount,
                    'exchange_rate' => $request->exchange_rate,
                    'iqd_amount' => $request->iqd_amount
                ]),
                'is_printed' => false
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم إنشاء فاتورة البيع بنجاح',
                'receipt' => $receipt,
                'receipt_data' => $this->formatSellReceiptData($receipt)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في إنشاء فاتورة البيع: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * إنشاء فاتورة لعملية الشراء
     */
    public function createBuyReceipt(Request $request)
    {
        $request->validate([
            'reference_number' => 'required|string',
            'dollar_amount' => 'required|numeric|min:0',
            'exchange_rate' => 'required|numeric|min:0',
            'iqd_amount' => 'required|numeric|min:0',
            'commission' => 'required|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'customer_phone' => 'nullable|string'
        ]);

        try {
            // إنشاء الفاتورة
            $receipt = ThermalReceipt::create([
                'receipt_number' => ThermalReceipt::generateReceiptNumber('buy_usd'),
                'transaction_type' => 'charge', // الشراء = دفع دينار واستلام دولار
                'service_type' => 'buy_usd',
                'reference_number' => $request->reference_number,
                'amount' => $request->iqd_amount, // المبلغ الأساسي بالدينار
                'commission' => $request->commission,
                'total_amount' => $request->total_amount,
                'notes' => $request->notes,
                'customer_phone' => $request->customer_phone,
                'employee_name' => session('user_data')['name'] ?? 'غير محدد',
                'user_id' => session('user_data')['id'] ?? 0,
                'receipt_settings' => array_merge($this->getDefaultReceiptSettings(), [
                    'dollar_amount' => $request->dollar_amount,
                    'exchange_rate' => $request->exchange_rate,
                    'iqd_amount' => $request->iqd_amount
                ]),
                'is_printed' => false
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم إنشاء فاتورة الشراء بنجاح',
                'receipt' => $receipt,
                'receipt_data' => $this->formatBuyReceiptData($receipt)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في إنشاء فاتورة الشراء: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * تنسيق بيانات فاتورة البيع
     */
    private function formatSellReceiptData($receipt)
    {
        $settings = $receipt->receipt_settings;

        return [
            'receipt_number' => $receipt->receipt_number,
            'service_name' => 'بيع الدولار الأمريكي',
            'service_type' => $receipt->service_type,
            'transaction_type' => 'بيع دولار',
            'reference_number' => $receipt->reference_number,
            'dollar_amount' => number_format($settings['dollar_amount'], 0),
            'exchange_rate' => number_format($settings['exchange_rate'], 0),
            'iqd_amount' => number_format($settings['iqd_amount'], 0),
            'commission' => number_format($receipt->commission, 0),
            'total_amount' => number_format($receipt->total_amount, 0),
            'notes' => $receipt->notes,
            'customer_phone' => $receipt->customer_phone,
            'employee_name' => $receipt->employee_name,
            'date' => $receipt->created_at->format('Y-m-d'),
            'time' => $receipt->created_at->format('H:i'),
            'datetime_formatted' => $receipt->created_at->format('Y-m-d H:i'),
            'company_info' => $this->getCompanyInfo(),
            'service_config' => $this->getServiceConfig($receipt->service_type)
        ];
    }

    /**
     * تنسيق بيانات فاتورة الشراء
     */
    private function formatBuyReceiptData($receipt)
    {
        $settings = $receipt->receipt_settings;

        return [
            'receipt_number' => $receipt->receipt_number,
            'service_name' => 'شراء الدولار الأمريكي',
            'service_type' => $receipt->service_type,
            'transaction_type' => 'شراء دولار',
            'reference_number' => $receipt->reference_number,
            'dollar_amount' => number_format($settings['dollar_amount'], 0),
            'exchange_rate' => number_format($settings['exchange_rate'], 0),
            'iqd_amount' => number_format($settings['iqd_amount'], 0),
            'commission' => number_format($receipt->commission, 0),
            'total_amount' => number_format($receipt->total_amount, 0),
            'notes' => $receipt->notes,
            'customer_phone' => $receipt->customer_phone,
            'employee_name' => $receipt->employee_name,
            'date' => $receipt->created_at->format('Y-m-d'),
            'time' => $receipt->created_at->format('H:i'),
            'datetime_formatted' => $receipt->created_at->format('Y-m-d H:i'),
            'company_info' => $this->getCompanyInfo(),
            'service_config' => $this->getServiceConfig($receipt->service_type)
        ];
    }

    /**
     * الحصول على فواتير المستخدم
     */
    public function getUserReceipts(Request $request)
    {
        $receipts = ThermalReceipt::byUser(Auth::id())
            ->latest()
            ->paginate(20);

        return response()->json([
            'success' => true,
            'receipts' => $receipts
        ]);
    }

    /**
     * الحصول على إحصائيات الفواتير
     */
    public function getReceiptStats(Request $request)
    {
        $userId = Auth::id();

        $stats = [
            'today_total' => ThermalReceipt::byUser($userId)->today()->count(),
            'today_printed' => ThermalReceipt::byUser($userId)->today()->printed()->count(),
            'total_amount_today' => ThermalReceipt::byUser($userId)->today()->sum('total_amount'),
            'by_service' => [
                'rafidain' => ThermalReceipt::byUser($userId)->today()->byService('rafidain')->count(),
                'rashid' => ThermalReceipt::byUser($userId)->today()->byService('rashid')->count(),
                'zain_cash' => ThermalReceipt::byUser($userId)->today()->byService('zain_cash')->count(),
                'super_key' => ThermalReceipt::byUser($userId)->today()->byService('super_key')->count(),
            ]
        ];

        return response()->json([
            'success' => true,
            'stats' => $stats
        ]);
    }
}
