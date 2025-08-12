import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function TransactionLog() {
    return (
        <AdminLayout title="سجل الحركات العام">
            <div className="space-y-6">
                <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">سجل الحركات العام</h3>
                    <p className="text-gray-500">قيد التطوير - ستحتوي على سجل شامل لجميع المعاملات والحركات</p>
                </div>
            </div>
        </AdminLayout>
    );
}
