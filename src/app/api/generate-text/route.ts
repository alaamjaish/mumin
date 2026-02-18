import { NextRequest, NextResponse } from "next/server";
import { generateRussianAdText } from "@/lib/gemini";
import { DEFAULT_RUSSIAN_INSTRUCTIONS } from "@/lib/prompts";

export async function POST(request: NextRequest) {
  try {
    const { hook, offer, cta, instructions } = await request.json();

    if (!hook || !offer || !cta) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة: hook, offer, cta" },
        { status: 400 }
      );
    }

    const finalInstructions = instructions?.trim() || DEFAULT_RUSSIAN_INSTRUCTIONS;
    const result = await generateRussianAdText(hook, offer, cta, finalInstructions);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Text generation error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في توليد النص الروسي" },
      { status: 500 }
    );
  }
}
