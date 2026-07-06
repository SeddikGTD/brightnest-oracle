const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// هذا السطر يخبر السيرفر بأن يقرأ ملفات CSS أو الصور من المجلد الحالي
app.use(express.static(__dirname));

// هذا السطر يخبر السيرفر أن يفتح ملف index.html مباشرة
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// هذا السطر يقوم بتشغيل السيرفر
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
