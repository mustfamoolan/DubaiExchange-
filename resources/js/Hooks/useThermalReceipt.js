import { useState } from 'react';

export const useThermalReceipt = () => {
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState(null);
    const [isCreatingReceipt, setIsCreatingReceipt] = useState(false);

    // إنشاء فاتورة حرارية
    const createReceipt = async (transactionData, serviceType) => {
        setIsCreatingReceipt(true);

        // طباعة في الكونسول للتحقق
        console.log('Creating thermal receipt:', {
            transactionData,
            serviceType,
            windowWidth: window.innerWidth,
            isMobile: window.innerWidth <= 768
        });

        try {
            const response = await fetch('/thermal-receipt/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                body: JSON.stringify({
                    transaction_type: transactionData.transaction_type,
                    service_type: serviceType,
                    reference_number: transactionData.reference_number,
                    amount: transactionData.amount,
                    commission: transactionData.commission,
                    notes: transactionData.notes,
                    customer_phone: transactionData.customer_phone || null
                })
            });

            if (response.ok) {
                const result = await response.json();
                setReceiptData(result.receipt_data);
                setShowReceipt(true);

                // طباعة في الكونسول للتحقق
                console.log('Receipt created successfully:', {
                    receiptData: result.receipt_data,
                    showReceipt: true,
                    windowWidth: window.innerWidth
                });

                return { success: true, receipt: result.receipt };
            } else {
                const error = await response.json();
                throw new Error(error.message || 'فشل في إنشاء الفاتورة');
            }
        } catch (error) {
            console.error('خطأ في إنشاء الفاتورة:', error);
            alert('حدث خطأ في إنشاء الفاتورة: ' + error.message);
            return { success: false, error: error.message };
        } finally {
            setIsCreatingReceipt(false);
        }
    };

    // طباعة الفاتورة
    const printReceipt = async () => {
        if (!receiptData || !receiptData.receipt_id) {
            return;
        }

        try {
            const response = await fetch(`/thermal-receipt/print/${receiptData.receipt_id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                }
            });

            if (response.ok) {
                return { success: true };
            } else {
                const error = await response.json();
                throw new Error(error.message || 'فشل في تسجيل الطباعة');
            }
        } catch (error) {
            console.error('خطأ في تسجيل الطباعة:', error);
            return { success: false, error: error.message };
        }
    };

    // إغلاق الفاتورة
    const closeReceipt = () => {
        setShowReceipt(false);
        setReceiptData(null);
    };

    // إنشاء فاتورة وحفظ المعاملة معاً
    const createReceiptAndSave = async (saveTransaction, transactionData, serviceType) => {
        try {
            // حفظ المعاملة أولاً
            const transactionResult = await saveTransaction();

            if (transactionResult && transactionResult.success !== false) {
                // إنشاء الفاتورة
                const receiptResult = await createReceipt({
                    ...transactionData,
                    transaction_type: transactionData.activeTab || transactionData.transaction_type
                }, serviceType);

                return {
                    success: true,
                    transaction: transactionResult,
                    receipt: receiptResult
                };
            } else {
                throw new Error(transactionResult?.error || 'فشل في حفظ المعاملة');
            }
        } catch (error) {
            console.error('خطأ في حفظ المعاملة وإنشاء الفاتورة:', error);
            alert('حدث خطأ: ' + error.message);
            return {
                success: false,
                error: error.message
            };
        }
    };

    // إنشاء فاتورة لعملية البيع
    const createSellReceipt = async (sellData) => {
        setIsCreatingReceipt(true);

        try {
            const response = await fetch('/thermal-receipt/create-sell', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                body: JSON.stringify({
                    reference_number: sellData.reference_number,
                    dollar_amount: sellData.dollar_amount,
                    exchange_rate: sellData.exchange_rate,
                    iqd_amount: sellData.iqd_amount,
                    commission: sellData.commission,
                    total_amount: sellData.total_amount,
                    notes: sellData.notes,
                    customer_phone: sellData.customer_phone || null
                })
            });

            if (response.ok) {
                const result = await response.json();
                setReceiptData(result.receipt_data);
                setShowReceipt(true);

                return { success: true, receipt: result.receipt };
            } else {
                const error = await response.json();
                throw new Error(error.message || 'فشل في إنشاء فاتورة البيع');
            }
        } catch (error) {
            console.error('Error creating sell receipt:', error);
            return { success: false, error: error.message };
        } finally {
            setIsCreatingReceipt(false);
        }
    };

    // إنشاء فاتورة لعملية الشراء
    const createBuyReceipt = async (buyData) => {
        setIsCreatingReceipt(true);

        try {
            const response = await fetch('/thermal-receipt/create-buy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                body: JSON.stringify({
                    reference_number: buyData.reference_number,
                    dollar_amount: buyData.dollar_amount,
                    exchange_rate: buyData.exchange_rate,
                    iqd_amount: buyData.iqd_amount,
                    commission: buyData.commission,
                    total_amount: buyData.total_amount,
                    notes: buyData.notes,
                    customer_phone: buyData.customer_phone || null
                })
            });

            if (response.ok) {
                const result = await response.json();
                setReceiptData(result.receipt_data);
                setShowReceipt(true);

                return { success: true, receipt: result.receipt };
            } else {
                const error = await response.json();
                throw new Error(error.message || 'فشل في إنشاء فاتورة الشراء');
            }
        } catch (error) {
            console.error('Error creating buy receipt:', error);
            return { success: false, error: error.message };
        } finally {
            setIsCreatingReceipt(false);
        }
    };

    return {
        showReceipt,
        receiptData,
        isCreatingReceipt,
        createReceipt,
        createSellReceipt,
        createBuyReceipt,
        printReceipt,
        closeReceipt,
        createReceiptAndSave
    };
};
