/**
 * توليد رقم مرجعي فريد للمعاملات
 * @param {string} prefix - البادئة (مثل TRV, EXC, REC, إلخ)
 * @returns {string} رقم مرجعي فريد
 */
export const generateUniqueReference = (prefix = '') => {
    const now = new Date();

    // التاريخ بصيغة YYYYMMDD
    const dateStr = now.getFullYear().toString() +
                   (now.getMonth() + 1).toString().padStart(2, '0') +
                   now.getDate().toString().padStart(2, '0');

    // الوقت بصيغة HHMMSS
    const timeStr = now.getHours().toString().padStart(2, '0') +
                   now.getMinutes().toString().padStart(2, '0') +
                   now.getSeconds().toString().padStart(2, '0');

    // الميلي ثانية للمزيد من الفرادة
    const millisStr = now.getMilliseconds().toString().padStart(3, '0');

    // رقم عشوائي إضافي
    const randomStr = Math.floor(Math.random() * 99).toString().padStart(2, '0');

    return `${prefix}${dateStr}${timeStr}${millisStr}${randomStr}`;
};

/**
 * توليد رقم مرجعي مبسط (أقصر)
 * @param {string} prefix - البادئة
 * @returns {string} رقم مرجعي مبسط
 */
export const generateSimpleReference = (prefix = '') => {
    const now = new Date();

    // التاريخ بصيغة YYYYMMDD
    const dateStr = now.getFullYear().toString() +
                   (now.getMonth() + 1).toString().padStart(2, '0') +
                   now.getDate().toString().padStart(2, '0');

    // timestamp في الثواني منذ منتصف الليل
    const secondsToday = (now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds();
    const timeStr = secondsToday.toString();

    // رقم عشوائي صغير
    const randomStr = Math.floor(Math.random() * 999).toString().padStart(3, '0');

    return `${prefix}${dateStr}${timeStr}${randomStr}`;
};
