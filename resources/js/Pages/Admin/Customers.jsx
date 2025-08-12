import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Customers() {
    return (
        <AdminLayout title="العملاء">
            <div className="space-y-6">
                <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 bg-teal-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">إدارة العملاء</h3>
                    <p className="text-gray-500">قيد التطوير - ستحتوي على قاعدة بيانات العملاء وملفاتهم</p>
                </div>
            </div>
        </AdminLayout>
    );
}
