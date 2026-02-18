/* ------------------------------------------------------------------ */
/*  Default user instructions (editable from Settings in the app)      */
/* ------------------------------------------------------------------ */

export const DEFAULT_RUSSIAN_INSTRUCTIONS = `أنت خبير إعلانات متخصص في اللغة الروسية ومتمرس في الثقافة الروسية.

مهمتك:
- تحويل المدخلات الإعلانية من العربية إلى الروسية بأسلوب إعلاني احترافي
- مراعاة الثقافة الروسية والأسلوب الإعلاني المناسب للجمهور الروسي
- إنتاج نصوص مناسبة لإعلانات تعليم اللغة العربية الموجهة للجمهور الروسي

القواعد:
1. لا تترجم حرفياً - أعد صياغة المحتوى بأسلوب إعلاني روسي طبيعي
2. استخدم عبارات جذابة ومقنعة بالروسية
3. راعِ الفروق الثقافية بين العربية والروسية
4. اجعل النص يبدو وكأنه كُتب أصلاً بالروسية`;

export const DEFAULT_GLOBAL_IMAGE_INSTRUCTIONS = `Create a ready-to-post social media advertisement image in RUSSIAN language.
This is an ad targeting Russian-speaking people, promoting an Arabic language learning course/offer.

Design requirements:
- Professional social media ad layout (1080x1080 square)
- Eye-catching design that a Russian person scrolling social media would stop to read
- Include visual elements related to Arabic language/culture (Arabic calligraphy accents, books, mosque silhouettes, Middle Eastern patterns — as background/decorative elements)
- The mood should feel premium, inviting, and trustworthy
- High contrast between text and background so the Russian copy is perfectly readable
- Color scheme that feels professional and appeals to a Russian audience`;

/* ------------------------------------------------------------------ */
/*  Hardcoded prompt skeletons (structural only — never edit from app) */
/* ------------------------------------------------------------------ */

export function buildTextGenerationPrompt(
  hook: string,
  offer: string,
  cta: string,
  userInstructions: string
): string {
  return `You will be given user instructions and Arabic ad copy inputs (Hook, Offer, CTA).
Follow the user instructions exactly to generate Russian ad copy.

--- USER INSTRUCTIONS ---
${userInstructions}
--- END USER INSTRUCTIONS ---

Arabic inputs:
- Hook: ${hook}
- Offer: ${offer}
- CTA: ${cta}

RESPOND WITH VALID JSON ONLY. No extra text, no markdown, no explanation.
{
  "hook_ru": "...",
  "offer_ru": "...",
  "cta_ru": "...",
  "full_copy_ru": "..."
}`;
}

export function buildImagePrompt(
  russianText: string,
  styleModifier: string,
  userInstructions: string
): string {
  return `Generate an ad image. Follow the instructions below exactly.

--- USER INSTRUCTIONS ---
${userInstructions}
--- END USER INSTRUCTIONS ---

THE FOLLOWING RUSSIAN TEXT MUST APPEAR ON THE IMAGE — render it clearly and legibly:
"""
${russianText}
"""

CRITICAL TEXT RULES:
- The Russian text above MUST be displayed on the image as the main headline/body text
- Render every Russian word correctly with proper Cyrillic characters (А-Я, а-я)
- The text must be large, bold, and easy to read

Visual style: ${styleModifier}`;
}
