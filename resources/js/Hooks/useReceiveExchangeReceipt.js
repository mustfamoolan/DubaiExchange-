import { useState } from 'react';

export function useReceiveExchangeReceipt() {
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState(null);
    const [isCreatingReceipt, setIsCreatingReceipt] = useState(false);

    // إنشاء فاتورة سند القبض/الصرف
    const createReceiveExchangeReceipt = (transactionData, receiptType = 'receive') => {
        const receipt = {
            reference_number: transactionData.documentNumber || transactionData.reference_number,
            employee_name: transactionData.receiverName || transactionData.employee_name || 'الموظف الحالي',
            person_name: transactionData.receivedFrom || transactionData.paidTo || transactionData.person_name,
            currency: transactionData.currency,
            amount: transactionData.amount,
            exchange_rate: transactionData.exchange_rate,
            amount_in_iqd: transactionData.amount_in_iqd || (parseFloat(transactionData.amount) * parseFloat(transactionData.exchange_rate || 1)),
            beneficiary: transactionData.beneficiary || 'الصندوق النقدي',
            description: transactionData.description,
            notes: transactionData.notes,
            receipt_type: receiptType,
            created_at: new Date().toISOString()
        };

        setReceiptData(receipt);
        setShowReceipt(true);
        return receipt;
    };

    // حفظ المعاملة وإنشاء الفاتورة
    const createReceiptAndSave = async (saveFunction, transactionData, receiptType = 'receive') => {
        setIsCreatingReceipt(true);
        try {
            // تنفيذ عملية الحفظ أولاً
            const saveResult = await saveFunction();

            if (saveResult && saveResult.success !== false) {
                // إنشاء بيانات الفاتورة من transactionData
                const receiptDataForCreation = {
                    documentNumber: transactionData.reference_number || transactionData.documentNumber,
                    receiverName: transactionData.employee_name || 'الموظف الحالي',
                    receivedFrom: transactionData.person_name || transactionData.receivedFrom || transactionData.paidTo,
                    currency: transactionData.currency,
                    amount: transactionData.amount,
                    exchange_rate: transactionData.exchange_rate,
                    beneficiary: transactionData.beneficiary || 'الصندوق النقدي',
                    description: transactionData.description,
                    notes: transactionData.notes
                };

                // إنشاء الفاتورة
                createReceiveExchangeReceipt(receiptDataForCreation, receiptType);

                return { success: true, data: saveResult };
            } else {
                throw new Error(saveResult.error || 'فشل في حفظ المعاملة');
            }
        } catch (error) {
            console.error('خطأ في createReceiptAndSave:', error);
            alert(error.message || 'حدث خطأ في العملية');
            return { success: false, error: error.message };
        } finally {
            setIsCreatingReceipt(false);
        }
    };

    // طباعة الفاتورة
    const printReceipt = () => {
        console.log('تم طباعة فاتورة سند القبض/الصرف');
    };

    // إغلاق الفاتورة
    const closeReceipt = () => {
        setShowReceipt(false);
        setReceiptData(null);
    };

    return {
        showReceipt,
        receiptData,
        isCreatingReceipt,
        createReceiveExchangeReceipt,
        createReceiptAndSave,
        printReceipt,
        closeReceipt
    };
}
