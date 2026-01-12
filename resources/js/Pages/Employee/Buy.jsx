import React, { useState, useEffect } from 'react';
import EmployeeLayout from '../../Layouts/EmployeeLayout';
import { router } from '@inertiajs/react';
import { useThermalReceipt } from '../../Hooks/useThermalReceipt';
import { useCentralCashBalance } from '../../Hooks/useCentralCashBalance';
import { useCentralDollarBalance } from '../../Hooks/useCentralDollarBalance';
import ThermalReceipt from '../../Components/ThermalReceipt';
import NotificationModal from '../../Components/NotificationModal';
import { useNotification } from '../../Hooks/useNotification';

export default function Buy({
    user,
    currentDollarBalance = 0,
    currentIQDBalance = 0,
    currentCashBalance = 0, // الرصيد النقدي الحالي
    currentCentralDollarBalance = 0, // الرصيد المركزي للدولار الحالي
    openingDollarBalance = 0,
    openingIQDBalance = 0,
    openingCashBalance = 0, // الرصيد النقدي الافتتاحي
    exchangeRate = 1500,
    transactions = [],
    quickReport = { charges: 0, payments: 0, operations: 0, dollars_bought: 0 }
}) {
    const [dollarBalance, setDollarBalance] = useState(currentDollarBalance);
    const [iqd_balance, setIqd_balance] = useState(currentIQDBalance);
    const [cashBalance, setCashBalance] = useState(currentCashBalance); // الرصيد النقدي
    const [todayReport, setTodayReport] = useState({
        charges: quickReport.charges,
        payments: quickReport.payments,
        operations: quickReport.operations,
        dollars_bought: quickReport.dollars_bought
    });

    // استخدام hook الرصيد النقدي المركزي
    const {
        centralCashBalance,
        updateBalanceAfterTransaction,
        fetchCurrentCashBalance
    } = useCentralCashBalance(currentCashBalance);

    // استخدام hook رصيد الدولار المركزي
    const {
        centralDollarBalance,
        updateBalanceAfterTransaction: updateDollarBalance,
        fetchCurrentDollarBalance
    } = useCentralDollarBalance(currentCentralDollarBalance);

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

    // حالات التقرير المفصل
    const [showDetailedReport, setShowDetailedReport] = useState(false);
    const [detailedReportData, setDetailedReportData] = useState(null);
    const [isLoadingReport, setIsLoadingReport] = useState(false);
    const [reportCurrentPage, setReportCurrentPage] = useState(1);
    const [reportPerPage] = useState(50);
    const [reportTotalPages, setReportTotalPages] = useState(1);

    // استخدام hook الفواتير الحرارية
    const {
        showReceipt,
        receiptData,
        isCreatingReceipt,
        createBuyReceipt,
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
            setReferenceNumber(`BUY${dateStr}${timeStr}`);
        };

        generateRefNumber();
    }, []);

    // تحديث documentNumber في formData عند تغيير referenceNumber
    useEffect(() => {
        setFormData(prev => ({ ...prev, documentNumber: referenceNumber }));
    }, [referenceNumber]);

    // مراقبة التغييرات في الرصيد والمبالغ للتحقق الفوري - محسن ومحدود
    useEffect(() => {
        // التحقق من صحة البيانات فقط عند الحاجة
        if (formData.dollarAmount || formData.exchangeRate) {
            const dollarAmount = parseFloat(formData.dollarAmount || 0);
            const exchangeRate = parseFloat(formData.exchangeRate || 0);

            // لا نقوم بأي عمليات مكلفة هنا، فقط التحديث الضروري
            if (dollarAmount > 0 && exchangeRate > 0) {
                // يمكن إضافة منطق خفيف هنا إذا لزم الأمر
            }
        }
        // تجنب إضافة centralCashBalance في dependency array لمنع re-renders مستمرة
    }, [formData.dollarAmount, formData.exchangeRate]);

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

        // إزالة setTimeout غير الضروري لتحسين الأداء
        // التحديث سيحدث تلقائياً عبر React's state management
    };

    // معالج خاص للمدخلات الرقمية مع الفواصل
    const handleNumberInputChange = (field, value) => {
        const cleanValue = removeCommas(value);
        setFormData(prev => ({ ...prev, [field]: cleanValue }));

        // إزالة setTimeout غير الضروري - React سيتولى التحديث
    };

    // حساب المبلغ بالدينار العراقي
    const getIQDAmount = () => {
        const dollarAmount = parseFloat(formData.dollarAmount) || 0;
        const exchangeRate = parseFloat(formData.exchangeRate) || 0;
        return exchangeRate > 0 ? dollarAmount * exchangeRate : 0;
    };

    // حساب المبلغ الكلي بالدينار العراقي (نفس المبلغ بدون عمولة)
    const getTotalIQD = () => {
        return getIQDAmount();
    };

    // التحقق من كفاية الرصيد النقدي المركزي - بدقة عالية جداً
    const checkSufficientCashBalance = () => {
        // التحقق من وجود مبلغ صحيح مع معالجة أفضل للقيم
        const dollarAmountStr = String(formData.dollarAmount || '').trim();
        const exchangeRateStr = String(formData.exchangeRate || '').trim();

        const dollarAmount = parseFloat(dollarAmountStr);
        const exchangeRate = parseFloat(exchangeRateStr);

        // طباعة القيم للتحقق (يمكن إزالتها لاحقاً)
        console.log('=== التحقق من الرصيد ===');
        console.log('مبلغ الدولار:', dollarAmountStr, '→', dollarAmount);
        console.log('سعر الصرف:', exchangeRateStr, '→', exchangeRate);
        console.log('الرصيد النقدي المركزي:', centralCashBalance);

        // إذا لم يكن هناك مبلغ أو المبلغ صفر أو سالب، نعتبر التحقق ناجح (للسماح بالإدخال)
        if (!dollarAmountStr || isNaN(dollarAmount) || dollarAmount <= 0) {
            console.log('النتيجة: لا يوجد مبلغ صحيح - السماح بالإدخال');
            return true;
        }

        // إذا لم يكن هناك سعر صرف صحيح، نعتبر التحقق ناجح
        if (!exchangeRateStr || isNaN(exchangeRate) || exchangeRate <= 0) {
            console.log('النتيجة: لا يوجد سعر صرف صحيح - السماح بالإدخال');
            return true;
        }

        // حساب التكلفة الإجمالية بدقة تامة
        const totalCost = Math.round(dollarAmount * exchangeRate);
        const availableBalance = Math.round(centralCashBalance);

        console.log('التكلفة المطلوبة:', totalCost);
        console.log('الرصيد المتاح:', availableBalance);
        console.log('النتيجة:', totalCost <= availableBalance ? 'كافي' : 'غير كافي');

        // التحقق الدقيق: إذا كان المطلوب أكبر من المتاح حتى لو بدينار واحد
        return totalCost <= availableBalance;
    };

    // الحصول على رسالة عدم كفاية الرصيد - محسنة ودقيقة
    const getInsufficientBalanceMessage = () => {
        const dollarAmountStr = String(formData.dollarAmount || '').trim();
        const exchangeRateStr = String(formData.exchangeRate || '').trim();

        const dollarAmount = parseFloat(dollarAmountStr);
        const exchangeRate = parseFloat(exchangeRateStr);

        // التحقق من صحة البيانات المدخلة
        if (!dollarAmountStr || isNaN(dollarAmount) || dollarAmount <= 0) {
            return null;
        }

        if (!exchangeRateStr || isNaN(exchangeRate) || exchangeRate <= 0) {
            return null;
        }

        const totalCost = Math.round(dollarAmount * exchangeRate);
        const availableBalance = Math.round(centralCashBalance);

        if (totalCost > availableBalance) {
            const shortage = totalCost - availableBalance;
            return `الرصيد النقدي غير كافي. المطلوب: ${totalCost.toLocaleString()} د.ع، المتاح: ${availableBalance.toLocaleString()} د.ع، النقص: ${shortage.toLocaleString()} د.ع`;
        }
        return null;
    };

    // التحقق الشامل من إمكانية إجراء العملية - دقيق جداً
    const canProceedWithTransaction = () => {
        const dollarAmountStr = String(formData.dollarAmount || '').trim();
        const exchangeRateStr = String(formData.exchangeRate || '').trim();

        const dollarAmount = parseFloat(dollarAmountStr);
        const exchangeRate = parseFloat(exchangeRateStr);

        // التحقق من صحة البيانات المدخلة
        if (!dollarAmountStr || isNaN(dollarAmount) || dollarAmount <= 0) {
            return false;
        }

        if (!exchangeRateStr || isNaN(exchangeRate) || exchangeRate <= 0) {
            return false;
        }

        // التحقق من كفاية الرصيد بدقة
        const totalCost = Math.round(dollarAmount * exchangeRate);
        const availableBalance = Math.round(centralCashBalance);

        return totalCost <= availableBalance;
    };    // إرسال معاملة الشراء
    const handleSubmit = async () => {
        // استخدام التحقق الشامل الجديد
        if (!canProceedWithTransaction()) {
            if (!formData.dollarAmount || parseFloat(formData.dollarAmount) <= 0) {
                showError('خطأ في المدخلات', 'يرجى إدخال مبلغ صحيح بالدولار');
            } else if (!formData.exchangeRate || parseFloat(formData.exchangeRate) <= 0) {
                showError('خطأ في المدخلات', 'يرجى إدخال سعر صرف صحيح');
            } else {
                const dollarAmount = parseFloat(formData.dollarAmount);
                const exchangeRate = parseFloat(formData.exchangeRate);
                const totalCost = Math.round(dollarAmount * exchangeRate);
                const availableBalance = Math.round(centralCashBalance);
                const shortage = totalCost - availableBalance;
                showError(
                    'رصيد غير كافي',
                    `الرصيد النقدي المركزي غير كافي. المطلوب: ${totalCost.toLocaleString()} د.ع، المتاح: ${availableBalance.toLocaleString()} د.ع، النقص: ${shortage.toLocaleString()} د.ع`
                );
            }
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/employee/buy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                body: JSON.stringify({
                    dollarAmount: formData.dollarAmount,
                    exchangeRate: formData.exchangeRate,
                    documentNumber: formData.documentNumber,
                    notes: formData.notes
                })
            });

            if (response.ok) {
                const result = await response.json();

                // تحديث الأرصدة
                setDollarBalance(result.new_dollar_balance);
                setIqd_balance(result.new_iqd_balance);
                setCashBalance(result.new_cash_balance); // تحديث الرصيد النقدي

                // تحديث الرصيد النقدي المركزي
                if (result.new_cash_balance !== undefined) {
                    updateBalanceAfterTransaction(result.new_cash_balance);
                }

                // تحديث رصيد الدولار المركزي
                if (result.new_central_dollar_balance !== undefined) {
                    updateDollarBalance(result.new_central_dollar_balance);
                }

                // تحديث تقرير اليوم بالبيانات الحديثة من الخادم
                if (result.updated_report) {
                    setTodayReport({
                        charges: result.updated_report.charges,
                        payments: result.updated_report.payments,
                        operations: result.updated_report.operations,
                        dollars_bought: result.updated_report.dollars_bought
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
                setReferenceNumber(`BUY${dateStr}${timeStr}`);

                // تحديث التوقيت الحالي
                setCurrentDateTime(now.toLocaleString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }));

                showSuccess('تم إنجاز العملية بنجاح!', 'تم إجراء عملية الشراء وتحديث الأرصدة بنجاح');
            } else {
                const error = await response.json();
                showError('فشل في العملية', error.message || 'حدث خطأ غير متوقع');
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
        // استخدام التحقق الشامل الجديد
        if (!canProceedWithTransaction()) {
            if (!formData.dollarAmount || parseFloat(formData.dollarAmount) <= 0) {
                showError('خطأ في المدخلات', 'يرجى إدخال مبلغ صحيح بالدولار قبل المتابعة');
            } else if (!formData.exchangeRate || parseFloat(formData.exchangeRate) <= 0) {
                showError('خطأ في المدخلات', 'يرجى إدخال سعر صرف صحيح');
            } else {
                const dollarAmount = parseFloat(formData.dollarAmount);
                const exchangeRate = parseFloat(formData.exchangeRate);
                const totalCost = Math.round(dollarAmount * exchangeRate);
                const availableBalance = Math.round(centralCashBalance);
                const shortage = totalCost - availableBalance;
                showError(
                    'رصيد غير كافي',
                    `الرصيد النقدي المركزي غير كافي. المطلوب: ${totalCost.toLocaleString()} د.ع، المتاح: ${availableBalance.toLocaleString()} د.ع، النقص: ${shortage.toLocaleString()} د.ع`
                );
            }
            return;
        }

        setIsSubmitting(true);

        try {
            // حفظ المعاملة أولاً
            const response = await fetch('/employee/buy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                body: JSON.stringify({
                    dollarAmount: formData.dollarAmount,
                    exchangeRate: formData.exchangeRate,
                    documentNumber: formData.documentNumber,
                    notes: formData.notes
                })
            });

            if (response.ok) {
                const result = await response.json();

                // تحديث الأرصدة
                setDollarBalance(result.new_dollar_balance);
                setIqd_balance(result.new_iqd_balance);
                setCashBalance(result.new_cash_balance); // تحديث الرصيد النقدي

                // تحديث الرصيد النقدي المركزي
                if (result.new_cash_balance !== undefined) {
                    updateBalanceAfterTransaction(result.new_cash_balance);
                }

                // تحديث رصيد الدولار المركزي
                if (result.new_central_dollar_balance !== undefined) {
                    updateDollarBalance(result.new_central_dollar_balance);
                }

                // تحديث تقرير اليوم
                if (result.updated_report) {
                    setTodayReport({
                        charges: result.updated_report.charges,
                        payments: result.updated_report.payments,
                        operations: result.updated_report.operations,
                        dollars_bought: result.updated_report.dollars_bought
                    });
                }

                // إنشاء فاتورة
                const receiptResult = await createBuyReceipt({
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
                    setReferenceNumber(`BUY${dateStr}${timeStr}`);

                    // تحديث التوقيت الحالي
                    setCurrentDateTime(now.toLocaleString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    }));

                    showSuccess('تم إنجاز العملية بنجاح!', 'تم إجراء عملية الشراء وإعداد الفاتورة للطباعة');
                } else {
                    showWarning('تحذير', 'تم حفظ العملية لكن فشل في إنشاء الفاتورة');
                }
            } else {
                const error = await response.json();
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

    // جلب التقرير المفصل
    const fetchDetailedReport = async (page = 1) => {
        setIsLoadingReport(true);
        try {
            const response = await fetch('/employee/buy/detailed-report', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    // تطبيق pagination على البيانات في الـ frontend
                    const allTransactions = result.report.buy_transactions || [];
                    const totalPages = Math.ceil(allTransactions.length / reportPerPage);
                    const startIndex = (page - 1) * reportPerPage;
                    const endIndex = startIndex + reportPerPage;
                    const paginatedTransactions = allTransactions.slice(startIndex, endIndex);
                    
                    setDetailedReportData({
                        ...result.report,
                        buy_transactions: paginatedTransactions,
                        all_transactions: allTransactions // احتفظ بجميع المعاملات
                    });
                    setReportTotalPages(totalPages);
                    setReportCurrentPage(page);
                } else {
                    showError('خطأ', 'فشل في جلب التقرير المفصل');
                }
            } else {
                showError('خطأ', 'فشل في جلب التقرير المفصل');
            }
        } catch (error) {
            console.error('خطأ في جلب التقرير:', error);
            showError('خطأ في الشبكة', 'تعذر الاتصال بالخادم');
        } finally {
            setIsLoadingReport(false);
        }
    };

    // تغيير الصفحة
    const handleReportPageChange = (newPage) => {
        if (newPage >= 1 && newPage <= reportTotalPages && detailedReportData) {
            const allTransactions = detailedReportData.all_transactions || [];
            const startIndex = (newPage - 1) * reportPerPage;
            const endIndex = startIndex + reportPerPage;
            const paginatedTransactions = allTransactions.slice(startIndex, endIndex);
            
            setDetailedReportData({
                ...detailedReportData,
                buy_transactions: paginatedTransactions
            });
            setReportCurrentPage(newPage);
        }
    };

    // عرض التقرير المفصل
    const handleShowDetailedReport = async () => {
        setShowDetailedReport(true);
        if (!detailedReportData) {
            await fetchDetailedReport(1);
        }
    };

    return (
        <EmployeeLayout title="شراء الدولار">
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
                            {/* شعار الشراء */}
                            <div className="text-center mb-6">
                                <div className="w-20 h-20 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <img
                                        src="/images/services/buy.png"
                                        alt="شراء الدولار"
                                        className="w-12 h-12 object-contain"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'block';
                                        }}
                                    />
                                    <span className="text-2xl text-cyan-600 hidden">🛒</span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">شراء الدولار</h2>
                            </div>

                            {/* عرض الرصيد */}
                            <div className="space-y-4 mb-6">
                                {/* الرصيد المتبقي بالدولار */}
                                <div className="bg-cyan-50 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-cyan-800 mb-2">الرصيد المركزي (دولار)</h3>
                                    <p className="text-3xl font-bold text-cyan-700">
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
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-700">بالدينار:</span>
                                        <span className="font-bold text-gray-800">
                                            {openingIQDBalance > 0 ? Math.floor(openingIQDBalance).toLocaleString() : '0'} د.ع
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">نقدي:</span>
                                        <span className="font-bold text-gray-800">
                                            {openingCashBalance > 0 ? Math.floor(openingCashBalance).toLocaleString() : '0'} د.ع
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* تقرير اليوم */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">تقرير شامل - جميع العمليات</h3>

                                <div className="bg-red-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-red-700">منصرف:</span>
                                        <span className="font-bold text-red-800">{todayReport.charges > 0 ? Math.floor(todayReport.charges).toLocaleString() : '0'} د.ع</span>
                                    </div>
                                </div>

                                <div className="bg-blue-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-blue-700">دولار مشترى:</span>
                                        <span className="font-bold text-blue-800">{todayReport.dollars_bought > 0 ? Math.floor(todayReport.dollars_bought).toLocaleString() : '0'} $</span>
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
                                onClick={handleShowDetailedReport}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 mt-6"
                            >
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-right"
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-right"
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-right bg-gray-50"
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
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-right ${
                                            getInsufficientBalanceMessage()
                                                ? 'border-red-500 bg-red-50'
                                                : 'border-gray-300'
                                        }`}
                                        placeholder="المبلغ بالدولار"
                                        value={formData.dollarAmount ? formatNumberWithCommas(formData.dollarAmount) : ''}
                                        onChange={(e) => handleNumberInputChange('dollarAmount', e.target.value)}
                                    />
                                    {getInsufficientBalanceMessage() && (
                                        <p className="text-xs text-red-600 mt-1 text-right font-medium">
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-right"
                                        placeholder={`السعر الافتراضي: ${Math.floor(exchangeRate).toLocaleString()}`}
                                        value={formData.exchangeRate ? formatNumberWithCommas(formData.exchangeRate) : ''}
                                        onChange={(e) => handleNumberInputChange('exchangeRate', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* عرض المبالغ الكلية */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="bg-cyan-50 rounded-xl p-4">
                                    <div className="text-center">
                                        <span className="text-sm font-semibold text-cyan-700">المبلغ بالدولار</span>
                                        <p className="text-xl font-bold text-cyan-800">${Math.floor(parseFloat(formData.dollarAmount || 0)).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="bg-orange-50 rounded-xl p-4">
                                    <div className="text-center">
                                        <span className="text-sm font-semibold text-orange-700">المبلغ بالدينار</span>
                                        <p className="text-xl font-bold text-orange-800">{Math.floor(getIQDAmount()).toLocaleString()} د.ع</p>
                                    </div>
                                </div>
                            </div>

                            {/* ملاحظات */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                    ملاحظات:
                                </label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-right"
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
                                    disabled={isSubmitting || !canProceedWithTransaction()}
                                    className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
                                >
                                    <span className="ml-2">📄</span>
                                    {isSubmitting ? 'جاري المعالجة...' : 'حفظ وطباعة'}
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSubmitting || !canProceedWithTransaction()}
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

            {/* نافذة التقرير المفصل */}
            {showDetailedReport && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                        {/* رأس النافذة */}
                        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4 rounded-t-2xl">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-white flex items-center">
                                    <span className="text-2xl mr-3">📊</span>
                                    التقرير المفصل - عمليات الشراء
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
                            {isLoadingReport ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
                                        <p className="text-gray-600">جاري تحميل التقرير...</p>
                                    </div>
                                </div>
                            ) : detailedReportData ? (
                                <div className="space-y-6">
                                    {/* ملخص التقرير */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-4 border border-cyan-200">
                                            <div className="text-sm font-medium text-cyan-700 mb-1">الرصيد الافتتاحي (دولار)</div>
                                            <div className="text-2xl font-bold text-cyan-900">
                                                ${Math.floor(detailedReportData.opening_dollar_balance || 0).toLocaleString()}
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                                            <div className="text-sm font-medium text-blue-700 mb-1">الرصيد الحالي (دولار)</div>
                                            <div className="text-2xl font-bold text-blue-900">
                                                ${Math.floor(detailedReportData.current_dollar_balance || 0).toLocaleString()}
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                                            <div className="text-sm font-medium text-orange-700 mb-1">إجمالي الدولار المشتراة</div>
                                            <div className="text-2xl font-bold text-orange-900">
                                                ${Math.floor(detailedReportData.total_dollars_bought || 0).toLocaleString()}
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                                            <div className="text-sm font-medium text-red-700 mb-1">إجمالي الدينار المصروف</div>
                                            <div className="text-2xl font-bold text-red-900">
                                                {Math.floor(detailedReportData.total_iqd_spent || 0).toLocaleString()} د.ع
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                                            <div className="text-sm font-medium text-purple-700 mb-1">الرصيد الافتتاحي (دينار)</div>
                                            <div className="text-2xl font-bold text-purple-900">
                                                {Math.floor(detailedReportData.opening_iqd_balance || 0).toLocaleString()} د.ع
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
                                            <div className="text-sm font-medium text-indigo-700 mb-1">الرصيد الحالي (دينار)</div>
                                            <div className="text-2xl font-bold text-indigo-900">
                                                {Math.floor(detailedReportData.current_iqd_balance || 0).toLocaleString()} د.ع
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                                            <div className="text-sm font-medium text-green-700 mb-1">إجمالي العمولة</div>
                                            <div className="text-2xl font-bold text-green-900">
                                                {Math.floor(detailedReportData.total_commission || 0).toLocaleString()} د.ع
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                                            <div className="text-sm font-medium text-gray-700 mb-1">عدد العمليات</div>
                                            <div className="text-2xl font-bold text-gray-900">
                                                {detailedReportData.total_operations || 0}
                                            </div>
                                        </div>
                                    </div>

                                    {/* جدول المعاملات */}
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 flex justify-between items-center">
                                            <h3 className="text-lg font-bold text-white">تفاصيل عمليات الشراء</h3>
                                            <div className="text-sm text-white">
                                                إجمالي المعاملات: {detailedReportData.all_transactions?.length || 0}
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">رقم المرجع</th>
                                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">مبلغ الدولار</th>
                                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">سعر الصرف</th>
                                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">مبلغ الدينار</th>
                                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">المبلغ الكلي</th>
                                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">التاريخ</th>
                                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">الملاحظات</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {detailedReportData.buy_transactions && detailedReportData.buy_transactions.length > 0 ? (
                                                        detailedReportData.buy_transactions.map((transaction, index) => (
                                                            <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                    {transaction.reference_number || '-'}
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-cyan-700 font-semibold">
                                                                    ${Math.floor(transaction.dollar_amount || 0).toLocaleString()}
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                                                    {Math.floor(transaction.exchange_rate || 0).toLocaleString()}
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-orange-700 font-semibold">
                                                                    {Math.floor(transaction.iqd_amount || 0).toLocaleString()} د.ع
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-red-700 font-semibold">
                                                                    {Math.floor(transaction.total_amount || 0).toLocaleString()} د.ع
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                                    {new Date(transaction.created_at).toLocaleString('ar-EG')}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                                                                    {transaction.notes || '-'}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                                                                لا توجد عمليات شراء مسجلة
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination Controls */}
                                        {reportTotalPages > 1 && (
                                            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                                                <div className="flex items-center justify-between">
                                                    <div className="text-sm text-gray-700">
                                                        صفحة <span className="font-semibold">{reportCurrentPage}</span> من{' '}
                                                        <span className="font-semibold">{reportTotalPages}</span>
                                                        {' '}(عرض {reportPerPage} معاملة لكل صفحة)
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleReportPageChange(1)}
                                                            disabled={reportCurrentPage === 1}
                                                            className="px-3 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            الأولى
                                                        </button>
                                                        <button
                                                            onClick={() => handleReportPageChange(reportCurrentPage - 1)}
                                                            disabled={reportCurrentPage === 1}
                                                            className="px-3 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            السابقة
                                                        </button>
                                                        <button
                                                            onClick={() => handleReportPageChange(reportCurrentPage + 1)}
                                                            disabled={reportCurrentPage === reportTotalPages}
                                                            className="px-3 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            التالية
                                                        </button>
                                                        <button
                                                            onClick={() => handleReportPageChange(reportTotalPages)}
                                                            disabled={reportCurrentPage === reportTotalPages}
                                                            className="px-3 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            الأخيرة
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* زر الإغلاق */}
                                    <div className="flex justify-center pt-4">
                                        <button
                                            onClick={() => setShowDetailedReport(false)}
                                            className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 flex items-center shadow-lg"
                                        >
                                            <span className="mr-2">✖️</span>
                                            إغلاق التقرير
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-gray-600 text-lg">لا توجد بيانات متاحة</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </EmployeeLayout>
    );
}
