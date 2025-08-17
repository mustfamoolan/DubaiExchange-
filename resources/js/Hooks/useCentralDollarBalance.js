import { useState, useEffect } from 'react';

export const useCentralDollarBalance = (initialBalance = 0) => {
    const [centralDollarBalance, setCentralDollarBalance] = useState(initialBalance || 0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // جلب الرصيد الحالي من الخادم
    const fetchCurrentDollarBalance = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/employee/dollar-balance/current', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                }
            });

            if (response.ok) {
                const data = await response.json();
                setCentralDollarBalance(data.current_balance || 0);
                return data.current_balance || 0;
            } else {
                throw new Error('فشل في جلب رصيد الدولار');
            }
        } catch (err) {
            console.error('Error fetching dollar balance:', err);
            setError(err.message);
            return centralDollarBalance; // إرجاع الرصيد الحالي في حالة الخطأ
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
