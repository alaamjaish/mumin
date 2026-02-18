import { NextRequest, NextResponse } from "next/server";
import { generateAdImages } from "@/lib/nano-banana";
import { AD_STYLES } from "@/lib/styles";

export async function POST(request: NextRequest) {
  try {
    const { russian_text, styles, count_per_style, visual_instructions } = await request.json();

    if (!russian_text || !styles || !Array.isArray(styles) || styles.length === 0) {
      return NextResponse.json(
        { error: "النص الروسي والستايلات مطلوبة" },
        { status: 400 }
      );
    }

    const count = Math.min(Math.max(count_per_style || 1, 1), 10);

    const allImages: { style: string; url: string }[] = [];

    for (const styleId of styles) {
      const style = AD_STYLES.find((s) => s.id === styleId);
      if (!style) continue;

      const images = await generateAdImages(
        russian_text,
        style.prompt_modifier,
        count,
        visual_instructions || ""
      );

      for (const url of images) {
        allImages.push({ style: styleId, url });
      }
    }

    return NextResponse.json({ images: allImages });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في توليد الصور" },
      { status: 500 }
    );
  }
}
