import React, { useState, useEffect } from 'react';
import EmployeeLayout from '../../Layouts/EmployeeLayout';
import { router } from '@inertiajs/react';
import { useThermalReceipt } from '../../Hooks/useThermalReceipt';
import ThermalReceipt from '../../Components/ThermalReceipt';
import { useReceiveExchangeReceipt } from '../../Hooks/useReceiveExchangeReceipt';
import ReceiveExchangeThermalReceipt from '../../Components/ReceiveExchangeThermalReceipt';

export default function Exchange({
    user,
    currentBalance = 0,
    openingBalance = 0,
    transactions = [],
    quickReport = { exchanged_today: 0, operations: 0, total_exchanged: 0, total_received: 0 }
}) {
    const [balance, setBalance] = useState(currentBalance);
    const [showDetailedReport, setShowDetailedReport] = useState(false);
    const [todayReport, setTodayReport] = useState({
        exchanged_today: quickReport.exchanged_today,
        operations: quickReport.operations,
        total_exchanged: quickReport.total_exchanged,
        total_received: quickReport.total_received
    });

    // استخدام hook الفواتير الحرارية العامة
    const {
        showReceipt,
        receiptData,
        isCreatingReceipt,
        createReceipt,
        printReceipt,
        closeReceipt,
        createReceiptAndSave
    } = useThermalReceipt();

    // استخدام hook المخصص لسندات القبض والصرف
    const {
        showReceipt: showExchangeReceipt,
        receiptData: exchangeReceiptData,
        isCreatingReceipt: isCreatingExchangeReceipt,
        createReceiveExchangeReceipt,
        createReceiptAndSave: createExchangeReceiptAndSave,
        printReceipt: printExchangeReceipt,
        closeReceipt: closeExchangeReceipt
    } = useReceiveExchangeReceipt();

    const [formData, setFormData] = useState({
        invoiceNumber: '',
        currentTime: new Date().toLocaleString('ar-EG'),
        amount: '',
        description: '',
        employeeName: user?.name || 'الموظف الحالي',
        paidTo: '',
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
            setReferenceNumber(`EXC${dateStr}${timeStr}`);
        };

        generateRefNumber();
    }, []);

    // تحديث invoiceNumber في formData عند تغيير referenceNumber
    useEffect(() => {
        setFormData(prev => ({ ...prev, invoiceNumber: referenceNumber }));
    }, [referenceNumber]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // إضافة state للتقرير المفصل
    const [detailedReportData, setDetailedReportData] = useState(null);

    // جلب التقرير المفصل
    const fetchDetailedReport = async () => {
        try {
            const response = await fetch('/employee/exchange/detailed-report', {
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

    // إرسال المعاملة (بدون رسائل تأكيد للاستخدام مع الطباعة)
    const handleSubmitSilent = async () => {
        if (!formData.amount || !formData.description) {
            throw new Error('يرجى ملء جميع الحقول المطلوبة');
        }

        if (parseFloat(formData.amount) <= 0) {
            throw new Error('يرجى إدخال مبلغ صحيح');
        }

        const response = await fetch('/employee/exchange', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
            },
            body: JSON.stringify({
                invoiceNumber: formData.invoiceNumber,
                amount: formData.amount,
                description: formData.description,
                paidTo: formData.paidTo,
                notes: formData.notes
            })
        });

        if (response.ok) {
            const result = await response.json();

            // تحديث الرصيد
            setBalance(result.new_balance);

            // تحديث تقرير اليوم بالبيانات الحديثة من الخادم
            if (result.updated_report) {
                setTodayReport({
                    exchanged_today: result.updated_report.exchanged_today,
                    operations: result.updated_report.operations,
                    total_exchanged: result.updated_report.total_exchanged,
                    total_received: result.updated_report.total_received
                });
            }

            // إعادة تعيين النموذج
            setFormData(prev => ({
                ...prev,
                amount: '',
                description: '',
                paidTo: '',
                notes: '',
                currentTime: new Date().toLocaleString('ar-EG')
            }));

            // توليد رقم مرجع جديد
            const now = new Date();
            const dateStr = now.getFullYear().toString() +
                           (now.getMonth() + 1).toString().padStart(2, '0') +
                           now.getDate().toString().padStart(2, '0');
            const timeStr = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            setReferenceNumber(`EXC${dateStr}${timeStr}`);

            return result; // إرجاع النتيجة للاستخدام في createReceiptAndSave
        } else {
            const error = await response.json();
            throw new Error(error.message || 'حدث خطأ');
        }
    };

    // إرسال المعاملة
    const handleSubmit = async () => {
        if (!formData.amount || !formData.description) {
            alert('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        if (parseFloat(formData.amount) <= 0) {
            alert('يرجى إدخال مبلغ صحيح');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/employee/exchange', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                body: JSON.stringify({
                    invoiceNumber: formData.invoiceNumber,
                    amount: formData.amount,
                    description: formData.description,
                    paidTo: formData.paidTo,
                    notes: formData.notes
                })
            });

            if (response.ok) {
                const result = await response.json();

                // تحديث الرصيد
                setBalance(result.new_balance);

                // تحديث تقرير اليوم بالبيانات الحديثة من الخادم
                if (result.updated_report) {
                    setTodayReport({
                        exchanged_today: result.updated_report.exchanged_today,
                        operations: result.updated_report.operations,
                        total_exchanged: result.updated_report.total_exchanged,
                        total_received: result.updated_report.total_received
                    });
                }

                // إعادة تعيين النموذج
                setFormData(prev => ({
                    ...prev,
                    amount: '',
                    description: '',
                    paidTo: '',
                    notes: '',
                    currentTime: new Date().toLocaleString('ar-EG')
                }));

                // توليد رقم مرجع جديد
                const now = new Date();
                const dateStr = now.getFullYear().toString() +
                               (now.getMonth() + 1).toString().padStart(2, '0') +
                               now.getDate().toString().padStart(2, '0');
                const timeStr = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                setReferenceNumber(`EXC${dateStr}${timeStr}`);

                alert('تم حفظ سند الصرف بنجاح!');
                return result; // إرجاع النتيجة للاستخدام في createReceiptAndSave
            } else {
                const error = await response.json();
                alert(error.message || 'حدث خطأ');
                return { success: false, error: error.message };
            }
        } catch (error) {
            console.error('Error:', error);
            alert('حدث خطأ في الشبكة');
            return { success: false, error: error.message };
        } finally {
            setIsSubmitting(false);
        }
    };

    // حفظ وطباعة فاتورة سند الصرف المخصصة
    const handleSaveAndPrint = async () => {
        if (!formData.amount || !formData.description) {
            alert('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        const saveTransactionResult = await createExchangeReceiptAndSave(
            handleSubmitSilent,
            {
                reference_number: formData.invoiceNumber,
                employee_name: user?.name || 'الموظف الحالي',
                person_name: formData.paidTo || 'غير محدد',
                currency: 'دينار عراقي',
                amount: formData.amount,
                exchange_rate: '1',
                amount_in_iqd: parseFloat(formData.amount),
                beneficiary: formData.paidTo || 'غير محدد',
                description: formData.description,
                notes: formData.notes || ''
            },
            'exchange' // نوع السند: صرف
        );

        if (saveTransactionResult && saveTransactionResult.success) {
            console.log('تم حفظ سند الصرف وإنشاء الفاتورة المخصصة بنجاح');
        }
    };

    const handleSave = async () => {
        await handleSubmit();
    };

    const handleBack = () => {
        router.visit('/employee/dashboard');
    };

    return (
        <EmployeeLayout title="عمليات الصرف">
            <div className="max-w-7xl mx-auto">
                {/* زر الرجوع */}
                <div className="mb-6">
                    <button
                        onClick={handleBack}
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
                            {/* شعار سند الصرف */}
                            <div className="text-center mb-6">
                                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-2xl text-red-600">💸</span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">الرصيد الحالي (نقداً)</h2>
                            </div>

                            {/* عرض الرصيد */}
                            <div className="space-y-4 mb-6">
                                {/* الرصيد الحالي */}
                                <div className="bg-green-50 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-green-800 mb-2">الرصيد الحالي</h3>
                                    <p className="text-3xl font-bold text-green-700">
                                        {Math.floor(balance).toLocaleString()} د.ع
                                    </p>
                                </div>

                                {/* الرصيد الافتتاحي */}
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">الرصيد الافتتاحي:</span>
                                        <span className="font-bold text-gray-800">
                                            {openingBalance > 0 ? Math.floor(openingBalance).toLocaleString() : '0'} د.ع
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* تقرير اليوم */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">تقرير شامل - جميع العمليات</h3>

                                <div className="bg-green-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-green-700">إجمالي المستلم:</span>
                                        <span className="font-bold text-green-800">{todayReport.total_received > 0 ? Math.floor(todayReport.total_received).toLocaleString() : '0'} د.ع</span>
                                    </div>
                                </div>

                                <div className="bg-red-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-red-700">مصروف اليوم:</span>
                                        <span className="font-bold text-red-800">{todayReport.exchanged_today > 0 ? Math.floor(todayReport.exchanged_today).toLocaleString() : '0'} د.ع</span>
                                    </div>
                                </div>

                                <div className="bg-blue-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-blue-700">إجمالي المصروف:</span>
                                        <span className="font-bold text-blue-800">{todayReport.total_exchanged > 0 ? Math.floor(todayReport.total_exchanged).toLocaleString() : '0'} د.ع</span>
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
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 mt-6"
                            >
                                تقرير مفصل
                            </button>
                        </div>
                    </div>

                    {/* الجانب الأيمن - نموذج سند الصرف */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            {/* العنوان */}
                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-bold text-gray-900">سند صرف</h1>
                            </div>

                            {/* الوقت ورقم الفاتورة */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        الوقت:
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-right bg-gray-50"
                                        value={currentDateTime}
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        رقم الفاتورة:
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-right bg-gray-50"
                                        value={formData.invoiceNumber}
                                        readOnly
                                    />
                                </div>
                            </div>

                            {/* اسم مدخل البيانات */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                    اسم مدخل البيانات:
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-right bg-gray-50"
                                    value={formData.employeeName}
                                    readOnly
                                />
                            </div>

                            {/* المبلغ */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                    المبلغ: *
                                </label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-right"
                                    placeholder="أدخل المبلغ بالدينار العراقي"
                                    value={formData.amount}
                                    onChange={(e) => handleInputChange('amount', e.target.value)}
                                />
                            </div>

                            {/* وصف السبب الدفع */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                    وصف السبب الدفع: *
                                </label>
                                <textarea
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-right"
                                    rows="4"
                                    placeholder="اكتب سبب الدفع والتفاصيل..."
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                />
                            </div>

                            {/* صُرف للسيد */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                    صُرف للسيد:
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-right"
                                    placeholder="اسم الشخص المستلم"
                                    value={formData.paidTo}
                                    onChange={(e) => handleInputChange('paidTo', e.target.value)}
                                />
                            </div>

                            {/* ملاحظات إضافية */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                    ملاحظات إضافية:
                                </label>
                                <textarea
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-right"
                                    rows="2"
                                    placeholder="ملاحظات أخرى..."
                                    value={formData.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                />
                            </div>

                            {/* أزرار الحفظ */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={handleSaveAndPrint}
                                    disabled={isSubmitting || !formData.amount || !formData.description}
                                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
                                >
                                    <span className="ml-2">🖨️</span>
                                    {isSubmitting ? 'جاري المعالجة...' : 'حفظ وطباعة'}
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSubmitting || !formData.amount || !formData.description}
                                    className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
                                >
                                    <span className="ml-2">💾</span>
                                    {isSubmitting ? 'جاري المعالجة...' : 'حفظ'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* نافذة الفاتورة الحرارية العامة */}
            {showReceipt && receiptData && (
                <ThermalReceipt
                    receiptData={receiptData}
                    onClose={closeReceipt}
                    onPrint={printReceipt}
                />
            )}

            {/* نافذة فاتورة سند الصرف المخصصة */}
            {showExchangeReceipt && exchangeReceiptData && (
                <ReceiveExchangeThermalReceipt
                    receiptData={exchangeReceiptData}
                    receiptType="exchange"
                    onClose={closeExchangeReceipt}
                    onPrint={printExchangeReceipt}
                />
            )}

            {/* نافذة التقرير المفصل */}
            {showDetailedReport && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900">التقرير المفصل - سندات الصرف</h2>
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
                                    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-red-50 p-4 rounded-lg">
                                            <h3 className="font-semibold text-red-800">إجمالي المصروف</h3>
                                            <p className="text-2xl font-bold text-red-700">
                                                {detailedReportData.summary?.total_amount?.toLocaleString() || '0'} د.ع
                                            </p>
                                        </div>
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <h3 className="font-semibold text-blue-800">عدد العمليات</h3>
                                            <p className="text-2xl font-bold text-blue-700">
                                                {detailedReportData.summary?.total_transactions || 0}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-full table-auto">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-right">رقم الفاتورة</th>
                                                    <th className="px-4 py-2 text-right">المبلغ</th>
                                                    <th className="px-4 py-2 text-right">الوصف</th>
                                                    <th className="px-4 py-2 text-right">التاريخ</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {detailedReportData.transactions?.map((transaction, index) => (
                                                    <tr key={index} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2">{transaction.invoice_number}</td>
                                                        <td className="px-4 py-2 font-semibold">{Number(transaction.amount).toLocaleString()} د.ع</td>
                                                        <td className="px-4 py-2">{transaction.description}</td>
                                                        <td className="px-4 py-2">{transaction.formatted_date}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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
