# 🚗 أوتو ماركت — منصة تسويق السيارات السعودية

منصة ويب عربية RTL كاملة لتسويق السيارات في المملكة العربية السعودية، بدون خادم — تعمل مباشرة في المتصفح.

---

## 📁 هيكل الملفات

```
automarket-sa/
├── index.html          # الصفحة الرئيسية (عرض وفلترة السيارات)
├── car.html            # صفحة تفاصيل السيارة
├── style.css           # التصميم الكامل (RTL عربي، Navy + Gold)
├── cars.js             # قاعدة بيانات السيارات (20 سيارة JSON)
├── app.js              # منطق الصفحة الرئيسية (فلترة + عرض البطاقات)
├── car-detail.js       # منطق صفحة التفاصيل
├── claude-prompt.md    # Prompt جاهز لـ Claude API لتوليد الإعلانات
└── README.md           # هذا الملف
```

---

## 🚀 التشغيل المحلي

### الطريقة 1 — فتح مباشر (أبسط طريقة)
```
افتح ملف index.html في المتصفح مباشرة
(انقر مزدوجاً على الملف أو اسحبه للمتصفح)
```

### الطريقة 2 — Live Server (VSCode)
```
1. افتح المجلد في VSCode
2. ثبّت إضافة "Live Server" من Extensions
3. انقر يمين على index.html → "Open with Live Server"
4. سيفتح على: http://127.0.0.1:5500
```

### الطريقة 3 — Python HTTP Server
```bash
cd automarket-sa
python -m http.server 8080
# افتح: http://localhost:8080
```

### الطريقة 4 — npx serve
```bash
cd automarket-sa
npx serve .
# افتح الرابط المعروض في الطرفية
```

---

## 🌐 النشر على الإنترنت

### Netlify (مجاني ومُوصى به)
```
1. اذهب إلى netlify.com وأنشئ حساباً
2. اسحب مجلد automarket-sa وأفلته في "Deploy manually"
3. ستحصل على رابط مباشر خلال ثوانٍ!
```

### GitHub Pages
```
1. ارفع المجلد على GitHub Repository
2. اذهب إلى Settings → Pages
3. اختر Source: main branch → /root
4. سيظهر الموقع على: https://username.github.io/repo-name
```

### Vercel
```bash
npm i -g vercel
cd automarket-sa
vercel
# اتبع التعليمات
```

---

## 🎨 التخصيص

### تغيير رقم الواتساب
افتح `app.js` و `car-detail.js` وابحث عن:
```javascript
// غيّر الرقم في هذا السطر
https://wa.me/966545888559
```

### إضافة سيارة جديدة
افتح `cars.js` وأضف كائن JSON جديد:
```javascript
{
  id: 21,                          // رقم فريد
  nameAr: "اسم السيارة بالعربي",
  nameEn: "Car Name in English",
  brand: "الماركة",
  brandEn: "brand-lowercase",      // يُستخدم في الفلترة
  year: 2024,
  price: 150000,                   // بالريال السعودي
  engine: "2.0L 4-سلندر",
  transmission: "أوتوماتيك",
  transmissionType: "automatic",   // "automatic" أو "manual"
  fuel: "بنزين",
  fuelType: "petrol",             // "petrol" أو "diesel" أو "hybrid" أو "electric"
  horsepower: 180,
  color: "اللون",
  category: "SUV",                 // "سيدان" أو "SUV" أو "بيك أب" أو "MPV"
  description: "وصف السيارة...",
  features: ["ميزة 1", "ميزة 2", "..."],
  image: "https://رابط-الصورة.jpg",
  gallery: [
    "https://صورة-1.jpg",
    "https://صورة-2.jpg",
    "https://صورة-3.jpg"
  ]
}
```

### تغيير الألوان
افتح `style.css` وعدّل المتغيرات في `:root`:
```css
:root {
  --navy-500: #0c2340;    /* اللون الأزرق الداكن الرئيسي */
  --gold-500: #c9922a;    /* اللون الذهبي الرئيسي */
}
```

---

## 🤖 توليد الإعلانات بـ Claude API

راجع ملف `claude-prompt.md` للحصول على:
- System Prompt جاهز
- User Prompt Template
- مثال كامل بـ JavaScript + Fetch
- مثال إعلان مولّد

---

## 📱 المميزات

| الميزة | الوصف |
|--------|-------|
| ✅ RTL كامل | دعم كامل للغة العربية من اليمين لليسار |
| ✅ بدون سيرفر | يعمل مباشرة في المتصفح بدون أي backend |
| ✅ الوضع الداكن | وضع فاتح وداكن مع حفظ التفضيل |
| ✅ متجاوب | يعمل على الموبايل والتابلت والكمبيوتر |
| ✅ فلترة متقدمة | بحث + ماركة + سعر + وقود + قير + فئة |
| ✅ واتساب مباشر | رسالة مخصصة جاهزة لكل سيارة |
| ✅ 20 سيارة | بيانات حقيقية لأشهر ماركات السوق السعودي |
| ✅ معرض صور | 3 صور لكل سيارة في صفحة التفاصيل |
| ✅ سيارات مشابهة | عرض سيارات من نفس الماركة/الفئة |
| ✅ Accessible | يدعم قارئات الشاشة والتنقل بالكيبورد |

---

## 🛠️ التقنيات المستخدمة

- **HTML5** — هيكل الصفحات
- **CSS3** مع Custom Properties — التصميم الكامل
- **Tailwind CSS** (CDN) — فئات مساعدة
- **Vanilla JavaScript** — منطق التطبيق بالكامل
- **Google Fonts** — خط Tajawal العربي
- **Fontshare** — خط Cabinet Grotesk
- **Unsplash** — صور السيارات

---

## 📞 رقم التواصل

الرقم المُعيَّن: **966545888559+**
لتغييره، ابحث في جميع الملفات عن هذا الرقم واستبدله.

---

## 📄 الترخيص

للاستخدام التجاري والشخصي بحرية.

---

*تم بناؤه بـ [Perplexity Computer](https://www.perplexity.ai/computer)*
