import { NextRequest, NextResponse } from "next/server";
import { generateRussianAdText } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const { hook, offer, cta, instructions } = await request.json();

    if (!hook || !offer || !cta) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة: hook, offer, cta" },
        { status: 400 }
      );
    }

    if (!instructions?.trim()) {
      return NextResponse.json(
        { error: "التعليمات مطلوبة" },
        { status: 400 }
      );
    }

    const result = await generateRussianAdText(hook, offer, cta, instructions);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Text generation error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في توليد النص الروسي" },
      { status: 500 }
    );
  }
}
