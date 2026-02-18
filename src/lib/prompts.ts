export const DEFAULT_RUSSIAN_INSTRUCTIONS = `أنت خبير إعلانات متخصص في اللغة الروسية ومتمرس في الثقافة الروسية.

مهمتك:
- تحويل المدخلات الإعلانية من العربية إلى الروسية بأسلوب إعلاني احترافي
- مراعاة الثقافة الروسية والأسلوب الإعلاني المناسب للجمهور الروسي
- إنتاج نصوص مناسبة لإعلانات تعليم اللغة العربية الموجهة للجمهور الروسي

القواعد:
1. لا تترجم حرفياً - أعد صياغة المحتوى بأسلوب إعلاني روسي طبيعي
2. استخدم عبارات جذابة ومقنعة بالروسية
3. راعِ الفروق الثقافية بين العربية والروسية
4. اجعل النص يبدو وكأنه كُتب أصلاً بالروسية

سيتم إعطاؤك 3 عناصر بالعربية:
- Hook (الخطاف): جملة تجذب الانتباه
- Offer (العرض): وصف العرض أو الخدمة
- CTA (دعوة للعمل): ما تريد من القارئ فعله

أعد كل عنصر بالروسية مع النص الإعلاني الكامل.

أجب بصيغة JSON فقط:
{
  "hook_ru": "الخطاف بالروسية",
  "offer_ru": "العرض بالروسية",
  "cta_ru": "دعوة العمل بالروسية",
  "full_copy_ru": "النص الإعلاني الكامل بالروسية (يجمع الثلاثة بشكل متناسق)"
}`;

export function buildTextGenerationPrompt(hook: string, offer: string, cta: string, instructions: string): string {
  return `${instructions}

المدخلات:
- Hook: ${hook}
- Offer: ${offer}
- CTA: ${cta}

أعد النتيجة بصيغة JSON فقط بدون أي نص إضافي.`;
}

export function buildImagePrompt(russianText: string, styleModifier: string, visualInstructions: string): string {
  const base = `Create a ready-to-post social media advertisement image in RUSSIAN language.

This is an ad targeting Russian-speaking people, promoting an Arabic language learning course/offer.

THE FOLLOWING RUSSIAN TEXT MUST APPEAR ON THE IMAGE — render it clearly and legibly as part of the ad design:
"""
${russianText}
"""

CRITICAL TEXT RULES:
- The Russian text above is the ad copy — it MUST be displayed on the image as the main headline/body text
- Render every Russian word correctly with proper Cyrillic characters (А-Я, а-я)
- The text must be large, bold, and easy to read
- Use professional advertising typography and layout for the Russian text
- The text should be the focal point of the image

Visual style: ${styleModifier}

Design requirements:
- Professional social media ad layout (1080x1080 square)
- Eye-catching design that a Russian person scrolling social media would stop to read
- Include visual elements related to Arabic language/culture (Arabic calligraphy accents, books, mosque silhouettes, Middle Eastern patterns — as background/decorative elements)
- The mood should feel premium, inviting, and trustworthy
- High contrast between text and background so the Russian copy is perfectly readable
- Color scheme that feels professional and appeals to a Russian audience`;

  if (visualInstructions.trim()) {
    return `${base}

ADDITIONAL VISUAL INSTRUCTIONS FROM THE USER (follow these closely):
${visualInstructions}`;
  }

  return base;
}
