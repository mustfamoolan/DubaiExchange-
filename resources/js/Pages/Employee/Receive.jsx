import React, { useState, useEffect } from 'react';
import EmployeeLayout from '../../Layouts/EmployeeLayout';
import { router } from '@inertiajs/react';
import { useThermalReceipt } from '../../Hooks/useThermalReceipt';
import ThermalReceipt from '../../Components/ThermalReceipt';

export default function Receive({
    user,
    currentBalance = 0,
    openingBalance = 0,
    transactions = [],
    quickReport = { received_today: 0, operations: 0, total_received: 0 }
}) {
    const [balance, setBalance] = useState(currentBalance);
    const [showDetailedReport, setShowDetailedReport] = useState(false);
    const [todayReport, setTodayReport] = useState({
        received_today: quickReport.received_today,
        operations: quickReport.operations,
        total_received: quickReport.total_received
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
        documentNumber: '',
        currentTime: new Date().toLocaleString('ar-EG'),
        receivedFrom: '',
        amount: '',
        currency: '',
        exchange_rate: '',
        description: '',
        receiverName: user?.name || 'الموظف الحالي',
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
            setReferenceNumber(`REC${dateStr}${timeStr}`);
        };

        generateRefNumber();
    }, []);

    // تحديث documentNumber في formData عند تغيير referenceNumber
    useEffect(() => {
        setFormData(prev => ({ ...prev, documentNumber: referenceNumber }));
    }, [referenceNumber]);

    const currencies = [
        'دينار عراقي',
        'دولار أمريكي',
        'يورو',
        'جنيه استرليني',
        'ليرة تركية',
        'دولار أسترالي',
        'دولار كندي',
        'يوان صيني',
        'ين ياباني',
        'كرونا سويدية',
        'كرونا نرويجية',
        'كرونا دنماركية',
        'مانات أذربيجان',
        'درهم إماراتي',
        'دينار أردني',
        'ريال سعودي',
        'ريال قطري',
        'ليرة لبنانية',
        'جنيه مصري',
        'دينار كويتي',
        'دينار بحريني',
        'ليرة سورية',
        'ريال إيراني'
    ];

    // تحديث قيم النموذج
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // إضافة state للتقرير المفصل
    const [detailedReportData, setDetailedReportData] = useState(null);

    // جلب التقرير المفصل
    const fetchDetailedReport = async () => {
        try {
            const response = await fetch('/employee/receive/detailed-report', {
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
        if (!formData.receivedFrom || !formData.amount || !formData.currency || !formData.exchange_rate) {
            alert('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        if (parseFloat(formData.amount) <= 0) {
            alert('يرجى إدخال مبلغ صحيح');
            return;
        }

        if (parseFloat(formData.exchange_rate) <= 0) {
            alert('يرجى إدخال سعر صرف صحيح');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/employee/receive', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                body: JSON.stringify({
                    documentNumber: formData.documentNumber,
                    receivedFrom: formData.receivedFrom,
                    amount: formData.amount,
                    currency: formData.currency,
                    exchange_rate: formData.exchange_rate,
                    description: formData.description,
                    beneficiary: 'الصندوق النقدي', // قيمة ثابتة
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
                        received_today: result.updated_report.received_today,
                        operations: result.updated_report.operations,
                        total_received: result.updated_report.total_received
                    });
                }

                // إعادة تعيين النموذج
                setFormData(prev => ({
                    ...prev,
                    receivedFrom: '',
                    amount: '',
                    currency: '',
                    exchange_rate: '',
                    description: '',
                    notes: '',
                    currentTime: new Date().toLocaleString('ar-EG')
                }));

                // توليد رقم مرجع جديد
                const now = new Date();
                const dateStr = now.getFullYear().toString() +
                               (now.getMonth() + 1).toString().padStart(2, '0') +
                               now.getDate().toString().padStart(2, '0');
                const timeStr = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                setReferenceNumber(`REC${dateStr}${timeStr}`);

                // تحديث التوقيت الحالي
                setCurrentDateTime(now.toLocaleString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }));

                alert('تم حفظ سند القبض بنجاح!');
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

    // حفظ وطباعة الفاتورة
    const handleSaveAndPrint = async () => {
        if (!formData.receivedFrom || !formData.amount || !formData.currency || !formData.exchange_rate) {
            alert('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        const amountInIqd = Math.floor(parseFloat(formData.amount || 0) * parseFloat(formData.exchange_rate || 0));

        const saveTransactionResult = await createReceiptAndSave(
            async () => await handleSubmit(),
            {
                transaction_type: 'payment', // سند القبض = دفع/استلام
                reference_number: formData.documentNumber,
                amount: formData.amount,
                commission: 0, // لا توجد عمولة في سند القبض
                notes: `${formData.description}\nمن: ${formData.receivedFrom}\nالعملة: ${formData.currency}\nسعر الصرف: ${formData.exchange_rate}\nالمبلغ بالدينار: ${amountInIqd.toLocaleString()} د.ع\nالمستفيد: الصندوق النقدي`,
                customer_phone: null
            },
            'receive' // نوع الخدمة
        );

        if (saveTransactionResult && saveTransactionResult.success) {
            console.log('تم حفظ سند القبض وإنشاء الفاتورة بنجاح');
        }
    };

    // إعادة تعيين النموذج
    const resetForm = () => {
        setFormData(prev => ({
            ...prev,
            receivedFrom: '',
            amount: '',
            currency: '',
            exchange_rate: '',
            description: '',
            notes: ''
        }));
    };

    const handleBack = () => {
        router.visit('/employee/dashboard');
    };

    return (
        <EmployeeLayout title="عمليات القبض">
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
                            {/* شعار سند القبض */}
                            <div className="text-center mb-6">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-2xl text-green-600">📝</span>
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
                                        <span className="text-sm text-green-700">مستلم اليوم:</span>
                                        <span className="font-bold text-green-800">{todayReport.received_today > 0 ? Math.floor(todayReport.received_today).toLocaleString() : '0'} د.ع</span>
                                    </div>
                                </div>

                                <div className="bg-blue-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-blue-700">إجمالي المستلم:</span>
                                        <span className="font-bold text-blue-800">{todayReport.total_received > 0 ? Math.floor(todayReport.total_received).toLocaleString() : '0'} د.ع</span>
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

                    {/* الجانب الأيمن - نموذج سند القبض */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            {/* العنوان */}
                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-bold text-gray-900">سند قبض</h1>
                            </div>

                            {/* معلومات المستند */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        رقم المستند:
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-right bg-gray-50"
                                        value={formData.documentNumber}
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        التاريخ والوقت:
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-right bg-gray-50"
                                        value={currentDateTime}
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        اسم المستلم:
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-right bg-gray-50"
                                        value={formData.receiverName}
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        استلمت من السيد: *
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-right"
                                        placeholder="اسم الشخص"
                                        value={formData.receivedFrom}
                                        onChange={(e) => handleInputChange('receivedFrom', e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        المبلغ: *
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-right"
                                        placeholder="أدخل المبلغ"
                                        value={formData.amount}
                                        onChange={(e) => handleInputChange('amount', e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        العملة: *
                                    </label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-right"
                                        value={formData.currency}
                                        onChange={(e) => handleInputChange('currency', e.target.value)}
                                    >
                                        <option value="">اختر العملة</option>
                                        {currencies.map((currency, index) => (
                                            <option key={index} value={currency}>
                                                {currency}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        سعر الصرف: *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-right"
                                        value={formData.exchange_rate}
                                        onChange={(e) => handleInputChange('exchange_rate', e.target.value)}
                                        placeholder="أدخل سعر الصرف"
                                    />
                                </div>

                                {/* عرض المبلغ بالدينار العراقي */}
                                {formData.amount && formData.exchange_rate && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                            المبلغ بالدينار العراقي:
                                        </label>
                                        <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-right">
                                            {Math.floor(parseFloat(formData.amount || 0) * parseFloat(formData.exchange_rate || 0)).toLocaleString()} د.ع
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* وذلك عن (ملاحظات) */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                    وذلك عن:
                                </label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-right"
                                    rows="3"
                                    placeholder="تفاصيل السبب أو الملاحظات..."
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                />
                            </div>

                            {/* ملاحظات إضافية */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                    ملاحظات إضافية:
                                </label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-right"
                                    rows="2"
                                    placeholder="ملاحظات أخرى..."
                                    value={formData.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                />
                            </div>

                            {/* أزرار العمل */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={handleSaveAndPrint}
                                    disabled={isSubmitting || !formData.receivedFrom || !formData.amount || !formData.currency || !formData.exchange_rate}
                                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
                                >
                                    <span className="ml-2">🖨️</span>
                                    {isSubmitting ? 'جاري المعالجة...' : 'حفظ وطباعة'}
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !formData.receivedFrom || !formData.amount || !formData.currency || !formData.exchange_rate}
                                    className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
                                >
                                    <span className="ml-2">💾</span>
                                    {isSubmitting ? 'جاري المعالجة...' : 'حفظ'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* نافذة الفاتورة الحرارية */}
            {showReceipt && receiptData && (
                <ThermalReceipt
                    receiptData={receiptData}
                    onClose={closeReceipt}
                    onPrint={printReceipt}
                />
            )}

            {/* نافذة التقرير المفصل */}
            {showDetailedReport && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900">التقرير المفصل - سندات القبض</h2>
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
                                    <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-green-50 p-4 rounded-lg">
                                            <h3 className="font-semibold text-green-800">إجمالي المبلغ</h3>
                                            <p className="text-2xl font-bold text-green-700">
                                                {detailedReportData.summary?.total_amount?.toLocaleString() || '0'} د.ع
                                            </p>
                                        </div>
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <h3 className="font-semibold text-blue-800">عدد العمليات</h3>
                                            <p className="text-2xl font-bold text-blue-700">
                                                {detailedReportData.summary?.total_transactions || 0}
                                            </p>
                                        </div>
                                        <div className="bg-purple-50 p-4 rounded-lg">
                                            <h3 className="font-semibold text-purple-800">عدد العملات</h3>
                                            <p className="text-2xl font-bold text-purple-700">
                                                {detailedReportData.summary?.currencies?.length || 0}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-full table-auto">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-right">رقم المستند</th>
                                                    <th className="px-4 py-2 text-right">المستلم من</th>
                                                    <th className="px-4 py-2 text-right">المبلغ</th>
                                                    <th className="px-4 py-2 text-right">العملة</th>
                                                    <th className="px-4 py-2 text-right">المستفيد</th>
                                                    <th className="px-4 py-2 text-right">التاريخ</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {detailedReportData.transactions?.map((transaction, index) => (
                                                    <tr key={index} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2">{transaction.document_number}</td>
                                                        <td className="px-4 py-2">{transaction.received_from}</td>
                                                        <td className="px-4 py-2 font-semibold">{Number(transaction.amount).toLocaleString()}</td>
                                                        <td className="px-4 py-2">{transaction.currency}</td>
                                                        <td className="px-4 py-2">{transaction.beneficiary}</td>
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
