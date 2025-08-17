import React, { useState } from 'react';
import { usePage, Link } from '@inertiajs/react';
import EmployeeLayout from '@/Layouts/EmployeeLayout';

export default function CustomerStatement({ customer, transactions }) {
    const { flash } = usePage().props;
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, received, delivered
    const [filterCurrency, setFilterCurrency] = useState('all'); // all, iqd, usd

    // فلترة المعاملات
    const filteredTransactions = transactions.filter(transaction => {
        // فلترة بالبحث
        const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             transaction.transaction_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             transaction.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             transaction.employee_name.toLowerCase().includes(searchTerm.toLowerCase());

        // فلترة بنوع المعاملة
        const matchesType = filterType === 'all' ||
                           (filterType === 'received' && transaction.transaction_type === 'received') ||
                           (filterType === 'delivered' && transaction.transaction_type === 'delivered');

        // فلترة بنوع العملة
        const matchesCurrency = filterCurrency === 'all' ||
                               transaction.currency_type === filterCurrency;

        return matchesSearch && matchesType && matchesCurrency;
    });

    return (
        <EmployeeLayout title={`كشف حساب العميل: ${customer.name}`}>
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

            <div className="space-y-6">
                {/* شريط الرجوع */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/employee/customers"
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-md"
                    >
                        <span>←</span>
                        العودة لقائمة العملاء
                    </Link>
                </div>

                {/* معلومات العميل */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">معلومات العميل</h3>
                            <div className="space-y-1">
                                <p><span className="font-medium">الاسم:</span> {customer.name}</p>
                                <p><span className="font-medium">رمز العميل:</span> <span className="text-blue-600 font-bold">{customer.customer_code}</span></p>
                                <p><span className="font-medium">الهاتف:</span> {customer.phone}</p>
                                <p><span className="font-medium">تاريخ التسجيل:</span> {customer.created_at}</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">الرصيد الافتتاحي</h3>
                            <div className="space-y-1">
                                <p><span className="font-medium">دينار عراقي:</span> {customer.iqd_opening_balance.toLocaleString()}</p>
                                <p><span className="font-medium">دولار أمريكي:</span> {customer.usd_opening_balance.toLocaleString()}</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">الرصيد الحالي</h3>
                            <div className="space-y-1">
                                <p className={`font-bold ${customer.current_iqd_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    <span className="font-medium text-gray-700">دينار عراقي:</span> {customer.current_iqd_balance.toLocaleString()}
                                </p>
                                <p className={`font-bold ${customer.current_usd_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    <span className="font-medium text-gray-700">دولار أمريكي:</span> {customer.current_usd_balance.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">الحالة</h3>
                            <div className="space-y-1">
                                <p>
                                    <span className="font-medium">الحالة:</span>
                                    <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                                        customer.is_active
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {customer.is_active ? 'نشط' : 'معطل'}
                                    </span>
                                </p>
                                <p><span className="font-medium">عدد المعاملات:</span> {transactions.length}</p>
                            </div>
                        </div>
                    </div>

                    {customer.notes && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <h4 className="font-medium text-gray-700 mb-1">ملاحظات:</h4>
                            <p className="text-gray-600 text-sm">{customer.notes}</p>
                        </div>
                    )}
                </div>

                {/* أدوات البحث والفلترة */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">البحث</label>
                            <input
                                type="text"
                                placeholder="البحث في المعاملات..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">نوع المعاملة</label>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                            >
                                <option value="all">جميع المعاملات</option>
                                <option value="received">استلام</option>
                                <option value="delivered">تسليم</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">نوع العملة</label>
                            <select
                                value={filterCurrency}
                                onChange={(e) => setFilterCurrency(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                            >
                                <option value="all">جميع العملات</option>
                                <option value="iqd">دينار عراقي</option>
                                <option value="usd">دولار أمريكي</option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setFilterType('all');
                                    setFilterCurrency('all');
                                }}
                                className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                            >
                                إعادة تعيين
                            </button>
                        </div>
                    </div>
                </div>

                {/* قائمة المعاملات */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {/* عرض الديسكتوب */}
                    <div className="hidden lg:block">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
                            <div className="grid grid-cols-9 gap-4 text-center font-semibold text-sm">
                                <div>رقم المعاملة</div>
                                <div>النوع</div>
                                <div>العملة</div>
                                <div>المبلغ</div>
                                <div>سعر الصرف</div>
                                <div>الوصف</div>
                                <div>الموظف</div>
                                <div>التاريخ</div>
                                <div>ملاحظات</div>
                            </div>
                        </div>

                        <div className="divide-y divide-gray-200">
                            {filteredTransactions.map((transaction) => (
                                <div key={transaction.id} className="p-4 hover:bg-blue-50 transition-colors">
                                    <div className="grid grid-cols-9 gap-4 items-center text-sm">
                                        <div className="text-center">
                                            <span className="text-blue-600 font-bold">{transaction.transaction_code}</span>
                                        </div>
                                        <div className="text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                transaction.transaction_type === 'received'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {transaction.transaction_type_text}
                                            </span>
                                        </div>
                                        <div className="text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                transaction.currency_type === 'iqd'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-green-100 text-green-800'
                                            }`}>
                                                {transaction.currency_type_text}
                                            </span>
                                        </div>
                                        <div className="text-center font-bold">
                                            {transaction.amount.toLocaleString()}
                                        </div>
                                        <div className="text-center">
                                            {transaction.exchange_rate || '-'}
                                        </div>
                                        <div className="text-right">
                                            {transaction.description}
                                        </div>
                                        <div className="text-center">
                                            {transaction.employee_name}
                                        </div>
                                        <div className="text-center text-gray-600">
                                            {transaction.transaction_date}
                                        </div>
                                        <div className="text-right text-gray-600 text-xs">
                                            {transaction.notes || '-'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* عرض الموبايل */}
                    <div className="lg:hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 text-center">
                            <h3 className="font-bold">تاريخ المعاملات</h3>
                        </div>

                        {filteredTransactions.map((transaction) => (
                            <div key={transaction.id} className="p-4 space-y-3 hover:bg-blue-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="text-blue-600 font-bold text-sm">{transaction.transaction_code}</div>
                                        <div className="text-gray-900 font-medium">{transaction.description}</div>
                                        <div className="text-gray-500 text-sm">الموظف: {transaction.employee_name}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold">{transaction.amount.toLocaleString()}</div>
                                        <div className="text-sm text-gray-500">{transaction.transaction_date}</div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                        transaction.transaction_type === 'received'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {transaction.transaction_type_text}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                        transaction.currency_type === 'iqd'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-green-100 text-green-800'
                                    }`}>
                                        {transaction.currency_type_text}
                                    </span>
                                    {transaction.exchange_rate && (
                                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                                            سعر الصرف: {transaction.exchange_rate}
                                        </span>
                                    )}
                                </div>

                                {transaction.notes && (
                                    <div className="pt-2 border-t border-gray-100">
                                        <div className="text-sm text-gray-600">
                                            <span className="font-medium">ملاحظات:</span> {transaction.notes}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* رسالة عدم وجود معاملات */}
                    {filteredTransactions.length === 0 && (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد معاملات</h3>
                            <p className="text-gray-500">لا توجد معاملات تطابق معايير البحث المحددة.</p>
                        </div>
                    )}
                </div>
            </div>
        </EmployeeLayout>
    );
}
