import React, { useState } from 'react';
import EmployeeLayout from '../../Layouts/EmployeeLayout';
import { router } from '@inertiajs/react';

export default function EmployeeDashboard() {
    // بيانات الكاردات - مرتبة: المصارف أولاً ثم باقي الخدمات
    const serviceCards = [
        // المصارف أولاً
        {
            id: 7,
            title: 'مصرف الرافدين',
            subtitle: 'معاملات الرافدين',
            icon: '�️',
            image: '/images/services/rafidain-bank.png',
            color: 'bg-green-600',
            route: '/employee/rafidain-bank'
        },
        {
            id: 6,
            title: 'مصرف الرشيد',
            subtitle: 'معاملات الرشيد',
            icon: '🌐',
            image: '/images/services/rashid-bank.png',
            color: 'bg-blue-500',
            route: '/employee/rashid-bank'
        },
        {
            id: 5,
            title: 'زين كاش',
            subtitle: 'المحفظة الإلكترونية',
            icon: '�',
            image: '/images/services/zain-cash.png',
            color: 'bg-purple-500',
            route: '/employee/zain-cash'
        },
        {
            id: 11,
            title: 'سوبر كي',
            subtitle: 'الدفع الإلكتروني',
            icon: '💳',
            image: '/images/services/super-key.png',
            color: 'bg-yellow-500',
            route: '/employee/super-key'
        },
        // باقي الخدمات
        {
            id: 10,
            title: 'المسافرين',
            subtitle: 'خدمات المسافرين',
            icon: '✈️',
            image: '/images/services/travelers.png',
            color: 'bg-cyan-500',
            route: '/employee/travelers'
        },
        {
            id: 1,
            title: 'بيع',
            subtitle: 'عمليات البيع',
            icon: '🏪',
            image: '/images/services/sell.png',
            color: 'bg-orange-500',
            route: '/employee/sell'
        },
        {
            id: 8,
            title: 'شراء',
            subtitle: 'عمليات الشراء',
            icon: '�',
            image: '/images/services/buy.png',
            color: 'bg-cyan-600',
            route: '/employee/buy'
        },
        {
            id: 2,
            title: 'قبض',
            subtitle: 'عمليات القبض',
            icon: '⚖️',
            image: '/images/services/receive.png',
            color: 'bg-green-500',
            route: '/employee/receive'
        },
        {
            id: 3,
            title: 'صرف',
            subtitle: 'عمليات الصرف',
            icon: '🔄',
            image: '/images/services/exchange.png',
            color: 'bg-red-500',
            route: '/employee/exchange'
        },
        {
            id: 12,
            title: 'الرصيد الافتتاحي',
            subtitle: 'عرض الرصيد الافتتاحي',
            icon: '📊',
            image: '/images/services/opening-balance.png',
            color: 'bg-indigo-500',
            route: '/employee/opening-balance'
        },

    ];

    const handleCardClick = (route) => {
        // التنقل إلى الصفحة المطلوبة
        router.visit(route);
    };

    // مكون عرض الصورة مع fallback للأيقونة
    const ServiceIcon = ({ card }) => {
        const [imageError, setImageError] = React.useState(false);

        const handleImageError = () => {
            setImageError(true);
        };

        if (imageError || !card.image) {
            return (
                <div className={`w-16 h-16 ${card.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                    <span className="text-3xl text-white">{card.icon}</span>
                </div>
            );
        }

        return (
            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-sm border border-gray-100">
                <img
                    src={card.image}
                    alt={card.title}
                    className="w-12 h-12 object-contain"
                    onError={handleImageError}
                />
            </div>
        );
    };

    return (
        <EmployeeLayout title="الصفحة الرئيسية">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {serviceCards.map((card) => (
                    <div
                        key={card.id}
                        onClick={() => handleCardClick(card.route)}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer group"
                    >
                        <div className="flex flex-col items-center text-center space-y-3">
                            {/* الأيقونة أو الصورة */}
                            <ServiceIcon card={card} />

                            {/* العنوان */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">
                                    {card.title}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {card.subtitle}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </EmployeeLayout>
    );
}
