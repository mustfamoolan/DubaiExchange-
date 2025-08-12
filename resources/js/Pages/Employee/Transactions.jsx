import React from 'react';
import EmployeeLayout from '../../Layouts/EmployeeLayout';

export default function Transactions() {
    return (
        <EmployeeLayout title="المعاملات">
            <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">سجل المعاملات</h3>
                <p className="text-gray-600 mb-4">صفحة سجل المعاملات قيد التطوير</p>
                <p className="text-sm text-gray-500">سيتم إضافة هذه الميزة قريباً</p>
            </div>
        </EmployeeLayout>
    );
}
