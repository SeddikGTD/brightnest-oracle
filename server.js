const express = require('express');
const path = require('path');
const app = express();

// إعداد المنفذ (Railway أو المنفذ الافتراضي 3000)
const PORT = process.env.PORT || 3000;

// لخدمة الملفات الثابتة (مثل index.html, style.css)
app.use(express.static(path.join(__dirname, '/')));

// مسار الصفحة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// إدارة السرفر لكي نستطيع إغلاقه بشكل صحيح عند الإشارات
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});

// إضافة مراقبة للأخطاء غير المعالجة ومنع توقف السيرفر بدون تنظيف
process.on('uncaughtException', (err) => {
    console.error('There was an uncaught exception:', err);
    // خروج منظم بعد تسجيل الخطأ
    try {
        server.close(() => process.exit(1));
    } catch (e) {
        process.exit(1);
    }
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // خروج منظم
    try {
        server.close(() => process.exit(1));
    } catch (e) {
        process.exit(1);
    }
});

// إغلاق منظم عند استلام إشارات إنهاء
function handleShutdown(signal) {
    console.log(`Received ${signal}. Closing server...`);
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
    // إذا لم يُغلق خلال مدة محددة، أجبر الإنهاء
    setTimeout(() => {
        console.error('Forcing shutdown');
        process.exit(1);
    }, 10000);
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
