import React, { useState } from 'react';
import { Link, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Employees({ employees: initialEmployees = [] }) {
    const { flash } = usePage().props;
    const [showAddForm, setShowAddForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        phone: '',
        password: '',
        password_confirmation: ''
    });

    // استخدام البيانات من الخادم
    const [employees, setEmployees] = useState(initialEmployees);

    const filteredEmployees = employees.filter(employee =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.phone.includes(searchTerm)
    );

    const handleSubmit = (e) => {
        e.preventDefault();

        post('/admin/employees', {
            onSuccess: () => {
                setShowAddForm(false);
                reset();
                // إعادة تحميل الصفحة للحصول على البيانات المحدثة
                window.location.reload();
            },
            onError: () => {
                // الأخطاء ستظهر تلقائياً من خلال نظام Inertia
            }
        });
    };

    const toggleEmployeeStatus = async (employeeId) => {
        try {
            await fetch(`/admin/employees/${employeeId}/toggle-status`, {
                method: 'PATCH',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    'Content-Type': 'application/json',
                },
            });

            // تحديث الحالة محلياً
            setEmployees(prev =>
                prev.map(emp =>
                    emp.id === employeeId
                        ? { ...emp, isActive: !emp.isActive }
                        : emp
                )
            );
        } catch (error) {
            console.error('Error toggling employee status:', error);
        }
    };

    return (
        <AdminLayout title="إدارة الموظفين">
            {/* رسائل النجاح والخطأ */}
            {flash?.success && (
                <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    {flash.error}
                </div>
            )}

            <div className="space-y-4 lg:space-y-6">
                {/* رأس الصفحة */}
                <div className="bg-white rounded-lg lg:rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                        <div>
                            <h2 className="text-xl lg:text-2xl font-bold text-gray-900">إدارة الموظفين</h2>
                            <p className="text-sm text-gray-500 mt-1">إضافة وإدارة موظفي النظام</p>
                        </div>
                        <button
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm lg:text-base flex items-center gap-2"
                        >
                            {showAddForm ? '❌ إلغاء' : '➕ إضافة موظف جديد'}
                        </button>
                    </div>

                    {/* شريط البحث */}
                    {!showAddForm && (
                        <div className="max-w-md">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="البحث عن موظف..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                                />
                                <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                    )}
                </div>

                {/* نموذج إضافة موظف جديد */}
                {showAddForm && (
                    <div className="bg-white rounded-lg lg:rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">إضافة موظف جديد</h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* اسم الموظف */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        اسم الموظف *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                                        placeholder="أدخل اسم الموظف الكامل"
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

                                {/* كلمة المرور */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        كلمة المرور *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                                            placeholder="أدخل كلمة مرور قوية"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                        >
                                            {showPassword ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L12 12m-2.122-2.122L7.76 7.76m4.242 4.242L12 12m0 0l2.122 2.122M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                    )}
                                </div>

                                {/* تأكيد كلمة المرور */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        تأكيد كلمة المرور *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswordConfirmation ? "text" : "password"}
                                            required
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                                            placeholder="أعد إدخال كلمة المرور"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                                            className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                        >
                                            {showPasswordConfirmation ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L12 12m-2.122-2.122L7.76 7.76m4.242 4.242L12 12m0 0l2.122 2.122M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    {errors.password_confirmation && (
                                        <p className="mt-1 text-sm text-red-600">{errors.password_confirmation}</p>
                                    )}
                                </div>
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
                                    {processing ? 'جاري الحفظ...' : 'حفظ الموظف'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* قائمة الموظفين */}
                {!showAddForm && (
                    <div className="bg-white rounded-lg lg:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* عرض الديسكتوب - جدول */}
                        <div className="hidden lg:block">
                            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4">
                                <div className="grid grid-cols-12 gap-4 text-center font-semibold text-sm">
                                    <div className="col-span-1">#</div>
                                    <div className="col-span-4">اسم الموظف</div>
                                    <div className="col-span-3">رقم الهاتف</div>
                                    <div className="col-span-2">تاريخ الإضافة</div>
                                    <div className="col-span-1">الحالة</div>
                                    <div className="col-span-1">الإجراءات</div>
                                </div>
                            </div>

                            <div className="divide-y divide-gray-200">
                                {filteredEmployees.map((employee, index) => (
                                    <Link
                                        key={employee.id}
                                        href={`/admin/employees/${employee.id}`}
                                        className="block p-4 hover:bg-blue-50 transition-colors cursor-pointer"
                                    >
                                        <div className="grid grid-cols-12 gap-4 items-center text-sm">
                                            <div className="col-span-1 text-center font-medium text-gray-900">
                                                {index + 1}
                                            </div>
                                            <div className="col-span-4">
                                                <div className="font-medium text-gray-900">{employee.name}</div>
                                            </div>
                                            <div className="col-span-3 text-center text-gray-600">
                                                {employee.phone}
                                            </div>
                                            <div className="col-span-2 text-center text-gray-600">
                                                {employee.createdAt}
                                            </div>
                                            <div className="col-span-1 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    employee.isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {employee.isActive ? 'نشط' : 'معطل'}
                                                </span>
                                            </div>
                                            <div className="col-span-1 text-center">
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        toggleEmployeeStatus(employee.id);
                                                    }}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 ${
                                                        employee.isActive
                                                            ? 'bg-red-500 hover:bg-red-600 text-white'
                                                            : 'bg-green-500 hover:bg-green-600 text-white'
                                                    }`}
                                                >
                                                    {employee.isActive ? 'تعطيل' : 'تفعيل'}
                                                </button>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* عرض الموبايل والتابلت - كاردات */}
                        <div className="lg:hidden divide-y divide-gray-200">
                            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-3 text-center font-semibold text-sm">
                                قائمة الموظفين ({filteredEmployees.length})
                            </div>

                            {filteredEmployees.map((employee) => (
                                <Link
                                    key={employee.id}
                                    href={`/admin/employees/${employee.id}`}
                                    className="block p-4 space-y-3 hover:bg-blue-50 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900 text-sm">{employee.name}</h3>
                                            <p className="text-xs text-gray-500">الهاتف: {employee.phone}</p>
                                            <p className="text-xs text-gray-400 mt-1">أضيف في: {employee.createdAt}</p>
                                        </div>
                                        <div className="text-right space-y-2">
                                            <div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    employee.isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {employee.isActive ? 'نشط' : 'معطل'}
                                                </span>
                                            </div>
                                            <div>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        toggleEmployeeStatus(employee.id);
                                                    }}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 ${
                                                        employee.isActive
                                                            ? 'bg-red-500 hover:bg-red-600 text-white'
                                                            : 'bg-green-500 hover:bg-green-600 text-white'
                                                    }`}
                                                >
                                                    {employee.isActive ? 'تعطيل' : 'تفعيل'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* إحصائيات سريعة */}
                {!showAddForm && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">إجمالي الموظفين</p>
                                    <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">الموظفين النشطين</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {employees.filter(emp => emp.isActive).length}
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
                                    <p className="text-sm font-medium text-gray-600">الموظفين المعطلين</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {employees.filter(emp => !emp.isActive).length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
