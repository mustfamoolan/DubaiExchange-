import React, { useState, useEffect } from 'react';
import EmployeeLayout from '../../Layouts/EmployeeLayout';
import { router } from '@inertiajs/react';
import { useThermalReceipt } from '../../Hooks/useThermalReceipt';
import ThermalReceipt from '../../Components/ThermalReceipt';
import { useReceiveExchangeReceipt } from '../../Hooks/useReceiveExchangeReceipt';
import ReceiveExchangeThermalReceipt from '../../Components/ReceiveExchangeThermalReceipt';

// دالة لتنسيق الأرقام مع فواصل وإزالة الأصفار الزائدة
const formatNumber = (value) => {
    if (!value || isNaN(value)) return '';
    const num = parseFloat(value);
    if (num === 0) return '0';
    // إزالة الأصفار الزائدة وإضافة فواصل
    return num.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
};

// دالة لتنسيق الإدخال أثناء الكتابة
const formatInputNumber = (value) => {
    if (!value) return '';
    // إزالة كل شيء ما عدا الأرقام والنقطة
    const cleanValue = value.replace(/[^0-9.]/g, '');
    // التأكد من وجود نقطة واحدة فقط
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
        return parts[0] + '.' + parts.slice(1).join('');
    }
    return cleanValue;
};

// دالة لإضافة فواصل للرقم أثناء العرض
const addCommasToInput = (value) => {
    if (!value) return '';
    const parts = value.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
};

