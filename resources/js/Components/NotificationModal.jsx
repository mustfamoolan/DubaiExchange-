import React, { useEffect, useState } from 'react';

const NotificationModal = ({
    isOpen,
    onClose,
    type = 'success', // 'success', 'error', 'warning', 'info'
    title,
    message,
    autoClose = true,
    autoCloseDelay = 4000
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // تحديد الألوان والأيقونات حسب النوع
    const getTypeStyles = () => {
        switch (type) {
            case 'success':
                return {
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200',
                    iconBg: 'bg-green-100',
                    iconColor: 'text-green-600',
                    titleColor: 'text-green-800',
                    messageColor: 'text-green-700',
                    buttonColor: 'bg-green-600 hover:bg-green-700',
                    icon: '✓'
                };
            case 'error':
                return {
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-200',
                    iconBg: 'bg-red-100',
                    iconColor: 'text-red-600',
                    titleColor: 'text-red-800',
                    messageColor: 'text-red-700',
                    buttonColor: 'bg-red-600 hover:bg-red-700',
                    icon: '✕'
                };
            case 'warning':
                return {
                    bgColor: 'bg-yellow-50',
                    borderColor: 'border-yellow-200',
                    iconBg: 'bg-yellow-100',
                    iconColor: 'text-yellow-600',
                    titleColor: 'text-yellow-800',
                    messageColor: 'text-yellow-700',
                    buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
                    icon: '⚠'
                };
            case 'info':
                return {
                    bgColor: 'bg-blue-50',
                    borderColor: 'border-blue-200',
                    iconBg: 'bg-blue-100',
                    iconColor: 'text-blue-600',
                    titleColor: 'text-blue-800',
                    messageColor: 'text-blue-700',
                    buttonColor: 'bg-blue-600 hover:bg-blue-700',
                    icon: 'ℹ'
                };
            default:
                return {
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200',
                    iconBg: 'bg-gray-100',
                    iconColor: 'text-gray-600',
                    titleColor: 'text-gray-800',
                    messageColor: 'text-gray-700',
                    buttonColor: 'bg-gray-600 hover:bg-gray-700',
                    icon: '•'
                };
        }
    };

    const styles = getTypeStyles();

    // تأثير فتح وإغلاق المودال
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            setTimeout(() => setIsAnimating(true), 10);

            // إغلاق تلقائي
            if (autoClose) {
                const timer = setTimeout(() => {
                    handleClose();
                }, autoCloseDelay);

                return () => clearTimeout(timer);
            }
        } else {
            handleClose();
        }
    }, [isOpen, autoClose, autoCloseDelay]);

    // دالة إغلاق المودال مع الأنيميشن
    const handleClose = () => {
        setIsAnimating(false);
        setTimeout(() => {
            setIsVisible(false);
            onClose();
        }, 300);
    };

    // منع إغلاق المودال عند النقر على المحتوى
    const handleContentClick = (e) => {
        e.stopPropagation();
    };

    if (!isVisible) return null;

    return (
        <div className="fixed top-4 right-4 z-50 w-80 max-w-xs">
            {/* المودال */}
            <div
                className={`transform transition-all duration-300 ${
                    isAnimating
                        ? 'translate-y-0 opacity-100 scale-100'
                        : '-translate-y-4 opacity-0 scale-95'
                }`}
                onClick={handleContentClick}
            >
                <div className={`rounded-lg ${styles.bgColor} ${styles.borderColor} border p-3 shadow-lg backdrop-blur-sm`}>
                    {/* محتوى مضغوط */}
                    <div className="flex items-center justify-between">
                        {/* أيقونة وعنوان في خط واحد */}
                        <div className="flex items-center flex-1">
                            <div className={`w-8 h-8 ${styles.iconBg} rounded-full flex items-center justify-center ml-3`}>
                                <span className={`text-sm ${styles.iconColor} font-bold`}>
                                    {styles.icon}
                                </span>
                            </div>
                            <div className="flex-1">
                                <h3 className={`text-sm font-semibold ${styles.titleColor} text-right`}>
                                    {title}
                                </h3>
                                {/* الرسالة في نفس السطر أو تحت العنوان مباشرة */}
                                {message && (
                                    <p className={`text-xs ${styles.messageColor} text-right mt-1`}>
                                        {message}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* زر إغلاق صغير */}
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600 text-lg font-bold leading-none mr-2"
                        >
                            ×
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationModal;
