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

    // دالة تحميل PDF بشكل مباشر وبسيط
    const handleDownloadPDF = () => {
        console.log('بدء تحميل PDF...');
        console.log('بيانات العميل:', customer);
        console.log('المعاملات:', transactionsWithBalance);

        // إنشاء محتوى للطباعة
        const element = document.createElement('div');
        element.style.position = 'absolute';
        element.style.left = '0';
        element.style.top = '0';
        element.style.backgroundColor = 'white';
        element.style.width = '210mm';
        element.style.minHeight = '297mm';
        element.style.padding = '20px';
        element.style.fontFamily = 'Arial, sans-serif';
        element.style.color = 'black';
        element.style.direction = 'rtl';
        element.style.zIndex = '-1';
        element.style.opacity = '0';
        element.style.pointerEvents = 'none';

        // محتوى PDF بنفس تصميم الطباعة
        element.innerHTML = `
            <div style="width: 100%; max-width: 210mm; margin: 0 auto; padding: 10mm; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #000; background: white; direction: rtl;">

                <!-- ترويسة الكشف -->
                <div style="border: 2px solid #000; margin-bottom: 10px;">
                    <div style="display: grid; grid-template-columns: 1fr auto 1fr auto 2fr auto; border-bottom: 1px solid #000;">
                        <div style="padding: 8px; text-align: center; border-left: 1px solid #000; background-color: #f5f5f5; font-weight: bold;">الاسم</div>
                        <div style="padding: 8px; text-align: center; border-left: 1px solid #000; font-weight: normal;">${customer?.name || 'غير محدد'}</div>
                        <div style="padding: 8px; text-align: center; border-left: 1px solid #000; font-weight: normal;">للتاريخ من</div>
                        <div style="padding: 8px; text-align: center; border-left: 1px solid #000; background-color: #f5f5f5; font-weight: bold;">${dateFrom || '2025-01-01'}</div>
                        <div style="padding: 8px; text-align: center; border-left: 1px solid #000; font-weight: normal;">إلى</div>
                        <div style="padding: 8px; text-align: center; background-color: #f5f5f5; font-weight: bold;">${dateTo || new Date().toISOString().split('T')[0]}</div>
                    </div>
                </div>

                <!-- جدول البيانات -->
                <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; font-size: 11px;">
                    <thead>
                        <tr>
                            <th style="border: 1px solid #000; padding: 4px 2px; text-align: center; vertical-align: middle; background-color: #f5f5f5; font-weight: bold; font-size: 12px;">العملة</th>
                            <th style="border: 1px solid #000; padding: 4px 2px; text-align: center; vertical-align: middle; background-color: #f5f5f5; font-weight: bold; font-size: 12px;">الرصيد</th>
                            <th style="border: 1px solid #000; padding: 4px 2px; text-align: center; vertical-align: middle; background-color: #f5f5f5; font-weight: bold; font-size: 12px;">الصادر</th>
                            <th style="border: 1px solid #000; padding: 4px 2px; text-align: center; vertical-align: middle; background-color: #f5f5f5; font-weight: bold; font-size: 12px;">الوارد</th>
                            <th style="border: 1px solid #000; padding: 4px 2px; text-align: center; vertical-align: middle; background-color: #f5f5f5; font-weight: bold; font-size: 12px;">نوع الحركة</th>
                            <th style="border: 1px solid #000; padding: 4px 2px; text-align: center; vertical-align: middle; background-color: #f5f5f5; font-weight: bold; font-size: 12px;">الملاحظات</th>
                            <th style="border: 1px solid #000; padding: 4px 2px; text-align: center; vertical-align: middle; background-color: #f5f5f5; font-weight: bold; font-size: 12px;">رقم القائمة</th>
                            <th style="border: 1px solid #000; padding: 4px 2px; text-align: center; vertical-align: middle; background-color: #f5f5f5; font-weight: bold; font-size: 12px;">تاريخ الحركة</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- الرصيد الافتتاحي للدينار العراقي -->
                        ${filterCurrency === 'iqd' ? `
                            <tr style="background-color: #e3f2fd; font-weight: bold;">
                                <td style="border: 1px solid #000; padding: 4px 2px; text-align: center; vertical-align: middle;">دينار</td>
                                <td style="border: 1px solid #000; padding: 4px 2px; text-align: center; vertical-align: middle; color: ${parseFloat(customer?.iqd_opening_balance || 0) > 0 ? '#059669' : parseFloat(customer?.iqd_opening_balance || 0) < 0 ? '#DC2626' : '#1F2937'}; font-weight: bold;">${formatNumber(customer?.iqd_opening_balance || 0)}</td>
                                <td style="border: 1px solid #000; padding: 4px 2px; text-align: center; vertical-align: middle;">-</td>
                                <td style="border: 1px solid #000; padding: 4px 2px; text-align: center; vertical-align: middle;">-</td>
                                <td style="border: 1px solid #000; padding: 4px 2px; text-align: center; vertical-align: middle;">رصيد افتتاحي</td>
                                <td style="border: 1px solid #000; padding: 4px 2px; text-align: center; vertical-align: middle;">الرصيد الافتتاحي بالدينار العراقي</td>
                                <td style="border: 1px solid #000; padding: 4px 2px; text-align: center; vertical-align: middle;">-</td>
                                <td style="border: 1px solid #000; padding: 4px 2px; text-align: center; vertical-align: middle;">-</td>
                            </tr>
                        ` : ''}

                        <!-- الرصيد الافتتاحي للدولار الأمريكي -->
                        ${filterCurrency === 'usd' ? `
                            <tr style="background-color: #e3f2fd; font-weight: bold;">
                                <td style="border: 1px solid #000; padding: 4px 2px; text-align: center; vertical-align: middle;">دولار</td>
                                <td style="border: 1px solid #000; padding: 4px 2px; text-align: center; vertical-align: middle; color: ${parseFloat(customer?.usd_opening_balance || 0) > 0 ? '#059669' : parseFloat(customer?.usd_opening_balance || 0) < 0 ? '#DC2626' : '#1F2937'}; font-weight: bold;">${formatNumber(customer?.usd_opening_balance || 0)}</td>
                                <td style="border: 1px solid #000; padding: 4px 2px; text-align: center; vertical-align: middle;">-</td>
                                <td style="border: 1px solid #000; padding: 4px 2px; text-align: center; vertical-align: middle;">-</td>
                                <td style="border: 1px solid #000; padding: 4px 2px; text-align: center; vertical-align: middle;">رصيد افتتاحي</td>
                                <td style="border: 1px solid #000; padding: 4px 2px; text-align: center; vertical-align: middle;">الرصيد الافتتاحي بالدولار الأمريكي</td>
                                <td style="border: 1px solid #000; padding: 4px 2px; text-align: center; vertical-align: middle;">-</td>
                                <td style="border: 1px solid #000; padding: 4px 2px; text-align: center; vertical-align: middle;">-</td>
                            </tr>
                        ` : ''}

                        <!-- المعاملات -->
                        ${transactionsWithBalance.map((transaction, index) => {
                            const balanceValue = transaction.currency_type === 'iqd' ? transaction.runningBalanceIQD : transaction.runningBalanceUSD;
                            const balanceColor = parseFloat(balanceValue) > 0 ? '#059669' : parseFloat(balanceValue) < 0 ? '#DC2626' : '#1F2937';

                            return `
                                <tr style="background-color: ${index % 2 === 0 ? '#f9f9f9' : 'white'};">
                                    <td style="border: 1px solid #000; padding: 4px 2px; text-align: center; vertical-align: middle;">${transaction.currency_type === 'iqd' ? 'دينار' : 'دولار'}</td>
                                    <td style="border: 1px solid #000; padding: 4px 2px; text-align: center; vertical-align: middle; color: ${balanceColor}; font-weight: bold;">${formatNumber(balanceValue)}</td>
                                    <td style="border: 1px solid #000; padding: 4px 2px; text-align: center; vertical-align: middle; ${transaction.transaction_type === 'delivered' ? 'color: #DC2626; font-weight: bold;' : ''}">${transaction.transaction_type === 'delivered' ? formatNumber(transaction.amount) : '0'}</td>
                                    <td style="border: 1px solid #000; padding: 4px 2px; text-align: center; vertical-align: middle; ${transaction.transaction_type === 'received' ? 'color: #059669; font-weight: bold;' : ''}">${transaction.transaction_type === 'received' ? formatNumber(transaction.amount) : '0'}</td>
                                    <td style="border: 1px solid #000; padding: 4px 2px; text-align: center; vertical-align: middle;">${transaction.transaction_type === 'received' ? 'قبض' : 'صرف'}</td>
                                    <td style="border: 1px solid #000; padding: 4px 2px; text-align: center; vertical-align: middle;">${extractDescription(transaction.description || transaction.notes)}</td>
                                    <td style="border: 1px solid #000; padding: 4px 2px; text-align: center; vertical-align: middle;">${transaction.transaction_code || '-'}</td>
                                    <td style="border: 1px solid #000; padding: 4px 2px; text-align: center; vertical-align: middle;">${formatDate(transaction.transaction_date)}</td>
                                </tr>
                            `;
                        }).join('')}

                        ${transactionsWithBalance.length === 0 ? `
                            <tr>
                                <td colspan="8" style="border: 1px solid #000; padding: 20px; text-align: center; color: #666;">
                                    لا توجد معاملات في الفترة المحددة
                                </td>
                            </tr>
                        ` : ''}
                    </tbody>
                </table>
            </div>
        `;        // إضافة العنصر للصفحة
        document.body.appendChild(element);
        console.log('تم إنشاء العنصر:', element);

        // إعدادات PDF محسنة
        const options = {
            margin: [0.5, 0.5, 0.5, 0.5],
            filename: `كشف_حساب_${customer?.name || 'عميل'}_${new Date().toISOString().split('T')[0]}.pdf`,
            image: {
                type: 'jpeg',
                quality: 1.0
            },
            html2canvas: {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                allowTaint: true,
                letterRendering: true,
                removeContainer: true,
                foreignObjectRendering: false,
                width: 794,
                height: Math.max(element.scrollHeight, 1123)
            },
            jsPDF: {
                unit: 'mm',
                format: 'a4',
                orientation: 'landscape',
                compress: true
            }
        };

        console.log('بدء تحويل PDF...');
        console.log('أبعاد العنصر:', element.scrollWidth, 'x', element.scrollHeight);

        // انتظار قليل للتأكد من تحميل المحتوى
        setTimeout(() => {
            // جعل العنصر مرئياً مؤقتاً للتقاط
            element.style.opacity = '1';
            element.style.zIndex = '9999';

            html2pdf()
                .set(options)
                .from(element)
                .toPdf()
                .get('pdf')
                .then((pdf) => {
                    // التأكد من وجود محتوى في PDF
                    const pageCount = pdf.internal.getNumberOfPages();
                    console.log('عدد الصفحات في PDF:', pageCount);

                    if (pageCount === 0) {
                        console.error('PDF فارغ - لا توجد صفحات');
                        throw new Error('PDF فارغ');
                    }

                    return pdf;
                })
                .save()
                .then(() => {
                    console.log('تم تحميل PDF بنجاح');
                    if (document.body.contains(element)) {
                        document.body.removeChild(element);
                    }
                })
                .catch((error) => {
                    console.error('خطأ في تحميل PDF:', error);
                    if (document.body.contains(element)) {
                        document.body.removeChild(element);
                    }
                });
        }, 1000);
    };

    return (
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
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 no-print">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <Link
                            href="/admin/customers"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 font-medium w-fit"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            العودة للعملاء
                        </Link>

                        <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-3">
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-3">
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    placeholder="من تاريخ"
                                />
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    placeholder="إلى تاريخ"
                                />
                            </div>

                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            >
                                <option value="all">جميع الحركات</option>
                                <option value="received">قبض</option>
                                <option value="delivered">صرف</option>
                            </select>

                            {/* أزرار العملات */}
                            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
                                <button
                                    onClick={() => setFilterCurrency('iqd')}
                                    className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-xs sm:text-sm ${
                                        filterCurrency === 'iqd'
                                            ? 'bg-green-500 text-white shadow-lg'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    دينار عراقي
                                </button>
                                <button
                                    onClick={() => setFilterCurrency('usd')}
                                    className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-xs sm:text-sm ${
                                        filterCurrency === 'usd'
                                            ? 'bg-blue-500 text-white shadow-lg'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    دولار أمريكي
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
                                <button
                                    onClick={handlePrint}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-xs sm:text-sm"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                    طباعة
                                </button>
                                <button
                                    onClick={handleDownloadPDF}
                                    className="bg-red-500 hover:bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-xs sm:text-sm"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    تحميل PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* كشف الحساب */}
                <div className="bg-white border border-gray-400 rounded-lg overflow-hidden">
                    {/* ترويسة الكشف - نفس تصميم الصورة */}
                    <div className="border-b border-gray-400">
                        {/* الصف العلوي للتواريخ - للشاشات الكبيرة */}
                        <div className="hidden sm:grid sm:grid-cols-6 border-b border-gray-400">
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

                        {/* معلومات الفترة للموبايل */}
                        <div className="sm:hidden p-3 space-y-2">
                            <div className="flex justify-between">
                                <span className="font-medium text-sm">الاسم:</span>
                                <span className="text-sm">{customer.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium text-sm">من تاريخ:</span>
                                <span className="text-sm">{dateFrom || '2025-01-01'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium text-sm">إلى تاريخ:</span>
                                <span className="text-sm">{dateTo || new Date().toISOString().split('T')[0]}</span>
                            </div>
                        </div>
                    </div>

                    {/* جدول كشف الحساب - للشاشات الكبيرة */}
                    <div className="hidden sm:block overflow-x-auto">
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

                    {/* عرض البطاقات للموبايل */}
                    <div className="sm:hidden">
                        {/* الرصيد الافتتاحي للموبايل */}
                        {filterCurrency === 'iqd' && (
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 m-3 rounded">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-bold text-blue-800">رصيد افتتاحي - دينار</span>
                                    <span className={`text-sm font-bold ${getNumberColor(customer.iqd_opening_balance)}`}>
                                        {formatNumberWithColor(customer.iqd_opening_balance || 0).value}
                                    </span>
                                </div>
                                <p className="text-xs text-blue-700">الرصيد الافتتاحي بالدينار العراقي</p>
                            </div>
                        )}
                        {filterCurrency === 'usd' && (
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 m-3 rounded">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-bold text-blue-800">رصيد افتتاحي - دولار</span>
                                    <span className={`text-sm font-bold ${getNumberColor(customer.usd_opening_balance)}`}>
                                        {formatNumberWithColor(customer.usd_opening_balance || 0).value}
                                    </span>
                                </div>
                                <p className="text-xs text-blue-700">الرصيد الافتتاحي بالدولار الأمريكي</p>
                            </div>
                        )}

                        {/* المعاملات كبطاقات */}
                        {transactionsWithBalance.length > 0 ? (
                            <div className="space-y-3 p-3">
                                {transactionsWithBalance.map((transaction, index) => (
                                    <div key={transaction.id} className={`border border-gray-300 rounded-lg p-3 ${
                                        transaction.transaction_type === 'received' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                                    }`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center space-x-2">
                                                <span className={`inline-block w-2 h-2 rounded-full ${
                                                    transaction.transaction_type === 'received' ? 'bg-green-500' : 'bg-red-500'
                                                }`}></span>
                                                <span className="text-sm font-medium">
                                                    {transaction.transaction_type === 'received' ? 'قبض' : 'صرف'}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {transaction.currency_type === 'iqd' ? 'دينار' : 'دولار'}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-600">
                                                {new Date(transaction.transaction_date).toLocaleDateString('ar-EG')}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <span className="text-gray-600">المبلغ:</span>
                                                <span className={`font-medium ml-1 ${
                                                    transaction.transaction_type === 'received' ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                    {formatNumber(transaction.amount)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">الرصيد:</span>
                                                <span className={`font-medium ml-1 ${getNumberColor(
                                                    transaction.currency_type === 'iqd' ? transaction.runningBalanceIQD : transaction.runningBalanceUSD
                                                )}`}>
                                                    {transaction.currency_type === 'iqd'
                                                        ? formatNumberWithColor(transaction.runningBalanceIQD).value
                                                        : formatNumberWithColor(transaction.runningBalanceUSD).value
                                                    }
                                                </span>
                                            </div>
                                        </div>

                                        {transaction.transaction_code && (
                                            <div className="mt-2 text-xs">
                                                <span className="text-gray-600">رقم القائمة: </span>
                                                <span className="font-medium">{transaction.transaction_code}</span>
                                            </div>
                                        )}

                                        {(transaction.description || transaction.notes) && (
                                            <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                                                {extractDescription(transaction.description || transaction.notes)}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 text-center text-gray-500">
                                <div className="flex flex-col items-center">
                                    <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="font-medium text-sm">لا توجد معاملات في الفترة المحددة</p>
                                    <p className="text-xs">جرب تغيير فلاتر البحث أو الفترة الزمنية</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* جدول الرصيد الحالي - للشاشات الكبيرة */}
                    <div className="mt-4 hidden sm:block overflow-x-auto">
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
                                        <td className={`border border-gray-400 px-2 py-1 text-center text-xs font-bold ${getNumberColor(customer.current_iqd_balance || 0)}`}>
                                            {formatNumberWithColor(customer.current_iqd_balance || 0).value}
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
                                        <td className={`border border-gray-400 px-2 py-1 text-center text-xs font-bold ${getNumberColor(customer.current_usd_balance || 0)}`}>
                                            {formatNumberWithColor(customer.current_usd_balance || 0).value}
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

                    {/* الرصيد الحالي - بطاقات للموبايل */}
                    <div className="sm:hidden mt-4 space-y-3 p-3">
                        {filterCurrency === 'iqd' && (
                            <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-bold text-green-800">الرصيد الحالي - دينار</span>
                                    <span className={`text-lg font-bold ${getNumberColor(customer.current_iqd_balance || 0)}`}>
                                        {formatNumberWithColor(customer.current_iqd_balance || 0).value}
                                    </span>
                                </div>
                                <p className="text-xs text-green-700">الرصيد الحالي بالدينار العراقي</p>
                            </div>
                        )}
                        {filterCurrency === 'usd' && (
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-bold text-blue-800">الرصيد الحالي - دولار</span>
                                    <span className={`text-lg font-bold ${getNumberColor(customer.current_usd_balance || 0)}`}>
                                        {formatNumberWithColor(customer.current_usd_balance || 0).value}
                                    </span>
                                </div>
                                <p className="text-xs text-blue-700">الرصيد الحالي بالدولار الأمريكي</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </AdminLayout>
    );
}
