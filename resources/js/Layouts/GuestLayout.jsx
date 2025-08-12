import React from 'react';
import { Head } from '@inertiajs/react';

export default function GuestLayout({ children, title = 'DubaiExchange' }) {
    return (
        <div className="min-h-screen bg-gray-50">
            <Head title={title} />

            {/* المحتوى الرئيسي */}
            <div className="relative min-h-screen">
                {children}
            </div>
        </div>
    );
}
