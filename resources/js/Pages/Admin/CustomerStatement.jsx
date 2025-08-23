import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { usePage } from '@inertiajs/react';
import html2pdf from 'html2pdf.js';

export default function CustomerStatement({ customer, transactions }) {
    const { flash } = usePage().props;
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, received, delivered
    const [filterCurrency, setFilterCurrency] = useState('iqd'); // all, iqd, usd

    // فلترة المعاملات حسب التاريخ والنوع
    const filteredTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.transaction_date);
        const fromDate = dateFrom ? new Date(dateFrom) : null;
        const toDate = dateTo ? new Date(dateTo) : null;

        const matchesDateRange = (!fromDate || transactionDate >= fromDate) &&
                                (!toDate || transactionDate <= toDate);

        const matchesType = filterType === 'all' || transaction.transaction_type === filterType;
        const matchesCurrency = filterCurrency === 'all' || transaction.currency_type === filterCurrency;

        return matchesDateRange && matchesType && matchesCurrency;
    });

    // حساب الرصيد التراكمي الصحيح
    const calculateRunningBalance = () => {
        // ترتيب المعاملات المفلترة حسب التاريخ (من الأقدم للأحدث)
        const sortedFilteredTransactions = [...filteredTransactions].sort((a, b) =>
            new Date(a.transaction_date) - new Date(b.transaction_date)
        );

        // تحويل الرصيد الافتتاحي إلى أرقام صحيحة
        let runningBalanceIQD = parseFloat(customer.iqd_opening_balance) || 0;
        let runningBalanceUSD = parseFloat(customer.usd_opening_balance) || 0;

        // حساب الرصيد التراكمي للمعاملات المفلترة
        const transactionsWithBalance = sortedFilteredTransactions.map((transaction, index) => {
            // تحويل المبلغ إلى رقم صحيح
            const amount = parseFloat(transaction.amount) || 0;

            // حساب الرصيد بعد هذه المعاملة
            if (transaction.currency_type === 'iqd') {
                if (transaction.transaction_type === 'received') {
                    runningBalanceIQD = parseFloat(runningBalanceIQD) + parseFloat(amount);
                } else if (transaction.transaction_type === 'delivered') {
                    runningBalanceIQD = parseFloat(runningBalanceIQD) - parseFloat(amount);
                }
            } else if (transaction.currency_type === 'usd') {
                if (transaction.transaction_type === 'received') {
                    runningBalanceUSD = parseFloat(runningBalanceUSD) + parseFloat(amount);
                } else if (transaction.transaction_type === 'delivered') {
                    runningBalanceUSD = parseFloat(runningBalanceUSD) - parseFloat(amount);
                }
            }

            return {
                ...transaction,
                runningBalanceIQD: runningBalanceIQD,
                runningBalanceUSD: runningBalanceUSD
            };
        });

        return transactionsWithBalance;
    };

    const transactionsWithBalance = calculateRunningBalance();

    // تنسيق الأرقام بالأرقام الإنجليزية بدون كسور عشرية مع التلوين
    const formatNumber = (num) => {
        const intNum = Math.floor(num || 0); // إزالة الكسور العشرية
        return new Intl.NumberFormat('en-US').format(intNum);
    };

    // دالة للحصول على لون الرقم حسب القيمة
    const getNumberColor = (num) => {
        const value = parseFloat(num) || 0;
        if (value > 0) return 'text-green-600'; // أخضر للموجب
        if (value < 0) return 'text-red-600';   // أحمر للسالب
        return 'text-gray-900';                 // رمادي للصفر
    };

    // دالة لتنسيق الرقم مع اللون
    const formatNumberWithColor = (num) => {
        const value = parseFloat(num) || 0;
        const formattedNumber = formatNumber(Math.abs(value));
        const colorClass = getNumberColor(value);

        return {
            value: value < 0 ? `-${formattedNumber}` : formattedNumber,
            colorClass: colorClass
        };
    };

    // تنسيق التاريخ بالأرقام الإنجليزية
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB');
    };

    const getColorClass = (value) => {
        const num = parseFloat(value);
        if (num > 0) return 'positive-amount';
        if (num < 0) return 'negative-amount';
        return 'zero-amount';
    };

    // دالة لاستخراج الوصف فقط من النص المخزن
    const extractDescription = (text) => {
        if (!text) return '-';

        // إذا كان النص يحتوي على "السبب" فاستخرج ما بعدها
        const reasonMatch = text.match(/السبب\s*(.+)/);
        if (reasonMatch) {
            return reasonMatch[1].trim();
        }

        // إذا كان النص يحتوي على " - " فاستخرج ما بعد آخر " - "
        const parts = text.split(' - ');
        if (parts.length > 1) {
            return parts[parts.length - 1].trim();
        }

        // إذا لم يكن هناك نمط محدد، ارجع النص كما هو
        return text.trim();
    };

    // دالة الطباعة الصحيحة
    const handlePrint = () => {
        // إنشاء نافذة طباعة منفصلة
        const printWindow = window.open('', '_blank', 'width=800,height=600');

        // إنشاء محتوى HTML للطباعة
        const printContent = `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>كشف حساب العميل - ${customer.name}</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                        font-family: 'Arial', sans-serif;
                    }

                    body {
                        font-size: 12px;
                        line-height: 1.4;
                        color: #000;
                        background: white;
                        direction: rtl;
                    }

                    .container {
                        width: 100%;
                        max-width: 210mm;
                        margin: 0 auto;
                        padding: 10mm;
                    }

                    .positive-amount {
                        color: #059669 !important;
                        font-weight: bold;
                    }

                    .negative-amount {
                        color: #DC2626 !important;
                        font-weight: bold;
                    }

                    .zero-amount {
                        color: #1F2937 !important;
                    }

                    .header {
                        border: 2px solid #000;
                        margin-bottom: 10px;
                    }

                    .header-row {
                        display: grid;
                        grid-template-columns: 1fr auto 1fr auto 2fr auto;
                        border-bottom: 1px solid #000;
                    }

                    .header-cell {
                        padding: 8px;
                        text-align: center;
                        border-left: 1px solid #000;
                        font-weight: normal;
                    }

                    .header-cell:last-child {
                        border-left: none;
                    }

                    .header-cell.highlight {
                        background-color: #f5f5f5;
                        font-weight: bold;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        border: 2px solid #000;
                        font-size: 11px;
                    }

                    th, td {
                        border: 1px solid #000;
                        padding: 4px 2px;
                        text-align: center;
                        vertical-align: middle;
                    }

                    th {
                        background-color: #f5f5f5;
                        font-weight: bold;
                        font-size: 12px;
                    }

                    .opening-balance {
                        background-color: #e3f2fd;
                        font-weight: bold;
                    }

                    .even-row {
                        background-color: #f9f9f9;
                    }

                    @page {
                        size: A4 landscape;
                        margin: 10mm 15mm;
                    }

                    @media print {
                        .container {
                            max-width: none;
                            margin: 0;
                            padding: 0;
                        }

                        body {
                            font-size: 11px;
                        }

                        table {
                            font-size: 10px;
                        }

                        th {
                            font-size: 11px;
                            font-weight: bold;
                        }

                        .header {
                            font-size: 12px;
                            margin-bottom: 15px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <!-- ترويسة الكشف -->
                    <div class="header">
                        <div class="header-row">
                            <div class="header-cell highlight">الاسم</div>
                            <div class="header-cell">${customer.name}</div>
                            <div class="header-cell">للتاريخ من</div>
                            <div class="header-cell highlight">${dateFrom || '2025-01-01'}</div>
                            <div class="header-cell">إلى</div>
                            <div class="header-cell highlight">${dateTo || new Date().toISOString().split('T')[0]}</div>
                        </div>
                    </div>

                    <!-- جدول البيانات -->
                    <table>
                        <thead>
                            <tr>
                                <th>العملة</th>
                                <th>الرصيد</th>
                                <th>الصادر</th>
                                <th>الوارد</th>
                                <th>نوع الحركة</th>
                                <th>الملاحظات</th>
                                <th>رقم القائمة</th>
                                <th>تاريخ الحركة</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- الرصيد الافتتاحي -->
                            ${filterCurrency === 'iqd' ? `
                            <tr class="opening-balance">
                                <td>دينار</td>
                                <td class="${getColorClass(customer.iqd_opening_balance || 0)}">${formatNumber(customer.iqd_opening_balance || 0)}</td>
                                <td>-</td>
                                <td>-</td>
                                <td>رصيد افتتاحي</td>
                                <td>الرصيد الافتتاحي بالدينار العراقي</td>
                                <td>-</td>
                                <td>-</td>
                            </tr>
                            ` : ''}
                            ${filterCurrency === 'usd' ? `
                            <tr class="opening-balance">
                                <td>دولار</td>
                                <td class="${getColorClass(customer.usd_opening_balance || 0)}">${formatNumber(customer.usd_opening_balance || 0)}</td>
                                <td>-</td>
                                <td>-</td>
                                <td>رصيد افتتاحي</td>
                                <td>الرصيد الافتتاحي بالدولار الأمريكي</td>
                                <td>-</td>
                                <td>-</td>
                            </tr>
                            ` : ''}

                            <!-- المعاملات -->
                            ${transactionsWithBalance.map((transaction, index) => `
                                <tr class="${index % 2 === 0 ? 'even-row' : ''}">
                                    <td>${transaction.currency_type === 'iqd' ? 'دينار' : 'دولار'}</td>
                                    <td class="${getColorClass(transaction.currency_type === 'iqd' ? transaction.runningBalanceIQD : transaction.runningBalanceUSD)}">${transaction.currency_type === 'iqd'
                                        ? formatNumber(transaction.runningBalanceIQD)
                                        : formatNumber(transaction.runningBalanceUSD)
                                    }</td>
                                    <td class="${transaction.transaction_type === 'delivered' ? 'negative-amount' : ''}">${transaction.transaction_type === 'delivered' ? formatNumber(transaction.amount) : '0'}</td>
                                    <td class="${transaction.transaction_type === 'received' ? 'positive-amount' : ''}">${transaction.transaction_type === 'received' ? formatNumber(transaction.amount) : '0'}</td>
                                    <td>${transaction.transaction_type === 'received' ? 'قبض' : 'صرف'}</td>
                                    <td>${extractDescription(transaction.description || transaction.notes)}</td>
                                    <td>${transaction.transaction_code}</td>
                                    <td>${formatDate(transaction.transaction_date)}</td>
                                </tr>
                            `).join('')}

                            ${transactionsWithBalance.length === 0 ? `
                                <tr>
                                    <td colspan="8" style="padding: 20px; color: #666;">
                                        لا توجد معاملات في الفترة المحددة
                                    </td>
                                </tr>
                            ` : ''}
                        </tbody>
                    </table>
                </div>

                <script>
                    // طباعة تلقائية عند فتح النافذة
                    window.onload = function() {
                        window.print();
                        // إغلاق النافذة بعد الطباعة
                        window.onafterprint = function() {
                            window.close();
                        };
                    };
                </script>
            </body>
            </html>
        `;

        // كتابة المحتوى في النافذة الجديدة
        printWindow.document.write(printContent);
        printWindow.document.close();
    };

    // دالة تحويل إلى PDF وإرسال عبر الواتساب
    const handleWhatsAppPDF = async () => {
        try {
            // إنشاء عنصر HTML للتحويل إلى PDF
            const element = document.createElement('div');
            element.innerHTML = `
                <div style="font-family: 'Arial', sans-serif; direction: rtl; padding: 20px; color: #000; background: white; min-height: 100vh; font-size: 14px;">
                    <!-- عنوان الصفحة -->
                    <h2 style="text-align: center; margin-bottom: 20px; color: #000; font-size: 18px; font-weight: bold;">
                        كشف حساب العميل: ${customer.name || 'غير محدد'}
                    </h2>

                    <!-- ترويسة الكشف -->
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 2px solid #000;">
                        <tr>
                            <td style="padding: 10px; border: 1px solid #000; text-align: center; background-color: #f0f0f0; font-weight: bold; width: 16.66%;">الاسم</td>
                            <td style="padding: 10px; border: 1px solid #000; text-align: center; width: 16.66%;">${customer.name || 'غير محدد'}</td>
                            <td style="padding: 10px; border: 1px solid #000; text-align: center; background-color: #f0f0f0; font-weight: bold; width: 16.66%;">من تاريخ</td>
                            <td style="padding: 10px; border: 1px solid #000; text-align: center; width: 16.66%;">${dateFrom || '2025-01-01'}</td>
                            <td style="padding: 10px; border: 1px solid #000; text-align: center; background-color: #f0f0f0; font-weight: bold; width: 16.66%;">إلى تاريخ</td>
                            <td style="padding: 10px; border: 1px solid #000; text-align: center; width: 16.66%;">${dateTo || new Date().toISOString().split('T')[0]}</td>
                        </tr>
                    </table>

                    <!-- جدول البيانات -->
                    <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; font-size: 12px;">
                        <thead>
                            <tr style="background-color: #f0f0f0;">
                                <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">العملة</th>
                                <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">الرصيد</th>
                                <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">الصادر</th>
                                <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">الوارد</th>
                                <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">نوع الحركة</th>
                                <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">الملاحظات</th>
                                <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">رقم القائمة</th>
                                <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">تاريخ الحركة</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filterCurrency === 'iqd' && customer.iqd_opening_balance ? `
                            <tr style="background-color: #e8f5e8;">
                                <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">دينار</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">${formatNumber(customer.iqd_opening_balance)}</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: center;">-</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: center;">-</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">رصيد افتتاحي</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: center;">الرصيد الافتتاحي بالدينار العراقي</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: center;">-</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: center;">-</td>
                            </tr>
                            ` : ''}
                            ${filterCurrency === 'usd' && customer.usd_opening_balance ? `
                            <tr style="background-color: #e3f2fd;">
                                <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">دولار</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">${formatNumber(customer.usd_opening_balance)}</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: center;">-</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: center;">-</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">رصيد افتتاحي</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: center;">الرصيد الافتتاحي بالدولار الأمريكي</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: center;">-</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: center;">-</td>
                            </tr>
                            ` : ''}

                            ${transactionsWithBalance && transactionsWithBalance.length > 0 ? transactionsWithBalance.map((transaction, index) => `
                                <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f9f9f9'};">
                                    <td style="border: 1px solid #000; padding: 6px; text-align: center;">${transaction.currency_type === 'iqd' ? 'دينار' : 'دولار'}</td>
                                    <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">${transaction.currency_type === 'iqd'
                                        ? formatNumber(transaction.runningBalanceIQD || 0)
                                        : formatNumber(transaction.runningBalanceUSD || 0)
                                    }</td>
                                    <td style="border: 1px solid #000; padding: 6px; text-align: center;">${transaction.transaction_type === 'delivered' ? formatNumber(transaction.amount || 0) : '0'}</td>
                                    <td style="border: 1px solid #000; padding: 6px; text-align: center;">${transaction.transaction_type === 'received' ? formatNumber(transaction.amount || 0) : '0'}</td>
                                    <td style="border: 1px solid #000; padding: 6px; text-align: center;">${transaction.transaction_type === 'received' ? 'قبض' : 'صرف'}</td>
                                    <td style="border: 1px solid #000; padding: 6px; text-align: center;">${extractDescription(transaction.description || transaction.notes)}</td>
                                    <td style="border: 1px solid #000; padding: 6px; text-align: center;">${transaction.transaction_code || '-'}</td>
                                    <td style="border: 1px solid #000; padding: 6px; text-align: center;">${formatDate(transaction.transaction_date) || '-'}</td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="8" style="border: 1px solid #000; padding: 20px; text-align: center; color: #666;">
                                        لا توجد معاملات في الفترة المحددة
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>

                    <!-- الرصيد الحالي -->
                    <div style="margin-top: 20px; padding: 15px; background-color: #f0f8ff; border: 2px solid #000; text-align: center;">
                        <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold; color: #000;">الرصيد الحالي</h3>
                        <div style="font-size: 14px; font-weight: bold; color: ${filterCurrency === 'iqd' ? '#2e7d32' : '#1976d2'};">
                            ${filterCurrency === 'iqd'
                                ? `${formatNumber(customer.current_iqd_balance || 0)} دينار عراقي`
                                : `${formatNumber(customer.current_usd_balance || 0)} دولار أمريكي`
                            }
                        </div>
                    </div>

                    <!-- تاريخ الطباعة -->
                    <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #666;">
                        تاريخ الطباعة: ${new Date().toLocaleDateString('en-GB')} - ${new Date().toLocaleTimeString('en-GB')}
                    </div>
                </div>
            `;            // إضافة العنصر إلى الصفحة مؤقتاً (مرئي للتحقق من التحويل)
            element.style.position = 'fixed';
            element.style.top = '0';
            element.style.left = '0';
            element.style.width = '100vw';
            element.style.height = '100vh';
            element.style.backgroundColor = 'white';
            element.style.zIndex = '9999';
            element.style.overflow = 'auto';
            document.body.appendChild(element);

            // انتظار قليل للتأكد من تحميل العنصر
            await new Promise(resolve => setTimeout(resolve, 1000));

            // إعدادات PDF محسنة
            const options = {
                margin: [5, 5, 5, 5],
                filename: `كشف_حساب_${customer.name}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.pdf`,
                image: {
                    type: 'jpeg',
                    quality: 1.0
                },
                html2canvas: {
                    scale: 1.5,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: true,
                    letterRendering: true,
                    scrollX: 0,
                    scrollY: 0
                },
                jsPDF: {
                    unit: 'mm',
                    format: 'a4',
                    orientation: 'landscape',
                    putOnlyUsedFonts: true,
                    floatPrecision: 16
                }
            };

            // تحويل إلى PDF وتحميل
            console.log('بدء تحويل PDF...');

            // إضافة زر إغلاق مؤقت
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = 'إغلاق المعاينة';
            closeBtn.style.position = 'fixed';
            closeBtn.style.top = '10px';
            closeBtn.style.right = '10px';
            closeBtn.style.zIndex = '10000';
            closeBtn.style.padding = '10px 20px';
            closeBtn.style.backgroundColor = '#dc3545';
            closeBtn.style.color = 'white';
            closeBtn.style.border = 'none';
            closeBtn.style.borderRadius = '5px';
            closeBtn.style.cursor = 'pointer';
            closeBtn.onclick = () => {
                document.body.removeChild(element);
                document.body.removeChild(closeBtn);
            };
            document.body.appendChild(closeBtn);

            await html2pdf().set(options).from(element).save();

            console.log('تم إنتاج PDF بنجاح');

            // إزالة العناصر المؤقتة
            setTimeout(() => {
                if (document.body.contains(element)) {
                    document.body.removeChild(element);
                }
                if (document.body.contains(closeBtn)) {
                    document.body.removeChild(closeBtn);
                }
            }, 2000);

            // فتح الواتساب مع رسالة
            const message = `تم إنشاء ملف PDF لكشف حساب العميل: ${customer.name}\nيرجى إرفاق الملف المحمل مع هذه الرسالة`;
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

            // انتظار قليل ثم فتح الواتساب
            setTimeout(() => {
                window.open(whatsappUrl, '_blank');
            }, 1000);

        } catch (error) {
            console.error('خطأ في تحويل PDF:', error);
            alert('حدث خطأ في تحويل الملف إلى PDF. يرجى المحاولة مرة أخرى.');
        }
    };    return (
        <AdminLayout title={`كشف حساب العميل: ${customer.name}`}>
            <div className="space-y-6">
                {/* رسائل النجاح والخطأ */}
                {flash.success && (
                    <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        {flash.success}
                    </div>
                )}
                {flash.error && (
                    <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {flash.error}
                    </div>
                )}

                {/* أدوات التحكم */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 no-print">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <Link
                            href="/admin/customers"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 font-medium"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            العودة للعملاء
                        </Link>

                        <div className="flex flex-wrap gap-3">
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="من تاريخ"
                            />
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="إلى تاريخ"
                            />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">جميع الحركات</option>
                                <option value="received">قبض</option>
                                <option value="delivered">صرف</option>
                            </select>

                            {/* أزرار العملات */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFilterCurrency('iqd')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                                        filterCurrency === 'iqd'
                                            ? 'bg-green-500 text-white shadow-lg'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    دينار عراقي
                                </button>
                                <button
                                    onClick={() => setFilterCurrency('usd')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                                        filterCurrency === 'usd'
                                            ? 'bg-blue-500 text-white shadow-lg'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    دولار أمريكي
                                </button>
                            </div>
                            <button
                                onClick={handlePrint}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                طباعة
                            </button>
                            <button
                                onClick={handleWhatsAppPDF}
                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.304"/>
                                </svg>
                                إرسال واتساب
                            </button>
                        </div>
                    </div>
                </div>

                {/* كشف الحساب */}
                <div className="bg-white border border-gray-400">
                    {/* ترويسة الكشف - نفس تصميم الصورة */}
                    <div className="border-b border-gray-400">
                        {/* الصف العلوي للتواريخ */}
                        <div className="grid grid-cols-6 border-b border-gray-400">
                            <div className="p-2 text-center text-sm font-medium bg-gray-100">
                                الاسم
                            </div>
                            <div className="border-r border-gray-400 p-2 text-center text-sm font-medium">
                                {customer.name}
                            </div>
                            <div className="border-r border-gray-400 p-2 text-center text-sm">
                                للتاريخ من
                            </div>
                            <div className="border-r border-gray-400 p-2 text-center text-sm font-medium bg-gray-100">
                                {dateFrom || '2025-01-01'}
                            </div>
                            <div className="border-r border-gray-400 p-2 text-center text-sm">
                                إلى
                            </div>
                            <div className="border-r border-gray-400 p-2 text-center text-sm font-medium bg-gray-100">
                                {dateTo || new Date().toISOString().split('T')[0]}
                            </div>
                        </div>
                    </div>

                    {/* جدول كشف الحساب */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-400 px-2 py-2 text-center text-sm font-bold">العملة</th>
                                    <th className="border border-gray-400 px-2 py-2 text-center text-sm font-bold">الرصيد</th>
                                    <th className="border border-gray-400 px-2 py-2 text-center text-sm font-bold">الصادر</th>
                                    <th className="border border-gray-400 px-2 py-2 text-center text-sm font-bold">الوارد</th>
                                    <th className="border border-gray-400 px-2 py-2 text-center text-sm font-bold">نوع الحركة</th>
                                    <th className="border border-gray-400 px-2 py-2 text-center text-sm font-bold">الملاحظات</th>
                                    <th className="border border-gray-400 px-2 py-2 text-center text-sm font-bold">رقم القائمة</th>
                                    <th className="border border-gray-400 px-2 py-2 text-center text-sm font-bold">تاريخ الحركة</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {/* صفوف الرصيد الافتتاحي */}
                                {filterCurrency === 'iqd' && (
                                    <tr className="bg-blue-50 border-b-2 border-blue-300">
                                        <td className="border border-gray-400 px-2 py-1 text-center text-xs font-bold">دينار</td>
                                        <td className={`border border-gray-400 px-2 py-1 text-center text-xs font-bold ${getNumberColor(customer.iqd_opening_balance)}`}>
                                            {formatNumberWithColor(customer.iqd_opening_balance || 0).value}
                                        </td>
                                        <td className="border border-gray-400 px-2 py-1 text-center text-xs">-</td>
                                        <td className="border border-gray-400 px-2 py-1 text-center text-xs">-</td>
                                        <td className="border border-gray-400 px-2 py-1 text-center text-xs font-bold">رصيد افتتاحي</td>
                                        <td className="border border-gray-400 px-2 py-1 text-center text-xs">الرصيد الافتتاحي بالدينار العراقي</td>
                                        <td className="border border-gray-400 px-2 py-1 text-center text-xs">-</td>
                                        <td className="border border-gray-400 px-2 py-1 text-center text-xs">-</td>
                                    </tr>
                                )}
                                {filterCurrency === 'usd' && (
                                    <tr className="bg-blue-50 border-b-2 border-blue-300">
                                        <td className="border border-gray-400 px-2 py-1 text-center text-xs font-bold">دولار</td>
                                        <td className={`border border-gray-400 px-2 py-1 text-center text-xs font-bold ${getNumberColor(customer.usd_opening_balance)}`}>
                                            {formatNumberWithColor(customer.usd_opening_balance || 0).value}
                                        </td>
                                        <td className="border border-gray-400 px-2 py-1 text-center text-xs">-</td>
                                        <td className="border border-gray-400 px-2 py-1 text-center text-xs">-</td>
                                        <td className="border border-gray-400 px-2 py-1 text-center text-xs font-bold">رصيد افتتاحي</td>
                                        <td className="border border-gray-400 px-2 py-1 text-center text-xs">الرصيد الافتتاحي بالدولار الأمريكي</td>
                                        <td className="border border-gray-400 px-2 py-1 text-center text-xs">-</td>
                                        <td className="border border-gray-400 px-2 py-1 text-center text-xs">-</td>
                                    </tr>
                                )}

                                {/* صفوف المعاملات */}
                                {transactionsWithBalance.length > 0 ? (
                                    transactionsWithBalance.map((transaction, index) => (
                                        <tr key={transaction.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                            <td className="border border-gray-400 px-2 py-1 text-center text-xs">
                                                {transaction.currency_type === 'iqd' ? 'دينار' : 'دولار'}
                                            </td>
                                            <td className={`border border-gray-400 px-2 py-1 text-center text-xs ${getNumberColor(transaction.currency_type === 'iqd' ? transaction.runningBalanceIQD : transaction.runningBalanceUSD)}`}>
                                                {transaction.currency_type === 'iqd'
                                                    ? formatNumberWithColor(transaction.runningBalanceIQD).value
                                                    : formatNumberWithColor(transaction.runningBalanceUSD).value
                                                }
                                            </td>
                                            <td className={`border border-gray-400 px-2 py-1 text-center text-xs ${transaction.transaction_type === 'delivered' ? 'text-red-600' : ''}`}>
                                                {transaction.transaction_type === 'delivered' ? formatNumber(transaction.amount) : '0'}
                                            </td>
                                            <td className={`border border-gray-400 px-2 py-1 text-center text-xs ${transaction.transaction_type === 'received' ? 'text-green-600' : ''}`}>
                                                {transaction.transaction_type === 'received' ? formatNumber(transaction.amount) : '0'}
                                            </td>
                                            <td className="border border-gray-400 px-2 py-1 text-center text-xs">
                                                {transaction.transaction_type === 'received' ? 'قبض' : 'صرف'}
                                            </td>
                                            <td className="border border-gray-400 px-2 py-1 text-center text-xs">
                                                {extractDescription(transaction.description || transaction.notes)}
                                            </td>
                                            <td className="border border-gray-400 px-2 py-1 text-center text-xs">
                                                {transaction.transaction_code}
                                            </td>
                                            <td className="border border-gray-400 px-2 py-1 text-center text-xs">
                                                {new Date(transaction.transaction_date).toLocaleDateString('en-GB')}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="border border-gray-400 px-6 py-8 text-center text-gray-500">
                                            <div className="flex flex-col items-center">
                                                <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <p className="font-medium">لا توجد معاملات في الفترة المحددة</p>
                                                <p className="text-sm">جرب تغيير فلاتر البحث أو الفترة الزمنية</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* جدول الرصيد الحالي */}
                    <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-400 px-2 py-2 text-center text-sm font-bold">العملة</th>
                                    <th className="border border-gray-400 px-2 py-2 text-center text-sm font-bold">الرصيد الحالي</th>
                                    <th className="border border-gray-400 px-2 py-2 text-center text-sm font-bold">الصادر</th>
                                    <th className="border border-gray-400 px-2 py-2 text-center text-sm font-bold">الوارد</th>
                                    <th className="border border-gray-400 px-2 py-2 text-center text-sm font-bold">نوع الحركة</th>
                                    <th className="border border-gray-400 px-2 py-2 text-center text-sm font-bold">الملاحظات</th>
                                    <th className="border border-gray-400 px-2 py-2 text-center text-sm font-bold">رقم القائمة</th>
                                    <th className="border border-gray-400 px-2 py-2 text-center text-sm font-bold">تاريخ الحركة</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {filterCurrency === 'iqd' && (
                                    <tr className="bg-green-50 border-b-2 border-green-300">
                                        <td className="border border-gray-400 px-2 py-1 text-center text-xs font-bold">دينار</td>
                                        <td className="border border-gray-400 px-2 py-1 text-center text-xs font-bold text-green-600">
                                            {formatNumber(customer.current_iqd_balance || 0)}
                                        </td>
                                        <td className="border border-gray-400 px-2 py-1 text-center text-xs">-</td>
                                        <td className="border border-gray-400 px-2 py-1 text-center text-xs">-</td>
                                        <td className="border border-gray-400 px-2 py-1 text-center text-xs font-bold">رصيد حالي</td>
                                        <td className="border border-gray-400 px-2 py-1 text-center text-xs">الرصيد الحالي بالدينار العراقي</td>
                                        <td className="border border-gray-400 px-2 py-1 text-center text-xs">-</td>
                                        <td className="border border-gray-400 px-2 py-1 text-center text-xs">-</td>
                                    </tr>
                                )}
                                {filterCurrency === 'usd' && (
                                    <tr className="bg-blue-50 border-b-2 border-blue-300">
                                        <td className="border border-gray-400 px-2 py-1 text-center text-xs font-bold">دولار</td>
                                        <td className="border border-gray-400 px-2 py-1 text-center text-xs font-bold text-blue-600">
                                            {formatNumber(customer.current_usd_balance || 0)}
                                        </td>
                                        <td className="border border-gray-400 px-2 py-1 text-center text-xs">-</td>
                                        <td className="border border-gray-400 px-2 py-1 text-center text-xs">-</td>
                                        <td className="border border-gray-400 px-2 py-1 text-center text-xs font-bold">رصيد حالي</td>
                                        <td className="border border-gray-400 px-2 py-1 text-center text-xs">الرصيد الحالي بالدولار الأمريكي</td>
                                        <td className="border border-gray-400 px-2 py-1 text-center text-xs">-</td>
                                        <td className="border border-gray-400 px-2 py-1 text-center text-xs">-</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </AdminLayout>
    );
}