export default function Exchange({
    user,
    currentBalance = 0,
    currentIqdBalance = 0,
    currentUsdBalance = 0,
    openingBalance = 0,
    transactions = [],
    quickReport = {
        exchanged_today: 0,
        operations: 0,
        total_exchanged: 0,
        total_received: 0,
        current_iqd_balance: 0,
        current_usd_balance: 0
    }
}) {
    const [balance, setBalance] = useState(currentBalance);
    const [iqd_balance, setIqdBalance] = useState(currentIqdBalance);
    const [usd_balance, setUsdBalance] = useState(currentUsdBalance);
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
        documentNumber: '',
        amount: '',
        currency: 'iqd', // 'iqd' أو 'usd'
        description: '',
        employeeName: user?.name || 'الموظف الحالي',
        paidTo: '',
        selectedCustomer: null,
        exchangeType: 'general', // 'customer' أو 'general'
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
        setFormData(prev => {
            const newData = { ...prev };

            // معالجة خاصة للحقول الرقمية
            if (field === 'amount') {
                // إزالة الفواصل وتنظيف القيمة
                const cleanValue = formatInputNumber(value);
                newData[field] = cleanValue;
            } else if (field === 'exchangeType') {
                // عند تغيير نوع الصرف، إعادة تعيين الحقول المتعلقة
                newData[field] = value;
                if (value === 'customer') {
                    // إعادة تعيين بيانات العميل
                    newData.paidTo = '';
                    newData.selectedCustomer = null;
                } else {
                    // إعادة تعيين بيانات الصرف العام
                    newData.paidTo = '';
                    newData.selectedCustomer = null;
                    newData.currency = 'iqd'; // العملة الافتراضية للصرف العام
                }
            } else {
                newData[field] = value;
            }

            return newData;
        });

        // إعادة تعيين حالة البحث عند تغيير نوع الصرف
        if (field === 'exchangeType') {
            setSearchQuery('');
            setShowCustomerDropdown(false);
        }
    };

    // جلب العملاء من الخادم
    const fetchCustomers = async () => {
        setIsLoadingCustomers(true);
        try {
            const response = await fetch('/api/customers/search', {
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

        // تحديث formData.paidTo للصرف العام
        setFormData(prev => ({
            ...prev,
            paidTo: query
            // لا نمسح selectedCustomer هنا لأنه سيتم مسحه من onChange
        }));

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
    };    // اختيار عميل من القائمة
    const handleSelectCustomer = (customer) => {
        setFormData(prev => ({
            ...prev,
            paidTo: customer.name,
            selectedCustomer: customer
        }));
        setSearchQuery(''); // مسح البحث بعد الاختيار
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

            const response = await fetch('/api/customers', {
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

                alert('تم إضافة العميل بنجاح!');
            } else {
                const error = await response.json();
                console.error('خطأ في إنشاء العميل:', error);
                alert(error.message || 'حدث خطأ في إضافة العميل');
            }
        } catch (error) {
            console.error('خطأ في الشبكة:', error);
            alert('حدث خطأ في الشبكة');
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

        // التحقق من متطلبات كل نوع صرف
        if (formData.exchangeType === 'customer' && !formData.selectedCustomer) {
            throw new Error('يرجى اختيار العميل');
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
                paidTo: formData.exchangeType === 'general' ? (formData.paidTo || 'غير محدد') : formData.selectedCustomer?.name,
                selectedCustomer: formData.exchangeType === 'customer' ? formData.selectedCustomer : null,
                exchangeType: formData.exchangeType,
                notes: formData.notes
            })
        });

        if (response.ok) {
            const result = await response.json();

            // تحديث الرصيد المناسب حسب العملة
            if (result.currency_type === 'usd') {
                setUsdBalance(result.new_balance);
            } else {
                setIqdBalance(result.new_balance);
                setBalance(result.new_balance); // للتوافق مع الكود الحالي
            }

            // تحديث تقرير اليوم بالبيانات الحديثة من الخادم
            if (result.updated_report) {
                setTodayReport({
                    exchanged_today: result.updated_report.exchanged_today,
                    operations: result.updated_report.operations,
                    total_exchanged: result.updated_report.total_exchanged,
                    total_received: result.updated_report.total_received,
                    current_iqd_balance: result.updated_report.current_iqd_balance || iqd_balance,
                    current_usd_balance: result.updated_report.current_usd_balance || usd_balance
                });
            }

            // إعادة تعيين النموذج
            setFormData(prev => ({
                ...prev,
                amount: '',
                description: '',
                paidTo: '',
                selectedCustomer: null,
                notes: '',
                currentTime: new Date().toLocaleString('ar-EG')
            }));

            // إعادة تعيين بيانات البحث
            setSearchQuery('');
            setShowCustomerDropdown(false);

            // إعادة جلب العملاء لتحديث الأرصدة
            await fetchCustomers();

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

        // التحقق من متطلبات كل نوع صرف
        if (formData.exchangeType === 'customer' && !formData.selectedCustomer) {
            alert('يرجى اختيار العميل');
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
                    currency: formData.currency,
                    description: formData.description,
                    paidTo: formData.exchangeType === 'general' ? (formData.paidTo || 'غير محدد') : formData.selectedCustomer?.name,
                    selectedCustomer: formData.exchangeType === 'customer' ? formData.selectedCustomer : null,
                    exchangeType: formData.exchangeType,
                    notes: formData.notes
                })
            });

            if (response.ok) {
                const result = await response.json();

                // تحديث الرصيد المناسب حسب العملة
                if (result.currency_type === 'usd') {
                    setUsdBalance(result.new_balance);
                } else {
                    setIqdBalance(result.new_balance);
                    setBalance(result.new_balance); // للتوافق مع الكود الحالي
                }

                // تحديث تقرير اليوم بالبيانات الحديثة من الخادم
                if (result.updated_report) {
                    setTodayReport({
                        exchanged_today: result.updated_report.exchanged_today,
                        operations: result.updated_report.operations,
                        total_exchanged: result.updated_report.total_exchanged,
                        total_received: result.updated_report.total_received,
                        current_iqd_balance: result.updated_report.current_iqd_balance || iqd_balance,
                        current_usd_balance: result.updated_report.current_usd_balance || usd_balance
                    });
                }

                // إعادة تعيين النموذج
                setFormData(prev => ({
                    ...prev,
                    amount: '',
                    description: '',
                    paidTo: '',
                    selectedCustomer: null,
                    notes: '',
                    currentTime: new Date().toLocaleString('ar-EG')
                }));

                // إعادة تعيين بيانات البحث
                setSearchQuery('');
                setShowCustomerDropdown(false);

                // إعادة جلب العملاء لتحديث الأرصدة
                await fetchCustomers();

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
                                <h2 className="text-xl font-bold text-gray-900">الأرصدة الحالية</h2>
                            </div>

                            {/* عرض الأرصدة */}
                            <div className="space-y-4 mb-6">
                                {/* رصيد الدينار العراقي */}
                                <div className="bg-green-50 rounded-xl p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-semibold text-green-800 mb-1">رصيد الدينار</h3>
                                            <p className="text-xl font-bold text-green-700">
                                                {formatNumber(iqd_balance)} د.ع
                                            </p>
                                        </div>
                                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                            <span className="text-green-600">💵</span>
                                        </div>
                                    </div>
                                </div>

                                {/* رصيد الدولار */}
                                <div className="bg-blue-50 rounded-xl p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-semibold text-blue-800 mb-1">رصيد الدولار</h3>
                                            <p className="text-xl font-bold text-blue-700">
                                                {formatNumber(usd_balance)} $
                                            </p>
                                        </div>
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <span className="text-blue-600">💲</span>
                                        </div>
                                    </div>
                                </div>

                                {/* الرصيد الافتتاحي */}
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">الرصيد الافتتاحي (نقداً):</span>
                                        <span className="font-bold text-gray-800">
                                            {formatNumber(openingBalance > 0 ? Math.floor(openingBalance) : 0)} د.ع
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
                                        <span className="font-bold text-green-800">{formatNumber(todayReport.total_received > 0 ? Math.floor(todayReport.total_received) : 0)} د.ع</span>
                                    </div>
                                </div>

                                <div className="bg-red-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-red-700">مصروف اليوم:</span>
                                        <span className="font-bold text-red-800">{formatNumber(todayReport.exchanged_today > 0 ? Math.floor(todayReport.exchanged_today) : 0)} د.ع</span>
                                    </div>
                                </div>

                                <div className="bg-blue-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-blue-700">إجمالي المصروف:</span>
                                        <span className="font-bold text-blue-800">{formatNumber(todayReport.total_exchanged > 0 ? Math.floor(todayReport.total_exchanged) : 0)} د.ع</span>
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

                            {/* اختيار نوع الصرف */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3 text-right">
                                    نوع الصرف:
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div
                                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                            formData.exchangeType === 'customer'
                                                ? 'border-red-500 bg-red-50 text-red-700'
                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                        }`}
                                        onClick={() => handleInputChange('exchangeType', 'customer')}
                                    >
                                        <div className="text-center">
                                            <div className="text-2xl mb-2">👤</div>
                                            <div className="font-medium">صرف لعميل</div>
                                            <div className="text-xs text-gray-500 mt-1">يتم ربطه برصيد العميل</div>
                                        </div>
                                    </div>
                                    <div
                                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                            formData.exchangeType === 'general'
                                                ? 'border-red-500 bg-red-50 text-red-700'
                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                        }`}
                                        onClick={() => handleInputChange('exchangeType', 'general')}
                                    >
                                        <div className="text-center">
                                            <div className="text-2xl mb-2">💸</div>
                                            <div className="font-medium">صرف عام</div>
                                            <div className="text-xs text-gray-500 mt-1">مصاريف أو صرف آخر</div>
                                        </div>
                                    </div>
                                </div>
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

                            {/* اسم مدخل البيانات وصُرف للسيد */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        اسم مدخل البيانات:
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-right bg-gray-50"
                                        value={formData.employeeName}
                                        readOnly
                                    />
                                </div>

                                {/* صُرف للسيد - يظهر فقط عند اختيار "صرف لعميل" */}
                                {formData.exchangeType === 'customer' && (
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                            صُرف للسيد: *
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-right"
                                                placeholder="ابحث عن عميل أو أدخل اسم جديد..."
                                                value={formData.selectedCustomer ? formData.selectedCustomer.name : searchQuery}
                                                onChange={(e) => {
                                                    // إذا كان هناك عميل مختار وبدأ المستخدم بالكتابة، امسح العميل
                                                    if (formData.selectedCustomer) {
                                                        setFormData(prev => ({ ...prev, selectedCustomer: null, paidTo: '' }));
                                                    }
                                                    handleCustomerSearch(e.target.value);
                                                }}
                                                onFocus={() => {
                                                    if (customers.length > 0) {
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
                                                    <span className="text-green-500 text-xl">✓</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* قائمة العملاء المنسدلة */}
                                        {showCustomerDropdown && searchQuery && !formData.selectedCustomer && (
                                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                {filteredCustomers.length > 0 ? (
                                                    <>
                                                        {filteredCustomers.map((customer) => (
                                                            <div
                                                                key={customer.id}
                                                                className="px-4 py-3 hover:bg-red-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                                                onClick={() => handleSelectCustomer(customer)}
                                                            >
                                                                <div className="flex justify-between items-center">
                                                                    <div className="text-left">
                                                                        <span className="text-xs text-gray-500">{customer.customer_code}</span>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="font-medium text-gray-900">{customer.name}</div>
                                                                        <div className="text-sm text-gray-600">{customer.phone}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </>
                                                ) : null}

                                                {/* زر إضافة عميل جديد - يظهر دائماً عند البحث */}
                                                {searchQuery && searchQuery.trim() !== '' && (
                                                    <div
                                                        className={`px-4 py-3 hover:bg-green-50 cursor-pointer text-center text-green-700 font-medium ${
                                                            filteredCustomers.length > 0 ? 'border-t-2 border-green-200' : ''
                                                        }`}
                                                        onClick={() => setShowAddCustomerModal(true)}
                                                    >
                                                        ➕ إضافة عميل جديد: "{searchQuery}"
                                                    </div>
                                                )}

                                                {/* رسالة عدم وجود عملاء - تظهر فقط عند عدم وجود نتائج وعدم وجود بحث */}
                                                {!searchQuery && filteredCustomers.length === 0 && (
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
                                                    <div className={`text-center p-2 rounded border-2 ${formData.currency === 'usd' ? 'bg-green-100 border-green-400' : 'bg-white border-gray-200'}`}>
                                                        <div className="text-gray-600">الرصيد USD</div>
                                                        <div className={`font-bold ${formData.currency === 'usd' ? 'text-green-700 text-lg' : 'text-red-700'}`}>
                                                            ${formatNumber(formData.selectedCustomer.current_usd_balance || 0)}
                                                        </div>
                                                        {formData.currency === 'usd' && <div className="text-xs text-green-600 mt-1">✓ مختارة</div>}
                                                    </div>
                                                    <div className={`text-center p-2 rounded border-2 ${formData.currency === 'iqd' ? 'bg-green-100 border-green-400' : 'bg-white border-gray-200'}`}>
                                                        <div className="text-gray-600">الرصيد IQD</div>
                                                        <div className={`font-bold ${formData.currency === 'iqd' ? 'text-green-700 text-lg' : 'text-red-700'}`}>
                                                            {formatNumber(formData.selectedCustomer.current_iqd_balance || 0)} د.ع
                                                        </div>
                                                        {formData.currency === 'iqd' && <div className="text-xs text-green-600 mt-1">✓ مختارة</div>}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* المبلغ والعملة ووصف السبب */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        المبلغ: *
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-right"
                                        placeholder={formData.exchangeType === 'customer' && formData.currency === 'usd' ? "أدخل المبلغ بالدولار" : "أدخل المبلغ بالدينار العراقي"}
                                        value={addCommasToInput(formData.amount)}
                                        onChange={(e) => handleInputChange('amount', e.target.value)}
                                    />
                                </div>

                                {/* اختيار العملة - يظهر فقط للعملاء */}
                                {formData.exchangeType === 'customer' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                            العملة: *
                                        </label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-right"
                                            value={formData.currency}
                                            onChange={(e) => handleInputChange('currency', e.target.value)}
                                        >
                                            <option value="iqd">دينار عراقي (IQD)</option>
                                            <option value="usd">دولار أمريكي (USD)</option>
                                        </select>
                                    </div>
                                )}

                                <div className={formData.exchangeType === 'customer' ? 'md:col-span-1' : 'md:col-span-2'}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        وصف السبب الدفع: *
                                    </label>
                                    <textarea
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-right"
                                        rows="3"
                                        placeholder="اكتب سبب الدفع والتفاصيل..."
                                        value={formData.description}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                    />
                                </div>
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
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-right"
                                            placeholder="0.00 (يمكن أن يكون سالب)"
                                            value={addCommasToInput(newCustomerData.opening_balance_usd)}
                                            onChange={(e) => setNewCustomerData(prev => ({ ...prev, opening_balance_usd: formatInputNumber(e.target.value) }))}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                            الرصيد الافتتاحي IQD
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-right"
                                            placeholder="0 (يمكن أن يكون سالب)"
                                            value={addCommasToInput(newCustomerData.opening_balance_iqd)}
                                            onChange={(e) => setNewCustomerData(prev => ({ ...prev, opening_balance_iqd: formatInputNumber(e.target.value) }))}
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
        </EmployeeLayout>
    );
}
