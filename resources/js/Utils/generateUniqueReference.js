/**
 * توليد رقم مرجعي فريد للمعاملات
 * @param {string} prefix - البادئة (مثل RAF, ZAI, SUP, إلخ)
 * @param {number|string} userId - معرف المستخدم (اختياري)
 * @returns {string} رقم مرجعي فريد
 */
export const generateUniqueReference = (prefix = '', userId = null) => {
    const now = new Date();

    // التاريخ بصيغة YYYYMMDD
    const dateStr = now.getFullYear().toString() +
                   (now.getMonth() + 1).toString().padStart(2, '0') +
                   now.getDate().toString().padStart(2, '0');

    // الوقت الدقيق بصيغة HHMMSSMMM (ساعة دقيقة ثانية ميلي ثانية)
    const timeStr = now.getHours().toString().padStart(2, '0') +
                   now.getMinutes().toString().padStart(2, '0') +
                   now.getSeconds().toString().padStart(2, '0') +
                   now.getMilliseconds().toString().padStart(3, '0');

    // رقم عشوائي إضافي للأمان (00-99)
    const randomStr = Math.floor(Math.random() * 100).toString().padStart(2, '0');

    // معرف المستخدم (اختياري) - آخر رقمين من معرف المستخدم
    const userStr = userId ? (parseInt(userId) % 100).toString().padStart(2, '0') : '';

    return `${prefix}${dateStr}${timeStr}${randomStr}${userStr}`;
};

/**
 * توليد رقم مرجعي مع إعادة المحاولة في حالة التكرار
 * @param {string} prefix - البادئة
 * @param {number|string} userId - معرف المستخدم
 * @param {number} maxAttempts - عدد المحاولات القصوى
 * @returns {string} رقم مرجعي فريد
 */
export const generateUniqueReferenceWithRetry = (prefix = '', userId = null, maxAttempts = 3) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const reference = generateUniqueReference(prefix, userId);

        // إضافة تأخير صغير بين المحاولات لضمان اختلاف الوقت
        if (attempt > 1) {
            // تأخير 1-10 ميلي ثانية
            const delay = Math.floor(Math.random() * 10) + 1;
            const start = Date.now();
            while (Date.now() - start < delay) {
                // انتظار غير متزامن
            }
        }

        return reference;
    }

    // في حالة فشل جميع المحاولات، استخدم timestamp كاملة
    return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
};

/**
 * دوال مساعدة لصفحات محددة
 */
export const generateRafidainReference = (userId = null) =>
    generateUniqueReference('RAF', userId);

export const generateZainCashReference = (userId = null) =>
    generateUniqueReference('ZAI', userId);

export const generateSuperKeyReference = (userId = null) =>
    generateUniqueReference('SUP', userId);

export const generateRashidBankReference = (userId = null) =>
    generateUniqueReference('RAS', userId);

export const generateTravelersReference = (userId = null) =>
    generateUniqueReference('TRV', userId);

export const generateReceiveReference = (userId = null) =>
    generateUniqueReference('REC', userId);

export const generateExchangeReference = (userId = null) =>
    generateUniqueReference('EXC', userId);

export const generateSellReference = (userId = null) =>
    generateUniqueReference('SELL', userId);

export const generateBuyReference = (userId = null) =>
    generateUniqueReference('BUY', userId);
