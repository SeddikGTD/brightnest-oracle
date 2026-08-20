const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const app = express();

// إعداد المنفذ (Railway أو المنفذ الافتراضي 3000)
const PORT = process.env.PORT || 3000;

// Middlewares
// We accept JSON and also text/plain (TradingView sends text/plain bodies)
app.use(express.json({limit: '100kb'}));
app.use(express.text({ type: ['text/*'], limit: '100kb' }));

// لخدمة الملفات الثابتة (مثل index.html, style.css)
app.use(express.static(path.join(__dirname, '/')));

// API بسيطة لمنح تجربة محلية: جلب إشارات من ملف JSON محلي
app.get('/api/signals', async (req, res) => {
    try {
        const dataPath = path.join(__dirname, 'data', 'signals.json');
        const content = await fs.readFile(dataPath, 'utf8');
        const signals = JSON.parse(content);
        res.json({ ok: true, data: signals });
    } catch (err) {
        console.error('Failed to read signals file', err);
        res.status(500).json({ ok: false, error: 'Failed to load signals' });
    }
});

// Endpoint to receive TradingView webhooks
// Usage in TradingView: set Webhook URL to https://your-domain.com/webhook?token=YOUR_SECRET_TOKEN
app.post('/webhook', async (req, res) => {
    const urlToken = (req.query && req.query.token) ? req.query.token : null;
    const envToken = process.env.TRADINGVIEW_WEBHOOK_TOKEN || null;

    // Parse payload: TradingView sends text/plain containing your message (can be JSON)
    let payloadRaw = req.body;
    let payload = null;

    if (typeof payloadRaw === 'string' && payloadRaw.trim().length > 0) {
        // Try parsing JSON if possible, otherwise keep as text
        try {
            payload = JSON.parse(payloadRaw);
        } catch (e) {
            // not JSON, store raw text
            payload = { message: payloadRaw };
        }
    } else if (typeof payloadRaw === 'object' && payloadRaw !== null) {
        payload = payloadRaw;
    } else {
        payload = {};
    }

    // Validate token: allow either env token match or token provided in URL
    const tokenOk = (envToken && urlToken && envToken === urlToken) || (!envToken && urlToken) || (payload.token && payload.token === envToken);
    if (!tokenOk) {
        console.warn('Webhook rejected due to invalid token');
        return res.status(401).json({ ok: false, error: 'Invalid token' });
    }

    // Normalize a signal object
    const signal = {
        id: 'sig-' + Date.now(),
        asset_pair: payload.ticker || payload.symbol || payload.asset || payload.asset_pair || payload.pair || 'UNKNOWN',
        action: (payload.action || payload.type || payload.direction || payload.side || payload.action_type || 'UNKNOWN').toString(),
        signal_strength: payload.confidence || payload.signal_strength || payload.score || null,
        entry_price: payload.close || payload.price || payload.entry_price || null,
        created_at: new Date().toISOString(),
        raw: payload
    };

    try {
        const dataPath = path.join(__dirname, 'data', 'signals.json');
        // Ensure directory exists
        await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
        let existing = [];
        try {
            const content = await fs.readFile(dataPath, 'utf8');
            existing = JSON.parse(content);
            if (!Array.isArray(existing)) existing = [];
        } catch (e) {
            existing = [];
        }

        // prepend new signal
        existing.push(signal);
        // keep only latest 200 signals
        if (existing.length > 200) existing = existing.slice(-200);

        await fs.writeFile(dataPath, JSON.stringify(existing, null, 2), 'utf8');

        console.log('Received webhook, stored signal:', signal.asset_pair, signal.action);
        return res.json({ ok: true });
    } catch (err) {
        console.error('Failed to store signal', err);
        return res.status(500).json({ ok: false, error: 'Failed to store signal' });
    }
});

// مسار الصفحة الرئيسية (خيار احتياطي، الملفات الساكنة تخدم index.html مباشرة)
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
