import React, { useState } from 'react';
import EmployeeLayout from '../../Layouts/EmployeeLayout';
import { router } from '@inertiajs/react';

export default function Buy() {
    const [formData, setFormData] = useState({
        documentNumber: 'BUY20250810001',
        currentTime: new Date().toLocaleString('ar-EG'),
        customerName: '',
        dollarAmount: '',
        exchangeRate: 1400, // سعر الصرف الافتراضي
        commission: '',
        notes: '',
        employeeName: 'الموظف الحالي - تلقائي'
    });

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // حساب المبلغ الكلي بالدولار
    const getTotalDollar = () => {
        const dollarAmount = parseFloat(formData.dollarAmount) || 0;
        const commission = parseFloat(formData.commission) || 0;
        return dollarAmount + commission;
    };

    // حساب المبلغ الكلي بالدينار العراقي
    const getTotalIQD = () => {
        return getTotalDollar() * formData.exchangeRate;
    };

    const handleSave = () => {
        console.log('حفظ البيانات:', formData);
        // منطق الحفظ
    };

    const handleSaveAndPrint = () => {
        console.log('حفظ وطباعة:', formData);
        // منطق الحفظ والطباعة
    };

    const handleBack = () => {
        router.visit('/employee/dashboard');
    };

    return (
        <EmployeeLayout title="شراء الدولار">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                    {/* العنوان مع زر العودة */}
                    <div className="flex items-center justify-between mb-8">
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-md"
                        >
                            <span>←</span>
                            العودة للصفحة الرئيسية
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">سند شراء دولار</h1>
                    </div>

                    {/* الوقت ورقم المستند */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                الوقت:
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-right bg-gray-50"
                                value={formData.currentTime}
                                readOnly
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                رقم المستند:
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-right bg-gray-50"
                                value={formData.documentNumber}
                                readOnly
                            />
                        </div>
                    </div>

                    {/* اسم العميل */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                            اسم العميل:
                        </label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-right"
                            placeholder="اسم العميل"
                            value={formData.customerName}
                            onChange={(e) => handleInputChange('customerName', e.target.value)}
                        />
                    </div>

                    {/* المبلغ بالدولار وسعر الصرف */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                المبلغ بالدولار:
                            </label>
                            <input
                                type="number"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-right"
                                placeholder="أدخل المبلغ بالدولار"
                                value={formData.dollarAmount}
                                onChange={(e) => handleInputChange('dollarAmount', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                سعر الصرف:
                            </label>
                            <input
                                type="number"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-right bg-gray-50"
                                value={formData.exchangeRate}
                                readOnly
                            />
                        </div>
                    </div>

                    {/* العمولة */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                            العمولة (بالدولار):
                        </label>
                        <input
                            type="number"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-right"
                            placeholder="العمولة"
                            value={formData.commission}
                            onChange={(e) => handleInputChange('commission', e.target.value)}
                        />
                    </div>

                    {/* عرض المبالغ الكلية */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-cyan-50 rounded-xl p-4">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-cyan-800">المبلغ الكلي (دولار):</span>
                                <span className="text-2xl font-bold text-cyan-700">${getTotalDollar().toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-green-800">المبلغ الكلي (د.ع):</span>
                                <span className="text-2xl font-bold text-green-700">{getTotalIQD().toLocaleString()} د.ع</span>
                            </div>
                        </div>
                    </div>

                    {/* ملاحظات */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                            ملاحظات:
                        </label>
                        <textarea
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-right"
                            rows="3"
                            placeholder="ملاحظات إضافية..."
                            value={formData.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                        />
                    </div>

                    {/* اسم الموظف */}
                    <div className="mb-8">
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                            اسم الموظف:
                        </label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-right bg-gray-50"
                            value={formData.employeeName}
                            readOnly
                        />
                    </div>

                    {/* أزرار الحفظ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={handleSave}
                            className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
                        >
                            <span className="ml-2">💾</span>
                            حفظ
                        </button>
                        <button
                            onClick={handleSaveAndPrint}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
                        >
                            <span className="ml-2">🖨️</span>
                            حفظ وطباعة
                        </button>
                    </div>
                </div>
            </div>
        </EmployeeLayout>
    );
}
