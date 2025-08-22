import React, { useState } from 'react';
import { Head, usePage, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function TreasuryIndex() {
    const { treasury, todayStats, recentMovements } = usePage().props;
    const [activeTab, setActiveTab] = useState('overview');

    // نموذج إضافة مبالغ للخزنة
    const addFundsForm = useForm({
        naqa: '',
        rafidain: '',
        rashid: '',
        zain_cash: '',
        super_key: '',
        usd_cash: '',
        source_description: '',
        notes: ''
    });

    // نموذج تحديث سعر الصرف
    const exchangeRateForm = useForm({
        exchange_rate: treasury?.current_exchange_rate || '1400'
    });

    const handleAddFunds = (e) => {
        e.preventDefault();
        addFundsForm.post('/admin/treasury/add-funds', {
            onSuccess: () => {
                addFundsForm.reset();
                setActiveTab('overview');
            }
        });
    };

    const handleExchangeRateUpdate = (e) => {
        e.preventDefault();
        exchangeRateForm.post('/admin/treasury/exchange-rate', {
            onSuccess: () => {
                exchangeRateForm.reset();
            }
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ar-IQ', {
            style: 'currency',
            currency: 'IQD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount || 0);
    };

    const formatNumber = (amount) => {
        return new Intl.NumberFormat('ar-IQ').format(amount || 0);
    };

    // حساب إجمالي المبالغ المدخلة
    const calculateTotal = () => {
        const naqa = parseFloat(addFundsForm.data.naqa) || 0;
        const rafidain = parseFloat(addFundsForm.data.rafidain) || 0;
        const rashid = parseFloat(addFundsForm.data.rashid) || 0;
        const zain_cash = parseFloat(addFundsForm.data.zain_cash) || 0;
        const super_key = parseFloat(addFundsForm.data.super_key) || 0;
        const usd_cash = parseFloat(addFundsForm.data.usd_cash) || 0;

        const totalIQD = naqa + rafidain + rashid + zain_cash + super_key;
        const exchangeRate = parseFloat(treasury?.current_exchange_rate) || 1400;
        const totalInIQD = totalIQD + (usd_cash * exchangeRate);

        return {
            totalIQD,
            totalUSD: usd_cash,
            grandTotal: totalInIQD
        };
    };

    const totals = calculateTotal();

    return (
        <AdminLayout>
            <Head title="الخزنة الرئيسية - إضافة أموال" />

            <div className="space-y-6">
                {/* العنوان */}
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">الخزنة الرئيسية</h1>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            className={`px-4 py-2 rounded-lg font-medium ${
                                activeTab === 'overview'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                            onClick={() => setActiveTab('overview')}
                        >
                            نظرة عامة
                        </button>
                        <button
                            type="button"
                            className={`px-4 py-2 rounded-lg font-medium ${
                                activeTab === 'add-funds'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                            onClick={() => setActiveTab('add-funds')}
                        >
                            إضافة مبالغ
                        </button>
                    </div>
                </div>

                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* إحصائيات سريعة */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-lg shadow-md p-6 border">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">الإجمالي العام</p>
                                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(treasury?.grand_total)}</p>
                                    </div>
                                    <div className="text-3xl">💰</div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6 border">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">الدولار النقدي</p>
                                        <p className="text-2xl font-bold text-green-600">${formatNumber(treasury?.usd_cash_balance)}</p>
                                    </div>
                                    <div className="text-3xl">💵</div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6 border">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">سعر الصرف</p>
                                        <p className="text-2xl font-bold text-blue-600">{formatNumber(treasury?.current_exchange_rate)}</p>
                                    </div>
                                    <div className="text-3xl">💱</div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6 border">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">تاريخ اليوم</p>
                                        <p className="text-lg font-bold text-gray-900">{new Date().toLocaleDateString('ar-IQ')}</p>
                                    </div>
                                    <div className="text-3xl">📅</div>
                                </div>
                            </div>
                        </div>

                        {/* تفاصيل الأرصدة */}
                        <div className="bg-white rounded-lg shadow-md border">
                            <div className="px-6 py-4 border-b">
                                <h3 className="text-lg font-semibold text-gray-900">تفاصيل الأرصدة</h3>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="text-sm font-medium text-gray-600 mb-2">النقد</h4>
                                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(treasury?.naqa_balance)}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="text-sm font-medium text-gray-600 mb-2">مصرف الرافدين</h4>
                                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(treasury?.rafidain_balance)}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="text-sm font-medium text-gray-600 mb-2">مصرف الرشيد</h4>
                                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(treasury?.rashid_balance)}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="text-sm font-medium text-gray-600 mb-2">زين كاش</h4>
                                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(treasury?.zain_cash_balance)}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="text-sm font-medium text-gray-600 mb-2">سوبر كي</h4>
                                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(treasury?.super_key_balance)}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="text-sm font-medium text-gray-600 mb-2">الدولار النقدي</h4>
                                        <p className="text-2xl font-bold text-green-600">${formatNumber(treasury?.usd_cash_balance)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* تحديث سعر الصرف */}
                        <div className="bg-white rounded-lg shadow-md border">
                            <div className="px-6 py-4 border-b">
                                <h3 className="text-lg font-semibold text-gray-900">تحديث سعر الصرف</h3>
                            </div>
                            <div className="p-6">
                                <form onSubmit={handleExchangeRateUpdate} className="flex gap-4 items-end">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">سعر الصرف (د.ع مقابل $1)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={exchangeRateForm.data.exchange_rate}
                                            onChange={(e) => exchangeRateForm.setData('exchange_rate', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={exchangeRateForm.processing}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                                    >
                                        {exchangeRateForm.processing ? 'جاري التحديث...' : 'تحديث'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* نموذج إضافة مبالغ للخزنة */}
                {activeTab === 'add-funds' && (
                    <div className="bg-white rounded-lg shadow-md border">
                        <div className="px-6 py-4 border-b bg-green-50">
                            <h3 className="text-lg font-semibold text-gray-900">إضافة مبالغ للخزنة الرئيسية</h3>
                            <p className="text-sm text-gray-600 mt-1">أضف الأموال إلى الخزنة الرئيسية من مصادر مختلفة</p>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleAddFunds} className="space-y-6">
                                {/* المبالغ */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">النقد (د.ع)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={addFundsForm.data.naqa}
                                            onChange={(e) => addFundsForm.setData('naqa', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                                            placeholder="0.00"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">مصرف الرافدين (د.ع)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={addFundsForm.data.rafidain}
                                            onChange={(e) => addFundsForm.setData('rafidain', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                                            placeholder="0.00"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">مصرف الرشيد (د.ع)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={addFundsForm.data.rashid}
                                            onChange={(e) => addFundsForm.setData('rashid', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                                            placeholder="0.00"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">زين كاش (د.ع)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={addFundsForm.data.zain_cash}
                                            onChange={(e) => addFundsForm.setData('zain_cash', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                                            placeholder="0.00"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">سوبر كي (د.ع)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={addFundsForm.data.super_key}
                                            onChange={(e) => addFundsForm.setData('super_key', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                                            placeholder="0.00"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">الدولار النقدي ($)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={addFundsForm.data.usd_cash}
                                            onChange={(e) => addFundsForm.setData('usd_cash', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                {/* عرض الإجمالي */}
                                {(totals.totalIQD > 0 || totals.totalUSD > 0) && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <h4 className="text-sm font-medium text-blue-800 mb-2">إجمالي المبالغ المدخلة:</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <span className="text-blue-600">إجمالي الدينار العراقي: </span>
                                                <span className="font-bold">{formatCurrency(totals.totalIQD)}</span>
                                            </div>
                                            <div>
                                                <span className="text-blue-600">إجمالي الدولار: </span>
                                                <span className="font-bold">${formatNumber(totals.totalUSD)}</span>
                                            </div>
                                            <div>
                                                <span className="text-blue-600">الإجمالي العام: </span>
                                                <span className="font-bold text-lg">{formatCurrency(totals.grandTotal)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* معلومات إضافية */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">مصدر الأموال <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={addFundsForm.data.source_description}
                                            onChange={(e) => addFundsForm.setData('source_description', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                                            placeholder="مثال: إيداع نقدي، تحويل بنكي، أرباح سابقة، إلخ"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                                        <textarea
                                            value={addFundsForm.data.notes}
                                            onChange={(e) => addFundsForm.setData('notes', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                                            placeholder="ملاحظات إضافية أو تفاصيل أخرى"
                                            rows="3"
                                        />
                                    </div>
                                </div>

                                {/* أزرار التحكم */}
                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={() => addFundsForm.reset()}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                    >
                                        مسح الحقول
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={addFundsForm.processing}
                                        className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {addFundsForm.processing ? 'جاري الإضافة...' : '💰 إضافة المبالغ للخزنة'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
