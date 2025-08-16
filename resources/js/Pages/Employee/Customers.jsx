import React, { useState } from 'react';
import { useForm, usePage, Link } from '@inertiajs/react';
import EmployeeLayout from '@/Layouts/EmployeeLayout';

export default function Customers({ customers: initialCustomers = [] }) {
    const { flash } = usePage().props;
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingCustomer, setDeletingCustomer] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        phone: '',
        iqd_opening_balance: 0,
        usd_opening_balance: 0,
        notes: ''
    });

    const { data: editData, setData: setEditData, put, processing: editProcessing, errors: editErrors, reset: resetEdit } = useForm({
        name: '',
        phone: '',
        iqd_opening_balance: 0,
        usd_opening_balance: 0,
        notes: ''
    });

    // استخدام البيانات من الخادم
    const [customers, setCustomers] = useState(initialCustomers);

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm) ||
        customer.customer_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = (e) => {
        e.preventDefault();

        post('/employee/customers', {
            onSuccess: () => {
                setShowAddForm(false);
                reset();
                window.location.reload();
            },
            onError: () => {
                // الأخطاء ستظهر تلقائياً من خلال نظام Inertia
            }
        });
    };

    const toggleCustomerStatus = async (customerId) => {
        try {
            const response = await fetch(`/employee/customers/${customerId}/toggle-status`, {
                method: 'PATCH',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                // تحديث حالة العميل في القائمة محلياً
                setCustomers(prev =>
                    prev.map(customer =>
                        customer.id === customerId
                            ? { ...customer, is_active: !customer.is_active }
                            : customer
                    )
                );
            }
        } catch (error) {
            console.error('Error toggling customer status:', error);
        }
    };

    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        setEditData({
            name: customer.name,
            phone: customer.phone,
            iqd_opening_balance: customer.iqd_opening_balance,
            usd_opening_balance: customer.usd_opening_balance,
            notes: customer.notes || ''
        });
        setShowEditForm(true);
        setShowAddForm(false);
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();

        put(`/employee/customers/${editingCustomer.id}`, {
            onSuccess: () => {
                setShowEditForm(false);
                setEditingCustomer(null);
                resetEdit();
                window.location.reload();
            },
            onError: () => {
                // الأخطاء ستظهر تلقائياً من خلال نظام Inertia
            }
        });
    };

    const handleDelete = (customer) => {
        setDeletingCustomer(customer);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deletingCustomer) return;

        try {
            const response = await fetch(`/employee/customers/${deletingCustomer.id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                // إزالة العميل من القائمة محلياً
                setCustomers(prev => prev.filter(customer => customer.id !== deletingCustomer.id));
                setShowDeleteModal(false);
                setDeletingCustomer(null);
            } else {
                alert('حدث خطأ أثناء حذف العميل');
            }
        } catch (error) {
            console.error('Error deleting customer:', error);
            alert('حدث خطأ أثناء حذف العميل');
        }
    };

    const cancelEdit = () => {
        setShowEditForm(false);
        setEditingCustomer(null);
        resetEdit();
    };

    return (
        <EmployeeLayout title="إدارة العملاء">
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
                {/* شريط الأدوات */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => {
                                setShowAddForm(!showAddForm);
                                setShowEditForm(false);
                                reset();
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            تعريف عميل جديد
                        </button>
                    </div>

                    <div className="w-full sm:w-auto">
                        <input
                            type="text"
                            placeholder="البحث عن عميل..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-80 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-right"
                        />
                    </div>
                </div>

                {/* إحصائيات */}
                {!showAddForm && !showEditForm && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">إجمالي العملاء</p>
                                    <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">العملاء النشطين</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {customers.filter(customer => customer.is_active).length}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                                    <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">العملاء ذوو المعاملات</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {customers.filter(customer => customer.transactions_count > 0).length}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">العملاء المعطلين</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {customers.filter(customer => !customer.is_active).length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* نموذج إضافة عميل جديد */}
                {showAddForm && (
                    <div className="bg-white rounded-lg lg:rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">تعريف عميل جديد</h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* اسم العميل */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        اسم العميل *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                                        placeholder="أدخل اسم العميل الكامل"
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                    )}
                                </div>

                                {/* رقم الهاتف */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        رقم الهاتف *
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                                        placeholder="07XXXXXXXXX"
                                    />
                                    {errors.phone && (
                                        <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                                    )}
                                </div>

                                {/* الرصيد الافتتاحي دينار */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        الرصيد الافتتاحي دينار *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={data.iqd_opening_balance}
                                        onChange={(e) => setData('iqd_opening_balance', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                                        placeholder="0.00 (يمكن أن يكون سالب)"
                                    />
                                    {errors.iqd_opening_balance && (
                                        <p className="mt-1 text-sm text-red-600">{errors.iqd_opening_balance}</p>
                                    )}
                                </div>

                                {/* الرصيد الافتتاحي دولار */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        الرصيد الافتتاحي دولار *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={data.usd_opening_balance}
                                        onChange={(e) => setData('usd_opening_balance', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                                        placeholder="0.00 (يمكن أن يكون سالب)"
                                    />
                                    {errors.usd_opening_balance && (
                                        <p className="mt-1 text-sm text-red-600">{errors.usd_opening_balance}</p>
                                    )}
                                </div>
                            </div>

                            {/* ملاحظات */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                    ملاحظات
                                </label>
                                <textarea
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                                    placeholder="أدخل أي ملاحظات إضافية..."
                                />
                                {errors.notes && (
                                    <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
                                )}
                            </div>

                            {/* أزرار النموذج */}
                            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                                >
                                    {processing ? 'جاري الحفظ...' : 'حفظ العميل'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* نموذج تعديل عميل */}
                {showEditForm && editingCustomer && (
                    <div className="bg-white rounded-lg lg:rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">تعديل بيانات العميل: {editingCustomer.name}</h3>

                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* اسم العميل */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        اسم العميل *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={editData.name}
                                        onChange={(e) => setEditData('name', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                                        placeholder="أدخل اسم العميل الكامل"
                                    />
                                    {editErrors.name && (
                                        <p className="mt-1 text-sm text-red-600">{editErrors.name}</p>
                                    )}
                                </div>

                                {/* رقم الهاتف */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        رقم الهاتف *
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        value={editData.phone}
                                        onChange={(e) => setEditData('phone', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                                        placeholder="07XXXXXXXXX"
                                    />
                                    {editErrors.phone && (
                                        <p className="mt-1 text-sm text-red-600">{editErrors.phone}</p>
                                    )}
                                </div>

                                {/* الرصيد الافتتاحي دينار */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        الرصيد الافتتاحي دينار *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={editData.iqd_opening_balance}
                                        onChange={(e) => setEditData('iqd_opening_balance', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                                        placeholder="0.00 (يمكن أن يكون سالب)"
                                    />
                                    {editErrors.iqd_opening_balance && (
                                        <p className="mt-1 text-sm text-red-600">{editErrors.iqd_opening_balance}</p>
                                    )}
                                </div>

                                {/* الرصيد الافتتاحي دولار */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        الرصيد الافتتاحي دولار *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={editData.usd_opening_balance}
                                        onChange={(e) => setEditData('usd_opening_balance', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                                        placeholder="0.00 (يمكن أن يكون سالب)"
                                    />
                                    {editErrors.usd_opening_balance && (
                                        <p className="mt-1 text-sm text-red-600">{editErrors.usd_opening_balance}</p>
                                    )}
                                </div>
                            </div>

                            {/* ملاحظات */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                    ملاحظات
                                </label>
                                <textarea
                                    value={editData.notes}
                                    onChange={(e) => setEditData('notes', e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                                    placeholder="أدخل أي ملاحظات إضافية..."
                                />
                                {editErrors.notes && (
                                    <p className="mt-1 text-sm text-red-600">{editErrors.notes}</p>
                                )}
                            </div>

                            {/* أزرار النموذج */}
                            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={editProcessing}
                                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                                >
                                    {editProcessing ? 'جاري التحديث...' : 'تحديث البيانات'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* قائمة العملاء */}
                {!showAddForm && !showEditForm && (
                    <div className="bg-white rounded-lg lg:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* طريقة عرض الديسكتوب */}
                        <div className="hidden lg:block">
                            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4">
                                <div className="grid grid-cols-12 gap-4 text-center font-semibold text-sm">
                                    <div className="col-span-1">#</div>
                                    <div className="col-span-1">رمز العميل</div>
                                    <div className="col-span-2">اسم العميل</div>
                                    <div className="col-span-2">رقم الهاتف</div>
                                    <div className="col-span-1">رصيد د.ع</div>
                                    <div className="col-span-1">رصيد $</div>
                                    <div className="col-span-1">معاملات</div>
                                    <div className="col-span-1">الحالة</div>
                                    <div className="col-span-2">الإجراءات</div>
                                </div>
                            </div>

                            <div className="divide-y divide-gray-200">
                                {filteredCustomers.map((customer, index) => (
                                    <div
                                        key={customer.id}
                                        className="p-4 hover:bg-blue-50 transition-colors"
                                    >
                                        <div className="grid grid-cols-12 gap-4 items-center text-sm">
                                            <div className="col-span-1 text-center font-medium text-gray-900">
                                                {index + 1}
                                            </div>
                                            <div className="col-span-1 text-center">
                                                <span className="text-blue-600 font-bold">{customer.customer_code}</span>
                                            </div>
                                            <div className="col-span-2">
                                                <div className="font-medium text-gray-900">{customer.name}</div>
                                            </div>
                                            <div className="col-span-2 text-center text-gray-600">
                                                {customer.phone}
                                            </div>
                                            <div className="col-span-1 text-center text-gray-600">
                                                {customer.current_iqd_balance.toLocaleString()}
                                            </div>
                                            <div className="col-span-1 text-center text-gray-600">
                                                {customer.current_usd_balance.toLocaleString()}
                                            </div>
                                            <div className="col-span-1 text-center">
                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                                                    {customer.transactions_count}
                                                </span>
                                            </div>
                                            <div className="col-span-1 text-center">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    customer.is_active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {customer.is_active ? 'نشط' : 'معطل'}
                                                </span>
                                            </div>
                                            <div className="col-span-2 text-center">
                                                <div className="flex gap-1 justify-center">
                                                    <Link
                                                        href={`/employee/customers/${customer.id}`}
                                                        className="px-2 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition-colors duration-200"
                                                    >
                                                        👁️ كشف
                                                    </Link>
                                                    <button
                                                        onClick={() => handleEdit(customer)}
                                                        className="px-2 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-xs font-medium transition-colors duration-200"
                                                    >
                                                        ✏️ تعديل
                                                    </button>
                                                    <button
                                                        onClick={() => toggleCustomerStatus(customer.id)}
                                                        className={`px-2 py-1.5 rounded text-xs font-medium transition-colors duration-200 ${
                                                            customer.is_active
                                                                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                                                : 'bg-green-500 hover:bg-green-600 text-white'
                                                        }`}
                                                    >
                                                        {customer.is_active ? '⏸️ تعطيل' : '▶️ تفعيل'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(customer)}
                                                        className="px-2 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition-colors duration-200"
                                                    >
                                                        🗑️ حذف
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* طريقة عرض الموبايل */}
                        <div className="lg:hidden">
                            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 text-center">
                                <h3 className="font-bold">قائمة العملاء</h3>
                            </div>

                            {filteredCustomers.map((customer) => (
                                <div
                                    key={customer.id}
                                    className="p-4 space-y-3 hover:bg-blue-50 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">{customer.name}</div>
                                            <div className="text-sm text-gray-500">{customer.phone}</div>
                                            <div className="text-xs text-blue-600 font-bold">كود: {customer.customer_code}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm">
                                                <span className="text-gray-500">د.ع: </span>
                                                <span className="font-bold">{customer.current_iqd_balance.toLocaleString()}</span>
                                            </div>
                                            <div className="text-sm">
                                                <span className="text-gray-500">$: </span>
                                                <span className="font-bold">{customer.current_usd_balance.toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2 justify-end mt-1">
                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                                                    {customer.transactions_count} معاملة
                                                </span>
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

                                    {/* أزرار الإجراءات للموبايل */}
                                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                                        <Link
                                            href={`/employee/customers/${customer.id}`}
                                            className="flex-1 min-w-0 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors duration-200 text-center"
                                        >
                                            👁️ كشف حساب
                                        </Link>
                                        <button
                                            onClick={() => handleEdit(customer)}
                                            className="flex-1 min-w-0 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-xs font-medium transition-colors duration-200"
                                        >
                                            ✏️ تعديل
                                        </button>
                                        <button
                                            onClick={() => toggleCustomerStatus(customer.id)}
                                            className={`flex-1 min-w-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-200 ${
                                                customer.is_active
                                                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                                    : 'bg-green-500 hover:bg-green-600 text-white'
                                            }`}
                                        >
                                            {customer.is_active ? '⏸️ تعطيل' : '▶️ تفعيل'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(customer)}
                                            className="flex-1 min-w-0 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors duration-200"
                                        >
                                            🗑️ حذف
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* رسالة عدم وجود عملاء */}
                        {filteredCustomers.length === 0 && (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">لا يوجد عملاء</h3>
                                <p className="text-gray-500">لم يتم العثور على عملاء. قم بإضافة عميل جديد.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* نافذة تأكيد الحذف */}
            {showDeleteModal && deletingCustomer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex items-center mb-4">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">تأكيد حذف العميل</h3>
                            <p className="text-sm text-gray-500 mb-6 text-right">
                                هل أنت متأكد من حذف العميل "<strong>{deletingCustomer.name}</strong>"؟
                                <br />
                                لا يمكن التراجع عن هذا الإجراء.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeletingCustomer(null);
                                }}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                            >
                                إلغاء
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                            >
                                حذف العميل
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </EmployeeLayout>
    );
}
