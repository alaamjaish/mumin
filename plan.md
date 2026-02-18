Mumin - مولد إعلانات روسية بالذكاء الاصطناعي
Context (السياق)
تطبيق لتوليد إعلانات تعليم اللغة العربية موجهة للجمهور الروسي. المستخدم يدخل Hook و Offer و CTA بالعربية، الذكاء الاصطناعي يحولهم لنص روسي احترافي، ثم يولد صور إعلانية بأنماط مختلفة للمقارنة والاختيار.

التقنيات المستخدمة
Frontend/Backend: Next.js (App Router)
توليد النص: Google Gemini API (gemini-3-pro-preview)
توليد الصور: Nano Banana Pro (gemini-3-pro-image-preview)
قاعدة البيانات والتخزين: Supabase (DB + Storage)
التصميم: Tailwind CSS (بسيط وعملي)
المصادقة: Supabase Auth (تسجيل دخول بسيط لفريق صغير)
هيكل المشروع

mumin/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Layout رئيسي (RTL support)
│   │   ├── page.tsx                # الصفحة الرئيسية - redirect
│   │   ├── login/
│   │   │   └── page.tsx            # صفحة تسجيل الدخول
│   │   ├── generate/
│   │   │   └── page.tsx            # المرحلة 1: توليد النص الروسي
│   │   ├── images/
│   │   │   └── page.tsx            # المرحلة 2: توليد الصور
│   │   ├── gallery/
│   │   │   └── page.tsx            # عرض ومقارنة الصور (Grid)
│   │   └── api/
│   │       ├── generate-text/
│   │       │   └── route.ts        # API: توليد النص الروسي
│   │       ├── generate-images/
│   │       │   └── route.ts        # API: توليد الصور بـ Nano Banana Pro
│   │       └── auth/
│   │           └── callback/
│   │               └── route.ts    # Supabase Auth callback
│   ├── components/
│   │   ├── TextGenerationForm.tsx   # فورم إدخال Hook/Offer/CTA
│   │   ├── RussianTextOutput.tsx    # عرض النص الروسي المولد
│   │   ├── ImageGenerationForm.tsx  # فورم توليد الصور (اختيار الستايل + عدد الصور)
│   │   ├── ImageGrid.tsx            # شبكة عرض الصور للمقارنة
│   │   ├── ImageCard.tsx            # كرت صورة واحدة
│   │   ├── StyleSelector.tsx        # اختيار الستايل من القائمة
│   │   └── Navbar.tsx               # شريط التنقل
│   ├── lib/
│   │   ├── gemini.ts               # Gemini API client (نص)
│   │   ├── nano-banana.ts          # Nano Banana Pro API client (صور)
│   │   ├── supabase/
│   │   │   ├── client.ts           # Supabase browser client
│   │   │   └── server.ts           # Supabase server client
│   │   ├── prompts.ts              # System prompts (خبير اللغة الروسية)
│   │   └── styles.ts               # قائمة الستايلات الجاهزة
│   └── types/
│       └── index.ts                # TypeScript types
├── .env.local                       # API keys
├── package.json
├── tailwind.config.ts
└── tsconfig.json
المراحل التنفيذية
المرحلة 1: إعداد المشروع الأساسي
إنشاء مشروع Next.js جديد مع TypeScript و Tailwind
إعداد Supabase (client + server)
إنشاء جداول قاعدة البيانات
إعداد Supabase Auth (email/password بسيط)
إنشاء Layout و Navbar
المرحلة 2: توليد النص الروسي (الصفحة الأولى)
كتابة System Prompt لخبير الإعلانات بالروسية
إنشاء TextGenerationForm - 3 حقول: Hook, Offer, CTA (بالعربي)
إنشاء API route /api/generate-text يستدعي Gemini
عرض النص الروسي المولد مع إمكانية التعديل
زر "اعتمد النص وانتقل لتوليد الصور"
المرحلة 3: توليد الصور (الصفحة الثانية)
إنشاء قائمة الستايلات الجاهزة (10-20 ستايل)
إنشاء StyleSelector لاختيار الستايلات
إنشاء ImageGenerationForm (اختيار ستايل + عدد الصور 1-10)
إنشاء API route /api/generate-images يستدعي Nano Banana Pro
توليد الصور بـ batches (لكل ستايل مختار)
المرحلة 4: المقارنة والاختيار (Gallery)
إنشاء ImageGrid لعرض كل الصور المولدة ككردات
إمكانية الفلترة حسب الستايل
إمكانية اختيار الصورة المفضلة
حفظ الصورة المختارة + تنزيلها
المرحلة 5: التخزين
حفظ النصوص المولدة في Supabase
رفع الصور إلى Supabase Storage
حفظ تاريخ التوليدات مع ربطها بالمستخدم
قاعدة البيانات (Supabase Tables)

