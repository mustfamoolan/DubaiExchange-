import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { usePage } from '@inertiajs/react';

export default function CustomerStatement({ customer, transactions }) {
    const { flash } = usePage().props;
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, received, delivered
    const [filterCurrency, setFilterCurrency] = useState('all'); // all, iqd, usd

    // فلترة المعاملات
    const filteredTransactions = transactions.filter(transaction => {
        const matchesSearch = transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             transaction.transaction_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             transaction.employee_name.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = filterType === 'all' || transaction.transaction_type === filterType;
        const matchesCurrency = filterCurrency === 'all' || transaction.currency_type === filterCurrency;

        return matchesSearch && matchesType && matchesCurrency;
    });

    return (
        <AdminLayout title={`كشف حساب العميل: ${customer.name}`}>
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
                {/* بيانات العميل */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">بيانات العميل</h2>
                        <Link
                            href="/admin/customers"
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                        >
                            العودة للعملاء
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="text-center">
                            <p className="text-sm text-gray-500 mb-1">رمز العميل</p>
                            <p className="text-lg font-bold text-blue-600">{customer.customer_code}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-500 mb-1">اسم العميل</p>
                            <p className="text-lg font-bold text-gray-900">{customer.name}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-500 mb-1">رقم الهاتف</p>
                            <p className="text-lg font-bold text-gray-900">{customer.phone}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-500 mb-1">الحالة</p>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                customer.is_active
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                            }`}>
                                {customer.is_active ? 'نشط' : 'معطل'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ملخص الأرصدة */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* الرصيد الافتتاحي */}
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <h3 className="text-sm font-medium text-blue-800 mb-3">الرصيد الافتتاحي</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-blue-600">دينار:</span>
                                <span className="font-bold text-blue-900">{customer.iqd_opening_balance.toLocaleString()} د.ع</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-blue-600">دولار:</span>
                                <span className="font-bold text-blue-900">${customer.usd_opening_balance.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* إجمالي المستلم */}
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <h3 className="text-sm font-medium text-green-800 mb-3">إجمالي المستلم</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-green-600">دينار:</span>
                                <span className="font-bold text-green-900">{customer.total_received.iqd.toLocaleString()} د.ع</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-green-600">دولار:</span>
                                <span className="font-bold text-green-900">${customer.total_received.usd.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* إجمالي المسلم */}
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                        <h3 className="text-sm font-medium text-red-800 mb-3">إجمالي المسلم</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-red-600">دينار:</span>
                                <span className="font-bold text-red-900">{customer.total_delivered.iqd.toLocaleString()} د.ع</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-red-600">دولار:</span>
                                <span className="font-bold text-red-900">${customer.total_delivered.usd.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* الرصيد المتبقي */}
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                        <h3 className="text-sm font-medium text-purple-800 mb-3">الرصيد المتبقي</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-purple-600">دينار:</span>
                                <span className={`font-bold ${customer.remaining_balance.iqd >= 0 ? 'text-purple-900' : 'text-red-700'}`}>
                                    {customer.remaining_balance.iqd.toLocaleString()} د.ع
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-purple-600">دولار:</span>
                                <span className={`font-bold ${customer.remaining_balance.usd >= 0 ? 'text-purple-900' : 'text-red-700'}`}>
                                    ${customer.remaining_balance.usd.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* كشف حساب المعاملات */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4">
                        <h3 className="text-lg font-bold">كشف حساب المعاملات</h3>
                    </div>

                    {/* فلاتر البحث */}
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <input
                                    type="text"
                                    placeholder="البحث في المعاملات..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-right"
                                />
                            </div>
                            <div>
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-right"
                                >
                                    <option value="all">جميع الأنواع</option>
                                    <option value="received">مستلم</option>
                                    <option value="delivered">مسلم</option>
                                </select>
                            </div>
                            <div>
                                <select
                                    value={filterCurrency}
                                    onChange={(e) => setFilterCurrency(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-right"
                                >
                                    <option value="all">جميع العملات</option>
                                    <option value="iqd">دينار عراقي</option>
                                    <option value="usd">دولار أمريكي</option>
                                </select>
                            </div>
                            <div className="text-sm text-gray-600 flex items-center">
                                إجمالي المعاملات: {filteredTransactions.length}
                            </div>
                        </div>
                    </div>

                    {/* جدول المعاملات */}
                    {filteredTransactions.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">رقم المعاملة</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">النوع</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">العملة</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المبلغ</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الوصف</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الموظف</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredTransactions.map((transaction) => (
                                        <tr key={transaction.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {transaction.transaction_code}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    transaction.transaction_type === 'received'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {transaction.transaction_type_text}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {transaction.currency_type_text}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                {transaction.amount.toLocaleString()} {transaction.currency_type === 'iqd' ? 'د.ع' : '$'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                {transaction.description || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {transaction.employee_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {transaction.transaction_date}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500">لا توجد معاملات للعميل</p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
