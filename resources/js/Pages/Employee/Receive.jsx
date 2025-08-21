import React, { useState, useEffect } from 'react';
import EmployeeLayout from '../../Layouts/EmployeeLayout';
import { router } from '@inertiajs/react';
import { useThermalReceipt } from '../../Hooks/useThermalReceipt';
import { useCentralCashBalance } from '../../Hooks/useCentralCashBalance';
import { useCentralDollarBalance } from '../../Hooks/useCentralDollarBalance';
import ThermalReceipt from '../../Components/ThermalReceipt';
import { useReceiveExchangeReceipt } from '../../Hooks/useReceiveExchangeReceipt';
import ReceiveExchangeThermalReceipt from '../../Components/ReceiveExchangeThermalReceipt';
import { generateReceiveReference } from '../../utils/generateUniqueReference';
import NotificationModal from '../../Components/NotificationModal';
import { useNotification } from '../../Hooks/useNotification';

export default function Receive({
    user,
    currentBalance = 0,
    currentCashBalance = 0, // الرصيد النقدي المركزي
    currentCentralDollarBalance = 0, // الرصيد المركزي للدولار
    currentDollarBalance = 0, // رصيد الدولار الحالي
    openingBalance = 0,
    openingCashBalance = 0, // الرصيد النقدي الافتتاحي
    openingDollarBalance = 0, // رصيد الدولار الافتتاحي
    transactions = [],
    quickReport = { received_today: 0, operations: 0, total_received: 0, total_exchanged: 0 }
}) {
    const [balance, setBalance] = useState(currentBalance);
    const [dollarBalance, setDollarBalance] = useState(currentDollarBalance || 0);
    const [showDetailedReport, setShowDetailedReport] = useState(false);
    const [todayReport, setTodayReport] = useState({
        received_today: quickReport.received_today,
        operations: quickReport.operations,
        total_received: quickReport.total_received,
        total_exchanged: quickReport.total_exchanged
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
        showReceipt: showReceiveReceipt,
        receiptData: receiveReceiptData,
        isCreatingReceipt: isCreatingReceiveReceipt,
        createReceiveExchangeReceipt,
        createReceiptAndSave: createReceiveReceiptAndSave,
        printReceipt: printReceiveReceipt,
        closeReceipt: closeReceiveReceipt
    } = useReceiveExchangeReceipt();

    // استخدام hook الإشعارات
    const {
        notification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        closeNotification
    } = useNotification();

    // بيانات النموذج
    const [formData, setFormData] = useState({
        documentNumber: '',
        currentTime: new Date().toLocaleString('ar-EG'),
        receivedFrom: '',
        selectedCustomer: null,
        amount: '',
        currency: '',
        exchange_rate: '',
        description: '',
        receiverName: user?.name || 'الموظف الحالي',
        notes: ''
    });

    // حالات البحث عن العملاء
    const [searchQuery, setSearchQuery] = useState('');
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

    // حالات النافذة المنبثقة لإضافة عميل جديد
    const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
    const [newCustomerData, setNewCustomerData] = useState({
        name: '',
        phone: '',
        opening_balance_iqd: '0',
        opening_balance_usd: '0'
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
            const uniqueRef = generateReceiveReference(user?.id);
            setReferenceNumber(uniqueRef);
        };

        generateRefNumber();
    }, [user?.id]);

    // تحديث documentNumber في formData عند تغيير referenceNumber
    useEffect(() => {
        setFormData(prev => ({ ...prev, documentNumber: referenceNumber }));
    }, [referenceNumber]);

    const currencies = [
        'دينار عراقي',
        'دولار أمريكي'
    ];

    // تنسيق الأرقام مع الفواصل وإزالة الأصفار الزائدة
    const formatNumberWithCommas = (value) => {
        if (!value) return '';

        // تنظيف القيمة من أي فواصل موجودة مسبقاً
        const cleanValue = value.toString().replace(/,/g, '');

        // التحقق من صحة الرقم
        if (isNaN(cleanValue) || cleanValue === '') return value;

        // تحويل إلى رقم وإزالة الأصفار الزائدة
        const num = parseFloat(cleanValue);

        // تحويل الرقم إلى string وإزالة الأصفار الزائدة
        let formattedNumber = num.toString();

        // إضافة الفواصل للجزء الصحيح فقط
        const parts = formattedNumber.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        return parts.join('.');
    };

    // إزالة الفواصل من الرقم
    const removeCommas = (value) => {
        return value.toString().replace(/,/g, '');
    };

    // معالجة تغيير قيم الحقول الرقمية
    const handleNumberInputChange = (field, value) => {
        const cleanValue = removeCommas(value);

        // السماح بالأرقام والنقطة العشرية فقط
        if (cleanValue === '' || /^\d*\.?\d*$/.test(cleanValue)) {
            setFormData(prev => ({ ...prev, [field]: cleanValue }));
        }
    };

    // تحديث قيم النموذج
    const handleInputChange = (field, value) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };

            // إذا تم تغيير العملة إلى دينار عراقي، جعل سعر الصرف 1 تلقائياً
            if (field === 'currency' && value === 'دينار عراقي') {
                newData.exchange_rate = '1';
            }
            // إذا تم تغيير العملة إلى دولار أمريكي، جعل سعر الصرف افتراضي
            if (field === 'currency' && value === 'دولار أمريكي') {
                newData.exchange_rate = '1'; // سعر الصرف 1 للدولار (سيأخذ المبلغ الأصلي)
            }

            return newData;
        });
    };

    // جلب العملاء من الخادم
    const fetchCustomers = async () => {
        setIsLoadingCustomers(true);
        try {
            const response = await fetch('/api/employee/customers/search', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                }
            });

            if (response.ok) {
                const data = await response.json();
                setCustomers(data.customers || []);
                setFilteredCustomers(data.customers || []);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setIsLoadingCustomers(false);
        }
    };

    // البحث في العملاء
    const handleCustomerSearch = (query) => {
        setSearchQuery(query);
        setFormData(prev => ({ ...prev, receivedFrom: query, selectedCustomer: null }));

        if (query.trim() === '') {
            setFilteredCustomers(customers);
            setShowCustomerDropdown(false);
            return;
        }

        const filtered = customers.filter(customer =>
            customer.name.toLowerCase().includes(query.toLowerCase()) ||
            customer.phone.includes(query) ||
            customer.customer_code.toLowerCase().includes(query.toLowerCase())
        );

        setFilteredCustomers(filtered);
        setShowCustomerDropdown(true);
    };

    // اختيار عميل من القائمة
    const handleSelectCustomer = (customer) => {
        setFormData(prev => ({
            ...prev,
            receivedFrom: customer.name,
            selectedCustomer: customer
        }));
        setSearchQuery(customer.name);
        setShowCustomerDropdown(false);
    };

    // إضافة عميل جديد
    const handleAddNewCustomer = async () => {
        try {
            console.log('إضافة عميل جديد - البيانات المرسلة:', {
                name: newCustomerData.name,
                phone: newCustomerData.phone,
                opening_balance_iqd: newCustomerData.opening_balance_iqd || '0',
                opening_balance_usd: newCustomerData.opening_balance_usd || '0'
            });

            const response = await fetch('/api/employee/customers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                },
                body: JSON.stringify({
                    name: newCustomerData.name,
                    phone: newCustomerData.phone,
                    opening_balance_iqd: newCustomerData.opening_balance_iqd || '0',
                    opening_balance_usd: newCustomerData.opening_balance_usd || '0'
                })
            });

            console.log('استجابة الخادم - حالة:', response.status);

            if (response.ok) {
                const result = await response.json();
                console.log('نجح إنشاء العميل:', result);
                const newCustomer = result.customer;

                // إضافة العميل الجديد للقائمة
                setCustomers(prev => [newCustomer, ...prev]);
                setFilteredCustomers(prev => [newCustomer, ...prev]);

                // اختيار العميل الجديد
                handleSelectCustomer(newCustomer);

                // إغلاق النافذة المنبثقة وإعادة تعيين البيانات
                setShowAddCustomerModal(false);
                setNewCustomerData({
                    name: '',
                    phone: '',
                    opening_balance_iqd: '0',
                    opening_balance_usd: '0'
                });

                showSuccess('نجاح العملية', 'تم إضافة العميل بنجاح!');
            } else {
                const error = await response.json();
                console.error('خطأ في إنشاء العميل:', error);
                showError('خطأ', error.message || 'حدث خطأ في إضافة العميل');
            }
        } catch (error) {
            console.error('خطأ في الشبكة:', error);
            showError('خطأ في الشبكة', 'حدث خطأ في الشبكة');
        }
    };

    // إظهار نافذة إضافة عميل جديد
    const handleShowAddCustomer = () => {
        setNewCustomerData(prev => ({ ...prev, name: searchQuery }));
        setShowAddCustomerModal(true);
        setShowCustomerDropdown(false);
    };

    // جلب العملاء عند تحميل الصفحة
    useEffect(() => {
        fetchCustomers();
    }, []);

    // إغلاق القائمة المنسدلة عند النقر خارجها
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showCustomerDropdown && !event.target.closest('.relative')) {
                setShowCustomerDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCustomerDropdown]);

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

    // إرسال المعاملة (بدون رسائل تأكيد للاستخدام مع الطباعة)
    const handleSubmitSilent = async () => {
        // التحقق من الحقول المطلوبة (سعر الصرف مطلوب فقط إذا لم تكن العملة دينار عراقي أو دولار أمريكي)
        const isExchangeRateRequired = formData.currency !== 'دينار عراقي' && formData.currency !== 'دولار أمريكي';

        if (!formData.receivedFrom || !formData.amount || !formData.currency ||
            (isExchangeRateRequired && !formData.exchange_rate)) {
            throw new Error('يرجى ملء جميع الحقول المطلوبة');
        }

        if (parseFloat(formData.amount) <= 0) {
            throw new Error('يرجى إدخال مبلغ صحيح');
        }

        if (isExchangeRateRequired && parseFloat(formData.exchange_rate) <= 0) {
            throw new Error('يرجى إدخال سعر صرف صحيح');
        }

        const response = await fetch('/employee/receive', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
            },
            body: JSON.stringify({
                documentNumber: formData.documentNumber,
                receivedFrom: formData.receivedFrom,
                selectedCustomer: formData.selectedCustomer,
                amount: removeCommas(formData.amount),
                currency: formData.currency,
                exchange_rate: removeCommas(formData.exchange_rate || '1'),
                description: formData.description,
                beneficiary: 'الصندوق النقدي', // قيمة ثابتة
                notes: formData.notes
            })
        });

        if (response.ok) {
            const result = await response.json();

            // تحديث الرصيد
            setBalance(result.new_balance);

            // تحديث الرصيد النقدي المركزي
            if (result.new_cash_balance !== undefined) {
                updateBalanceAfterTransaction(result.new_cash_balance);
            }

            // تحديث الرصيد المركزي للدولار
            if (result.new_central_dollar_balance !== undefined) {
                updateDollarBalance(result.new_central_dollar_balance);
            }

            // تحديث رصيد الدولار إذا كان القبض بالدولار
            if (result.new_dollar_balance !== undefined && result.new_dollar_balance !== null) {
                setDollarBalance(result.new_dollar_balance);
            }

            // تحديث تقرير اليوم بالبيانات الحديثة من الخادم
            if (result.updated_report) {
                setTodayReport({
                    received_today: result.updated_report.received_today,
                    operations: result.updated_report.operations,
                    total_received: result.updated_report.total_received,
                    total_exchanged: result.updated_report.total_exchanged
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

            return result; // إرجاع النتيجة للاستخدام في createReceiptAndSave
        } else {
            // محاولة قراءة الخطأ كـ JSON، وإذا فشلت فاستخدم النص
            let errorMessage = 'حدث خطأ';
            try {
                const error = await response.json();
                errorMessage = error.message || 'حدث خطأ';
            } catch (jsonError) {
                // إذا فشل في قراءة JSON، اقرأ كنص
                const errorText = await response.text();
                console.error('خطأ في الاستجابة:', errorText);
                errorMessage = 'خطأ في الخادم';
            }
            throw new Error(errorMessage);
        }
    };

    // إرسال المعاملة
    const handleSubmit = async () => {
        // التحقق من الحقول المطلوبة (سعر الصرف مطلوب فقط إذا لم تكن العملة دينار عراقي أو دولار أمريكي)
        const isExchangeRateRequired = formData.currency !== 'دينار عراقي' && formData.currency !== 'دولار أمريكي';

        if (!formData.receivedFrom || !formData.amount || !formData.currency ||
            (isExchangeRateRequired && !formData.exchange_rate)) {
            showWarning('تحذير', 'يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        if (parseFloat(formData.amount) <= 0) {
            showWarning('تحذير', 'يرجى إدخال مبلغ صحيح');
            return;
        }

        if (isExchangeRateRequired && parseFloat(formData.exchange_rate) <= 0) {
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
                    selectedCustomer: formData.selectedCustomer,
                    amount: removeCommas(formData.amount),
                    currency: formData.currency,
                    exchange_rate: removeCommas(formData.exchange_rate || '1'),
                    description: formData.description,
                    beneficiary: 'الصندوق النقدي', // قيمة ثابتة
                    notes: formData.notes
                })
            });

            if (response.ok) {
                const result = await response.json();

                // تحديث الرصيد
                setBalance(result.new_balance);

                // تحديث الرصيد النقدي المركزي
                if (result.new_cash_balance !== undefined) {
                    updateBalanceAfterTransaction(result.new_cash_balance);
                }

                // تحديث الرصيد المركزي للدولار
                if (result.new_central_dollar_balance !== undefined) {
                    updateDollarBalance(result.new_central_dollar_balance);
                }

                // تحديث رصيد الدولار إذا كان القبض بالدولار
                if (result.new_dollar_balance !== undefined && result.new_dollar_balance !== null) {
                    setDollarBalance(result.new_dollar_balance);
                }

                // تحديث تقرير اليوم بالبيانات الحديثة من الخادم
                if (result.updated_report) {
                    setTodayReport({
                        received_today: result.updated_report.received_today,
                        operations: result.updated_report.operations,
                        total_received: result.updated_report.total_received,
                        total_exchanged: result.updated_report.total_exchanged
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
                const uniqueRef = generateReceiveReference(user?.id);
                setReferenceNumber(uniqueRef);

                // تحديث التوقيت الحالي
                const now = new Date();
                setCurrentDateTime(now.toLocaleString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }));

                alert('تم حفظ سند القبض بنجاح!');
                return result; // إرجاع النتيجة للاستخدام في createReceiptAndSave
            } else {
                // محاولة قراءة الخطأ كـ JSON، وإذا فشلت فاستخدم النص
                let errorMessage = 'حدث خطأ';
                try {
                    const error = await response.json();
                    errorMessage = error.message || 'حدث خطأ';
                } catch (jsonError) {
                    // إذا فشل في قراءة JSON، اقرأ كنص
                    const errorText = await response.text();
                    console.error('خطأ في الاستجابة:', errorText);
                    errorMessage = 'خطأ في الخادم';
                }
                alert(errorMessage);
                return { success: false, error: errorMessage };
            }
        } catch (error) {
            console.error('Error:', error);
            alert('حدث خطأ في الشبكة');
            return { success: false, error: error.message };
        } finally {
            setIsSubmitting(false);
        }
    };

    // حفظ وطباعة فاتورة سند القبض المخصصة
    const handleSaveAndPrint = async () => {
        // التحقق من الحقول المطلوبة (سعر الصرف مطلوب فقط إذا لم تكن العملة دينار عراقي أو دولار أمريكي)
        const isExchangeRateRequired = formData.currency !== 'دينار عراقي' && formData.currency !== 'دولار أمريكي';

        if (!formData.receivedFrom || !formData.amount || !formData.currency ||
            (isExchangeRateRequired && !formData.exchange_rate)) {
            alert('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        const amountInIqd = Math.floor(parseFloat(formData.amount || 0) * parseFloat(formData.exchange_rate || 1));

        const saveTransactionResult = await createReceiveReceiptAndSave(
            handleSubmitSilent,
            {
                reference_number: formData.documentNumber,
                employee_name: formData.receiverName,
                person_name: formData.receivedFrom,
                currency: formData.currency,
                amount: formData.amount,
                exchange_rate: formData.exchange_rate || '1',
                amount_in_iqd: amountInIqd,
                beneficiary: 'الصندوق النقدي',
                description: formData.description,
                notes: formData.notes
            },
            'receive' // نوع السند: قبض
        );

        if (saveTransactionResult && saveTransactionResult.success) {
            console.log('تم حفظ سند القبض وإنشاء الفاتورة المخصصة بنجاح');
        }
    };

    // إعادة تعيين النموذج
    const resetForm = () => {
        setFormData(prev => ({
            ...prev,
            receivedFrom: '',
            selectedCustomer: null,
            amount: '',
            currency: '',
            exchange_rate: '',
            description: '',
            notes: ''
        }));
        setSearchQuery('');
        setShowCustomerDropdown(false);
    };

    const handleBack = () => {
        router.visit('/employee/dashboard');
    };

    // حساب ما إذا كان النموذج صالحاً للإرسال
    const isFormValid = () => {
        const isExchangeRateRequired = formData.currency !== 'دينار عراقي' && formData.currency !== 'دولار أمريكي';
        return formData.receivedFrom &&
               formData.amount &&
               formData.currency &&
               (!isExchangeRateRequired || formData.exchange_rate);
    };

    return (
        <EmployeeLayout title="عمليات القبض">
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
                            {/* شعار سند القبض */}
                            <div className="text-center mb-6">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-2xl text-green-600">📝</span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">سند القبض</h2>
                            </div>

                            {/* عرض الرصيد */}
                            <div className="space-y-4 mb-6">
                                {/* الرصيد النقدي المركزي */}
                                <div className="bg-green-50 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-green-800 mb-2">الرصيد النقدي المركزي</h3>
                                    <p className="text-3xl font-bold text-green-700">
                                        {Math.floor(centralCashBalance).toLocaleString()} د.ع
                                    </p>
                                </div>

                                {/* الرصيد المركزي للدولار */}
                                <div className="bg-purple-50 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-purple-800 mb-2">الرصيد المركزي للدولار</h3>
                                    <p className="text-3xl font-bold text-purple-700">
                                        ${Math.floor(centralDollarBalance).toLocaleString()}
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

                                <div className="bg-red-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-red-700">إجمالي المصروف:</span>
                                        <span className="font-bold text-red-800">{todayReport.total_exchanged > 0 ? Math.floor(todayReport.total_exchanged).toLocaleString() : '0'} د.ع</span>
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

                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        استلمت من السيد: *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-right"
                                            placeholder="ابحث عن عميل أو أدخل اسم جديد..."
                                            value={searchQuery}
                                            onChange={(e) => handleCustomerSearch(e.target.value)}
                                            onFocus={() => {
                                                if (customers.length > 0 && searchQuery) {
                                                    setShowCustomerDropdown(true);
                                                }
                                            }}
                                        />
                                        {isLoadingCustomers && (
                                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                                <div className="animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
                                            </div>
                                        )}
                                        {formData.selectedCustomer && (
                                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            </div>
                                        )}
                                    </div>

                                    {/* قائمة منسدلة للعملاء */}
                                    {showCustomerDropdown && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            {filteredCustomers.length > 0 ? (
                                                <>
                                                    {filteredCustomers.map((customer) => (
                                                        <div
                                                            key={customer.id}
                                                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 text-right"
                                                            onClick={() => handleSelectCustomer(customer)}
                                                        >
                                                            <div className="flex justify-between items-center">
                                                                <div className="text-left">
                                                                    <span className="text-xs text-gray-500">{customer.customer_code}</span>
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-gray-900">{customer.name}</div>
                                                                    <div className="text-sm text-gray-600">{customer.phone}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {searchQuery && !filteredCustomers.some(c => c.name.toLowerCase() === searchQuery.toLowerCase()) && (
                                                        <div
                                                            className="px-4 py-3 bg-green-50 hover:bg-green-100 cursor-pointer border-t border-green-200 text-center text-green-700 font-medium"
                                                            onClick={handleShowAddCustomer}
                                                        >
                                                            <svg className="w-4 h-4 inline-block ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                            </svg>
                                                            إضافة عميل جديد: "{searchQuery}"
                                                        </div>
                                                    )}
                                                </>
                                            ) : searchQuery ? (
                                                <div
                                                    className="px-4 py-3 bg-green-50 hover:bg-green-100 cursor-pointer text-center text-green-700 font-medium"
                                                    onClick={handleShowAddCustomer}
                                                >
                                                    <svg className="w-4 h-4 inline-block ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                    </svg>
                                                    إضافة عميل جديد: "{searchQuery}"
                                                </div>
                                            ) : (
                                                <div className="px-4 py-3 text-center text-gray-500">
                                                    لا توجد عملاء
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* عرض معلومات العميل المختار */}
                                    {formData.selectedCustomer && (
                                        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg text-right">
                                            <div className="flex justify-between items-center">
                                                <div className="text-left">
                                                    <span className="text-xs font-medium text-green-700">{formData.selectedCustomer.customer_code}</span>
                                                </div>
                                                <div>
                                                    <div className="font-medium text-green-900">{formData.selectedCustomer.name}</div>
                                                    <div className="text-sm text-green-700">{formData.selectedCustomer.phone}</div>
                                                </div>
                                            </div>
                                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                                <div className="text-center bg-white p-2 rounded">
                                                    <div className="text-gray-600">الرصيد USD</div>
                                                    <div className="font-bold text-green-700">${formData.selectedCustomer.current_usd_balance || '0.00'}</div>
                                                </div>
                                                <div className="text-center bg-white p-2 rounded">
                                                    <div className="text-gray-600">الرصيد IQD</div>
                                                    <div className="font-bold text-green-700">{parseInt(formData.selectedCustomer.current_iqd_balance || 0).toLocaleString()} د.ع</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        المبلغ: *
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-right"
                                        placeholder="أدخل المبلغ"
                                        value={formData.amount ? formatNumberWithCommas(formData.amount) : ''}
                                        onChange={(e) => handleNumberInputChange('amount', e.target.value)}
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

                                {/* حقل سعر الصرف - يُخفى عندما تكون العملة دينار عراقي أو دولار أمريكي */}
                                {formData.currency !== 'دينار عراقي' && formData.currency !== 'دولار أمريكي' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                            سعر الصرف: *
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-right"
                                            value={formData.exchange_rate ? formatNumberWithCommas(formData.exchange_rate) : ''}
                                            onChange={(e) => handleNumberInputChange('exchange_rate', e.target.value)}
                                            placeholder="أدخل سعر الصرف"
                                        />
                                    </div>
                                )}

                                {/* عرض المبلغ بالدينار العراقي للعملات الأخرى فقط */}
                                {formData.amount && formData.exchange_rate && formData.currency !== 'دينار عراقي' && formData.currency !== 'دولار أمريكي' && (
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
                                    disabled={isSubmitting || !isFormValid()}
                                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
                                >
                                    <span className="ml-2">🖨️</span>
                                    {isSubmitting ? 'جاري المعالجة...' : 'حفظ وطباعة'}
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !isFormValid()}
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

            {/* نافذة الفاتورة الحرارية العامة */}
            {showReceipt && receiptData && (
                <ThermalReceipt
                    receiptData={receiptData}
                    onClose={closeReceipt}
                    onPrint={printReceipt}
                />
            )}

            {/* نافذة فاتورة سند القبض المخصصة */}
            {showReceiveReceipt && receiveReceiptData && (
                <ReceiveExchangeThermalReceipt
                    receiptData={receiveReceiptData}
                    receiptType="receive"
                    onClose={closeReceiveReceipt}
                    onPrint={printReceiveReceipt}
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

            {/* النافذة المنبثقة لإضافة عميل جديد */}
            {showAddCustomerModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <button
                                    onClick={() => setShowAddCustomerModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                                <h2 className="text-xl font-bold text-gray-900">إضافة عميل جديد</h2>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        اسم العميل: *
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-right"
                                        placeholder="أدخل اسم العميل"
                                        value={newCustomerData.name}
                                        onChange={(e) => setNewCustomerData(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        رقم الهاتف: *
                                    </label>
                                    <input
                                        type="tel"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-right"
                                        placeholder="أدخل رقم الهاتف"
                                        value={newCustomerData.phone}
                                        onChange={(e) => setNewCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                            الرصيد الافتتاحي USD
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-right"
                                            placeholder="0.00 (يمكن أن يكون سالب)"
                                            value={newCustomerData.opening_balance_usd}
                                            onChange={(e) => setNewCustomerData(prev => ({ ...prev, opening_balance_usd: e.target.value }))}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                            الرصيد الافتتاحي IQD
                                        </label>
                                        <input
                                            type="number"
                                            step="1"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-right"
                                            placeholder="0 (يمكن أن يكون سالب)"
                                            value={newCustomerData.opening_balance_iqd}
                                            onChange={(e) => setNewCustomerData(prev => ({ ...prev, opening_balance_iqd: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div className="flex space-x-3 space-x-reverse pt-4">
                                    <button
                                        onClick={() => setShowAddCustomerModal(false)}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        onClick={handleAddNewCustomer}
                                        disabled={!newCustomerData.name || !newCustomerData.phone}
                                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        إضافة العميل
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
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
