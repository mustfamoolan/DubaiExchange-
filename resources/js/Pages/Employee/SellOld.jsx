import React, { useState } from 'react';
import EmployeeLayout from '../../Layouts/EmployeeLayout';
import { router } from '@inertiajs/react';

export default function Sell() {
    const [currentBalance, setCurrentBalance] = useState(0);
    const [activeTab, setActiveTab] = useState('charge'); // 'charge' or 'payment'
    const [todayReport, setTodayReport] = useState({
        charges: 0,
        payments: 0,
        operations: 0
    });

    return (
        <EmployeeLayout title="عمليات البيع">
            <div className="max-w-7xl mx-auto">
                {/* زر الرجوع */}
                <div className="mb-6">
                    <button
                        onClick={() => router.visit('/employee/dashboard')}
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
                            {/* شعار البيع */}
                            <div className="text-center mb-6">
                                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <img
                                        src="/images/services/sell.png"
                                        alt="عمليات البيع"
                                        className="w-12 h-12 object-contain"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'block';
                                        }}
                                    />
                                    <span className="text-2xl text-orange-600 hidden">🏪</span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">الرصيد الحالي</h2>
                            </div>

                            {/* عرض الرصيد */}
                            <div className="bg-orange-50 rounded-xl p-6 mb-6">
                                <h3 className="text-lg font-semibold text-orange-800 mb-2">الرصيد المتبقي</h3>
                                <p className="text-3xl font-bold text-orange-700">
                                    {currentBalance.toLocaleString()} د.ع
                                </p>
                            </div>

                            {/* تقرير اليوم */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">تقرير سريع - اليوم</h3>

                                <div className="bg-red-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-red-700">شحن:</span>
                                        <span className="font-bold text-red-800">{todayReport.charges.toLocaleString()} د.ع</span>
                                    </div>
                                </div>

                                <div className="bg-green-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-green-700">دفع:</span>
                                        <span className="font-bold text-green-800">{todayReport.payments.toLocaleString()} د.ع</span>
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
                            <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 mt-6">
                                تقرير مفصل
                            </button>
                        </div>
                    </div>

                    {/* الجانب الأيمن - نموذج المعاملة */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            {/* أزرار التبديل */}
                            <div className="flex mb-6">
                                <button className="bg-red-500 text-white px-6 py-2 rounded-r-lg font-semibold flex-1">
                                    شحن
                                </button>
                                <button className="bg-gray-200 text-gray-700 px-6 py-2 rounded-l-lg font-semibold flex-1 hover:bg-gray-300 transition-colors">
                                    دفع
                                </button>
                            </div>

                            {/* معلومات المعاملة */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        رقم المرجع:
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                                        value="SEL20250810001"
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        التاريخ والوقت:
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                                        value="18:31:10 10/08/2025"
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        مستخدم افتراضي:
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                                        placeholder="مدخل البيانات"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        المبلغ:
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                                        placeholder="المبلغ"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                        العمولة:
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                                        placeholder="0 (اختياري)"
                                        defaultValue="0"
                                    />
                                </div>
                            </div>

                            {/* المبلغ الكلي */}
                            <div className="bg-green-50 rounded-xl p-4 mb-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-semibold text-green-800">المبلغ الكلي:</span>
                                    <span className="text-2xl font-bold text-green-700">0 د.ع</span>
                                </div>
                            </div>

                            {/* ملاحظات */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                    ملاحظات:
                                </label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                                    rows="3"
                                    placeholder="ملاحظات إضافية..."
                                ></textarea>
                            </div>

                            {/* أزرار العمل */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center">
                                    <span className="ml-2">📄</span>
                                    حفظ وطباعة
                                </button>
                                <button className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center">
                                    <span className="ml-2">💾</span>
                                    حفظ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </EmployeeLayout>
    );
}
