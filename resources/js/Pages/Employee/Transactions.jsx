import React, { useState, useEffect } from 'react';
import EmployeeLayout from '../../Layouts/EmployeeLayout';
import { useCentralCashBalance } from '../../Hooks/useCentralCashBalance';

export default function Transactions({
    user,
    currentCashBalance = 0,
    openingCashBalance = 0
}) {
    // استخدام نظام الرصيد النقدي المركزي
    const { centralCashBalance } = useCentralCashBalance(currentCashBalance);

    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterType, setFilterType] = useState('all'); // all, receive, exchange, travelers, banking
    const [dateFilter, setDateFilter] = useState('today'); // today, week, month, all
    const [searchQuery, setSearchQuery] = useState('');

    // إحصائيات المعاملات
    const [summary, setSummary] = useState({
        totalTransactions: 0,
        totalAmount: 0,
        receiveAmount: 0,
        exchangeAmount: 0,
        travelersAmount: 0,
        bankingAmount: 0
    });

    // جلب المعاملات من الخادم
    const fetchTransactions = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                type: filterType,
                date: dateFilter,
                search: searchQuery
            });

            const response = await fetch(`/employee/transactions?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
            });

            if (response.ok) {
                const result = await response.json();
                setTransactions(result.transactions || []);
                setSummary(result.summary || {});
            } else {
                console.error('فشل في جلب المعاملات');
            }
        } catch (error) {
            console.error('خطأ في جلب المعاملات:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // جلب المعاملات عند تحميل الصفحة أو تغيير الفلاتر
    useEffect(() => {
        fetchTransactions();
    }, [filterType, dateFilter, searchQuery]);

    // تنسيق المبلغ
    const formatAmount = (amount) => {
        return new Intl.NumberFormat('ar-IQ').format(amount);
    };

    // تنسيق التاريخ
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // تحديد لون نوع المعاملة
    const getTransactionTypeColor = (type) => {
        switch (type) {
            case 'receive': return 'bg-green-100 text-green-800';
            case 'exchange': return 'bg-red-100 text-red-800';
            case 'travelers': return 'bg-blue-100 text-blue-800';
            case 'banking': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // ترجمة نوع المعاملة
    const getTransactionTypeText = (type) => {
        switch (type) {
            case 'receive': return 'قبض';
            case 'exchange': return 'صرف';
            case 'travelers': return 'مسافرين';
            case 'banking': return 'حوالة مصرفية';
            default: return 'غير محدد';
        }
    };

    return (
        <EmployeeLayout title="سجل المعاملات">
            <div className="max-w-7xl mx-auto">
                {/* رأس الصفحة والإحصائيات */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">سجل المعاملات</h1>
                            <p className="text-gray-600">عرض شامل لجميع المعاملات المالية</p>
                        </div>

                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-4 rounded-lg">
                            <div className="text-sm opacity-90">الرصيد النقدي الحالي</div>
                            <div className="text-2xl font-bold">{formatAmount(centralCashBalance)} د.ع</div>
                        </div>
                    </div>

                    {/* إحصائيات سريعة */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-gray-900">{summary.totalTransactions || 0}</div>
                            <div className="text-sm text-gray-600">إجمالي المعاملات</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-green-600">{formatAmount(summary.receiveAmount || 0)}</div>
                            <div className="text-sm text-gray-600">مبلغ القبض</div>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-red-600">{formatAmount(summary.exchangeAmount || 0)}</div>
                            <div className="text-sm text-gray-600">مبلغ الصرف</div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-blue-600">{formatAmount(summary.travelersAmount || 0)}</div>
                            <div className="text-sm text-gray-600">معاملات المسافرين</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-purple-600">{formatAmount(summary.bankingAmount || 0)}</div>
                            <div className="text-sm text-gray-600">الحوالات المصرفية</div>
                        </div>
                    </div>
                </div>

                {/* فلاتر البحث */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* فلتر نوع المعاملة */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">نوع المعاملة</label>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">جميع المعاملات</option>
                                <option value="receive">القبض</option>
                                <option value="exchange">الصرف</option>
                                <option value="travelers">المسافرين</option>
                                <option value="banking">الحوالات المصرفية</option>
                            </select>
                        </div>

                        {/* فلتر التاريخ */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">الفترة الزمنية</label>
                            <select
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="today">اليوم</option>
                                <option value="week">هذا الأسبوع</option>
                                <option value="month">هذا الشهر</option>
                                <option value="all">جميع الفترات</option>
                            </select>
                        </div>

                        {/* البحث */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">البحث</label>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="بحث في المعاملات..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* جدول المعاملات */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">قائمة المعاملات</h3>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <span className="mr-3 text-gray-600">جاري التحميل...</span>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد معاملات</h3>
                            <p className="text-gray-600">لم يتم العثور على معاملات تطابق معايير البحث</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            رقم المرجع
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            نوع المعاملة
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            المبلغ
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            العميل/المرسل إليه
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            الوصف
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            التاريخ والوقت
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {transactions.map((transaction, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {transaction.reference_number || transaction.receipt_number || transaction.document_number || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTransactionTypeColor(transaction.type)}`}>
                                                    {getTransactionTypeText(transaction.type)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div className="font-semibold">{formatAmount(transaction.amount || 0)} د.ع</div>
                                                {transaction.usd_amount && (
                                                    <div className="text-xs text-gray-500">{formatAmount(transaction.usd_amount)} $</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {transaction.customer_name || transaction.received_from || transaction.paid_to || transaction.full_name || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                {transaction.description || transaction.notes || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(transaction.created_at)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </EmployeeLayout>
    );
}
