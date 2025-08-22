import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { usePage } from '@inertiajs/react';

export default function CustomerStatement({ customer, transactions }) {
    const { flash } = usePage().props;
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, received, delivered
    const [filterCurrency, setFilterCurrency] = useState('all'); // all, iqd, usd

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
        // ترتيب جميع المعاملات حسب التاريخ
        const allTransactionsSorted = [...transactions].sort((a, b) =>
            new Date(a.transaction_date) - new Date(b.transaction_date)
        );

        let runningBalanceIQD = customer.iqd_opening_balance || 0;
        let runningBalanceUSD = customer.usd_opening_balance || 0;

        // إنشاء خريطة للأرصدة لكل معاملة
        const balanceMap = new Map();

        // حساب الرصيد التراكمي لجميع المعاملات
        allTransactionsSorted.forEach((transaction) => {
            const amount = parseFloat(transaction.amount) || 0;

            if (transaction.currency_type === 'iqd') {
                if (transaction.transaction_type === 'received') {
                    runningBalanceIQD += amount;
                } else if (transaction.transaction_type === 'delivered') {
                    runningBalanceIQD -= amount;
                }
            } else if (transaction.currency_type === 'usd') {
                if (transaction.transaction_type === 'received') {
                    runningBalanceUSD += amount;
                } else if (transaction.transaction_type === 'delivered') {
                    runningBalanceUSD -= amount;
                }
            }

            // حفظ الرصيد لهذه المعاملة
            balanceMap.set(transaction.id, {
                runningBalanceIQD: runningBalanceIQD,
                runningBalanceUSD: runningBalanceUSD
            });
        });

        // تطبيق الأرصدة على المعاملات المفلترة
        return filteredTransactions.map((transaction) => {
            const balance = balanceMap.get(transaction.id) || {
                runningBalanceIQD: customer.iqd_opening_balance || 0,
                runningBalanceUSD: customer.usd_opening_balance || 0
            };

            return {
                ...transaction,
                runningBalanceIQD: balance.runningBalanceIQD,
                runningBalanceUSD: balance.runningBalanceUSD
            };
        });
    };

    const transactionsWithBalance = calculateRunningBalance();

    // تنسيق الأرقام بالأرقام الإنجليزية بدون كسور عشرية
    const formatNumber = (num) => {
        const intNum = Math.floor(num || 0); // إزالة الكسور العشرية
        return new Intl.NumberFormat('en-US').format(intNum);
    };

    // تنسيق التاريخ بالأرقام الإنجليزية
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB');
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
                        size: A4;
                        margin: 15mm;
                    }

                    @media print {
                        .container {
                            max-width: none;
                            margin: 0;
                            padding: 0;
                        }

                        body {
                            font-size: 10px;
                        }

                        table {
                            font-size: 9px;
                        }

                        th {
                            font-size: 10px;
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
                                <th>ت الحركة</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- الرصيد الافتتاحي -->
                            <tr class="opening-balance">
                                <td>دينار</td>
                                <td>${formatNumber(customer.iqd_opening_balance || 0)}</td>
                                <td>-</td>
                                <td>-</td>
                                <td>رصيد افتتاحي</td>
                                <td>الرصيد الافتتاحي بالدينار العراقي</td>
                                <td>-</td>
                                <td>-</td>
                            </tr>
                            <tr class="opening-balance">
                                <td>دولار</td>
                                <td>${formatNumber(customer.usd_opening_balance || 0)}</td>
                                <td>-</td>
                                <td>-</td>
                                <td>رصيد افتتاحي</td>
                                <td>الرصيد الافتتاحي بالدولار الأمريكي</td>
                                <td>-</td>
                                <td>-</td>
                            </tr>

                            <!-- المعاملات -->
                            ${transactionsWithBalance.map((transaction, index) => `
                                <tr class="${index % 2 === 0 ? 'even-row' : ''}">
                                    <td>${transaction.currency_type === 'iqd' ? 'دينار' : 'دولار'}</td>
                                    <td>${transaction.currency_type === 'iqd'
                                        ? formatNumber(transaction.runningBalanceIQD)
                                        : formatNumber(transaction.runningBalanceUSD)
                                    }</td>
                                    <td>${transaction.transaction_type === 'delivered' ? formatNumber(transaction.amount) : '0'}</td>
                                    <td>${transaction.transaction_type === 'received' ? formatNumber(transaction.amount) : '0'}</td>
                                    <td>${transaction.transaction_type === 'received' ? 'قبض' : 'صرف'}</td>
                                    <td>${transaction.description || '-'}</td>
                                    <td>${transaction.transaction_code}</td>
                                    <td>${index + 1}</td>
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
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 no-print">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <Link
                            href="/admin/customers"
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
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
                            <select
                                value={filterCurrency}
                                onChange={(e) => setFilterCurrency(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">جميع العملات</option>
                                <option value="iqd">دينار</option>
                                <option value="usd">دولار</option>
                            </select>
                            <button
                                onClick={handlePrint}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                طباعة
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
                                    <th className="border border-gray-400 px-2 py-2 text-center text-sm font-bold">ت الحركة</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {/* صفوف الرصيد الافتتاحي */}
                                <tr className="bg-blue-50 border-b-2 border-blue-300">
                                    <td className="border border-gray-400 px-2 py-1 text-center text-xs font-bold">دينار</td>
                                    <td className="border border-gray-400 px-2 py-1 text-center text-xs font-bold">
                                        {formatNumber(customer.iqd_opening_balance || 0)}
                                    </td>
                                    <td className="border border-gray-400 px-2 py-1 text-center text-xs">-</td>
                                    <td className="border border-gray-400 px-2 py-1 text-center text-xs">-</td>
                                    <td className="border border-gray-400 px-2 py-1 text-center text-xs font-bold">رصيد افتتاحي</td>
                                    <td className="border border-gray-400 px-2 py-1 text-center text-xs">الرصيد الافتتاحي بالدينار العراقي</td>
                                    <td className="border border-gray-400 px-2 py-1 text-center text-xs">-</td>
                                    <td className="border border-gray-400 px-2 py-1 text-center text-xs">-</td>
                                </tr>
                                <tr className="bg-blue-50 border-b-2 border-blue-300">
                                    <td className="border border-gray-400 px-2 py-1 text-center text-xs font-bold">دولار</td>
                                    <td className="border border-gray-400 px-2 py-1 text-center text-xs font-bold">
                                        {formatNumber(customer.usd_opening_balance || 0)}
                                    </td>
                                    <td className="border border-gray-400 px-2 py-1 text-center text-xs">-</td>
                                    <td className="border border-gray-400 px-2 py-1 text-center text-xs">-</td>
                                    <td className="border border-gray-400 px-2 py-1 text-center text-xs font-bold">رصيد افتتاحي</td>
                                    <td className="border border-gray-400 px-2 py-1 text-center text-xs">الرصيد الافتتاحي بالدولار الأمريكي</td>
                                    <td className="border border-gray-400 px-2 py-1 text-center text-xs">-</td>
                                    <td className="border border-gray-400 px-2 py-1 text-center text-xs">-</td>
                                </tr>

                                {/* صفوف المعاملات */}
                                {transactionsWithBalance.length > 0 ? (
                                    transactionsWithBalance.map((transaction, index) => (
                                        <tr key={transaction.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                            <td className="border border-gray-400 px-2 py-1 text-center text-xs">
                                                {transaction.currency_type === 'iqd' ? 'دينار' : 'دولار'}
                                            </td>
                                            <td className="border border-gray-400 px-2 py-1 text-center text-xs">
                                                {transaction.currency_type === 'iqd'
                                                    ? formatNumber(transaction.runningBalanceIQD)
                                                    : formatNumber(transaction.runningBalanceUSD)
                                                }
                                            </td>
                                            <td className="border border-gray-400 px-2 py-1 text-center text-xs">
                                                {transaction.transaction_type === 'delivered' ? formatNumber(transaction.amount) : '0'}
                                            </td>
                                            <td className="border border-gray-400 px-2 py-1 text-center text-xs">
                                                {transaction.transaction_type === 'received' ? formatNumber(transaction.amount) : '0'}
                                            </td>
                                            <td className="border border-gray-400 px-2 py-1 text-center text-xs">
                                                {transaction.transaction_type === 'received' ? 'قبض' : 'صرف'}
                                            </td>
                                            <td className="border border-gray-400 px-2 py-1 text-center text-xs">
                                                {transaction.description || '-'}
                                                {transaction.notes && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {transaction.notes}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="border border-gray-400 px-2 py-1 text-center text-xs">
                                                {transaction.transaction_code}
                                            </td>
                                            <td className="border border-gray-400 px-2 py-1 text-center text-xs">
                                                {index + 1}
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
                </div>
            </div>

        </AdminLayout>
    );
}
