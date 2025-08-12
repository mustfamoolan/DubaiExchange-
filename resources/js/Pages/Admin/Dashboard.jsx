import React from 'react';
import AdminLayout from '../../Layouts/AdminLayout';

export default function AdminDashboard() {
    return (
        <AdminLayout title="لوحة التحكم الرئيسية">
            <div className="h-full p-6">
                {/* Coming Soon Content */}
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">لوحة تحكم الأدمن</h2>
                    <p className="text-gray-500 mb-8 max-w-md">
                        ستحتوي هذه الصفحة على ملخص شامل لجميع أنشطة النظام والإحصائيات الإدارية.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium">قيد التطوير - سيتم إضافة المحتوى قريباً</span>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
