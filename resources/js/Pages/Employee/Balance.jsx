import React from 'react';
import EmployeeLayout from '../../Layouts/EmployeeLayout';

export default function Balance() {
    const handleBack = () => {
        window.location.href = '/employee/dashboard';
    };

    return (
        <EmployeeLayout title="الأرصدة">
            {/* زر الرجوع */}
            <div className="mb-6">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-md"
                >
                    <span>←</span>
                    <span>العودة للصفحة الرئيسية</span>
                </button>
            </div>

            <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">الأرصدة الحالية</h3>
                <p className="text-gray-600 mb-4">صفحة عرض الأرصدة الحالية قيد التطوير</p>
                <p className="text-sm text-gray-500">سيتم إضافة هذه الميزة قريباً</p>
            </div>
        </EmployeeLayout>
    );
}
