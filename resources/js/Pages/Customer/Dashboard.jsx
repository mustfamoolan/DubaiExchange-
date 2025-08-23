import React from 'react';
import CustomerLayout from '../../Layouts/CustomerLayout';
import { Head } from '@inertiajs/react';

export default function Dashboard({ customer }) {
    return (
        <CustomerLayout>
            <Head title="لوحة التحكم" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <h1 className="text-3xl font-bold text-gray-800 mb-4">
                                مرحباً، {customer.name}
                            </h1>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h2 className="text-lg font-semibold text-blue-800 mb-2">
                                    معلومات الحساب
                                </h2>
                                <p className="text-blue-700">
                                    رقم الهاتف: {customer.phone}
                                </p>
                                <p className="text-blue-700">
                                    رقم العميل: {customer.id}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
