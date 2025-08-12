import React from 'react';
import EmployeeLayout from '../../Layouts/EmployeeLayout';
import { usePage, router } from '@inertiajs/react';

export default function EmployeeOpeningBalance() {
    const { props } = usePage();
    const user = props.auth?.sessionUser || null;
    const openingBalance = props.openingBalance || null;

    const formatCurrency = (amount) => {
        if (!amount) return '0';
        return Number(amount).toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        const badges = {
            active: { text: 'نشط', color: 'bg-green-100 text-green-800' },
            inactive: { text: 'غير نشط', color: 'bg-red-100 text-red-800' },
            pending: { text: 'في الانتظار', color: 'bg-yellow-100 text-yellow-800' }
        };
        const badge = badges[status] || badges.pending;
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
                {badge.text}
            </span>
        );
    };

    // حسابات الدينار العراقي
    const iqd_accounts = [
        { id: 'naqa', name: 'نقداً', icon: '💵', color: 'bg-green-100 text-green-600' },
        { id: 'rafidain', name: 'مصرف الرافدين', icon: '🏛️', color: 'bg-green-100 text-green-600' },
        { id: 'rashid', name: 'مصرف الرشيد', icon: '🏦', color: 'bg-blue-100 text-blue-600' },
        { id: 'zain_cash', name: 'زين كاش', icon: '📱', color: 'bg-purple-100 text-purple-600' },
        { id: 'super_key', name: 'سوبر كي', icon: '💳', color: 'bg-yellow-100 text-yellow-600' },
    ];

    // حساب الدولار
    const usd_account = { id: 'usd_cash', name: 'الدولار الأمريكي', icon: '💲', color: 'bg-indigo-100 text-indigo-600' };

    const getTotalIQD = () => {
        if (!openingBalance) return 0;
        const naqa = parseFloat(openingBalance.naqa || 0);
        const rafidain = parseFloat(openingBalance.rafidain || 0);
        const rashid = parseFloat(openingBalance.rashid || 0);
        const zain_cash = parseFloat(openingBalance.zain_cash || 0);
        const super_key = parseFloat(openingBalance.super_key || 0);
        return naqa + rafidain + rashid + zain_cash + super_key;
    };

    const getTotalUSD = () => {
        if (!openingBalance) return 0;
        return parseFloat(openingBalance.usd_cash || 0);
    };

    const getGrandTotal = () => {
        if (!openingBalance) return 0;
        const totalIQD = getTotalIQD();
        const totalUSD = getTotalUSD();
        const exchangeRate = parseFloat(openingBalance.exchange_rate || 1400);
        return totalIQD + (totalUSD * exchangeRate);
    };

    // إذا لم يوجد رصيد افتتاحي
    if (!openingBalance) {
        return (
            <EmployeeLayout title="الرصيد الافتتاحي">
                <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">لا يوجد رصيد افتتاحي</h3>
                    <p className="text-gray-600 mb-4">لم يتم إنشاء رصيد افتتاحي لحسابك بعد.</p>
                    <p className="text-sm text-gray-500">يرجى التواصل مع الإدارة لإنشاء رصيدك الافتتاحي.</p>
                </div>
            </EmployeeLayout>
        );
    }

    return (
        <EmployeeLayout title="الرصيد الافتتاحي">
            <div className="space-y-6">
                {/* زر الرجوع */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => router.visit('/employee/dashboard')}
                        className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                    >
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        العودة إلى الداشبورد
                    </button>

                    <div className="text-right">
                        <h1 className="text-2xl font-bold text-gray-900">الرصيد الافتتاحي</h1>
                        <p className="text-sm text-gray-600">عرض الرصيد الافتتاحي للموظف</p>
                    </div>
                </div>

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">الرصيد الافتتاحي</h2>
                            <p className="text-blue-100">الموظف: {user?.name}</p>
                            <p className="text-blue-100 text-sm">تاريخ الافتتاح: {formatDate(openingBalance.opening_date)}</p>
                        </div>
                        <div className="text-left">
                            <div className="text-sm text-blue-100 mb-1">الحالة</div>
                            <div className="bg-white bg-opacity-20 rounded-lg px-3 py-2">
                                {getStatusBadge(openingBalance.status)}
                            </div>
                        </div>
                    </div>

                    {/* الإجمالي العام في الهيدر */}
                    <div className="bg-white bg-opacity-90 rounded-lg p-4 border border-white border-opacity-30">
                        <div className="text-center">
                            <p className="text-blue-800 text-sm mb-1 font-semibold">الإجمالي العام</p>
                            <p className="text-2xl font-bold text-blue-900">{formatCurrency(getGrandTotal())} IQD</p>
                        </div>
                    </div>
                </div>

                {/* حسابات الدينار العراقي */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                        <span className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mr-3">
                            💵
                        </span>
                        حسابات الدينار العراقي
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {iqd_accounts.map((account) => (
                            <div key={account.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center mb-3">
                                    <div className={`w-10 h-10 ${account.color} rounded-lg flex items-center justify-center mr-3`}>
                                        <span className="text-lg">{account.icon}</span>
                                    </div>
                                    <label className="text-sm font-medium text-gray-700">
                                        {account.name}
                                    </label>
                                </div>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                                    <span className="text-lg font-semibold text-gray-900">
                                        {formatCurrency(openingBalance[account.id] || 0)}
                                    </span>
                                    <span className="text-sm text-gray-500 mr-2">IQD</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* إجمالي الدينار العراقي */}
                    <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-green-800">إجمالي الدينار العراقي:</span>
                            <span className="text-xl font-bold text-green-600">
                                {formatCurrency(getTotalIQD())} IQD
                            </span>
                        </div>
                    </div>
                </div>

                {/* حساب الدولار الأمريكي */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                        <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mr-3">
                            💲
                        </span>
                        حساب الدولار الأمريكي
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* مبلغ الدولار */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center mb-3">
                                <div className={`w-10 h-10 ${usd_account.color} rounded-lg flex items-center justify-center mr-3`}>
                                    <span className="text-lg">{usd_account.icon}</span>
                                </div>
                                <label className="text-sm font-medium text-gray-700">
                                    {usd_account.name}
                                </label>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                                <span className="text-lg font-semibold text-gray-900">
                                    {formatCurrency(openingBalance.usd_cash || 0)}
                                </span>
                                <span className="text-sm text-gray-500 mr-2">USD</span>
                            </div>
                        </div>

                        {/* سعر الصرف */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center mb-3">
                                <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mr-3">
                                    <span className="text-lg">�</span>
                                </div>
                                <label className="text-sm font-medium text-gray-700">
                                    سعر الصرف
                                </label>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                                <span className="text-lg font-semibold text-gray-900">
                                    {formatCurrency(openingBalance.exchange_rate || 0)}
                                </span>
                                <span className="text-sm text-gray-500 mr-2">IQD/USD</span>
                            </div>
                        </div>

                        {/* المعادل بالدينار */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center mb-3">
                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-3">
                                    <span className="text-lg">�</span>
                                </div>
                                <label className="text-sm font-medium text-gray-700">
                                    المعادل بالدينار
                                </label>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                                <span className="text-lg font-semibold text-gray-900">
                                    {formatCurrency(getTotalUSD() * parseFloat(openingBalance.exchange_rate || 0))}
                                </span>
                                <span className="text-sm text-gray-500 mr-2">IQD</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* الملاحظات */}
                {openingBalance.notes && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <span className="w-8 h-8 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center mr-3">
                                📝
                            </span>
                            الملاحظات
                        </h3>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <p className="text-gray-700">{openingBalance.notes}</p>
                        </div>
                    </div>
                )}

                {/* تنبيه مهم */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="mr-3">
                            <h4 className="text-sm font-medium text-blue-800">معلومة مهمة</h4>
                            <p className="text-sm text-blue-700 mt-1">
                                هذا الرصيد الافتتاحي للعرض فقط. لا يمكنك تعديل أو حذف هذه البيانات.
                                في حالة وجود أي خطأ، يرجى التواصل مع الإدارة.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </EmployeeLayout>
    );
}
