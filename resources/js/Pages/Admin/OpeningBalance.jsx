import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Link, useForm, router } from '@inertiajs/react';

export default function OpeningBalance({ employee, openingBalances = [] }) {
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [confirmationCode, setConfirmationCode] = useState('');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [statusChangeType, setStatusChangeType] = useState('');

    // البحث عن الرصيد الفعال
    const activeBalance = openingBalances.find(balance => balance.status === 'active');
    const hasActiveBalance = !!activeBalance;

    // التحقق من وجود بيانات الموظف
    if (!employee) {
        return (
            <AdminLayout title="الرصيد الافتتاحي">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">لم يتم العثور على بيانات الموظف</h3>
                        <p className="text-gray-500 mb-4">تأكد من صحة الرابط أو اتصالك بقاعدة البيانات</p>
                        <Link
                            href={route('admin.opening-balance')}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                        >
                            العودة إلى قائمة الموظفين
                        </Link>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    const { data, setData, post, processing, errors, reset } = useForm({
        user_id: employee.id,
        opening_date: hasActiveBalance ? activeBalance.opening_date : currentDate,
        naqa: hasActiveBalance ? activeBalance.naqa || '' : '',
        rafidain: hasActiveBalance ? activeBalance.rafidain || '' : '',
        rashid: hasActiveBalance ? activeBalance.rashid || '' : '',
        zain_cash: hasActiveBalance ? activeBalance.zain_cash || '' : '',
        super_key: hasActiveBalance ? activeBalance.super_key || '' : '',
        usd_cash: hasActiveBalance ? activeBalance.usd_cash || '' : '',
        exchange_rate: hasActiveBalance ? activeBalance.exchange_rate || '1400' : '1400',
        notes: hasActiveBalance ? activeBalance.notes || '' : ''
    });

    // تحديث البيانات عند تغيير الرصيد الفعال
    useEffect(() => {
        if (hasActiveBalance && !isEditMode) {
            setData({
                user_id: employee.id,
                opening_date: activeBalance.opening_date,
                naqa: activeBalance.naqa || '',
                rafidain: activeBalance.rafidain || '',
                rashid: activeBalance.rashid || '',
                zain_cash: activeBalance.zain_cash || '',
                super_key: activeBalance.super_key || '',
                usd_cash: activeBalance.usd_cash || '',
                exchange_rate: activeBalance.exchange_rate || '1400',
                notes: activeBalance.notes || ''
            });
        }
    }, [hasActiveBalance, activeBalance, isEditMode]);

    const iqd_accounts = [
        { id: 'naqa', name: 'نقدا', icon: '💵', color: 'bg-green-100 text-green-600' },
        { id: 'rafidain', name: 'مصرف الرافدين', icon: '🏛️', color: 'bg-green-100 text-green-600' },
        { id: 'rashid', name: 'مصرف الرشيد', icon: '🏦', color: 'bg-blue-100 text-blue-600' },
        { id: 'zain_cash', name: 'زين كاش', icon: '📱', color: 'bg-purple-100 text-purple-600' },
        { id: 'super_key', name: 'سوبر كي', icon: '💳', color: 'bg-yellow-100 text-yellow-600' },

    ];

    const usd_account = { id: 'usd_cash', name: 'الدولار الأمريكي', icon: '💲', color: 'bg-indigo-100 text-indigo-600' };

    const handleInputChange = (field, value) => {
        if (hasActiveBalance && !isEditMode) {
            return; // منع التعديل إذا كان هناك رصيد فعال والمستخدم ليس في وضع التعديل
        }
        setData(field, value);
    };

    const handleStatusChange = (newStatus) => {
        setStatusChangeType(newStatus);
        setShowConfirmDialog(true);
    };

    const confirmStatusChange = () => {
        if (confirmationCode !== '1234') { // يمكنك تغيير الرمز حسب الحاجة
            alert('رمز التأكيد غير صحيح');
            return;
        }

        const endpoint = statusChangeType === 'inactive' ?
            route('opening-balance.deactivate', activeBalance.id) :
            route('opening-balance.activate', activeBalance.id);

        router.patch(endpoint, {}, {
            onSuccess: () => {
                alert(`تم ${statusChangeType === 'inactive' ? 'إلغاء تفعيل' : 'تفعيل'} الرصيد بنجاح`);
                setShowConfirmDialog(false);
                setConfirmationCode('');
                // إعادة تحميل الصفحة لتحديث البيانات
                window.location.reload();
            },
            onError: () => {
                alert('حدث خطأ أثناء تغيير حالة الرصيد');
            }
        });
    };

    const enableEditMode = () => {
        setIsEditMode(true);
    };

    const cancelEditMode = () => {
        setIsEditMode(false);
        // إعادة تعيين البيانات للقيم الأصلية
        if (hasActiveBalance) {
            setData({
                user_id: employee.id,
                opening_date: activeBalance.opening_date,
                naqa: activeBalance.naqa || '',
                rafidain: activeBalance.rafidain || '',
                rashid: activeBalance.rashid || '',
                zain_cash: activeBalance.zain_cash || '',
                super_key: activeBalance.super_key || '',
                usd_cash: activeBalance.usd_cash || '',
                exchange_rate: activeBalance.exchange_rate || '1400',
                notes: activeBalance.notes || ''
            });
        }
    };

    const getTotalIQD = () => {
        let total = 0;
        iqd_accounts.forEach(account => {
            total += parseFloat(data[account.id]) || 0;
        });
        return total;
    };

    const getTotalUSD = () => {
        return parseFloat(data.usd_cash) || 0;
    };

    const getGrandTotal = () => {
        const iqd_total = getTotalIQD();
        const usd_in_iqd = getTotalUSD() * parseFloat(data.exchange_rate);
        return iqd_total + (usd_in_iqd || 0);
    };

    const handleSave = () => {
        if (hasActiveBalance && isEditMode) {
            // تحديث الرصيد الموجود
            router.patch(route('opening-balance.update', activeBalance.id), data, {
                onSuccess: () => {
                    alert('تم تحديث الأرصدة بنجاح!');
                    setIsEditMode(false);
                    window.location.reload();
                },
                onError: (errors) => {
                    console.error('Validation errors:', errors);
                    if (Object.keys(errors).length > 0) {
                        alert('يرجى التحقق من البيانات المدخلة');
                    }
                }
            });
        } else if (!hasActiveBalance) {
            // إنشاء رصيد جديد
            post(route('opening-balance.store'), {
                onSuccess: () => {
                    alert('تم حفظ الأرصدة بنجاح!');
                    reset();
                    window.location.reload();
                },
                onError: (errors) => {
                    console.error('Validation errors:', errors);
                    if (errors.employee_id) {
                        alert('خطأ في بيانات الموظف: ' + errors.employee_id);
                    } else if (Object.keys(errors).length > 0) {
                        alert('يرجى التحقق من البيانات المدخلة');
                    }
                }
            });
        }
    };

    const handleClear = () => {
        if (hasActiveBalance && !isEditMode) {
            return; // منع المسح إذا كان هناك رصيد فعال والمستخدم ليس في وضع التعديل
        }

        reset();
        setData('exchange_rate', '1400');
        setData('opening_date', currentDate);
        setData('user_id', employee.id);
    };

    return (
        <AdminLayout title="الأرصدة الافتتاحية">
            <div className="space-y-4 lg:space-y-6">
                {/* عنوان الصفحة مع التاريخ */}
                <div className="bg-white rounded-lg lg:rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 lg:mb-6">
                        <div>
                            <h2 className="text-xl lg:text-2xl font-bold text-gray-900">الأرصدة الافتتاحية</h2>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-sm text-gray-500">الموظف:</span>
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                    {employee.name}
                                </span>
                            </div>
                        </div>
                        <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm lg:text-base">
                            <Link href="/admin/opening-balance" className="flex items-center gap-2">
                                ← الرجوع
                            </Link>
                        </button>
                    </div>

                    <div className="max-w-xs">
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                            التاريخ:
                        </label>
                        <input
                            type="date"
                            value={data.opening_date}
                            onChange={(e) => {
                                if (hasActiveBalance && !isEditMode) return;
                                setCurrentDate(e.target.value);
                                setData('opening_date', e.target.value);
                            }}
                            disabled={hasActiveBalance && !isEditMode}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right text-sm lg:text-base ${
                                hasActiveBalance && !isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                        />
                    </div>
                </div>

                {/* عرض معلومات الرصيد الفعال */}
                {hasActiveBalance && (
                    <div className="bg-green-50 border border-green-200 rounded-lg lg:rounded-xl p-4 lg:p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-green-800">يوجد رصيد افتتاحي فعال</h3>
                                <p className="text-sm text-green-600">تاريخ الإنشاء: {new Date(activeBalance.opening_date).toLocaleDateString('ar-EG')}</p>
                            </div>
                            <div className="mr-auto">
                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                    فعال
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="bg-white rounded-lg p-3 border border-green-200">
                                <div className="text-sm text-gray-600">إجمالي الدينار العراقي</div>
                                <div className="text-lg font-bold text-gray-900">
                                    {((parseFloat(activeBalance.naqa) || 0) +
                                      (parseFloat(activeBalance.rafidain) || 0) +
                                      (parseFloat(activeBalance.rashid) || 0) +
                                      (parseFloat(activeBalance.zain_cash) || 0) +
                                      (parseFloat(activeBalance.super_key) || 0)).toLocaleString()} د.ع
                                </div>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-green-200">
                                <div className="text-sm text-gray-600">الدولار الأمريكي</div>
                                <div className="text-lg font-bold text-gray-900">
                                    ${(parseFloat(activeBalance.usd_cash) || 0).toLocaleString()}
                                </div>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-green-200">
                                <div className="text-sm text-gray-600">الإجمالي النهائي</div>
                                <div className="text-lg font-bold text-green-600">
                                    {(() => {
                                        // حساب إجمالي الدينار العراقي من جميع المصارف والنقد
                                        const totalIQD = (parseFloat(activeBalance.naqa) || 0) +
                                                         (parseFloat(activeBalance.rafidain) || 0) +
                                                         (parseFloat(activeBalance.rashid) || 0) +
                                                         (parseFloat(activeBalance.zain_cash) || 0) +
                                                         (parseFloat(activeBalance.super_key) || 0);

                                        // حساب قيمة الدولار بالدينار العراقي
                                        const usdInIQD = (parseFloat(activeBalance.usd_cash) || 0) * (parseFloat(activeBalance.exchange_rate) || 1400);

                                        // الإجمالي النهائي
                                        const grandTotal = totalIQD + usdInIQD;

                                        return grandTotal.toLocaleString();
                                    })()} د.ع
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    ({((parseFloat(activeBalance.naqa) || 0) +
                                      (parseFloat(activeBalance.rafidain) || 0) +
                                      (parseFloat(activeBalance.rashid) || 0) +
                                      (parseFloat(activeBalance.zain_cash) || 0) +
                                      (parseFloat(activeBalance.super_key) || 0)).toLocaleString()} د.ع +
                                    {((parseFloat(activeBalance.usd_cash) || 0) * (parseFloat(activeBalance.exchange_rate) || 1400)).toLocaleString()} د.ع)
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {!isEditMode ? (
                                <>
                                    <button
                                        onClick={enableEditMode}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 text-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        تعديل المبالغ
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange('inactive')}
                                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 text-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                                        </svg>
                                        إلغاء التفعيل
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={handleSave}
                                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 text-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        حفظ التغييرات
                                    </button>
                                    <button
                                        onClick={cancelEditMode}
                                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 text-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        إلغاء
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}                {/* جدول الأرصدة */}
                <div className="bg-white rounded-lg lg:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* رأس الجدول */}
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 lg:p-4">
                        <div className="hidden lg:grid lg:grid-cols-12 gap-4 text-center font-semibold">
                            <div className="col-span-1 text-sm">الرمز</div>
                            <div className="col-span-4 text-sm">اسم الحساب</div>
                            <div className="col-span-2 text-sm">نوع العملة</div>
                            <div className="col-span-3 text-sm">المبلغ</div>
                            <div className="col-span-2 text-sm">سعر الصرف</div>
                        </div>
                        <div className="lg:hidden text-center font-semibold text-sm">
                            إدارة الأرصدة الافتتاحية
                        </div>
                    </div>

                    <div className="divide-y divide-gray-200">
                        {/* حسابات الدينار العراقي */}
                        {iqd_accounts.map((account) => (
                            <div key={account.id} className="p-3 lg:p-4 hover:bg-gray-50 transition-colors">
                                {/* عرض الديسكتوب */}
                                <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center">
                                    <div className="col-span-1 text-center">
                                        <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full ${account.color} flex items-center justify-center mx-auto`}>
                                            <span className="text-base lg:text-lg">{account.icon}</span>
                                        </div>
                                    </div>
                                    <div className="col-span-4 text-right font-medium text-gray-900 text-sm lg:text-base">
                                        {account.name}
                                    </div>
                                    <div className="col-span-2 text-center">
                                        <span className="px-2 py-1 lg:px-3 lg:py-1 bg-green-100 text-green-800 rounded-full text-xs lg:text-sm font-medium">
                                            دينار عراقي
                                        </span>
                                    </div>
                                    <div className="col-span-3">
                                        <input
                                            type="number"
                                            placeholder="0"
                                            disabled={hasActiveBalance && !isEditMode}
                                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-sm lg:text-base ${
                                                hasActiveBalance && !isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''
                                            }`}
                                            value={data[account.id]}
                                            onChange={(e) => handleInputChange(account.id, e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-2 text-center text-gray-500 text-sm">
                                        -
                                    </div>
                                </div>

                                {/* عرض الموبايل والتابلت */}
                                <div className="lg:hidden space-y-3">
                                    <div className="flex items-center space-x-3 space-x-reverse">
                                        <div className={`w-8 h-8 rounded-full ${account.color} flex items-center justify-center flex-shrink-0`}>
                                            <span className="text-sm">{account.icon}</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900 text-sm">{account.name}</h3>
                                            <p className="text-xs text-gray-500">دينار عراقي</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1 text-right">المبلغ:</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            disabled={hasActiveBalance && !isEditMode}
                                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-sm ${
                                                hasActiveBalance && !isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''
                                            }`}
                                            value={data[account.id]}
                                            onChange={(e) => handleInputChange(account.id, e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* حساب الدولار الأمريكي */}
                        <div className="p-3 lg:p-4 hover:bg-gray-50 transition-colors bg-blue-50/30">
                            {/* عرض الديسكتوب */}
                            <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center">
                                <div className="col-span-1 text-center">
                                    <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full ${usd_account.color} flex items-center justify-center mx-auto`}>
                                        <span className="text-base lg:text-lg">{usd_account.icon}</span>
                                    </div>
                                </div>
                                <div className="col-span-4 text-right font-medium text-gray-900 text-sm lg:text-base">
                                    {usd_account.name}
                                </div>
                                <div className="col-span-2 text-center">
                                    <span className="px-2 py-1 lg:px-3 lg:py-1 bg-blue-100 text-blue-800 rounded-full text-xs lg:text-sm font-medium">
                                        دولار أمريكي
                                    </span>
                                </div>
                                <div className="col-span-3">
                                    <input
                                        type="number"
                                        placeholder="0"
                                        disabled={hasActiveBalance && !isEditMode}
                                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-sm lg:text-base ${
                                            hasActiveBalance && !isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''
                                        }`}
                                        value={data.usd_cash}
                                        onChange={(e) => handleInputChange('usd_cash', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <input
                                        type="number"
                                        placeholder="1400"
                                        disabled={hasActiveBalance && !isEditMode}
                                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center bg-yellow-50 text-sm lg:text-base ${
                                            hasActiveBalance && !isEditMode ? 'bg-gray-100 cursor-not-allowed' : 'bg-yellow-50'
                                        }`}
                                        value={data.exchange_rate}
                                        onChange={(e) => handleInputChange('exchange_rate', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* عرض الموبايل والتابلت */}
                            <div className="lg:hidden space-y-3">
                                <div className="flex items-center space-x-3 space-x-reverse">
                                    <div className={`w-8 h-8 rounded-full ${usd_account.color} flex items-center justify-center flex-shrink-0`}>
                                        <span className="text-sm">{usd_account.icon}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900 text-sm">{usd_account.name}</h3>
                                        <p className="text-xs text-gray-500">دولار أمريكي</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1 text-right">المبلغ ($):</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            disabled={hasActiveBalance && !isEditMode}
                                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-sm ${
                                                hasActiveBalance && !isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''
                                            }`}
                                            value={data.usd_cash}
                                            onChange={(e) => handleInputChange('usd_cash', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1 text-right">سعر الصرف:</label>
                                        <input
                                            type="number"
                                            placeholder="1400"
                                            disabled={hasActiveBalance && !isEditMode}
                                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-sm ${
                                                hasActiveBalance && !isEditMode ? 'bg-gray-100 cursor-not-allowed' : 'bg-yellow-50'
                                            }`}
                                            value={data.exchange_rate}
                                            onChange={(e) => handleInputChange('exchange_rate', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* صف المجموع */}
                    <div className="bg-gray-50 p-3 lg:p-4 border-t-2 border-gray-200">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">
                            <div className="text-center lg:text-right">
                                <h3 className="text-base lg:text-lg font-bold text-gray-900">الإجمالي النهائي</h3>
                                <p className="text-xs lg:text-sm text-gray-500">مجموع جميع الأرصدة (دينار عراقي + دولار بسعر الصرف)</p>
                            </div>
                            <div className="flex justify-center">
                                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-3 lg:p-4 shadow-lg min-w-[200px] text-center">
                                    <div className="text-lg lg:text-2xl font-bold">
                                        {getGrandTotal().toLocaleString()} د.ع
                                    </div>
                                    <div className="text-xs opacity-80 mt-1">
                                        ({getTotalIQD().toLocaleString()} + {(getTotalUSD() * parseFloat(data.exchange_rate || 1400)).toLocaleString()})
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* أزرار العمليات */}
                {!hasActiveBalance && (
                    <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 justify-center">
                        <button
                            onClick={handleClear}
                            className="bg-red-500 hover:bg-red-600 text-white px-6 lg:px-8 py-2.5 lg:py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2 text-sm lg:text-base"
                        >
                            🗑️ مسح
                        </button>
                        <button
                            onClick={handleSave}
                            className="bg-green-500 hover:bg-green-600 text-white px-6 lg:px-8 py-2.5 lg:py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2 text-sm lg:text-base"
                        >
                            💾 حفظ الأرصدة
                        </button>
                    </div>
                )}
            </div>

            {/* نافذة تأكيد تغيير الحالة */}
            {showConfirmDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-right">
                            تأكيد {statusChangeType === 'inactive' ? 'إلغاء التفعيل' : 'التفعيل'}
                        </h3>
                        <p className="text-gray-600 mb-4 text-right">
                            يرجى إدخال رمز التأكيد لمتابعة العملية
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                رمز التأكيد:
                            </label>
                            <input
                                type="password"
                                value={confirmationCode}
                                onChange={(e) => setConfirmationCode(e.target.value)}
                                placeholder="أدخل رمز التأكيد"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowConfirmDialog(false);
                                    setConfirmationCode('');
                                }}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={confirmStatusChange}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                            >
                                تأكيد
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
