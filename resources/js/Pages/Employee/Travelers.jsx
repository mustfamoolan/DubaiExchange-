import React, { useState, useEffect } from 'react';
import EmployeeLayout from '../../Layouts/EmployeeLayout';
import { router } from '@inertiajs/react';
import { useCentralCashBalance } from '../../Hooks/useCentralCashBalance';
import { generateUniqueReference } from '../../Utils/generateUniqueReference';

export default function Travelers({
    user,
    transactions = [],
    quickReport = { today_total: 0, today_operations: 0, total_amount: 0, total_operations: 0 },
    currentCashBalance = 0,
    openingCashBalance = 0,
    centralExchangeRate = 1320
}) {
    // استخدام نظام الرصيد النقدي المركزي
    const { centralCashBalance, updateBalanceAfterTransaction } = useCentralCashBalance(currentCashBalance);

    const [formData, setFormData] = useState({
        receiptNumber: '',
        tripNumber: '',
        fullName: '',
        usdAmount: '',
        iqdAmount: '',
        employeeName: user?.name || 'الموظف الحالي',
        notes: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [todayReport, setTodayReport] = useState({
        today_total: quickReport.today_total,
        today_operations: quickReport.today_operations,
        total_amount: quickReport.total_amount,
        total_operations: quickReport.total_operations
    });

    // حالة التقرير المفصل
    const [showDetailedReport, setShowDetailedReport] = useState(false);
    const [detailedReportData, setDetailedReportData] = useState(null);

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

    // توليد رقم إيصال جديد
    useEffect(() => {
        const generateReceiptNumber = () => {
            const uniqueRef = generateUniqueReference('TRV');
            setFormData(prev => ({ ...prev, receiptNumber: uniqueRef }));
        };

        generateReceiptNumber();
    }, []);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // حساب الإجمالي
    const calculateTotal = () => {
        const usd = parseFloat(formData.usdAmount) || 0;
        const iqd = parseFloat(formData.iqdAmount) || 0;
        return (usd * centralExchangeRate) + iqd;
    };

    // جلب التقرير المفصل
    const fetchDetailedReport = async () => {
        try {
            const response = await fetch('/employee/travelers/detailed-report', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
            });

            if (response.ok) {
                const result = await response.json();
                setDetailedReportData(result);
                return result;
            } else {
                console.error('فشل في جلب التقرير المفصل');
                return null;
            }
        } catch (error) {
            console.error('خطأ في جلب التقرير:', error);
            return null;
        }
    };

    // عرض التقرير المفصل
    const handleDetailedReport = async () => {
        setShowDetailedReport(true);
        if (!detailedReportData) {
            await fetchDetailedReport();
        }
    };

    // إرسال المعاملة
    const handleSubmit = async () => {
        if (!formData.tripNumber || !formData.fullName || !formData.usdAmount || !formData.iqdAmount) {
            alert('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        if (parseFloat(formData.usdAmount) <= 0 || parseFloat(formData.iqdAmount) < 0) {
            alert('يرجى إدخال مبالغ صحيحة');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/employee/travelers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                body: JSON.stringify({
                    receiptNumber: formData.receiptNumber,
                    tripNumber: formData.tripNumber,
                    fullName: formData.fullName,
                    usdAmount: formData.usdAmount,
                    iqdAmount: formData.iqdAmount,
                    notes: formData.notes
                })
            });

            if (response.ok) {
                const result = await response.json();

                // تحديث الرصيد المركزي
                if (result.new_cash_balance !== undefined) {
                    updateBalanceAfterTransaction(result.new_cash_balance);
                }

                // تحديث التقرير
                if (result.updated_report) {
                    setTodayReport({
                        today_total: result.updated_report.today_total,
                        today_operations: result.updated_report.today_operations,
                        total_amount: result.updated_report.total_amount,
                        total_operations: result.updated_report.total_operations
                    });
                }

                // إعادة تعيين النموذج
                setFormData(prev => ({
                    ...prev,
                    tripNumber: '',
                    fullName: '',
                    usdAmount: '',
                    iqdAmount: '',
                    notes: ''
                }));

                // توليد رقم إيصال جديد
                const uniqueRef = generateUniqueReference('TRV');
                setFormData(prev => ({ ...prev, receiptNumber: uniqueRef }));

                alert('تم حفظ معاملة المسافر بنجاح!');
            } else {
                const error = await response.json();
                alert(error.message || 'حدث خطأ');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('حدث خطأ في الشبكة');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        router.visit('/employee/dashboard');
    };

    return (
        <EmployeeLayout title="خدمات المسافرين">
            <div className="max-w-7xl mx-auto">
                {/* زر الرجوع */}
                <div className="mb-6">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-md"
                    >
                        <span>←</span>
                        <span>العودة للصفحة الرئيسية</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* الجانب الأيسر - الرصيد */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            {/* شعار خدمات المسافرين */}
                            <div className="text-center mb-6">
                                <div className="w-20 h-20 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-2xl text-cyan-600">✈️</span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">خدمات المسافرين</h2>
                            </div>

                            {/* عرض الرصيد */}
                            <div className="space-y-4 mb-6">
                                {/* الرصيد الحالي */}
                                <div className="bg-green-50 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-green-800 mb-2">الرصيد النقدي المركزي</h3>
                                    <p className="text-3xl font-bold text-green-700">
                                        {Math.floor(centralCashBalance).toLocaleString()} د.ع
                                    </p>
                                </div>

                                {/* الرصيد الافتتاحي */}
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">الرصيد الافتتاحي:</span>
                                        <span className="font-bold text-gray-800">
                                            {openingCashBalance > 0 ? Math.floor(openingCashBalance).toLocaleString() : '0'} د.ع
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* تقرير اليوم */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">تقرير المسافرين</h3>

                                <div className="bg-cyan-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-cyan-700">إجمالي اليوم:</span>
                                        <span className="font-bold text-cyan-800">{todayReport.today_total > 0 ? Math.floor(todayReport.today_total).toLocaleString() : '0'} د.ع</span>
                                    </div>
                                </div>

                                <div className="bg-blue-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-blue-700">إجمالي الكل:</span>
                                        <span className="font-bold text-blue-800">{todayReport.total_amount > 0 ? Math.floor(todayReport.total_amount).toLocaleString() : '0'} د.ع</span>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-700">عمليات اليوم:</span>
                                        <span className="font-bold text-gray-800">{todayReport.today_operations}</span>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-700">إجمالي العمليات:</span>
                                        <span className="font-bold text-gray-800">{todayReport.total_operations}</span>
                                    </div>
                                </div>
                            </div>

                            {/* زر التقرير المفصل */}
                            <button
                                onClick={handleDetailedReport}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 mt-6"
                            >
                                تقرير مفصل
                            </button>
                        </div>
                    </div>

                    {/* الجانب الأيمن - نموذج المسافرين */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            {/* العنوان */}
                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-bold text-gray-900">خدمات المسافرين</h1>
                                <p className="text-gray-600 mt-2">سعر الصرف المركزي: {centralExchangeRate.toLocaleString()} د.ع</p>
                            </div>

                            {/* الوقت ورقم الإيصال */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        التاريخ والوقت:
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-right bg-gray-50"
                                        value={currentDateTime}
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        رقم الإيصال:
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-right bg-gray-50"
                                        value={formData.receiptNumber}
                                        readOnly
                                    />
                                </div>
                            </div>

                            {/* اسم المنفذ */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                    اسم منفذ العملية:
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-right bg-gray-50"
                                    value={formData.employeeName}
                                    readOnly
                                />
                            </div>

                            {/* بيانات المسافر */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        رقم الوجبة: *
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-right"
                                        placeholder="أدخل رقم الوجبة"
                                        value={formData.tripNumber}
                                        onChange={(e) => handleInputChange('tripNumber', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        الاسم الثلاثي: *
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-right"
                                        placeholder="أدخل الاسم الثلاثي"
                                        value={formData.fullName}
                                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* المبالغ */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        المبلغ بالدولار: *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-right"
                                        placeholder="0.00"
                                        value={formData.usdAmount}
                                        onChange={(e) => handleInputChange('usdAmount', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        العمولة بالدينار العراقي: *
                                    </label>
                                    <input
                                        type="number"
                                        step="1"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-right"
                                        placeholder="0"
                                        value={formData.iqdAmount}
                                        onChange={(e) => handleInputChange('iqdAmount', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* الإجمالي */}
                            <div className="bg-cyan-50 rounded-xl p-6 mb-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-semibold text-cyan-800">الإجمالي بالدينار العراقي:</span>
                                    <span className="text-2xl font-bold text-cyan-700">
                                        {calculateTotal().toLocaleString()} د.ع
                                    </span>
                                </div>
                                {formData.usdAmount && (
                                    <div className="mt-2 text-sm text-cyan-600 text-right">
                                        ({parseFloat(formData.usdAmount || 0).toFixed(2)} × {centralExchangeRate.toLocaleString()}) + {parseFloat(formData.iqdAmount || 0).toLocaleString()}
                                    </div>
                                )}
                            </div>

                            {/* ملاحظات */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                    ملاحظات:
                                </label>
                                <textarea
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-right"
                                    rows="3"
                                    placeholder="ملاحظات إضافية..."
                                    value={formData.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                />
                            </div>

                            {/* أزرار الحفظ */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !formData.tripNumber || !formData.fullName || !formData.usdAmount || !formData.iqdAmount}
                                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
                                >
                                    <span className="ml-2">🖨️</span>
                                    {isSubmitting ? 'جاري المعالجة...' : 'حفظ وطباعة'}
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !formData.tripNumber || !formData.fullName || !formData.usdAmount || !formData.iqdAmount}
                                    className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
                                >
                                    <span className="ml-2">💾</span>
                                    {isSubmitting ? 'جاري المعالجة...' : 'حفظ'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* نافذة التقرير المفصل */}
            {showDetailedReport && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900">التقرير المفصل - خدمات المسافرين</h2>
                                <button
                                    onClick={() => setShowDetailedReport(false)}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            {detailedReportData ? (
                                <div>
                                    <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="bg-cyan-50 p-4 rounded-lg">
                                            <h3 className="font-semibold text-cyan-800">إجمالي الدينار</h3>
                                            <p className="text-2xl font-bold text-cyan-700">
                                                {detailedReportData.summary?.total_amount?.toLocaleString() || '0'} د.ع
                                            </p>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-lg">
                                            <h3 className="font-semibold text-green-800">إجمالي الدولار</h3>
                                            <p className="text-2xl font-bold text-green-700">
                                                ${detailedReportData.summary?.total_usd?.toFixed(2) || '0.00'}
                                            </p>
                                        </div>
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <h3 className="font-semibold text-blue-800">العمولات</h3>
                                            <p className="text-2xl font-bold text-blue-700">
                                                {detailedReportData.summary?.total_iqd_direct?.toLocaleString() || '0'} د.ع
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h3 className="font-semibold text-gray-800">عدد العمليات</h3>
                                            <p className="text-2xl font-bold text-gray-700">
                                                {detailedReportData.summary?.total_transactions || 0}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-full table-auto">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-right">رقم الإيصال</th>
                                                    <th className="px-4 py-2 text-right">رقم الوجبة</th>
                                                    <th className="px-4 py-2 text-right">الاسم</th>
                                                    <th className="px-4 py-2 text-right">USD</th>
                                                    <th className="px-4 py-2 text-right">العمولة</th>
                                                    <th className="px-4 py-2 text-right">الإجمالي</th>
                                                    <th className="px-4 py-2 text-right">التاريخ</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {detailedReportData.transactions?.map((transaction, index) => (
                                                    <tr key={index} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2">{transaction.receipt_number}</td>
                                                        <td className="px-4 py-2">{transaction.trip_number}</td>
                                                        <td className="px-4 py-2">{transaction.full_name}</td>
                                                        <td className="px-4 py-2">${Number(transaction.usd_amount).toFixed(2)}</td>
                                                        <td className="px-4 py-2">{Number(transaction.iqd_amount).toLocaleString()} د.ع</td>
                                                        <td className="px-4 py-2 font-semibold">{Number(transaction.total_iqd).toLocaleString()} د.ع</td>
                                                        <td className="px-4 py-2">{transaction.formatted_date}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                                    <p className="mt-2 text-gray-600">جاري تحميل التقرير...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </EmployeeLayout>
    );
}
