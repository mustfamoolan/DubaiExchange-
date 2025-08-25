import { useState, useEffect } from 'react';

export const useCentralDollarBalance = (initialBalance = 0) => {
    const [centralDollarBalance, setCentralDollarBalance] = useState(initialBalance || 0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // جلب الرصيد الحالي من الخادم مع error handling محسن
    const fetchCurrentDollarBalance = async () => {
        // تجنب multiple requests في نفس الوقت
        if (isLoading) {
            return centralDollarBalance;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/employee/dollar-balance/current', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                },
                // إضافة timeout لتجنب التعليق
                signal: AbortSignal.timeout(10000) // 10 ثواني timeout
            });

            if (response.ok) {
                const data = await response.json();
                const newBalance = parseFloat(data.current_balance) || 0;
                setCentralDollarBalance(newBalance);
                return newBalance;
            } else {
                console.warn('فشل في جلب رصيد الدولار، سيتم استخدام القيمة الحالية');
                setError('فشل في تحديث الرصيد');
                return centralDollarBalance;
            }
        } catch (err) {
            console.error('Error fetching dollar balance:', err);
            if (err.name === 'TimeoutError') {
                setError('انتهت مهلة الاتصال');
            } else if (err.name === 'AbortError') {
                setError('تم إلغاء الطلب');
            } else {
                setError(err.message || 'خطأ في الشبكة');
            }
            // إرجاع الرصيد الحالي في حالة الخطأ بدلاً من undefined
            return centralDollarBalance;
        } finally {
            setIsLoading(false);
        }
    };

    // تحديث الرصيد بعد المعاملة
    const updateBalanceAfterTransaction = (newBalance) => {
        if (newBalance !== undefined && newBalance !== null) {
            setCentralDollarBalance(parseFloat(newBalance) || 0);
        }
    };

    // تحديث الرصيد بمقدار معين
    const adjustBalance = (amount) => {
        setCentralDollarBalance(prev => (parseFloat(prev) || 0) + (parseFloat(amount) || 0));
    };

    // إعادة تعيين الرصيد
    const resetBalance = (newBalance = 0) => {
        setCentralDollarBalance(parseFloat(newBalance) || 0);
    };

    // تحديث الرصيد عند تغيير initialBalance
    useEffect(() => {
        if (initialBalance !== undefined && initialBalance !== null) {
            setCentralDollarBalance(parseFloat(initialBalance) || 0);
        }
    }, [initialBalance]);

    return {
        centralDollarBalance: parseFloat(centralDollarBalance) || 0,
        isLoading,
        error,
        fetchCurrentDollarBalance,
        updateBalanceAfterTransaction,
        adjustBalance,
        resetBalance,
        setCentralDollarBalance
    };
};
