import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

const ThermalReceipt = ({ receiptData, onClose, onPrint }) => {
    const receiptRef = useRef(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    // طباعة البيانات للتحقق
    console.log('ThermalReceipt receiptData:', receiptData);

    // دالة للحصول على صورة الخدمة المناسبة
    const getServiceImage = (service) => {
        console.log('Looking for service image for:', service); // للتحقق
        const serviceImages = {
            'rafidain': '/images/services/rafidain-bank.png',
            'rashid': '/images/services/rashid-bank.png',
            'zain_cash': '/images/services/zain-cash.png',
            'super_key': '/images/services/super-key.png',
            'buy_usd': '/images/services/buy.png',
            'sell_usd': '/images/services/sell.png',
            'receive': '/images/services/receive.png',
            'exchange': '/images/services/exchange.png'
        };
        const imagePath = serviceImages[service] || '/images/services/default.png';
        console.log('Selected image path:', imagePath); // للتحقق
        return imagePath;
    };

    // التحقق من إمكانية المشاركة
    const canShare = navigator.share && window.innerWidth <= 768;

    // إضافة viewport meta tag للموبايل
    React.useEffect(() => {
        // التأكد من أن النافذة ستظهر على الموبايل
        document.body.style.overflow = 'hidden';

        // معالج مفتاح Escape
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        // إضافة مستمع الأحداث
        document.addEventListener('keydown', handleEscape);

        // طباعة في الكونسول للتأكد
        console.log('ThermalReceipt opened:', {
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            canShare,
            receiptData
        });

        return () => {
            document.body.style.overflow = 'auto';
            document.removeEventListener('keydown', handleEscape);
        };
    }, [canShare, receiptData, onClose]);

    const handlePrint = async () => {
        setIsPrinting(true);
        try {
            // على الموبايل، استخدم طباعة مختلفة
            if (window.innerWidth <= 768) {
                // للموبايل: استخدم النافذة المنفصلة بدلاً من تعديل document.body
                const printWindow = window.open('', '_blank');
                const receiptHTML = generateReceiptHTML();

                printWindow.document.write(receiptHTML);
                printWindow.document.close();
                printWindow.focus();

                // محاولة الطباعة
                try {
                    printWindow.print();
                } catch (printError) {
                    console.error('خطأ في الطباعة:', printError);
                    alert('للطباعة على الموبايل، يرجى استخدام ميزة "طباعة" من متصفحك');
                }

                // إغلاق نافذة الطباعة بعد فترة قصيرة
                setTimeout(() => {
                    try {
                        printWindow.close();
                    } catch (e) {
                        console.log('النافذة مغلقة بالفعل');
                    }
                }, 1000);
            } else {
                // للديسكتوب: استخدم النافذة المنفصلة
                const printWindow = window.open('', '_blank');
                const receiptHTML = generateReceiptHTML();

                printWindow.document.write(receiptHTML);
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();

                // إغلاق نافذة الطباعة بعد الطباعة
                printWindow.addEventListener('afterprint', () => {
                    printWindow.close();
                });
            }

            // استدعاء callback للطباعة
            if (onPrint) {
                await onPrint();
            }
        } catch (error) {
            console.error('خطأ في الطباعة:', error);
            alert('حدث خطأ أثناء الطباعة. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsPrinting(false);
        }
    };

    // مشاركة الفاتورة على الموبايل
    const handleShare = async () => {
        setIsSharing(true);
        try {
            if (navigator.share) {
                const shareText = receiptData.service_type === 'buy_usd' || receiptData.service_type === 'sell_usd'
                    ? `فاتورة ${receiptData.transaction_type} ${receiptData.service_name}
رقم الفاتورة: ${receiptData.receipt_number}
مبلغ الدولار: $${receiptData.dollar_amount}
سعر الصرف: ${receiptData.exchange_rate} د.ع
المبلغ بالدينار: ${receiptData.iqd_amount} د.ع
العمولة: ${receiptData.commission} د.ع
المجموع: ${receiptData.total_amount} د.ع
التاريخ: ${receiptData.created_at}
الموظف: ${receiptData.employee_name}`
                    : `فاتورة ${receiptData.transaction_type === 'charge' ? 'شحن' : 'دفع'} ${receiptData.service_name}
رقم الفاتورة: ${receiptData.receipt_number}
المبلغ: ${receiptData.amount} د.ع
العمولة: ${receiptData.commission} د.ع
المجموع: ${receiptData.total_amount} د.ع
التاريخ: ${receiptData.created_at}
الموظف: ${receiptData.employee_name}`;

                await navigator.share({
                    title: `فاتورة ${receiptData.service_name} - ${receiptData.receipt_number}`,
                    text: shareText,
                });
            }
        } catch (error) {
            console.error('خطأ في المشاركة:', error);
        } finally {
            setIsSharing(false);
        }
    };

    const generateReceiptHTML = () => {
        return `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>فاتورة حرارية - ${receiptData.receipt_number}</title>
            <style>
                @page {
                    size: 80mm auto;
                    margin: 2mm;
                }

                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    font-family: 'Courier New', monospace;
                    width: 76mm;
                    margin: 0 auto;
                    padding: 2mm;
                    background: white;
                    color: #000;
                    font-size: 10px;
                    line-height: 1.2;
                }

                .receipt-container {
                    width: 100%;
                    text-align: center;
                }

                .header {
                    border-bottom: 2px dashed #000;
                    padding-bottom: 3mm;
                    margin-bottom: 3mm;
                }

                .company-name {
                    font-size: 14px;
                    font-weight: bold;
                    margin-bottom: 2mm;
                }

                .company-info {
                    font-size: 8px;
                    color: #333;
                    margin-bottom: 1mm;
                }

                .receipt-title {
                    background: #000;
                    color: #fff;
                    padding: 2mm;
                    font-size: 11px;
                    font-weight: bold;
                    margin: 2mm 0;
                }

                .receipt-info {
                    text-align: right;
                    margin: 3mm 0;
                }

                .info-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 1mm;
                    font-size: 9px;
                    border-bottom: 1px dotted #999;
                    padding-bottom: 0.5mm;
                }

                .info-label {
                    font-weight: bold;
                    min-width: 25mm;
                }

                .info-value {
                    text-align: left;
                }

                .transaction-details {
                    border: 2px solid #000;
                    padding: 2mm;
                    margin: 3mm 0;
                    background: #f9f9f9;
                }

                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 1mm;
                    font-size: 9px;
                }

                .total-row {
                    border-top: 2px dashed #000;
                    padding-top: 1mm;
                    margin-top: 2mm;
                    font-weight: bold;
                    font-size: 11px;
                }

                .notes {
                    margin: 3mm 0;
                    padding: 2mm;
                    border: 1px dashed #000;
                    text-align: right;
                    font-size: 8px;
                }

                .footer {
                    border-top: 2px dashed #000;
                    padding-top: 2mm;
                    margin-top: 4mm;
                    text-align: center;
                    font-size: 8px;
                }

                @media print {
                    @page {
                        size: 80mm auto;
                        margin: 1mm;
                    }

                    body {
                        width: 78mm !important;
                        margin: 0 !important;
                        padding: 1mm !important;
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }

                    .receipt-container {
                        page-break-inside: avoid;
                    }

                    .receipt-title {
                        background: #000 !important;
                        color: #fff !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    .transaction-details {
                        background: #f9f9f9 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            </style>
        </head>
        <body>
            <div class="receipt-container">
                <div class="header">
                    <div class="company-name">${receiptData.company_info?.name || 'دبي العملية للصرافة'}</div>
                    <div class="company-info">هاتف: ${receiptData.company_info?.phone || '07801234567'}</div>
                    <div class="company-info">${receiptData.company_info?.address || 'العراق - بغداد'}</div>
                </div>

                <div class="receipt-title">
                    فاتورة ${receiptData.transaction_type === 'charge' ? 'شحن' : receiptData.transaction_type === 'payment' ? 'دفع' : receiptData.transaction_type} - ${receiptData.service_name}
                </div>

                <div class="receipt-info">
                    <div class="info-row">
                        <span class="info-label">رقم الفاتورة:</span>
                        <span class="info-value">${receiptData.receipt_number}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">رقم المرجع:</span>
                        <span class="info-value">${receiptData.reference_number}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">التاريخ:</span>
                        <span class="info-value">${receiptData.date}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">الوقت:</span>
                        <span class="info-value">${receiptData.time}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">الموظف:</span>
                        <span class="info-value">${receiptData.employee_name}</span>
                    </div>
                    ${receiptData.customer_phone ? `
                    <div class="info-row">
                        <span class="info-label">هاتف العميل:</span>
                        <span class="info-value">${receiptData.customer_phone}</span>
                    </div>
                    ` : ''}
                </div>

                <div class="transaction-details">
                    ${(receiptData.service_type === 'buy_usd' || receiptData.service_type === 'sell_usd') ? `
                        <div class="detail-row">
                            <span>مبلغ الدولار:</span>
                            <span>$${receiptData.dollar_amount}</span>
                        </div>
                        <div class="detail-row">
                            <span>سعر الصرف:</span>
                            <span>${receiptData.exchange_rate} د.ع</span>
                        </div>
                        <div class="detail-row">
                            <span>المبلغ بالدينار:</span>
                            <span>${receiptData.iqd_amount} د.ع</span>
                        </div>
                    ` : `
                        <div class="detail-row">
                            <span>المبلغ:</span>
                            <span>${receiptData.amount} د.ع</span>
                        </div>
                    `}
                    <div class="detail-row">
                        <span>العمولة:</span>
                        <span>${receiptData.commission} د.ع</span>
                    </div>
                    <div class="detail-row total-row">
                        <span>المجموع:</span>
                        <span>${receiptData.total_amount} د.ع</span>
                    </div>
                </div>

                ${receiptData.notes ? `
                <div class="notes">
                    <strong>ملاحظات:</strong><br>
                    ${receiptData.notes}
                </div>
                ` : ''}

                <div class="footer">
                    <div>${receiptData.company_info?.footer_text || 'شكراً لكم لتعاملكم معنا'}</div>
                    <div style="margin-top: 2mm; font-size: 7px;">
                        تم الطباعة في: ${new Date().toLocaleString('ar-IQ')}
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;
    };

    if (!receiptData) {
        return null;
    }

    const modalContent = (
        <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center"
            style={{ zIndex: 9999 }}
            onClick={(e) => {
                // إغلاق النافذة عند النقر على الخلفية
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                className="w-full h-full sm:w-auto sm:h-auto sm:max-w-md sm:mx-auto sm:max-h-[95vh] bg-white sm:rounded-xl shadow-2xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()} // منع انتشار الحدث
            >
                {/* رأس النافذة */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-3 sm:p-4 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-white flex items-center">
                        <span className="text-lg sm:text-xl md:text-2xl ml-2">🧾</span>
                        فاتورة حرارية
                    </h2>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onClose();
                        }}
                        className="text-white hover:text-gray-200 text-xl sm:text-2xl md:text-3xl font-bold transition-colors duration-200 p-2 touch-manipulation bg-red-500 hover:bg-red-600 rounded-full flex-shrink-0"
                        style={{ minWidth: '44px', minHeight: '44px' }}
                        aria-label="إغلاق النافذة"
                    >
                        ×
                    </button>
                </div>

                {/* محتوى الفاتورة */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-gray-50">
                    <div
                        ref={receiptRef}
                        className="thermal-receipt bg-white p-3 sm:p-4 text-center font-mono text-xs sm:text-sm border border-gray-200 rounded-lg mx-auto"
                        style={{
                            width: '100%',
                            maxWidth: '280px',
                            margin: '0 auto',
                            fontFamily: 'monospace, Arial, sans-serif',
                            lineHeight: '1.2'
                        }}
                    >
                        {/* رأس الفاتورة */}
                        <div className="text-center border-b-2 border-dashed border-gray-400 pb-2 mb-3">
                            <img
                                src={getServiceImage(receiptData.service_type || receiptData.service)}
                                alt={receiptData.service_name}
                                className="w-10 h-10 mx-auto mb-2"
                                onError={(e) => {
                                    console.log('Image failed to load, using fallback');
                                    e.target.src = '/images/services/default.png';
                                    e.target.onerror = () => {
                                        // إذا فشلت الصورة الافتراضية، أخفِ الصورة واعرض الأيقونة
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'block';
                                    };
                                }}
                            />
                            <div className="text-2xl mb-2 hidden">📄</div>
                            <div className="font-bold text-sm">{receiptData.company_info?.name || 'دبي العملية للصرافة'}</div>
                            <div className="text-xs text-gray-600">هاتف: {receiptData.company_info?.phone || '07801234567'}</div>
                            <div className="text-xs text-gray-600">{receiptData.company_info?.address || 'العراق - بغداد'}</div>
                        </div>

                        {/* عنوان الفاتورة */}
                        <div className="text-center font-bold text-sm bg-gray-100 p-2 rounded mb-3">
                            فاتورة {receiptData.transaction_type} - {receiptData.service_name}
                        </div>

                        {/* معلومات الفاتورة */}
                        <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                                <span className="font-bold">رقم الفاتورة:</span>
                                <span>{receiptData.receipt_number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-bold">رقم المرجع:</span>
                                <span>{receiptData.reference_number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-bold">التاريخ:</span>
                                <span>{receiptData.date}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-bold">الوقت:</span>
                                <span>{receiptData.time}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-bold">الموظف:</span>
                                <span>{receiptData.employee_name}</span>
                            </div>
                            {receiptData.customer_phone && (
                                <div className="flex justify-between">
                                    <span className="font-bold">هاتف العميل:</span>
                                    <span>{receiptData.customer_phone}</span>
                                </div>
                            )}
                        </div>

                        {/* قسم المبالغ */}
                        <div className="border-t border-b border-gray-400 py-2 my-3 text-xs">
                            {(receiptData.service_type === 'buy_usd' || receiptData.service_type === 'sell_usd') ? (
                                <>
                                    <div className="flex justify-between">
                                        <span>مبلغ الدولار:</span>
                                        <span>${receiptData.dollar_amount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>سعر الصرف:</span>
                                        <span>{receiptData.exchange_rate} د.ع</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>المبلغ بالدينار:</span>
                                        <span>{receiptData.iqd_amount} د.ع</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex justify-between">
                                    <span>المبلغ:</span>
                                    <span>{receiptData.amount} د.ع</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span>العمولة:</span>
                                <span>{receiptData.commission} د.ع</span>
                            </div>
                            <div className="flex justify-between font-bold border-t border-dashed border-gray-400 pt-1 mt-1">
                                <span>المجموع:</span>
                                <span>{receiptData.total_amount} د.ع</span>
                            </div>
                        </div>

                        {/* الملاحظات */}
                        {receiptData.notes && (
                            <div className="text-xs text-gray-600 mb-3">
                                ملاحظات: {receiptData.notes}
                            </div>
                        )}

                        {/* تذييل الفاتورة */}
                        <div className="text-center border-t-2 border-dashed border-gray-400 pt-2 text-xs">
                            <div>{receiptData.company_info?.footer_text || 'شكراً لكم لتعاملكم معنا'}</div>
                            <div className="text-xs text-gray-500 mt-1">
                                تم الطباعة في: {new Date().toLocaleString('ar-IQ')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* أزرار العمل */}
                <div className="p-3 sm:p-4 bg-gray-100 border-t">
                    <div className={`grid gap-3 ${canShare ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
                        <button
                            onClick={handlePrint}
                            disabled={isPrinting}
                            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-4 sm:py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center text-base sm:text-sm touch-manipulation order-1"
                            style={{ minHeight: '48px' }}
                        >
                            <span className="ml-2 text-xl sm:text-lg">🖨️</span>
                            {isPrinting ? 'جاري الطباعة...' : 'طباعة'}
                        </button>

                        {canShare && (
                            <button
                                onClick={handleShare}
                                disabled={isSharing}
                                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-4 sm:py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center text-base sm:text-sm touch-manipulation order-2"
                                style={{ minHeight: '48px' }}
                            >
                                <span className="ml-2 text-xl sm:text-lg">📤</span>
                                {isSharing ? 'جاري المشاركة...' : 'مشاركة'}
                            </button>
                        )}

                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onClose();
                            }}
                            className={`bg-red-500 hover:bg-red-600 text-white font-bold py-4 sm:py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center text-base sm:text-sm touch-manipulation ${canShare ? 'order-3' : 'order-2'}`}
                            style={{ minHeight: '48px' }}
                        >
                            <span className="ml-2 text-xl sm:text-lg">✖️</span>
                            إغلاق
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // استخدام portal لعرض النافذة
    return createPortal(modalContent, document.body);
};

export default ThermalReceipt;
