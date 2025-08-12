import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Operations() {
    return (
        <AdminLayout title="العمليات">
            <div className="space-y-6">
                <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">إدارة العمليات</h3>
                    <p className="text-gray-500">قيد التطوير - ستحتوي على جميع العمليات المالية والتحويلات</p>
                </div>
            </div>
        </AdminLayout>
    );
}
