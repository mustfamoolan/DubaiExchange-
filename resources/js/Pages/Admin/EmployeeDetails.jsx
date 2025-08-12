import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function EmployeeDetails({ employee, openingBalances: realOpeningBalances }) {
    const [activeTab, setActiveTab] = useState('balances');

    // استخدام البيانات الحقيقية أو بيانات افتراضية
    const openingBalances = realOpeningBalances || {
        naqa: 0,
        rafidain: 0,
        rashid: 0,
        zain_cash: 0,
        super_key: 0,
        usd_cash: 0,
        exchange_rate: 1400
    };

    // بيانات مبسطة للعمليات الأخيرة
    const recentTransactions = [
        {
            id: 1,
            type: 'بيع',
            amount: '1000 $',
            date: '2025-08-10',
            time: '14:30'
        },
        {
            id: 2,
            type: 'شراء',
            amount: '500 $',
            date: '2025-08-10',
            time: '12:15'
        },
        {
            id: 3,
            type: 'مصرف',
            amount: '2,000,000 د.ع',
            date: '2025-08-09',
            time: '11:45'
        }
    ];

    const accounts = [
        { id: 'naqa', name: 'نقداً', icon: '💵' },
        { id: 'rafidain', name: 'الرافدين', icon: '🏛️' },
        { id: 'rashid', name: 'الرشيد', icon: '🏦' },
        { id: 'zain_cash', name: 'زين كاش', icon: '📱' },
        { id: 'super_key', name: 'سوبر كي', icon: '💳' }
    ];

    const getTotalIQD = () => {
        if (!openingBalances) return 0;
        return accounts.reduce((sum, account) => sum + (openingBalances[account.id] || 0), 0);
    };

    const getTotalBalance = () => {
        if (!openingBalances) return 0;
        const iqd_total = getTotalIQD();
        const usd_in_iqd = (openingBalances.usd_cash || 0) * (openingBalances.exchange_rate || 0);
        return iqd_total + usd_in_iqd;
    };

    const formatCurrency = (amount, currency = 'IQD') => {
        if (currency === 'USD') {
            return `$${amount.toLocaleString()}`;
        }
        return `${amount.toLocaleString()} د.ع`;
    };

    return (
        <AdminLayout title={`تفاصيل الموظف - ${employee?.name || 'غير محدد'}`}>
            <div className="space-y-6">
                {/* رأس الصفحة */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/admin/employees"
                                className="text-blue-600 hover:text-blue-800"
                            >
                                ← العودة
                            </Link>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {employee?.name || 'أحمد محمد علي'}
                                </h2>
                                <p className="text-gray-500">
                                    الهاتف: {employee?.phone || '07701234567'}
                                </p>
                            </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            employee?.isActive !== false
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                        }`}>
                            {employee?.isActive !== false ? 'نشط' : 'معطل'}
                        </span>
                    </div>
                </div>

                {/* التبويبات */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6">
                            <button
                                onClick={() => setActiveTab('balances')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'balances'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500'
                                }`}
                            >
                                💰 الأرصدة الافتتاحية
                            </button>
                            <button
                                onClick={() => setActiveTab('transactions')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'transactions'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500'
                                }`}
                            >
                                📋 آخر العمليات
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {/* الأرصدة الافتتاحية */}
                        {activeTab === 'balances' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">الأرصدة الافتتاحية</h3>
                                    {realOpeningBalances && (
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${realOpeningBalances.statusColor}`}>
                                                {realOpeningBalances.statusText}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                تاريخ الافتتاح: {realOpeningBalances.opening_date}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {!employee?.hasOpeningBalance ? (
                                    // عرض رسالة عدم وجود أرصدة
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                                            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد أرصدة افتتاحية</h3>
                                        <p className="text-gray-500 mb-6">لم يتم تسجيل أي أرصدة افتتاحية لهذا الموظف بعد</p>
                                        <Link
                                            href={`/admin/opening-balance/${employee.id}`}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                                        >
                                            ➕ إضافة الأرصدة الافتتاحية
                                        </Link>
                                    </div>
                                ) : (
                                    <>
                                        {/* حسابات الدينار العراقي */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {accounts.map((account) => (
                                                <div key={account.id} className="bg-gray-50 rounded-lg p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-2xl">{account.icon}</span>
                                                            <span className="font-medium text-gray-900">{account.name}</span>
                                                        </div>
                                                        <span className="text-lg font-bold text-gray-900">
                                                            {formatCurrency(openingBalances[account.id] || 0)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* حساب الدولار */}
                                        <div className="bg-blue-50 rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">💲</span>
                                                    <span className="font-medium text-gray-900">الدولار الأمريكي</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-lg font-bold text-gray-900">
                                                        {formatCurrency(openingBalances.usd_cash || 0, 'USD')}
                                                    </span>
                                                    <p className="text-sm text-gray-600">
                                                        سعر الصرف: {(openingBalances.exchange_rate || 0).toLocaleString()} د.ع/$
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* إجمالي الأرصدة */}
                                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-blue-100">إجمالي جميع الأرصدة</p>
                                                    <p className="text-3xl font-bold">{formatCurrency(getTotalBalance())}</p>
                                                    {realOpeningBalances?.notes && (
                                                        <p className="text-blue-100 text-sm mt-2">ملاحظات: {realOpeningBalances.notes}</p>
                                                    )}
                                                </div>
                                                <div className="text-4xl">💰</div>
                                            </div>
                                        </div>

                                        {/* زر تعديل الأرصدة */}
                                        <div className="text-center">
                                            <Link
                                                href={`/admin/opening-balance/${employee.id}`}
                                                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                                            >
                                                ✏️ تعديل الأرصدة الافتتاحية
                                            </Link>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* آخر العمليات */}
                        {activeTab === 'transactions' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900">آخر العمليات</h3>

                                <div className="space-y-3">
                                    {recentTransactions.map((transaction) => (
                                        <div key={transaction.id} className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        عملية {transaction.type}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {transaction.date} - {transaction.time}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-gray-900">
                                                        {transaction.amount}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* إحصائيات بسيطة */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                    <div className="bg-green-50 rounded-lg p-4 text-center">
                                        <p className="text-2xl font-bold text-green-600">8</p>
                                        <p className="text-sm text-green-700">عمليات اليوم</p>
                                    </div>
                                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                                        <p className="text-2xl font-bold text-blue-600">45</p>
                                        <p className="text-sm text-blue-700">عمليات هذا الأسبوع</p>
                                    </div>
                                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                                        <p className="text-2xl font-bold text-purple-600">182</p>
                                        <p className="text-sm text-purple-700">عمليات هذا الشهر</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
