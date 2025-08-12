import React, { useState, useEffect } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';

export default function AdminLayout({ children, title = 'لوحة تحكم الأدمن' }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const { url, props } = usePage();

    // الحصول على بيانات المستخدم من session
    const user = props.auth?.sessionUser || null;

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);

            if (mobile) {
                const savedState = localStorage.getItem('mobile-sidebar-open');
                setSidebarOpen(savedState === 'true');
            } else {
                setSidebarOpen(true);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const navigation = [
        {
            name: 'الرئيسية',
            href: '/admin/dashboard',
            icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z',
            description: 'لوحة المراقبة الرئيسية'
        },
        {
            name: 'الرصيد الافتتاحي',
            href: '/admin/opening-balance',
            icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            description: 'إدارة الأرصدة الافتتاحية'
        },
        {
            name: 'الموظفين',
            href: '/admin/employees',
            icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
            description: 'إدارة فريق العمل'
        },
        {
            name: 'العمليات',
            href: '/admin/operations',
            icon: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6',
            description: 'إدارة العمليات المالية'
        },
        {
            name: 'العملاء',
            href: '/admin/customers',
            icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
            description: 'قاعدة بيانات العملاء'
        },
        {
            name: 'سجل الحركات العام',
            href: '/admin/transaction-log',
            icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
            description: 'سجل شامل للمعاملات'
        },
        {
            name: 'التقارير',
            href: '/admin/reports',
            icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
            description: 'تقارير الأداء والإحصائيات'
        },
        {
            name: 'الإعدادات',
            href: '/admin/settings',
            icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
            description: 'إعدادات النظام'
        }
    ];

    const toggleSidebar = () => {
        if (isMobile) {
            const newState = !sidebarOpen;
            setSidebarOpen(newState);
            localStorage.setItem('mobile-sidebar-open', newState.toString());
        }
    };

    const getCurrentPageInfo = () => {
        const currentItem = navigation.find(item => url.startsWith(item.href));
        return currentItem || navigation[0];
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('ar-SA', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('ar-SA', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Head title={`${title} - ${user?.name || 'DubaiExchange'}`} />

            {/* Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm backdrop-blur-md bg-opacity-95 sticky top-0 z-50">
                <div className="px-3 sm:px-4 md:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-12 sm:h-14">
                        {/* Left: Menu and Logo */}
                        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 space-x-reverse">
                            {/* Menu toggle - only visible on mobile */}
                            {isMobile && (
                                <button
                                    onClick={toggleSidebar}
                                    className="p-1.5 sm:p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                                >
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                            )}

                            <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                                <div className="hidden xs:block sm:block">
                                    <h1 className="text-xs sm:text-sm font-semibold text-gray-900">
                                        DubaiExchange - {user?.name || 'إدارة النظام'}
                                    </h1>
                                    <p className="text-xs text-gray-500 hidden sm:block">{getCurrentPageInfo().name}</p>
                                </div>
                            </div>
                        </div>

                        {/* Center: Search Bar (Desktop) */}
                        <div className="hidden md:flex flex-1 max-w-md mx-8">
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    placeholder="البحث..."
                                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:outline-none transition-all duration-200"
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
                                <p className="text-xs font-medium text-gray-900">{formatTime(currentTime)}</p>
                                <p className="text-xs text-gray-500">{formatDate(currentTime).split('،')[0]}</p>
                            </div>

                            {/* Notifications */}
                            <button className="relative p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20">
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
                                    <p className="text-xs font-semibold text-gray-900">
                                        {user?.name || 'مستخدم النظام'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {user?.type === 'admin' ? 'مدير عام' : 'موظف'}
                                    </p>
                                </div>
                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-semibold">
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

            <div className="flex flex-1 overflow-hidden">
                {/* Mobile Overlay */}
                {isMobile && sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-30"
                        onClick={() => {
                            setSidebarOpen(false);
                            localStorage.setItem('mobile-sidebar-open', 'false');
                        }}
                    ></div>
                )}

                {/* Sidebar */}
                <aside className={`
                    ${isMobile ? 'fixed' : 'relative'}
                    ${isMobile ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
                    z-40 w-full sm:w-80 md:w-72 lg:w-64 bg-white border-r border-gray-200 shadow-2xl lg:shadow-none transition-transform duration-300 ease-in-out
                `}
                style={{ height: isMobile ? '100vh' : 'calc(100vh - 56px)' }}>
                    <div className="flex flex-col h-full bg-white">
                        {/* Sidebar Header */}
                        <div className="p-3 sm:p-4 border-b border-gray-100 flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse">
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-sm sm:text-sm font-semibold text-gray-900">لوحة التحكم</h2>
                                        <p className="text-xs text-gray-500">إدارة شاملة</p>
                                    </div>
                                </div>
                                {isMobile && (
                                    <button
                                        onClick={() => {
                                            setSidebarOpen(false);
                                            localStorage.setItem('mobile-sidebar-open', 'false');
                                        }}
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Navigation Menu */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <nav className="px-2 sm:px-3 py-3 sm:py-4 space-y-1.5 sm:space-y-2">
                                {navigation.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => {
                                            if (isMobile) {
                                                setSidebarOpen(false);
                                                localStorage.setItem('mobile-sidebar-open', 'false');
                                            }
                                        }}
                                        className={`w-full flex items-center px-3 sm:px-4 py-3.5 sm:py-4 md:py-2.5 text-right rounded-xl transition-all duration-200 group ${
                                            url.startsWith(item.href)
                                                ? 'bg-blue-50 text-blue-700 shadow-sm border-r-2 border-blue-500'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100'
                                        }`}
                                    >
                                        <svg
                                            className={`ml-2.5 sm:ml-3 w-5 h-5 sm:w-6 sm:h-6 md:w-5 md:h-5 ${
                                                url.startsWith(item.href) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                                            } transition-colors duration-200`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                                        </svg>
                                        <div className="flex-1 text-right">
                                            <div className={`text-sm sm:text-base md:text-sm font-medium ${url.startsWith(item.href) ? 'text-blue-900' : ''}`}>
                                                {item.name}
                                            </div>
                                            <div className={`text-xs sm:text-sm md:text-xs mt-0.5 sm:mt-1 md:mt-0.5 ${
                                                url.startsWith(item.href) ? 'text-blue-600' : 'text-gray-500'
                                            }`}>
                                                {item.description}
                                            </div>
                                        </div>
                                        {url.startsWith(item.href) && (
                                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-2 md:h-2 bg-blue-500 rounded-full"></div>
                                        )}
                                    </Link>
                                ))}
                            </nav>
                        </div>

                        {/* Sidebar Footer */}
                        <div className="p-3 sm:p-4 border-t border-gray-100 flex-shrink-0 bg-white">
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-2.5 sm:p-3 border border-blue-100">
                                <div className="flex items-center space-x-2 space-x-reverse">
                                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-blue-900 truncate">الإصدار المتقدم</p>
                                        <p className="text-xs text-blue-600 truncate">جميع الميزات نشطة</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-hidden">
                    <div className="h-full overflow-y-auto">
                        <div className="p-3 sm:p-4 md:p-6 lg:p-8">
                            {/* Page Header */}
                            <div className="mb-4 md:mb-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3 space-x-reverse">
                                        <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                            <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={getCurrentPageInfo().icon} />
                                            </svg>
                                        </div>
                                        <div>
                                            <h1 className="text-lg md:text-xl font-bold text-gray-900">{getCurrentPageInfo().name}</h1>
                                            <p className="text-xs md:text-sm text-gray-500 hidden sm:block">{getCurrentPageInfo().description}</p>
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
                                <div className="p-4 sm:p-6">
                                    {children}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
