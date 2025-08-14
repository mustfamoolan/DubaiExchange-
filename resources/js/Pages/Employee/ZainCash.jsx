import React, { useState, useEffect } from 'react';
import EmployeeLayout from '../../Layouts/EmployeeLayout';
import { router } from '@inertiajs/react';
import ThermalReceipt from '../../Components/ThermalReceipt';
import { useThermalReceipt } from '../../Hooks/useThermalReceipt';

export default function ZainCash({ user, currentBalance = 0, currentCashBalance = 0, transactions = [], openingBalance = 0, quickReport = { charges: 0, payments: 0, operations: 0 } }) {
    const [balance, setBalance] = useState(currentBalance);
    const [cashBalance, setCashBalance] = useState(currentCashBalance);
    const [activeTab, setActiveTab] = useState('charge'); // 'charge' or 'payment'
    const [showDetailedReport, setShowDetailedReport] = useState(false);
    const [todayReport, setTodayReport] = useState({
        charges: quickReport.charges,
        payments: quickReport.payments,
        operations: quickReport.operations
    });

    // استخدام hook الفواتير الحرارية
    const {
        showReceipt,
        receiptData,
        isCreatingReceipt,
        createReceipt,
        printReceipt,
        closeReceipt,
        createReceiptAndSave
    } = useThermalReceipt();

    // بيانات النموذج
    const [formData, setFormData] = useState({
        amount: '',
        commission: '',
        notes: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [referenceNumber, setReferenceNumber] = useState('');
    const [currentDateTime, setCurrentDateTime] = useState('');

    // تحديث التاريخ والوقت كل ثانية
    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            const formatted = now.toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            setCurrentDateTime(formatted);
        };

        updateDateTime();
        const interval = setInterval(updateDateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    // توليد رقم مرجع جديد
    useEffect(() => {
        const generateRefNumber = () => {
            const now = new Date();
            const dateStr = now.getFullYear().toString() +
                           (now.getMonth() + 1).toString().padStart(2, '0') +
                           now.getDate().toString().padStart(2, '0');
            const timeStr = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            setReferenceNumber(`ZAI${dateStr}${timeStr}`);
        };

        generateRefNumber();
    }, []);

    // حساب العمولة التلقائي
    useEffect(() => {
        if (formData.amount) {
            const amount = parseFloat(formData.amount);
            if (!isNaN(amount)) {
                const commission = Math.round(amount * 0.01); // 1% عمولة
                setFormData(prev => ({ ...prev, commission: commission.toString() }));
            }
        }
    }, [formData.amount]);

    // تحديث قيم النموذج
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // حساب المبلغ الإجمالي
    const getTotalAmount = () => {
        const amount = parseFloat(formData.amount) || 0;
        const commission = parseFloat(formData.commission) || 0;
        return amount + commission;
    };

    // إضافة state للتقرير المفصل
    const [detailedReportData, setDetailedReportData] = useState(null);

    // جلب التقرير المفصل
    const fetchDetailedReport = async () => {
        try {
            const response = await fetch('/zain-cash/detailed-report', {
                method: 'GET',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                setDetailedReportData(result.report);
                return result.report;
            } else if (response.status === 401) {
                alert('جلسة العمل منتهية الصلاحية، يرجى تسجيل الدخول مرة أخرى');
                router.visit('/login');
                return null;
            } else {
                // محاولة قراءة رسالة الخطأ
                try {
                    const errorData = await response.json();
                    alert(errorData.message || 'حدث خطأ أثناء جلب التقرير');
                } catch {
                    alert('حدث خطأ أثناء جلب التقرير');
                }
                return null;
            }
        } catch (error) {
            console.error('Error fetching detailed report:', error);
            alert('حدث خطأ في الشبكة أثناء جلب التقرير');
        }
        return null;
    };

    // عرض التقرير المفصل
    const handleDetailedReport = async () => {
        const reportData = await fetchDetailedReport();
        if (reportData) {
            setShowDetailedReport(true);
        }
    };

    // إرسال المعاملة (حفظ فقط)
    const handleSubmit = async (action) => {
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            alert('يرجى إدخال مبلغ صحيح');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`/zain-cash/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    reference_number: referenceNumber
                })
            });

            if (response.ok) {
                const result = await response.json();

                // تحديث الرصيد
                setBalance(result.new_balance);

                // تحديث الرصيد النقدي
                if (result.new_cash_balance !== undefined) {
                    setCashBalance(result.new_cash_balance);
                }

                // تحديث تقرير اليوم بالبيانات الحديثة من الخادم
                if (result.updated_report) {
                    setTodayReport({
                        charges: result.updated_report.charges,
                        payments: result.updated_report.payments,
                        operations: result.updated_report.operations
                    });
                }

                // إعادة تعيين النموذج
                resetForm();

                alert(`تم ${action === 'charge' ? 'الشحن' : 'الدفع'} بنجاح!`);
                return { success: true, result };
            } else if (response.status === 401) {
                alert('جلسة العمل منتهية الصلاحية، يرجى تسجيل الدخول مرة أخرى');
                router.visit('/login');
                return { success: false, error: 'Unauthorized' };
            } else {
                // محاولة قراءة رسالة الخطأ
                try {
                    const error = await response.json();
                    alert(error.message || 'حدث خطأ');
                } catch {
                    alert('حدث خطأ في الخادم');
                }
                return { success: false, error: 'Server error' };
            }
        } catch (error) {
            console.error('Error:', error);
            alert('حدث خطأ في الشبكة');
            return { success: false, error };
        } finally {
            setIsSubmitting(false);
        }
    };

    // حفظ وطباعة الفاتورة
    const handleSaveAndPrint = async () => {
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            alert('يرجى إدخال مبلغ صحيح');
            return;
        }

        const transactionData = {
            transaction_type: activeTab,
            reference_number: referenceNumber,
            amount: formData.amount,
            commission: formData.commission,
            notes: formData.notes,
            customer_phone: null
        };

        const result = await createReceiptAndSave(
            () => handleSubmit(activeTab),
            transactionData,
            'zain_cash'
        );

        if (result.success) {
            // النجاح - الفاتورة ستظهر تلقائياً
        }
    };

    // إعادة تعيين النموذج
    const resetForm = () => {
        setFormData({
            amount: '',
            commission: '',
            notes: ''
        });

        // توليد رقم مرجع جديد
        const now = new Date();
        const dateStr = now.getFullYear().toString() +
                       (now.getMonth() + 1).toString().padStart(2, '0') +
                       now.getDate().toString().padStart(2, '0');
        const timeStr = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        setReferenceNumber(`ZAI${dateStr}${timeStr}`);
    };

    return (
        <EmployeeLayout title="زين كاش">
            <div className="max-w-7xl mx-auto">
                {/* زر الرجوع */}
                <div className="mb-6">
                    <button
                        onClick={() => router.visit('/employee/dashboard')}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
                    >
                        <span>←</span>
                        <span>العودة للصفحة الرئيسية</span>
                    </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* الجانب الأيسر - الرصيد الحالي */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            {/* شعار المصرف */}
                            <div className="text-center mb-6">
                                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <img
                                        src="/images/services/zain-cash.png"
                                        alt="زين كاش"
                                        className="w-12 h-12 object-contain"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'block';
                                        }}
                                    />
                                    <span className="text-2xl text-purple-600 hidden">🏛️</span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">الرصيد الحالي</h2>
                            </div>

                            {/* عرض الرصيد */}
                            <div className="space-y-4 mb-6">
                                <div className="bg-purple-50 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-purple-800 mb-2">الرصيد المتبقي</h3>
                                    <p className="text-3xl font-bold text-purple-700">
                                        {Math.floor(balance).toLocaleString()} د.ع
                                    </p>
                                </div>

                                {/* الرصيد النقدي الحالي */}
                                <div className="bg-green-50 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-green-800 mb-2">الرصيد النقدي</h3>
                                    <p className="text-3xl font-bold text-green-700">
                                        {Math.floor(cashBalance).toLocaleString()} د.ع
                                    </p>
                                </div>
                            </div>

                            {/* عرض الرصيد الافتتاحي */}
                            <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                <h4 className="text-sm font-semibold text-gray-700 mb-1">الرصيد الافتتاحي</h4>
                                <p className="text-lg font-bold text-gray-800">
                                    {openingBalance > 0 ? Math.floor(openingBalance).toLocaleString() : '0'} د.ع
                                </p>
                            </div>

                            {/* تقرير اليوم */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">تقرير شامل - جميع العمليات</h3>

                                <div className="bg-red-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-red-700">شحن:</span>
                                        <span className="font-bold text-red-800">{todayReport.charges > 0 ? Math.floor(todayReport.charges).toLocaleString() : '0'} د.ع</span>
                                    </div>
                                </div>

                                <div className="bg-green-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-green-700">دفع:</span>
                                        <span className="font-bold text-green-800">{todayReport.payments > 0 ? Math.floor(todayReport.payments).toLocaleString() : '0'} د.ع</span>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-700">العمليات:</span>
                                        <span className="font-bold text-gray-800">{todayReport.operations}</span>
                                    </div>
                                </div>
                            </div>

                            {/* زر التقرير المفصل */}
                            <button
                                onClick={handleDetailedReport}
                                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 mt-6"
                            >
                                تقرير مفصل
                            </button>
                        </div>
                    </div>

                    {/* الجانب الأيمن - نموذج المعاملة */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            {/* أزرار التبديل */}
                            <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setActiveTab('charge')}
                                    className={`px-6 py-3 rounded-lg font-semibold flex-1 transition-all duration-300 transform ${
                                        activeTab === 'charge'
                                            ? 'bg-red-500 text-white shadow-lg scale-105'
                                            : 'bg-transparent text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    💰 شحن
                                </button>
                                <button
                                    onClick={() => setActiveTab('payment')}
                                    className={`px-6 py-3 rounded-lg font-semibold flex-1 transition-all duration-300 transform ${
                                        activeTab === 'payment'
                                            ? 'bg-green-500 text-white shadow-lg scale-105'
                                            : 'bg-transparent text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    💸 دفع
                                </button>
                            </div>

                            {/* مؤشر الحالة الحالية */}
                            <div className={`mb-6 p-4 rounded-lg border-l-4 ${
                                activeTab === 'charge'
                                    ? 'bg-red-50 border-red-500'
                                    : 'bg-green-50 border-green-500'
                            }`}>
                                <h3 className={`font-semibold ${
                                    activeTab === 'charge' ? 'text-red-800' : 'text-green-800'
                                }`}>
                                    {activeTab === 'charge' ? '🔴 وضع الشحن نشط' : '🟢 وضع الدفع نشط'}
                                </h3>
                                <p className={`text-sm ${
                                    activeTab === 'charge' ? 'text-red-600' : 'text-green-600'
                                }`}>
                                    {activeTab === 'charge'
                                        ? 'أدخل بيانات عملية الشحن'
                                        : 'أدخل بيانات عملية الدفع'
                                    }
                                </p>
                            </div>

                            {/* معلومات المعاملة */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        رقم المرجع:
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-right"
                                        value={referenceNumber}
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        التاريخ والوقت:
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-right"
                                        value={currentDateTime}
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        مدخل البيانات:
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-right bg-gray-50"
                                        value={user?.name || 'غير محدد'}
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        المبلغ:
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-right"
                                        placeholder="المبلغ"
                                        value={formData.amount}
                                        onChange={(e) => handleInputChange('amount', e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        العمولة:
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-right"
                                        placeholder="العمولة"
                                        value={formData.commission}
                                        onChange={(e) => handleInputChange('commission', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* المبلغ الكلي */}
                            <div className={`rounded-xl p-4 mb-6 ${
                                activeTab === 'charge'
                                    ? 'bg-red-50 border border-red-200'
                                    : 'bg-green-50 border border-green-200'
                            }`}>
                                <div className="flex justify-between items-center">
                                    <span className={`text-lg font-semibold ${
                                        activeTab === 'charge' ? 'text-red-800' : 'text-green-800'
                                    }`}>
                                        {activeTab === 'charge' ? 'إجمالي الشحن:' : 'إجمالي الدفع:'}
                                    </span>
                                    <span className={`text-2xl font-bold ${
                                        activeTab === 'charge' ? 'text-red-700' : 'text-green-700'
                                    }`}>
                                        {getTotalAmount() > 0 ? Math.floor(getTotalAmount()).toLocaleString() : '0'} د.ع
                                    </span>
                                </div>
                            </div>

                            {/* ملاحظات */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                    ملاحظات:
                                </label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-right"
                                    rows="3"
                                    placeholder="ملاحظات إضافية..."
                                    value={formData.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                ></textarea>
                            </div>

                            {/* أزرار العمل */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={handleSaveAndPrint}
                                    disabled={isSubmitting || isCreatingReceipt}
                                    className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
                                >
                                    <span className="ml-2">📄</span>
                                    {(isSubmitting || isCreatingReceipt) ? 'جاري المعالجة...' : 'حفظ وطباعة'}
                                </button>
                                <button
                                    onClick={() => handleSubmit(activeTab)}
                                    disabled={isSubmitting || isCreatingReceipt}
                                    className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
                                >
                                    <span className="ml-2">💾</span>
                                    {isSubmitting ? 'جاري المعالجة...' : 'حفظ'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* نافذة التقرير المفصل */}
                {showDetailedReport && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[95vh] overflow-y-auto">
                            {/* رأس النافذة */}
                            <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 rounded-t-2xl">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-white flex items-center">
                                        <span className="text-2xl mr-3">📊</span>
                                        التقرير المفصل - زين كاش
                                    </h2>
                                    <button
                                        onClick={() => setShowDetailedReport(false)}
                                        className="text-white hover:text-gray-200 text-3xl font-bold transition-colors duration-200"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>

                            {/* محتوى التقرير */}
                            <div className="p-6 bg-gray-50">
                                {/* معلومات الموظف */}
                                <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                        <span className="text-xl mr-2">👤</span>
                                        معلومات الموظف
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex items-center space-x-3 space-x-reverse">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                <span className="text-blue-600 font-bold">👨‍💼</span>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">اسم الموظف:</span>
                                                <p className="font-semibold text-gray-800">{user?.name || 'غير محدد'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3 space-x-reverse">
                                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                <span className="text-green-600 font-bold">📅</span>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">تاريخ التقرير:</span>
                                                <p className="font-semibold text-gray-800">{new Date().toLocaleDateString('en-US')}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* إحصائيات شاملة */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                    {/* الرصيد الافتتاحي */}
                                    <div className="bg-white rounded-xl p-6 border border-blue-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                                        <div className="text-center">
                                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <span className="text-2xl">🏦</span>
                                            </div>
                                            <h4 className="text-sm font-semibold text-blue-700 mb-2">الرصيد الافتتاحي</h4>
                                            <p className="text-2xl font-bold text-blue-800">
                                                {detailedReportData ? Math.floor(detailedReportData.opening_balance).toLocaleString() : '0'}
                                            </p>
                                            <p className="text-xs text-blue-600 mt-1">د.ع</p>
                                        </div>
                                    </div>

                                    {/* الرصيد المتبقي */}
                                    <div className="bg-white rounded-xl p-6 border border-purple-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                                        <div className="text-center">
                                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <span className="text-2xl">💰</span>
                                            </div>
                                            <h4 className="text-sm font-semibold text-purple-700 mb-2">الرصيد المتبقي</h4>
                                            <p className="text-2xl font-bold text-purple-800">
                                                {detailedReportData ? Math.floor(detailedReportData.current_balance).toLocaleString() : Math.floor(balance).toLocaleString()}
                                            </p>
                                            <p className="text-xs text-purple-600 mt-1">د.ع</p>
                                        </div>
                                    </div>

                                    {/* إجمالي العمليات */}
                                    <div className="bg-white rounded-xl p-6 border border-purple-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                                        <div className="text-center">
                                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <span className="text-2xl">📈</span>
                                            </div>
                                            <h4 className="text-sm font-semibold text-purple-700 mb-2">إجمالي العمليات</h4>
                                            <p className="text-2xl font-bold text-purple-800">
                                                {detailedReportData ? detailedReportData.total_operations : todayReport.operations}
                                            </p>
                                            <p className="text-xs text-purple-600 mt-1">عملية</p>
                                        </div>
                                    </div>
                                </div>

                                {/* تفاصيل العمليات */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    {/* عمليات الشحن */}
                                    <div className="bg-white rounded-xl p-6 border border-red-200 shadow-sm">
                                        <h4 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
                                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                                                <span className="text-red-600">💸</span>
                                            </div>
                                            عمليات الشحن
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="bg-red-50 rounded-lg p-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-red-600">إجمالي المبلغ:</span>
                                                    <span className="font-bold text-red-800 text-lg">
                                                        {detailedReportData ? Math.floor(detailedReportData.total_charges).toLocaleString() : Math.floor(todayReport.charges).toLocaleString()} د.ع
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="bg-red-50 rounded-lg p-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-red-600">عدد العمليات:</span>
                                                    <span className="font-bold text-red-800 text-lg">
                                                        {detailedReportData ? detailedReportData.charge_count : Math.floor(todayReport.operations * (todayReport.charges / (todayReport.charges + todayReport.payments || 1)))} عملية
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* عمليات الدفع */}
                                    <div className="bg-white rounded-xl p-6 border border-green-200 shadow-sm">
                                        <h4 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                                <span className="text-green-600">💰</span>
                                            </div>
                                            عمليات الدفع
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="bg-green-50 rounded-lg p-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-green-600">إجمالي المبلغ:</span>
                                                    <span className="font-bold text-green-800 text-lg">
                                                        {detailedReportData ? Math.floor(detailedReportData.total_payments).toLocaleString() : Math.floor(todayReport.payments).toLocaleString()} د.ع
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="bg-green-50 rounded-lg p-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-green-600">عدد العمليات:</span>
                                                    <span className="font-bold text-green-800 text-lg">
                                                        {detailedReportData ? detailedReportData.payment_count : Math.floor(todayReport.operations * (todayReport.payments / (todayReport.charges + todayReport.payments || 1)))} عملية
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* معلومات العمولة */}
                                <div className="bg-white rounded-xl p-6 border border-yellow-200 shadow-sm mb-6">
                                    <h4 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
                                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                                            <span className="text-yellow-600">💳</span>
                                        </div>
                                        إجمالي العمولة
                                    </h4>
                                    <div className="bg-yellow-50 rounded-lg p-6">
                                        <div className="text-center">
                                            <p className="text-3xl font-bold text-yellow-800">
                                                {detailedReportData ? Math.floor(detailedReportData.total_commission).toLocaleString() : Math.floor((todayReport.charges + todayReport.payments) * 0.01).toLocaleString()} د.ع
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* زر الإغلاق */}
                                <div className="flex justify-center">
                                    <button
                                        onClick={() => setShowDetailedReport(false)}
                                        className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 flex items-center shadow-lg"
                                    >
                                        <span className="mr-2">✖️</span>
                                        إغلاق التقرير
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* نافذة الفاتورة الحرارية */}
                {showReceipt && receiptData && (
                    <ThermalReceipt
                        receiptData={receiptData}
                        onClose={closeReceipt}
                        onPrint={printReceipt}
                    />
                )}
            </div>
        </EmployeeLayout>
    );
}
