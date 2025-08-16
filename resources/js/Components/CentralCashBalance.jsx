import React from 'react';
import { useCentralCashBalance, useCashBalanceStats } from '../Hooks/useCentralCashBalance';

/**
 * مكون عرض الرصيد النقدي المركزي
 * يمكن استخدامه في أي صفحة
 */
export default function CentralCashBalance({
    initialBalance = 0,
    showStats = false,
    className = "",
    size = "normal" // "small", "normal", "large"
}) {
    const { centralCashBalance, isUpdating, fetchCurrentCashBalance } = useCentralCashBalance(initialBalance);
    const { stats, isLoading: statsLoading } = useCashBalanceStats();

    // تحديد أحجام النصوص حسب الحجم المطلوب
    const sizeClasses = {
        small: "text-sm",
        normal: "text-base",
        large: "text-lg"
    };

    const refreshBalance = () => {
        fetchCurrentCashBalance();
    };

    return (
        <div className={`bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg ${className}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className="bg-white bg-opacity-20 rounded-full p-2">
                        <span className="text-xl">💵</span>
                    </div>
                    <div>
                        <h3 className={`font-bold ${sizeClasses[size]}`}>
                            الرصيد النقدي المركزي
                        </h3>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <span className={`font-bold ${size === 'large' ? 'text-2xl' : size === 'small' ? 'text-lg' : 'text-xl'}`}>
                                {Math.floor(centralCashBalance).toLocaleString('en-US')} د.ع
                            </span>
                            {isUpdating && (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            )}
                        </div>
                    </div>
                </div>

                <button
                    onClick={refreshBalance}
                    disabled={isUpdating}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-2 transition-all duration-200 disabled:opacity-50"
                    title="تحديث الرصيد"
                >
                    <svg
                        className={`w-5 h-5 ${isUpdating ? 'animate-spin' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                </button>
            </div>

            {/* عرض الإحصائيات الإضافية */}
            {showStats && !statsLoading && (
                <div className="mt-4 pt-4 border-t border-white border-opacity-20">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="opacity-80">الرصيد الافتتاحي:</span>
                            <br />
                            <span className="font-semibold">
                                {Math.floor(stats.opening_balance).toLocaleString('en-US')} د.ع
                            </span>
                        </div>
                        <div>
                            <span className="opacity-80">الفرق:</span>
                            <br />
                            <span className={`font-semibold ${stats.difference >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                                {stats.difference >= 0 ? '+' : ''}{Math.floor(stats.difference).toLocaleString('en-US')} د.ع
                            </span>
                        </div>
                    </div>

                    {stats.last_transaction && (
                        <div className="mt-3 text-xs opacity-80">
                            آخر معاملة: {stats.last_transaction.type} - {stats.last_transaction.source}
                            <br />
                            المبلغ: {Math.floor(stats.last_transaction.amount).toLocaleString('en-US')} د.ع
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * مكون مبسط لعرض الرصيد فقط (بدون إحصائيات)
 */
export function SimpleCashBalance({ initialBalance = 0, className = "" }) {
    return (
        <CentralCashBalance
            initialBalance={initialBalance}
            showStats={false}
            size="small"
            className={className}
        />
    );
}

/**
 * مكون مفصل لعرض الرصيد مع الإحصائيات
 */
export function DetailedCashBalance({ initialBalance = 0, className = "" }) {
    return (
        <CentralCashBalance
            initialBalance={initialBalance}
            showStats={true}
            size="large"
            className={className}
        />
    );
}
