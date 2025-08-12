import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Link } from '@inertiajs/react';

export default function EmployeesList({ employees }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredEmployees = employees.filter(employee =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (employee) => {
        if (employee.hasOpeningBalance && employee.latestBalance) {
            const balance = employee.latestBalance;
            return (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${balance.statusColor}`}>
                    {balance.statusText}
                </span>
            );
        } else {
            return (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                    في الانتظار
                </span>
            );
        }
    };

    return (
        <AdminLayout title="قائمة الموظفين - الأرصدة الافتتاحية">
            <div className="space-y-4 lg:space-y-6">
                {/* رأس الصفحة */}
                <div className="bg-white rounded-lg lg:rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                        <div>
                            <h2 className="text-xl lg:text-2xl font-bold text-gray-900">الأرصدة الافتتاحية للموظفين</h2>
                            <p className="text-sm text-gray-500 mt-1">إدارة وتتبع أرصدة الموظفين الافتتاحية</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm lg:text-base">
                                تصدير التقرير
                            </button>
                        </div>
                    </div>

                    {/* شريط البحث */}
                    <div className="max-w-md">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="البحث عن موظف..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                            />
                            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* قائمة الموظفين */}
                <div className="bg-white rounded-lg lg:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* عرض الديسكتوب - جدول */}
                    <div className="hidden lg:block">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
                            <div className="grid grid-cols-12 gap-4 text-center font-semibold text-sm">
                                <div className="col-span-1">#</div>
                                <div className="col-span-5">اسم الموظف</div>
                                <div className="col-span-3">الرصيد الإجمالي</div>
                                <div className="col-span-2">آخر تحديث</div>
                                <div className="col-span-1">الحالة</div>
                            </div>
                        </div>

                        <div className="divide-y divide-gray-200">
                            {filteredEmployees.map((employee, index) => (
                                <Link
                                    key={employee.id}
                                    href={route('opening-balance.show', employee.id)}
                                    className="block p-4 hover:bg-blue-50 transition-colors duration-200 cursor-pointer"
                                >
                                    <div className="grid grid-cols-12 gap-4 items-center text-sm">
                                        <div className="col-span-1 text-center font-medium text-gray-900">
                                            {index + 1}
                                        </div>
                                        <div className="col-span-5">
                                            <div className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                                                {employee.name}
                                            </div>
                                        </div>
                                        <div className="col-span-3 text-center">
                                            <div className="font-medium text-gray-900">
                                                {employee.latestBalance?.grand_total ?
                                                    parseFloat(employee.latestBalance.grand_total).toLocaleString() + ' د.ع' :
                                                    '0 د.ع'
                                                }
                                            </div>
                                        </div>
                                        <div className="col-span-2 text-center text-gray-600">
                                            {employee.latestBalance?.opening_date || 'لم يتم التحديث'}
                                        </div>
                                        <div className="col-span-1 text-center">
                                            {getStatusBadge(employee)}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* عرض الموبايل والتابلت - كاردات */}
                    <div className="lg:hidden divide-y divide-gray-200">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 text-center font-semibold text-sm">
                            قائمة الموظفين ({filteredEmployees.length})
                        </div>

                        {filteredEmployees.map((employee) => (
                            <Link
                                key={employee.id}
                                href={route('opening-balance.show', employee.id)}
                                className="block p-4 space-y-3 hover:bg-blue-50 transition-colors duration-200"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900 text-sm hover:text-blue-600 transition-colors">
                                            {employee.name}
                                        </h3>
                                        {employee.latestBalance?.opening_date && (
                                            <p className="text-xs text-gray-400 mt-1">آخر تحديث: {employee.latestBalance.opening_date}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        {getStatusBadge(employee)}
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-gray-100">
                                    <span className="text-xs text-gray-500">الرصيد الإجمالي:</span>
                                    <span className="block font-medium text-gray-900 text-sm">
                                        {employee.latestBalance?.grand_total ?
                                            parseFloat(employee.latestBalance.grand_total).toLocaleString() + ' د.ع' :
                                            '0 د.ع'
                                        }
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* إحصائيات سريعة */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">إجمالي الموظفين</p>
                                <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">الأرصدة المكتملة</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {employees.filter(emp => emp.hasOpeningBalance && emp.latestBalance?.status === 'active').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">في الانتظار</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {employees.filter(emp => !emp.hasOpeningBalance).length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">إجمالي الأرصدة</p>
                                <p className="text-lg font-bold text-gray-900">
                                    {employees.reduce((sum, emp) => sum + (emp.latestBalance?.grand_total ? parseFloat(emp.latestBalance.grand_total) : 0), 0).toLocaleString()} د.ع
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
