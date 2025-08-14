import React from 'react';

export default function ReceiveExchangeThermalReceipt({
    receiptData,
    onClose,
    onPrint,
    receiptType = 'receive' // 'receive' أو 'exchange'
}) {
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        const content = document.getElementById('thermal-receipt-content').innerHTML;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>طباعة ${receiptType === 'receive' ? 'سند القبض' : 'سند الصرف'}</title>
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
                        font-size: 10px;
                        line-height: 1.1;
                        color: #000;
                        background: #fff;
                        direction: rtl;
                        text-align: right;
                        width: 76mm;
                        margin: 0 auto;
                        padding: 2mm;
                    }

                    .receipt {
                        width: 100%;
                        max-width: 72mm;
                        padding: 1mm;
                        margin: 0 auto;
                    }

                    .header {
                        text-align: center;
                        border-bottom: 2px dashed #000;
                        padding-bottom: 2mm;
                        margin-bottom: 3mm;
                    }

                    .company-name {
                        font-weight: bold;
                        font-size: 12px;
                        margin-bottom: 1mm;
                    }

                    .receipt-title {
                        font-weight: bold;
                        font-size: 11px;
                        margin-bottom: 1mm;
                        background: #000;
                        color: #fff;
                        padding: 1mm;
                    }

                    .receipt-number {
                        font-size: 10px;
                        margin-bottom: 1mm;
                    }

                    .date-time {
                        font-size: 9px;
                    }

                    .content {
                        margin: 2mm 0;
                    }

                    .field-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 1mm;
                        padding-bottom: 0.5mm;
                        border-bottom: 1px dotted #999;
                        font-size: 9px;
                    }

                    .field-label {
                        font-weight: bold;
                        min-width: 25mm;
                        flex-shrink: 0;
                    }

                    .field-value {
                        text-align: left;
                        flex-grow: 1;
                        word-wrap: break-word;
                    }

                    .amount-section {
                        border: 2px solid #000;
                        padding: 2mm;
                        margin: 3mm 0;
                        text-align: center;
                        background: #f5f5f5;
                    }

                    .field-label {
                        font-size: 9px;
                        margin-bottom: 1mm;
                    }

                    .amount-large {
                        font-size: 14px;
                        font-weight: bold;
                        margin: 1mm 0;
                        color: #000;
                    }

                    .description-section {
                        border: 1px dashed #000;
                        padding: 2mm;
                        margin: 2mm 0;
                        min-height: 8mm;
                        font-size: 8px;
                    }

                    .description-title {
                        font-weight: bold;
                        font-size: 9px;
                        margin-bottom: 1mm;
                    }

                    .description-text {
                        font-size: 8px;
                        line-height: 1.2;
                    }

                    .signature-section {
                        margin-top: 4mm;
                        border-top: 2px dashed #000;
                        padding-top: 3mm;
                    }

                    .signature-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 3mm;
                    }

                    .signature-box {
                        text-align: center;
                        width: 30mm;
                    }

                    .signature-line {
                        border-bottom: 1px solid #000;
                        height: 8mm;
                        margin-bottom: 1mm;
                    }

                    .signature-label {
                        font-size: 8px;
                        font-weight: bold;
                    }

                    .footer {
                        text-align: center;
                        margin-top: 4mm;
                        padding-top: 2mm;
                        border-top: 2px dashed #000;
                        font-size: 8px;
                    }

                    .notes-section {
                        margin-top: 2mm;
                        padding: 1mm;
                        border: 1px dashed #000;
                        font-size: 8px;
                    }

                    .notes-title {
                        font-weight: bold;
                        font-size: 8px;
                        margin-bottom: 1mm;
                    }

                    .notes-text {
                        font-size: 7px;
                        line-height: 1.2;
                    }

                    @media print {
                        @page {
                            size: 80mm auto;
                            margin: 1mm;
                        }

                        body {
                            print-color-adjust: exact;
                            -webkit-print-color-adjust: exact;
                            width: 78mm !important;
                            margin: 0 !important;
                            padding: 1mm !important;
                        }

                        .receipt {
                            page-break-inside: avoid;
                            width: 100% !important;
                            max-width: 76mm !important;
                        }

                        .amount-section {
                            background: #f5f5f5 !important;
                            border: 2px solid #000 !important;
                        }

                        .receipt-title {
                            background: #000 !important;
                            color: #fff !important;
                        }
                    }
                </style>
            </head>
            <body>
                ${content}
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();

        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);

        if (onPrint) onPrint();
    };

    // تحديد عنوان السند حسب النوع
    const getReceiptTitle = () => {
        return receiptType === 'receive' ? 'سند قبض' : 'سند صرف';
    };

    // تحديد نص المبلغ حسب النوع
    const getAmountText = () => {
        return receiptType === 'receive' ? 'المبلغ المستلم' : 'المبلغ المصروف';
    };

    // تحديد نص الشخص حسب النوع
    const getPersonText = () => {
        return receiptType === 'receive' ? 'استلمت من السيد' : 'صرف للسيد';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">
                        معاينة {getReceiptTitle()}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* Receipt Content */}
                <div className="p-4">
                    <div id="thermal-receipt-content">
                        <div className="receipt">
                            {/* Header Section */}
                            <div className="header">
                                <div className="company-name">مكتب دبي للصرافة</div>
                                <div className="receipt-title">{getReceiptTitle()}</div>
                                <div className="receipt-number">رقم: {receiptData.reference_number}</div>
                                <div className="date-time">{new Date().toLocaleString('ar-EG')}</div>
                            </div>

                            {/* Content Section */}
                            <div className="content">
                                {/* رقم المستند */}
                                <div className="field-row">
                                    <span className="field-label">رقم المستند:</span>
                                    <span className="field-value">{receiptData.reference_number}</span>
                                </div>

                                {/* التاريخ والوقت */}
                                <div className="field-row">
                                    <span className="field-label">التاريخ:</span>
                                    <span className="field-value">{new Date().toLocaleDateString('ar-EG')}</span>
                                </div>

                                <div className="field-row">
                                    <span className="field-label">الوقت:</span>
                                    <span className="field-value">{new Date().toLocaleTimeString('ar-EG')}</span>
                                </div>

                                {/* اسم الموظف */}
                                <div className="field-row">
                                    <span className="field-label">الموظف:</span>
                                    <span className="field-value">{receiptData.employee_name || 'الموظف الحالي'}</span>
                                </div>

                                {/* الشخص (من/إلى) */}
                                <div className="field-row">
                                    <span className="field-label">{getPersonText()}:</span>
                                    <span className="field-value">{receiptData.person_name}</span>
                                </div>

                                {/* العملة */}
                                <div className="field-row">
                                    <span className="field-label">العملة:</span>
                                    <span className="field-value">{receiptData.currency}</span>
                                </div>

                                {/* المبلغ بالعملة الأصلية */}
                                <div className="field-row">
                                    <span className="field-label">المبلغ:</span>
                                    <span className="field-value">{parseFloat(receiptData.amount).toLocaleString()}</span>
                                </div>

                                {/* سعر الصرف إذا لم تكن دينار عراقي */}
                                {receiptData.currency !== 'دينار عراقي' && receiptData.exchange_rate && (
                                    <div className="field-row">
                                        <span className="field-label">سعر الصرف:</span>
                                        <span className="field-value">{parseFloat(receiptData.exchange_rate).toLocaleString()}</span>
                                    </div>
                                )}

                                {/* المبلغ بالدينار العراقي */}
                                <div className="amount-section">
                                    <div className="field-label">{getAmountText()}</div>
                                    <div className="amount-large">
                                        {receiptData.amount_in_iqd ?
                                            Math.floor(receiptData.amount_in_iqd).toLocaleString() :
                                            Math.floor(parseFloat(receiptData.amount) * parseFloat(receiptData.exchange_rate || 1)).toLocaleString()
                                        } د.ع
                                    </div>
                                </div>

                                {/* المستفيد */}
                                <div className="field-row">
                                    <span className="field-label">المستفيد:</span>
                                    <span className="field-value">{receiptData.beneficiary || 'الصندوق النقدي'}</span>
                                </div>

                                {/* وذلك عن (الوصف) */}
                                {receiptData.description && (
                                    <div className="description-section">
                                        <div className="description-title">وذلك عن:</div>
                                        <div className="description-text">{receiptData.description}</div>
                                    </div>
                                )}

                                {/* الملاحظات الإضافية */}
                                {receiptData.notes && (
                                    <div className="notes-section">
                                        <div className="notes-title">ملاحظات:</div>
                                        <div className="notes-text">{receiptData.notes}</div>
                                    </div>
                                )}

                                {/* قسم التوقيعات */}
                                <div className="signature-section">
                                    <div className="signature-row">
                                        <div className="signature-box">
                                            <div className="signature-line"></div>
                                            <div className="signature-label">توقيع المستلم</div>
                                        </div>
                                        <div className="signature-box">
                                            <div className="signature-line"></div>
                                            <div className="signature-label">توقيع المسؤول</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="footer">
                                    <div>شكراً لثقتكم بنا</div>
                                    <div>مكتب دبي للصرافة</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="p-4 border-t border-gray-200 flex gap-2">
                    <button
                        onClick={handlePrint}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                        🖨️ طباعة
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
}
