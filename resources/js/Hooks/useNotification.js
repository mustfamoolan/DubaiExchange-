import { useState } from 'react';

export const useNotification = () => {
    const [notification, setNotification] = useState({
        isOpen: false,
        type: 'success',
        title: '',
        message: '',
        autoClose: true,
        autoCloseDelay: 3000
    });

    // عرض إشعار نجاح
    const showSuccess = (title, message = '', options = {}) => {
        setNotification({
            isOpen: true,
            type: 'success',
            title,
            message,
            autoClose: options.autoClose !== undefined ? options.autoClose : true,
            autoCloseDelay: options.autoCloseDelay || 3000
        });
    };

    // عرض إشعار خطأ
    const showError = (title, message = '', options = {}) => {
        setNotification({
            isOpen: true,
            type: 'error',
            title,
            message,
            autoClose: options.autoClose !== undefined ? options.autoClose : true,
            autoCloseDelay: options.autoCloseDelay || 5000 // خطأ يحتاج وقت أطول
        });
    };

    // عرض إشعار تحذير
    const showWarning = (title, message = '', options = {}) => {
        setNotification({
            isOpen: true,
            type: 'warning',
            title,
            message,
            autoClose: options.autoClose !== undefined ? options.autoClose : true,
            autoCloseDelay: options.autoCloseDelay || 4000
        });
    };

    // عرض إشعار معلومات
    const showInfo = (title, message = '', options = {}) => {
        setNotification({
            isOpen: true,
            type: 'info',
            title,
            message,
            autoClose: options.autoClose !== undefined ? options.autoClose : true,
            autoCloseDelay: options.autoCloseDelay || 3000
        });
    };

    // إغلاق الإشعار
    const closeNotification = () => {
        setNotification(prev => ({ ...prev, isOpen: false }));
    };

    return {
        notification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        closeNotification
    };
};
