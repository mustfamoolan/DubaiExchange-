import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Reports() {
    return (
        <AdminLayout title="التقارير">
            <div className="space-y-6">
                <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">التقارير</h3>
                    <p className="text-gray-500">قيد التطوير - ستحتوي على تقارير الأداء والإحصائيات التفصيلية</p>
                </div>
            </div>
        </AdminLayout>
    );
}
