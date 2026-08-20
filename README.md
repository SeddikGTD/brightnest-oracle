# BrightNest Oracle — TradingView Webhooks (Local test)

هذا الفرع يضيف استقبال Webhook من TradingView، وواجهة بسيطة لعرض الإشارات محليًا.

محتويات وماذا تفعل:
- server.js: خادم Express يحتوي على
  - GET /api/signals → يعيد محتويات data/signals.json
  - POST /webhook → يستقبل تنبيهات TradingView (text/plain أو JSON)، يتحقق من token، ويخزن الإشارة في data/signals.json
  - صفحة ثابتة index.html لخدمة الواجهة
- index.html: واجهة بسيطة تُ��دّث كل 3 ثوانٍ وتعرض الإشارات
- data/signals.json: ملف عيّنة لاختبار الواجهة
- package.json: سكربتات التشغيل واعتماديات التطوير

التشغيل المحلي (سريع)
1. ثبّت الاعتمادات:
   npm install

2. عيّن متغيّر البيئة للسِرّ (مكان آمن):
   export TRADINGVIEW_WEBHOOK_TOKEN="ضع_توكن_قوي_هنا"

3. شغّل الخادم:
   npm start

4. افتح المتصفح على http://localhost:3000

اختبار Webhook محليًا عبر curl (قبل إعداد TradingView):
curl -X POST "http://localhost:3000/webhook?token=ضع_توكن_قوي_هنا" \
  -H "Content-Type: text/plain" \
  --data '{"ticker":"BTCUSD","close":"69123.45","time":"2026-08-20T21:00:00Z","action":"BUY"}'

اختبار TradingView (HTTPS):
- استخدم ngrok (أو أي نفق HTTPS) لتعرّض localhost:3000 عبر HTTPS:
  ngrok http 3000
- خذ رابط HTTPS (مثال: https://abcd-1234.ngrok.io) وضع في TradingView Webhook URL:
  https://abcd-1234.ngrok.io/webhook?token=ضع_توكن_قوي_هنا
- في حقل الرسالة داخل Alert ضع JSON مثل:
  {"ticker":"{{ticker}}","close":"{{close}}","time":"{{time}}","action":"BUY"}

ملاحظات أمنية:
- لا ترفع التوكن إلى المستودع. استخدم متغيرات بيئة في الخدمة السحابية.
- ngrok للاختبار فقط — للانتاج استعمل خدمة استضافة مع HTTPS ثابت.

التحسينات الممكنة لاحقًا:
- استبدال التخزين المحلي بقاعدة بيانات (SQLite / Postgres).
- إضافة فلترة لتجنّب التكرارات والحد من الspam.
- إضافة صفحة إدارة محمية لمسح أو تأكيد الإشارات.

