import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';

export default function TransactionLog({ transactions, employees, operationTypes, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [employeeId, setEmployeeId] = useState(filters.employee_id || '');
    const [type, setType] = useState(filters.type || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const handleFilter = () => {
        router.get(route('admin.transaction-log'), {
            search,
            employee_id: employeeId,
            type,
            date_from: dateFrom,
            date_to: dateTo
        }, {
            preserveState: true,
            replace: true
        });
    };

    const handleReset = () => {
        setSearch('');
        setEmployeeId('');
        setType('');
        setDateFrom('');
        setDateTo('');
        router.get(route('admin.transaction-log'));
    };

    const getOpBadge = (type) => {
        const badges = {
            buy: 'bg-blue-100 text-blue-700 border-blue-200',
            sell: 'bg-green-100 text-green-700 border-green-200',
            exchange: 'bg-purple-100 text-purple-700 border-purple-200',
            receive: 'bg-teal-100 text-teal-700 border-teal-200',
            zain_cash_charge: 'bg-red-100 text-red-700 border-red-200',
            zain_cash_payment: 'bg-rose-100 text-rose-700 border-rose-200',
            rafidain_charge: 'bg-indigo-100 text-indigo-700 border-indigo-200',
            rafidain_payment: 'bg-slate-100 text-slate-700 border-slate-200',
            rashid_charge: 'bg-sky-100 text-sky-700 border-sky-200',
            rashid_payment: 'bg-cyan-100 text-cyan-700 border-cyan-200',
            super_key_charge: 'bg-pink-100 text-pink-700 border-pink-200',
            super_key_payment: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
            traveler: 'bg-orange-100 text-orange-700 border-orange-200',
            distribution: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            return: 'bg-gray-100 text-gray-700 border-gray-200',
        };

        const names = {
            buy: 'شراء دولار',
            sell: 'بيع دولار',
            exchange: 'سند صرف',
            receive: 'سند قبض',
            zain_cash_charge: 'شحن زين كاش',
            zain_cash_payment: 'دفع زين كاش',
            rafidain_charge: 'شحن رافدين',
            rafidain_payment: 'دفع رافدين',
            rashid_charge: 'شحن رشيد',
            rashid_payment: 'دفع رشيد',
            super_key_charge: 'شحن سوبر كي',
            super_key_payment: 'دفع سوبر كي',
            traveler: 'مسافرين',
            distribution: 'توزيع (خزنة)',
            return: 'إرجاع (خزنة)',
        };

        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border inline-block whitespace-nowrap ${badges[type] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {names[type] || type}
            </span>
        );
    };

    const formatNumber = (num) => {
        const value = parseFloat(num) || 0;
        return new Intl.NumberFormat('en-US').format(Math.floor(value));
    };

    const getNumberColor = (num) => {
        const value = parseFloat(num) || 0;
        if (value > 0) return 'text-green-600';
        if (value < 0) return 'text-red-600';
        return 'text-gray-900';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const d = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
        const t = date.toLocaleTimeString('ar-IQ', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        return (
            <div className="flex flex-col text-[10px] sm:text-xs">
                <span className="font-mono text-gray-900 font-medium">{d}</span>
                <span className="text-gray-400">{t}</span>
            </div>
        );
    };

    const isPositiveOp = (type) => {
        return ['sell', 'receive', 'zain_cash_charge', 'rafidain_charge', 'rashid_charge', 'super_key_charge', 'return'].includes(type);
    };

    // الحصول على اسم الموظف المختار للعرض في الترويسة
    const selectedEmployeeName = employeeId ? employees.find(e => e.id == employeeId)?.name : 'كافة الموظفين';

    return (
        <AdminLayout title="سجل الحركات العام">
            <Head title="سجل الحركات العام" />

            <div className="space-y-6">
                {/* أدوات التحكم - نفس تصميم كشف الحساب */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 no-print mt-2">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap gap-2 sm:gap-3 w-full">
                            {/* البحث */}
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="بحث برقم المرجع أو البيان..."
                                className="w-full sm:w-64 text-sm border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />

                            {/* الموظف */}
                            <select
                                value={employeeId}
                                onChange={(e) => setEmployeeId(e.target.value)}
                                className="w-full sm:w-48 text-sm border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">كل الموظفين</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                            </select>

                            {/* النوع */}
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full sm:w-48 text-sm border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">جميع الحركات</option>
                                {operationTypes.map(op => (
                                    <option key={op.id} value={op.id}>{op.name}</option>
                                ))}
                            </select>

                            {/* التواريخ */}
                            <div className="flex gap-2 w-full sm:w-auto">
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-1/2 sm:w-auto text-sm border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-1/2 sm:w-auto text-sm border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* أزرار البحث والرست */}
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button
                                    onClick={handleFilter}
                                    className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    فلترة
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    إعادة ضبط
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* كشف الحساب - التصميم المطابق 100% */}
                <div className="bg-white border border-gray-400 rounded-lg overflow-hidden shadow-sm">
                    {/* ترويسة الكشف - نفس تصميم كشف العميل */}
                    <div className="border-b border-gray-400">
                        <div className="hidden sm:grid sm:grid-cols-6 border-b border-gray-400">
                            <div className="p-2 text-center text-sm font-medium bg-gray-100">الموظف</div>
                            <div className="border-r border-gray-400 p-2 text-center text-sm font-medium">{selectedEmployeeName}</div>
                            <div className="border-r border-gray-400 p-2 text-center text-sm">للتاريخ من</div>
                            <div className="border-r border-gray-400 p-2 text-center text-sm font-medium bg-gray-100">{dateFrom || 'الاشتغال من البداية'}</div>
                            <div className="border-r border-gray-400 p-2 text-center text-sm">إلى</div>
                            <div className="border-r border-gray-400 p-2 text-center text-sm font-medium bg-gray-100">{dateTo || new Date().toISOString().split('T')[0]}</div>
                        </div>

                        {/* معلومات الموبايل */}
                        <div className="sm:hidden p-3 space-y-2 bg-gray-50">
                            <div className="flex justify-between text-sm"><span className="font-bold">الموظف:</span><span>{selectedEmployeeName}</span></div>
                            <div className="flex justify-between text-sm"><span className="font-bold">الفترة:</span><span>{dateFrom || '...'} إلى {dateTo || 'اليوم'}</span></div>
                        </div>
                    </div>

                    {/* جدول الديسكتوب - التصميم المطابق 100% */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="min-w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-400 px-2 py-2 text-center text-sm font-bold">تاريخ الحركة</th>
                                    <th className="border border-gray-400 px-2 py-2 text-center text-sm font-bold">الموظف</th>
                                    <th className="border border-gray-400 px-2 py-2 text-center text-sm font-bold">نوع الحركة</th>
                                    <th className="border border-gray-400 px-2 py-2 text-center text-sm font-bold">المرجع</th>
                                    <th className="border border-gray-400 px-2 py-2 text-center text-sm font-bold">المبلغ</th>
                                    <th className="border border-gray-400 px-2 py-2 text-center text-sm font-bold">الرصيد السابق</th>
                                    <th className="border border-gray-400 px-2 py-2 text-center text-sm font-bold">الرصيد الحالي</th>
                                    <th className="border border-gray-400 px-2 py-2 text-center text-sm font-bold">الربح</th>
                                    <th className="border border-gray-400 px-2 py-2 text-center text-sm font-bold">الملاحظات</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {transactions.data.length > 0 ? (
                                    transactions.data.map((item, index) => (
                                        <tr key={`${item.op_type}-${item.id}`} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                            <td className="border border-gray-400 px-2 py-1 text-center whitespace-nowrap">
                                                {formatDate(item.created_at)}
                                            </td>
                                            <td className="border border-gray-400 px-2 py-1 text-center text-xs font-medium">
                                                {item.employee_name}
                                            </td>
                                            <td className="border border-gray-400 px-2 py-1 text-center">
                                                {getOpBadge(item.op_type)}
                                            </td>
                                            <td className="border border-gray-400 px-2 py-1 text-center text-[10px] font-mono text-gray-500">
                                                {item.reference}
                                            </td>
                                            <td className={`border border-gray-400 px-2 py-1 text-center text-xs font-bold ${getNumberColor(item.amount)}`}>
                                                {formatNumber(item.amount)} <span className="text-[9px] text-gray-400">{item.currency}</span>
                                            </td>
                                            <td className="border border-gray-400 px-2 py-1 text-center text-xs text-gray-500">
                                                {formatNumber(item.previous_balance)}
                                            </td>
                                            <td className={`border border-gray-400 px-2 py-1 text-center text-xs font-bold ${getNumberColor(item.new_balance)}`}>
                                                {formatNumber(item.new_balance)}
                                            </td>
                                            <td className={`border border-gray-400 px-2 py-1 text-center text-xs font-bold ${item.profit > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                                {item.profit != 0 ? formatNumber(item.profit) : '-'}
                                            </td>
                                            <td className="border border-gray-400 px-2 py-1 text-right text-xs max-w-[150px] truncate" title={item.notes}>
                                                {item.notes || '-'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="border border-gray-400 px-6 py-12 text-center text-gray-500 italic">
                                            لا توجد معاملات مسجلة في هذه الفترة
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* عرض البطاقات للموبايل - المطابق 100% */}
                    <div className="sm:hidden pb-4">
                        {transactions.data.length > 0 ? (
                            <div className="space-y-3 p-3">
                                {transactions.data.map((item, index) => (
                                    <div key={`${item.op_type}-${item.id}`} className={`border border-gray-300 rounded-lg p-3 ${
                                        isPositiveOp(item.op_type) ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                                    }`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center space-x-2 space-x-reverse">
                                                <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                                                    isPositiveOp(item.op_type) ? 'bg-green-500' : 'bg-red-500'
                                                }`}></span>
                                                <span className="text-sm font-bold text-gray-900">
                                                    {getOpBadge(item.op_type)}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                {formatDate(item.created_at)}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-y-3 gap-x-1 mt-3">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-500">الموظف:</span>
                                                <span className="text-xs font-medium">{item.employee_name}</span>
                                            </div>
                                            <div className="flex flex-col text-left">
                                                <span className="text-[10px] text-gray-500">رقم القائمة:</span>
                                                <span className="text-[10px] font-mono">{item.reference}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-500">المبلغ:</span>
                                                <span className={`text-sm font-black ${getNumberColor(item.amount)}`}>
                                                    {formatNumber(item.amount)} {item.currency}
                                                </span>
                                            </div>
                                            <div className="flex flex-col text-left">
                                                <span className="text-[10px] text-gray-500">الرصيد الجاري:</span>
                                                <span className={`text-sm font-black ${getNumberColor(item.new_balance)}`}>
                                                    {formatNumber(item.new_balance)}
                                                </span>
                                            </div>
                                        </div>

                                        {item.notes && (
                                            <div className="mt-2.5 p-2 bg-white/50 border border-gray-200 rounded text-xs text-gray-600">
                                                <span className="font-bold ml-1">البيان:</span>
                                                {item.notes}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center text-gray-500 text-sm">
                                لا توجد حركات لعرضها
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {transactions.links.length > 3 && (
                        <div className="px-3 py-4 bg-gray-50 border-t border-gray-400">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-xs text-gray-500 order-2 sm:order-1 text-center sm:text-right w-full sm:w-auto">
                                    عرض {transactions.from || 0} إلى {transactions.to || 0} من أصل {transactions.total || 0} حركة
                                </div>
                                <div className="flex flex-wrap justify-center gap-1 order-1 sm:order-2">
                                    {/* عرض نسخة بسيطة للموبايل: السابق + 3 أرقام + التالي */}
                                    <div className="flex sm:hidden w-full flex-col gap-3 items-center mb-2 px-2">
                                        <div className="flex w-full justify-between items-center gap-2">
                                            {transactions.prev_page_url ? (
                                                <Link href={transactions.prev_page_url} className="flex-1 text-center py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700">السابق</Link>
                                            ) : (
                                                <span className="flex-1 text-center py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-400">السابق</span>
                                            )}
                                            
                                            <div className="flex gap-1">
                                                {transactions.links.filter(link => !isNaN(link.label) && Math.abs(link.label - transactions.current_page) <= 1).map((link, i) => (
                                                    <Link 
                                                        key={i} 
                                                        href={link.url} 
                                                        className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold border transition-all ${
                                                            link.active 
                                                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                                                            : 'bg-white text-gray-700 border-gray-200 shadow-sm'
                                                        }`}
                                                    >
                                                        {link.label}
                                                    </Link>
                                                ))}
                                            </div>

                                            {transactions.next_page_url ? (
                                                <Link href={transactions.next_page_url} className="flex-1 text-center py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700">التالي</Link>
                                            ) : (
                                                <span className="flex-1 text-center py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-400">التالي</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* عرض الترقيم الكامل للديسكتوب والشاشات المتوسطة */}
                                    <div className="hidden sm:flex flex-wrap justify-center gap-1">
                                        {transactions.links.map((link, i) => (
                                            link.url ? (
                                                <Link
                                                    key={i}
                                                    href={link.url}
                                                    className={`px-3 py-1.5 text-xs rounded-md border transition-all ${
                                                        link.active 
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                    }`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ) : (
                                                <span
                                                    key={i}
                                                    className="px-3 py-1.5 text-xs rounded-md border bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed"
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            )
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
