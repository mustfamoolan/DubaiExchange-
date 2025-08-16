import React, { useState, useEffect } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';

export default function EmployeeLayout({ children, title = 'منطقة الموظفين' }) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const { url, props } = usePage();

    // الحصول على بيانات المستخدم من session
    const user = props.auth?.sessionUser || null;

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Head title={`${title} - ${user?.name || 'DubaiExchange'}`} />

            {/* Windows 11 Style Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm backdrop-blur-md bg-opacity-95 sticky top-0 z-50">
                <div className="px-3 sm:px-4 md:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-12 sm:h-14">
                        {/* Left: Logo */}
                        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 space-x-reverse">
                            <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-sm">
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <div className="hidden xs:block sm:block">
                                    <h1 className="text-xs sm:text-sm font-bold text-gray-900 drop-shadow-sm">
                                        DubaiExchange - {user?.name || 'منطقة الموظفين'}
                                    </h1>
                                    <p className="text-xs text-gray-600 hidden sm:block font-medium">لوحة المراقبة الرئيسية</p>
                                </div>
                            </div>
                        </div>

                        {/* Center: Search Bar (Desktop) */}
                        <div className="hidden md:flex flex-1 max-w-md mx-8">
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    placeholder="البحث..."
                                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:ring-opacity-20 focus:outline-none transition-all duration-200"
                                />
                                <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* Right: Status and User */}
                        <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 space-x-reverse">
                            {/* Time Display */}
                            <div className="hidden md:block text-right">
                                <p className="text-xs font-bold text-gray-900 drop-shadow-sm">{formatTime(currentTime)}</p>
                                <p className="text-xs text-gray-600 font-medium">{formatDate(currentTime).split(',')[0]}</p>
                            </div>

                            {/* Notifications */}
                            <button className="relative p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-20">
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full"></span>
                                </span>
                            </button>

                            {/* User Profile */}
                            <div className="flex items-center space-x-1 sm:space-x-2 space-x-reverse">
                                <div className="hidden lg:block text-right">
                                    <p className="text-xs font-semibold text-gray-900 drop-shadow-sm">
                                        {user?.name || 'موظف النظام'}
                                    </p>
                                    <p className="text-xs text-gray-600 font-medium">موظف صرافة</p>
                                </div>
                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-lg border-2 border-white">
                                    {user?.name ? user.name.charAt(0) : 'م'}
                                </div>
                            </div>

                            {/* Settings/Logout */}
                            <button
                                onClick={() => {
                                    if (confirm('هل تريد تسجيل الخروج؟')) {
                                        router.post('/logout');
                                    }
                                }}
                                className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-20"
                                title="خروج"
                            >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="h-full">
                    <div className="p-3 sm:p-4 md:p-6 lg:p-8">
                        {/* Page Header */}
                        <div className="mb-4 md:mb-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 space-x-reverse">
                                    <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                                        <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h1 className="text-lg md:text-xl font-bold text-gray-900 drop-shadow-sm">الصفحة الرئيسية</h1>
                                        <p className="text-xs md:text-sm text-gray-600 hidden sm:block font-medium">لوحة المراقبة الرئيسية</p>
                                    </div>
                                </div>

                                {/* Mobile Search */}
                                <button className="md:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Page Content */}
                        <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 min-h-[calc(100vh-180px)] md:min-h-[calc(100vh-200px)]">
                            <div className="p-4 sm:p-6 overflow-y-auto">
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
