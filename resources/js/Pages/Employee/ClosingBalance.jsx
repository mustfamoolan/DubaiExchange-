import React from 'react';
import EmployeeLayout from '../../Layouts/EmployeeLayout';

export default function ClosingBalance() {
    const handleBack = () => {
        window.location.href = '/employee/dashboard';
    };

    return (
        <EmployeeLayout title="الرصيد الختامي">
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
                <div className="w-24 h-24 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">الرصيد الختامي</h3>
                <p className="text-gray-600 mb-4">صفحة الرصيد الختامي قيد التطوير</p>
                <p className="text-sm text-gray-500">سيتم إضافة هذه الميزة قريباً</p>
            </div>
        </EmployeeLayout>
    );
}
