import React, { useState, useEffect } from 'react';
import EmployeeLayout from '../../Layouts/EmployeeLayout';
import { router } from '@inertiajs/react';
import { useThermalReceipt } from '../../Hooks/useThermalReceipt';
import ThermalReceipt from '../../Components/ThermalReceipt';
import { useReceiveExchangeReceipt } from '../../Hooks/useReceiveExchangeReceipt';
import ReceiveExchangeThermalReceipt from '../../Components/ReceiveExchangeThermalReceipt';
import { useCentralCashBalance } from '../../Hooks/useCentralCashBalance';
import { useCentralDollarBalance } from '../../Hooks/useCentralDollarBalance';
import { generateExchangeReference } from '../../utils/generateUniqueReference';
import NotificationModal from '../../Components/NotificationModal';
import { useNotification } from '../../Hooks/useNotification';

export default function Exchange({
    user,
    currentBalance = 0,
    openingBalance = 0,
    transactions = [],
    quickReport = { exchanged_today: 0, operations: 0, total_exchanged: 0, total_received: 0 },
    currentCashBalance = 0,
    currentCentralDollarBalance = 0,
    openingCashBalance = 0
}) {
    // استخدام نظام الرصيد النقدي المركزي
    const { centralCashBalance, updateBalanceAfterTransaction } = useCentralCashBalance(currentCashBalance);

    // استخدام نظام الرصيد المركزي للدولار
    const {
        centralDollarBalance,
        updateBalanceAfterTransaction: updateDollarBalance
    } = useCentralDollarBalance(currentCentralDollarBalance);

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

    // استخدام hook الإشعارات
    const {
        notification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        closeNotification
    } = useNotification();

    const [formData, setFormData] = useState({
        invoiceNumber: '',
        currentTime: new Date().toLocaleString('ar-EG'),
        amount: '',
        currency: 'دينار عراقي', // العملة الافتراضية
        description: '',
        employeeName: user?.name || 'الموظف الحالي',
        paidTo: '',
        selectedCustomer: null,
        notes: ''
    });

    // إضافة حالة لنوع الصرف
    const [exchangeType, setExchangeType] = useState('normal'); // 'normal' للصرف العادي, 'customer' للصرف لعميل

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
            const uniqueRef = generateExchangeReference(user?.id);
            setReferenceNumber(uniqueRef);
        };

        generateRefNumber();
    }, []);

    // تحديث invoiceNumber في formData عند تغيير referenceNumber
    useEffect(() => {
        setFormData(prev => ({ ...prev, invoiceNumber: referenceNumber }));
    }, [referenceNumber]);

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

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
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
        setFormData(prev => ({ ...prev, paidTo: query, selectedCustomer: null }));

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
            paidTo: customer.name,
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
                currency: formData.currency,
                description: formData.description,
                paidTo: formData.paidTo,
                selectedCustomer: formData.selectedCustomer,
                notes: formData.notes
            })
        });

        if (response.ok) {
            const result = await response.json();

            // تحديث الرصيد المركزي
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
                currency: 'دينار عراقي',
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
            showWarning('تحذير', 'يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        if (parseFloat(formData.amount) <= 0) {
            showWarning('تحذير', 'يرجى إدخال مبلغ صحيح');
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
                    currency: formData.currency,
                    description: formData.description,
                    paidTo: formData.paidTo,
                    selectedCustomer: formData.selectedCustomer,
                    notes: formData.notes
                })
            });

            if (response.ok) {
                const result = await response.json();

                // تحديث الرصيد المركزي
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
                    currency: 'دينار عراقي',
                    description: '',
                    paidTo: '',
                    selectedCustomer: null,
                    notes: '',
                    currentTime: new Date().toLocaleString('ar-EG')
                }));

                // إعادة تعيين بيانات البحث
                setSearchQuery('');
                setShowCustomerDropdown(false);

                // توليد رقم مرجع جديد
                const now = new Date();
                const dateStr = now.getFullYear().toString() +
                               (now.getMonth() + 1).toString().padStart(2, '0') +
                               now.getDate().toString().padStart(2, '0');
                const timeStr = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                setReferenceNumber(`EXC${dateStr}${timeStr}`);

                showSuccess('نجاح العملية', 'تم حفظ سند الصرف بنجاح!');
                return result; // إرجاع النتيجة للاستخدام في createReceiptAndSave
            } else {
                const error = await response.json();
                showError('خطأ', error.message || 'حدث خطأ');
                return { success: false, error: error.message };
            }
        } catch (error) {
            console.error('Error:', error);
            showError('خطأ في الشبكة', 'حدث خطأ في الشبكة');
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

        // التحقق من وجود مستلم في حالة الصرف لعميل فقط
        if (exchangeType === 'customer' && !formData.selectedCustomer && !formData.paidTo) {
            alert('يرجى اختيار عميل أو إدخال اسم المستلم');
            return;
        }

        const saveTransactionResult = await createExchangeReceiptAndSave(
            handleSubmitSilent,
            {
                reference_number: formData.invoiceNumber,
                employee_name: user?.name || 'الموظف الحالي',
                person_name: exchangeType === 'customer'
                    ? (formData.selectedCustomer ? formData.selectedCustomer.name : formData.paidTo)
                    : 'صرف عادي',
                currency: formData.currency,
                amount: formData.amount,
                exchange_rate: '1',
                amount_in_iqd: parseFloat(formData.amount),
                beneficiary: exchangeType === 'customer'
                    ? (formData.selectedCustomer ? formData.selectedCustomer.name : formData.paidTo)
                    : 'صرف عادي',
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
                            {/* شعار سند الصرف */}
                            <div className="text-center mb-6">
                                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-2xl text-red-600">💸</span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">سند الصرف</h2>
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

                            {/* أزرار اختيار نوع الصرف */}
                            <div className="flex mb-6">
                                <button
                                    onClick={() => {
                                        setExchangeType('normal');
                                        setFormData(prev => ({ ...prev, paidTo: '', selectedCustomer: null }));
                                        setSearchQuery('');
                                        setShowCustomerDropdown(false);
                                    }}
                                    className={`flex-1 py-3 px-6 rounded-r-lg font-semibold transition-colors duration-200 ${
                                        exchangeType === 'normal'
                                            ? 'bg-red-500 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    صرف عادي
                                </button>
                                <button
                                    onClick={() => setExchangeType('customer')}
                                    className={`flex-1 py-3 px-6 rounded-l-lg font-semibold transition-colors duration-200 ${
                                        exchangeType === 'customer'
                                            ? 'bg-red-500 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    صرف لعميل
                                </button>
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
                                    type="text"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-right"
                                    placeholder={formData.currency === 'دولار أمريكي' ? 'أدخل المبلغ بالدولار' : 'أدخل المبلغ بالدينار العراقي'}
                                    value={formData.amount ? formatNumberWithCommas(formData.amount) : ''}
                                    onChange={(e) => handleNumberInputChange('amount', e.target.value)}
                                />
                            </div>

                            {/* العملة */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                    العملة: *
                                </label>
                                <select
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-right"
                                    value={formData.currency}
                                    onChange={(e) => handleInputChange('currency', e.target.value)}
                                >
                                    <option value="دينار عراقي">دينار عراقي</option>
                                    <option value="دولار أمريكي">دولار أمريكي</option>
                                </select>
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

                            {/* صُرف للسيد - يظهر فقط في حالة الصرف لعميل */}
                            {exchangeType === 'customer' && (
                                <div className="mb-6 relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        صُرف للسيد: *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-right"
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
                                                <div className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full"></div>
                                            </div>
                                        )}
                                        {formData.selectedCustomer && (
                                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
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
                                                            className="px-4 py-3 bg-red-50 hover:bg-red-100 cursor-pointer border-t border-red-200 text-center text-red-700 font-medium"
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
                                                    className="px-4 py-3 bg-red-50 hover:bg-red-100 cursor-pointer text-center text-red-700 font-medium"
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
                                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-right">
                                            <div className="flex justify-between items-center">
                                                <div className="text-left">
                                                    <span className="text-xs font-medium text-red-700">{formData.selectedCustomer.customer_code}</span>
                                                </div>
                                                <div>
                                                    <div className="font-medium text-red-900">{formData.selectedCustomer.name}</div>
                                                    <div className="text-sm text-red-700">{formData.selectedCustomer.phone}</div>
                                                </div>
                                            </div>
                                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                                <div className="text-center bg-white p-2 rounded">
                                                    <div className="text-gray-600">الرصيد USD</div>
                                                    <div className="font-bold text-red-700">${formData.selectedCustomer.current_usd_balance || '0.00'}</div>
                                                </div>
                                                <div className="text-center bg-white p-2 rounded">
                                                    <div className="text-gray-600">الرصيد IQD</div>
                                                    <div className="font-bold text-red-700">{parseInt(formData.selectedCustomer.current_iqd_balance || 0).toLocaleString()} د.ع</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* حقل اسم المستلم للصرف العادي - تم إلغاؤه */}
                            {/* {exchangeType === 'normal' && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        صُرف للسيد: (اختياري)
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-right"
                                        placeholder="اسم المستلم (اختياري)..."
                                        value={formData.paidTo}
                                        onChange={(e) => handleInputChange('paidTo', e.target.value)}
                                    />
                                </div>
                            )} */}

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
                                    disabled={isSubmitting || !formData.amount || !formData.description || (exchangeType === 'customer' && !formData.selectedCustomer && !formData.paidTo)}
                                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
                                >
                                    <span className="ml-2">🖨️</span>
                                    {isSubmitting ? 'جاري المعالجة...' : 'حفظ وطباعة'}
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSubmitting || !formData.amount || !formData.description || (exchangeType === 'customer' && !formData.selectedCustomer && !formData.paidTo)}
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-right"
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-right"
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
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-right"
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
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-right"
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
                                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
