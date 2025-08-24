import React, { useState } from 'react';
import CustomerLayout from '../../Layouts/CustomerLayout';
import { Head } from '@inertiajs/react';

export default function Dashboard({ customer, transactions = [] }) {
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, received, delivered
    const [filterCurrency, setFilterCurrency] = useState('iqd'); // iqd, usd

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

            return {
                ...transaction,
                runningBalanceIQD,
                runningBalanceUSD
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

    // دالة لاستخراج الوصف فقط من النص المخزن
    const extractDescription = (text) => {
        if (!text) return '';

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

    return (
        <CustomerLayout>
            <Head title="كشف الحساب" />

            <div className="space-y-6">
                {/* معلومات العميل */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6">
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
                        مرحباً، {customer.name}
                    </h1>

                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                            <h3 className="font-semibold text-blue-800 mb-2 text-sm sm:text-base">معلومات الحساب</h3>
                            <p className="text-blue-700 text-xs sm:text-sm">رقم الهاتف: {customer.phone}</p>
                            <p className="text-blue-700 text-xs sm:text-sm">رقم العميل: {customer.id}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                                <h3 className="font-semibold text-green-800 mb-2 text-sm sm:text-base">الرصيد - دينار عراقي</h3>
                                <p className={`text-base sm:text-lg font-bold ${getNumberColor(customer.current_iqd_balance)}`}>
                                    {formatNumberWithColor(customer.current_iqd_balance || 0).value}
                                </p>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                                <h3 className="font-semibold text-blue-800 mb-2 text-sm sm:text-base">الرصيد - دولار أمريكي</h3>
                                <p className={`text-base sm:text-lg font-bold ${getNumberColor(customer.current_usd_balance)}`}>
                                    {formatNumberWithColor(customer.current_usd_balance || 0).value}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* فلاتر البحث */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
                    <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-4">
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                placeholder="من تاريخ"
                            />
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                placeholder="إلى تاريخ"
                            />
                        </div>

                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        >
                            <option value="all">جميع الحركات</option>
                            <option value="received">قبض</option>
                            <option value="delivered">صرف</option>
                        </select>

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
                    </div>
                </div>

                {/* كشف الحساب */}
                <div className="bg-white border border-gray-400 rounded-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-gray-100 p-3 sm:p-4 border-b border-gray-400">
                        <h2 className="text-base sm:text-lg font-bold text-center">كشف حساب العميل: {customer.name}</h2>
                    </div>

                    {/* معلومات الفترة */}
                    <div className="border-b border-gray-400">
                        <div className="hidden sm:grid sm:grid-cols-6">
                            <div className="p-3 text-center text-sm font-medium bg-gray-100 border-r border-gray-400">
                                الاسم
                            </div>
                            <div className="p-3 text-center text-sm font-medium border-r border-gray-400">
                                {customer.name}
                            </div>
                            <div className="p-3 text-center text-sm bg-gray-100 border-r border-gray-400">
                                للتاريخ من
                            </div>
                            <div className="p-3 text-center text-sm font-medium border-r border-gray-400">
                                {dateFrom || '2025-01-01'}
                            </div>
                            <div className="p-3 text-center text-sm bg-gray-100 border-r border-gray-400">
                                إلى
                            </div>
                            <div className="p-3 text-center text-sm font-medium">
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

                    {/* جدول المعاملات للشاشات الكبيرة */}
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
                                {/* الرصيد الافتتاحي */}
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

                                {/* المعاملات */}
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

                    {/* الرصيد الحالي - جدول للشاشات الكبيرة */}
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
        </CustomerLayout>
    );
}
