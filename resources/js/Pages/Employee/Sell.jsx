import React, { useState, useEffect } from 'react';
import EmployeeLayout from '../../Layouts/EmployeeLayout';
import { router } from '@inertiajs/react';
import { useThermalReceipt } from '../../Hooks/useThermalReceipt';
import { useCentralCashBalance } from '../../Hooks/useCentralCashBalance';
import { useCentralDollarBalance } from '../../Hooks/useCentralDollarBalance';
import ThermalReceipt from '../../Components/ThermalReceipt';
import NotificationModal from '../../Components/NotificationModal';
import { useNotification } from '../../Hooks/useNotification';

export default function Sell({
    user,
    currentDollarBalance = 0,
    currentBalance = 0,
    currentCashBalance = 0, // الرصيد النقدي المركزي
    currentCentralDollarBalance = 0, // الرصيد المركزي للدولار
    openingDollarBalance = 0,
    openingBalance = 0,
    openingCashBalance = 0, // الرصيد النقدي الافتتاحي
    exchangeRate = 1500,
    transactions = [],
    quickReport = { charges: 0, payments: 0, operations: 0, dollars_sold: 0 }
}) {
    const [dollarBalance, setDollarBalance] = useState(currentDollarBalance);
    const [cashBalance, setCashBalance] = useState(currentBalance);
    const [todayReport, setTodayReport] = useState({
        charges: quickReport.charges,
        payments: quickReport.payments,
        operations: quickReport.operations,
        dollars_sold: quickReport.dollars_sold
    });

    // استخدام hook الرصيد النقدي المركزي
    const {
        centralCashBalance,
        updateBalanceAfterTransaction,
        fetchCurrentCashBalance
    } = useCentralCashBalance(currentCashBalance);

    // استخدام hook الرصيد المركزي للدولار
    const {
        centralDollarBalance,
        updateBalanceAfterTransaction: updateDollarBalance,
        fetchCurrentDollarBalance
    } = useCentralDollarBalance(currentCentralDollarBalance);

    // تشخيص القيم الأولية
    console.log('Initial Values:');
    console.log('currentCentralDollarBalance prop:', currentCentralDollarBalance);
    console.log('centralDollarBalance from hook:', centralDollarBalance);
    console.log('Type of centralDollarBalance:', typeof centralDollarBalance);

    const [formData, setFormData] = useState({
        documentNumber: '',
        currentTime: new Date().toLocaleString('ar-EG'),
        dollarAmount: '',
        exchangeRate: exchangeRate, // سعر الصرف من قاعدة البيانات
        notes: '',
        employeeName: user?.name || 'الموظف الحالي'
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [referenceNumber, setReferenceNumber] = useState('');
    const [currentDateTime, setCurrentDateTime] = useState('');

    // استخدام hook الفواتير الحرارية
    const {
        showReceipt,
        receiptData,
        isCreatingReceipt,
        createSellReceipt,
        printReceipt,
        closeReceipt
    } = useThermalReceipt();

    // استخدام hook الإشعارات
    const {
        notification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        closeNotification
    } = useNotification();

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
            setReferenceNumber(`SELL${dateStr}${timeStr}`);
        };

        generateRefNumber();
    }, []);

    // تحديث documentNumber في formData عند تغيير referenceNumber
    useEffect(() => {
        setFormData(prev => ({ ...prev, documentNumber: referenceNumber }));
    }, [referenceNumber]);

    // حساب العمولة التلقائي - تم إلغاؤه ليبدأ بصفر
    // useEffect(() => {
    //     if (formData.dollarAmount && formData.exchangeRate) {
    //         const dollarAmount = parseFloat(formData.dollarAmount);
    //         const exchangeRate = parseFloat(formData.exchangeRate);
    //         if (!isNaN(dollarAmount) && !isNaN(exchangeRate)) {
    //             const iqd_amount = dollarAmount * exchangeRate;
    //             const commission = Math.round(iqd_amount * 0.01); // 1% عمولة
    //             setFormData(prev => ({ ...prev, commission: commission.toString() }));
    //         }
    //     }
    // }, [formData.dollarAmount, formData.exchangeRate]);

    // دوال تنسيق الأرقام بالفواصل
    const formatNumberWithCommas = (value) => {
        // إزالة كل شيء ما عدا الأرقام والنقطة العشرية
        const cleanValue = value.toString().replace(/[^0-9.]/g, '');

        // التحقق من عدم وجود أكثر من نقطة عشرية واحدة
        const parts = cleanValue.split('.');
        if (parts.length > 2) {
            return parts[0] + '.' + parts.slice(1).join('');
        }

        // إزالة الأصفار الزائدة من الجزء العشري
        if (parts[1]) {
            parts[1] = parts[1].replace(/0+$/, ''); // إزالة الأصفار من النهاية
            if (parts[1] === '') {
                parts.pop(); // إزالة النقطة إذا لم يعد هناك جزء عشري
            }
        }

        // إضافة الفواصل للجزء الصحيح
        if (parts[0]) {
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }

        return parts.join('.');
    };

    const removeCommas = (value) => {
        return value.toString().replace(/,/g, '');
    };

    const handleInputChange = (field, value) => {
        // إزالة الفواصل قبل الحفظ
        const cleanValue = removeCommas(value);
        setFormData(prev => ({ ...prev, [field]: cleanValue }));
    };

    // معالج خاص للمدخلات الرقمية مع الفواصل
    const handleNumberInputChange = (field, value) => {
        const cleanValue = removeCommas(value);
        setFormData(prev => ({ ...prev, [field]: cleanValue }));
    };

    // حساب المبلغ بالدينار العراقي
    const getIQDAmount = () => {
        const dollarAmount = parseFloat(removeCommas(formData.dollarAmount)) || 0;
        const exchangeRate = parseFloat(removeCommas(formData.exchangeRate)) || 0;
        return dollarAmount * exchangeRate;
    };

    // حساب المبلغ الكلي بالدينار العراقي (نفس المبلغ بدون عمولة)
    const getTotalIQD = () => {
        return getIQDAmount();
    };

    // التحقق من كفاية الرصيد للدولار
    const checkSufficientDollarBalance = () => {
        const dollarAmount = parseFloat(removeCommas(formData.dollarAmount)) || 0;
        console.log('checkSufficientDollarBalance - Dollar Amount:', dollarAmount);
        console.log('checkSufficientDollarBalance - Central Dollar Balance:', centralDollarBalance);
        console.log('checkSufficientDollarBalance - Type of centralDollarBalance:', typeof centralDollarBalance);
        console.log('checkSufficientDollarBalance - Comparison result:', dollarAmount <= centralDollarBalance);
        console.log('checkSufficientDollarBalance - currentCentralDollarBalance prop:', currentCentralDollarBalance);
        return dollarAmount <= centralDollarBalance;
    };

    // الحصول على رسالة عدم كفاية الرصيد
    const getInsufficientBalanceMessage = () => {
        const dollarAmount = parseFloat(removeCommas(formData.dollarAmount)) || 0;
        if (dollarAmount > centralDollarBalance) {
            return `الرصيد غير كافي. المطلوب: $${dollarAmount.toLocaleString()}، المتاح: $${Math.floor(centralDollarBalance).toLocaleString()}`;
        }
        return null;
    };

    // إرسال معاملة البيع
    const handleSubmit = async () => {
        if (!formData.dollarAmount || parseFloat(removeCommas(formData.dollarAmount)) <= 0) {
            showError('خطأ في المدخلات', 'يرجى إدخال مبلغ صحيح بالدولار');
            return;
        }

        // التحقق من كفاية الرصيد المركزي للدولار
        const dollarAmount = parseFloat(removeCommas(formData.dollarAmount));
        console.log('Dollar Amount:', dollarAmount);
        console.log('Central Dollar Balance:', centralDollarBalance);

        if (dollarAmount > centralDollarBalance) {
            showError(
                'رصيد غير كافي',
                `الرصيد المركزي للدولار غير كافي. المطلوب: $${dollarAmount.toLocaleString()}، المتاح: $${Math.floor(centralDollarBalance).toLocaleString()}`
            );
            return;
        }

        setIsSubmitting(true);

        try {
            console.log('Sending request to server with data:', {
                dollarAmount: removeCommas(formData.dollarAmount),
                exchangeRate: removeCommas(formData.exchangeRate),
                documentNumber: formData.documentNumber,
                notes: formData.notes
            });

            const response = await fetch('/employee/sell', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                body: JSON.stringify({
                    dollarAmount: removeCommas(formData.dollarAmount),
                    exchangeRate: removeCommas(formData.exchangeRate),
                    documentNumber: formData.documentNumber,
                    notes: formData.notes
                })
            });

            console.log('Server response status:', response.status);
            console.log('Server response ok:', response.ok);

            if (response.ok) {
                const result = await response.json();

                // تحديث الأرصدة
                setDollarBalance(result.new_dollar_balance);
                setCashBalance(result.new_cash_balance);

                // تحديث الرصيد النقدي المركزي
                if (result.new_cash_balance !== undefined) {
                    updateBalanceAfterTransaction(result.new_cash_balance);
                }

                // تحديث الرصيد المركزي للدولار
                if (result.new_central_dollar_balance !== undefined) {
                    updateDollarBalance(result.new_central_dollar_balance);
                }

                // تحديث تقرير اليوم بالبيانات الحديثة من الخادم
                if (result.updated_report) {
                    setTodayReport({
                        charges: result.updated_report.charges,
                        payments: result.updated_report.payments,
                        operations: result.updated_report.operations,
                        dollars_sold: result.updated_report.dollars_sold
                    });
                }

                // إعادة تعيين النموذج
                setFormData(prev => ({
                    ...prev,
                    dollarAmount: '',
                    notes: '',
                    currentTime: new Date().toLocaleString('ar-EG') // تحديث التوقيت
                }));

                // توليد رقم مرجع جديد
                const now = new Date();
                const dateStr = now.getFullYear().toString() +
                               (now.getMonth() + 1).toString().padStart(2, '0') +
                               now.getDate().toString().padStart(2, '0');
                const timeStr = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                setReferenceNumber(`SELL${dateStr}${timeStr}`);

                // تحديث التوقيت الحالي
                setCurrentDateTime(now.toLocaleString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }));

                showSuccess('تم إنجاز العملية بنجاح!', 'تم إجراء عملية البيع وتحديث الأرصدة بنجاح');
            } else {
                console.log('Server response not ok, status:', response.status);
                // محاولة قراءة الخطأ كـ JSON، وإذا فشلت فاستخدم النص
                let errorMessage = 'حدث خطأ غير متوقع';
                try {
                    const error = await response.json();
                    console.log('Server error response:', error);
                    errorMessage = error.message || 'حدث خطأ غير متوقع';
                } catch (jsonError) {
                    // إذا فشل في قراءة JSON، اقرأ كنص
                    const errorText = await response.text();
                    console.error('خطأ في الاستجابة:', errorText);
                    errorMessage = 'خطأ في الخادم';
                }
                showError('فشل في العملية', errorMessage);
            }
        } catch (error) {
            console.error('Error:', error);
            showError('خطأ في الشبكة', 'تعذر الاتصال بالخادم، يرجى المحاولة مرة أخرى');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSave = () => {
        handleSubmit();
    };

    const handleSaveAndPrint = async () => {
        if (!formData.dollarAmount || parseFloat(removeCommas(formData.dollarAmount)) <= 0) {
            showError('خطأ في المدخلات', 'يرجى إدخال مبلغ صحيح بالدولار قبل المتابعة');
            return;
        }

        // التحقق من كفاية الرصيد المركزي للدولار
        const dollarAmount = parseFloat(removeCommas(formData.dollarAmount));
        console.log('SaveAndPrint - Dollar Amount:', dollarAmount);
        console.log('SaveAndPrint - Central Dollar Balance:', centralDollarBalance);

        if (dollarAmount > centralDollarBalance) {
            showError(
                'رصيد غير كافي',
                `الرصيد المركزي للدولار غير كافي. المطلوب: $${dollarAmount.toLocaleString()}، المتاح: $${Math.floor(centralDollarBalance).toLocaleString()}`
            );
            return;
        }

        setIsSubmitting(true);

        try {
            console.log('SaveAndPrint - Sending request to /employee/sell with data:', {
                dollarAmount: removeCommas(formData.dollarAmount),
                exchangeRate: removeCommas(formData.exchangeRate),
                documentNumber: formData.documentNumber,
                notes: formData.notes
            });

            // حفظ المعاملة أولاً
            const response = await fetch('/employee/sell', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                body: JSON.stringify({
                    dollarAmount: removeCommas(formData.dollarAmount),
                    exchangeRate: removeCommas(formData.exchangeRate),
                    documentNumber: formData.documentNumber,
                    notes: formData.notes
                })
            });

            console.log('SaveAndPrint - Server response status:', response.status);
            console.log('SaveAndPrint - Server response ok:', response.ok);

            if (response.ok) {
                const result = await response.json();
                console.log('SaveAndPrint - Server response data:', result);

                // تحديث الأرصدة
                setDollarBalance(result.new_dollar_balance);
                setCashBalance(result.new_cash_balance);

                // تحديث الرصيد النقدي المركزي
                if (result.new_cash_balance !== undefined) {
                    updateBalanceAfterTransaction(result.new_cash_balance);
                }

                // تحديث الرصيد المركزي للدولار
                if (result.new_central_dollar_balance !== undefined) {
                    updateDollarBalance(result.new_central_dollar_balance);
                }

                // تحديث تقرير اليوم
                if (result.updated_report) {
                    setTodayReport({
                        charges: result.updated_report.charges,
                        payments: result.updated_report.payments,
                        operations: result.updated_report.operations,
                        dollars_sold: result.updated_report.dollars_sold
                    });
                }

                // إنشاء فاتورة
                const receiptResult = await createSellReceipt({
                    reference_number: formData.documentNumber,
                    dollar_amount: parseFloat(formData.dollarAmount),
                    exchange_rate: parseFloat(formData.exchangeRate),
                    iqd_amount: getIQDAmount(),
                    total_amount: getTotalIQD(),
                    notes: formData.notes,
                    customer_phone: null
                });

                if (receiptResult.success) {
                    // إعادة تعيين النموذج
                    setFormData(prev => ({
                        ...prev,
                        dollarAmount: '',
                        notes: '',
                        currentTime: new Date().toLocaleString('ar-EG')
                    }));

                    // توليد رقم مرجع جديد
                    const now = new Date();
                    const dateStr = now.getFullYear().toString() +
                                   (now.getMonth() + 1).toString().padStart(2, '0') +
                                   now.getDate().toString().padStart(2, '0');
                    const timeStr = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                    setReferenceNumber(`SELL${dateStr}${timeStr}`);

                    // تحديث التوقيت الحالي
                    setCurrentDateTime(now.toLocaleString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    }));

                    showSuccess('تم إنجاز العملية بنجاح!', 'تم إجراء عملية البيع وإعداد الفاتورة للطباعة');
                } else {
                    showWarning('تحذير', 'تم حفظ العملية لكن فشل في إنشاء الفاتورة');
                }
            } else {
                console.log('SaveAndPrint - Server response not ok, status:', response.status);
                const error = await response.json();
                console.log('SaveAndPrint - Server error response:', error);
                showError('فشل في العملية', error.message || 'حدث خطأ غير متوقع');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('خطأ في الشبكة', 'تعذر الاتصال بالخادم، يرجى المحاولة مرة أخرى');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        router.visit('/employee/dashboard');
    };

    return (
        <EmployeeLayout title="بيع الدولار">
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
                    {/* الجانب الأيسر - الرصيد الحالي */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            {/* شعار البيع */}
                            <div className="text-center mb-6">
                                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <img
                                        src="/images/services/sell.png"
                                        alt="بيع الدولار"
                                        className="w-12 h-12 object-contain"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'block';
                                        }}
                                    />
                                    <span className="text-2xl text-orange-600 hidden">🏪</span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">بيع الدولار</h2>
                            </div>

                            {/* عرض الرصيد */}
                            <div className="space-y-4 mb-6">
                                {/* الرصيد المركزي للدولار */}
                                <div className="bg-purple-50 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-purple-800 mb-2">الرصيد المركزي للدولار</h3>
                                    <p className="text-3xl font-bold text-purple-700">
                                        ${Math.floor(centralDollarBalance).toLocaleString()}
                                    </p>
                                </div>

                                {/* الرصيد النقدي المركزي */}
                                <div className="bg-green-50 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-green-800 mb-2">الرصيد النقدي المركزي</h3>
                                    <p className="text-3xl font-bold text-green-700">
                                        {Math.floor(centralCashBalance).toLocaleString()} د.ع
                                    </p>
                                </div>
                            </div>

                            {/* عرض الرصيد الافتتاحي */}
                            <div className="space-y-3 mb-6">
                                <h4 className="text-lg font-semibold text-gray-800">الرصيد الافتتاحي</h4>

                                <div className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-700">بالدولار:</span>
                                        <span className="font-bold text-gray-800">
                                            ${openingDollarBalance > 0 ? Math.floor(openingDollarBalance).toLocaleString() : '0'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">بالدينار النقدي:</span>
                                        <span className="font-bold text-gray-800">
                                            {openingCashBalance > 0 ? Math.floor(openingCashBalance).toLocaleString() : '0'} د.ع
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* تقرير اليوم */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">تقرير شامل - جميع العمليات</h3>

                                <div className="bg-green-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-green-700">مبيعات:</span>
                                        <span className="font-bold text-green-800">{todayReport.payments > 0 ? Math.floor(todayReport.payments).toLocaleString() : '0'} د.ع</span>
                                    </div>
                                </div>

                                <div className="bg-blue-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-blue-700">دولار مباع:</span>
                                        <span className="font-bold text-blue-800">{todayReport.dollars_sold > 0 ? Math.floor(todayReport.dollars_sold).toLocaleString() : '0'} $</span>
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
                            <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 mt-6">
                                تقرير مفصل
                            </button>
                        </div>
                    </div>

                    {/* الجانب الأيمن - نموذج المعاملة */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            {/* معلومات المعاملة */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        رقم المرجع:
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-right"
                                        value={formData.documentNumber}
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        رقم المرجع:
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-right"
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-right"
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-right bg-gray-50"
                                        value={user?.name || 'غير محدد'}
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        المبلغ بالدولار:
                                    </label>
                                    <input
                                        type="text"
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-right ${
                                            formData.dollarAmount && !checkSufficientDollarBalance()
                                                ? 'border-red-500 bg-red-50'
                                                : 'border-gray-300'
                                        }`}
                                        placeholder="المبلغ بالدولار"
                                        value={formData.dollarAmount ? formatNumberWithCommas(formData.dollarAmount) : ''}
                                        onChange={(e) => handleNumberInputChange('dollarAmount', e.target.value)}
                                    />
                                    {formData.dollarAmount && !checkSufficientDollarBalance() && (
                                        <p className="text-xs text-red-600 mt-1 text-right">
                                            {getInsufficientBalanceMessage()}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        سعر الصرف:
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-right"
                                        value={formData.exchangeRate ? formatNumberWithCommas(formData.exchangeRate) : ''}
                                        onChange={(e) => handleNumberInputChange('exchangeRate', e.target.value)}
                                        placeholder="سعر الصرف"
                                    />
                                    <p className="text-xs text-gray-500 mt-1 text-right">
                                        السعر الافتراضي: {exchangeRate.toLocaleString()} د.ع
                                    </p>
                                </div>
                            </div>

                            {/* عرض المبالغ الكلية */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="bg-blue-50 rounded-xl p-4">
                                    <div className="text-center">
                                        <span className="text-sm font-semibold text-blue-700">المبلغ بالدولار</span>
                                        <p className="text-xl font-bold text-blue-800">${parseFloat(formData.dollarAmount || 0).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="bg-orange-50 rounded-xl p-4">
                                    <div className="text-center">
                                        <span className="text-sm font-semibold text-orange-700">المبلغ بالدينار</span>
                                        <p className="text-xl font-bold text-orange-800">{getIQDAmount().toLocaleString()} د.ع</p>
                                    </div>
                                </div>
                            </div>

                            {/* ملاحظات */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                    ملاحظات:
                                </label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-right"
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
                                    disabled={isSubmitting || !formData.dollarAmount || !checkSufficientDollarBalance()}
                                    className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
                                >
                                    <span className="ml-2">📄</span>
                                    {isSubmitting ? 'جاري المعالجة...' : 'حفظ وطباعة'}
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSubmitting || !formData.dollarAmount || !checkSufficientDollarBalance()}
                                    className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
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

            {/* مودال الإشعارات */}
            <NotificationModal
                isOpen={notification.isOpen}
                type={notification.type}
                title={notification.title}
                message={notification.message}
                autoClose={notification.autoClose}
                autoCloseDelay={notification.autoCloseDelay}
                onClose={closeNotification}
            />
        </EmployeeLayout>
    );
}
