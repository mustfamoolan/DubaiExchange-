import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';

/**
 * Hook مشترك لإدارة الرصيد النقدي المركزي
 * يمكن استخدامه في جميع صفحات العمليات
 */
export function useCentralCashBalance(initialCashBalance = 0) {
    const [centralCashBalance, setCentralCashBalance] = useState(initialCashBalance);
    const [isUpdating, setIsUpdating] = useState(false);

    // تحديث الرصيد النقدي المركزي
    const updateCentralCashBalance = (newBalance) => {
        setCentralCashBalance(newBalance);
    };

    // جلب الرصيد النقدي الحالي من الخادم
    const fetchCurrentCashBalance = async () => {
        try {
            setIsUpdating(true);
            // استخدام current page reload بدلاً من API call
            // لأن Laravel controllers ترسل البيانات مباشرة للصفحة
            window.location.reload();
        } catch (error) {
            console.error('خطأ في جلب الرصيد النقدي المركزي:', error);
        } finally {
            setIsUpdating(false);
        }
        return centralCashBalance;
    };

    // تحديث الرصيد بعد المعاملة
    const updateBalanceAfterTransaction = (newBalance) => {
        setCentralCashBalance(newBalance);

        // إشعار جميع المكونات الأخرى بالتحديث
        window.dispatchEvent(new CustomEvent('cashBalanceUpdated', {
            detail: { newBalance }
        }));
    };

    // الاستماع لتحديثات الرصيد من مكونات أخرى
    useEffect(() => {
        const handleCashBalanceUpdate = (event) => {
            setCentralCashBalance(event.detail.newBalance);
        };

        window.addEventListener('cashBalanceUpdated', handleCashBalanceUpdate);

        return () => {
            window.removeEventListener('cashBalanceUpdated', handleCashBalanceUpdate);
        };
    }, []);

    // جلب الرصيد عند تحميل المكون
    useEffect(() => {
        if (initialCashBalance === 0) {
            fetchCurrentCashBalance();
        }
    }, []);

    return {
        centralCashBalance,
        setCentralCashBalance: updateCentralCashBalance,
        updateBalanceAfterTransaction,
        fetchCurrentCashBalance,
        isUpdating
    };
}

/**
 * Hook للحصول على إحصائيات الرصيد النقدي
 */
export function useCashBalanceStats() {
    const [stats, setStats] = useState({
        current_balance: 0,
        opening_balance: 0,
        difference: 0,
        last_updated: null,
        last_transaction: null
    });
    const [isLoading, setIsLoading] = useState(false);

    const fetchStats = async () => {
        try {
            setIsLoading(true);
            // استخدام current page reload بدلاً من API call
            // لأن Laravel controllers ترسل البيانات مباشرة للصفحة
            console.log('Stats will be fetched on page reload');
        } catch (error) {
            console.error('خطأ في جلب إحصائيات الرصيد النقدي:', error);
        } finally {
            setIsLoading(false);
        }
        return stats;
    };

    useEffect(() => {
        fetchStats();
    }, []);

    return {
        stats,
        fetchStats,
        isLoading
    };
}