-- المستخدمين (يتم إدارتهم تلقائياً بـ Supabase Auth)

-- جدول التوليدات
CREATE TABLE generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  hook_ar TEXT NOT NULL,          -- Hook بالعربي
  offer_ar TEXT NOT NULL,         -- Offer بالعربي
  cta_ar TEXT NOT NULL,           -- CTA بالعربي
  hook_ru TEXT,                   -- Hook بالروسي (مولد)
  offer_ru TEXT,                  -- Offer بالروسي (مولد)
  cta_ru TEXT,                    -- CTA بالروسي (مولد)
  full_copy_ru TEXT,              -- النص الكامل بالروسي
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول الصور المولدة
CREATE TABLE generated_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  generation_id UUID REFERENCES generations(id),
  user_id UUID REFERENCES auth.users(id),
  style TEXT NOT NULL,            -- الستايل المستخدم
  image_url TEXT NOT NULL,        -- رابط الصورة في Storage
  is_selected BOOLEAN DEFAULT FALSE, -- هل تم اختيارها
  created_at TIMESTAMPTZ DEFAULT NOW()
);
قائمة الستايلات الجاهزة (أولية)
Cartoon - رسوم كرتونية ملونة
Realistic Photo - صورة واقعية
Flat Design - تصميم مسطح
3D Render - تصميم ثلاثي الأبعاد
Watercolor - ألوان مائية
Minimalist - بسيط ونظيف
Pop Art - فن بوب ملون
Vintage/Retro - ستايل كلاسيكي
Neon/Cyberpunk - نيون وألوان ساطعة
Isometric - تصميم أيزومتري
System Prompt (خبير الإعلانات بالروسية)
سيكون prompt مفصل يتضمن:

أنت خبير إعلانات ومتخصص في اللغة الروسية
تحول المدخلات العربية إلى نص روسي إعلاني احترافي
تراعي الثقافة الروسية والأسلوب الإعلاني المناسب
تولد نص مناسب لإعلانات تعليم اللغة العربية
المخرجات: Hook بالروسي + Offer بالروسي + CTA بالروسي + النص الكامل
ملف .env.local

GOOGLE_AI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
التحقق والاختبار
تشغيل المشروع محلياً بـ npm run dev
اختبار تسجيل الدخول عبر Supabase Auth
اختبار إدخال Hook/Offer/CTA بالعربي والحصول على نص روسي
اختبار توليد صور بأنماط مختلفة
اختبار عرض الصور بالـ Grid والاختيار
اختبار حفظ وتنزيل الصور
User approved the plan
ممتاز، الخطة اتعتمدت! خليني أبدأ التنفيذ.

Update Todos

إنشاء مشروع Next.js مع TypeScript و Tailwind

إعداد Supabase (client + server + types)

إنشاء Layout و Navbar وصفحة تسجيل الدخول

المرحلة 1: توليد النص الروسي (prompt + form + API)

المرحلة 2: توليد الصور (styles + form + Nano Banana API)

المرحلة 3: Gallery للمقارنة والاختيار

التخزين في Supabase (DB + Storage)
