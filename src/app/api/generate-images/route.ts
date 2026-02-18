import { NextRequest, NextResponse } from "next/server";
import { generateAdImages } from "@/lib/nano-banana";
import { AD_STYLES } from "@/lib/styles";

const MAX_COUNT_PER_STYLE = 10;
const MAX_TOTAL_IMAGES_PER_REQUEST = 30;

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const { russian_text, styles, count_per_style, visual_instructions } = await request.json();

    if (!russian_text || !styles || !Array.isArray(styles) || styles.length === 0) {
      return NextResponse.json({ error: "Russian text and styles are required" }, { status: 400 });
    }

    const normalizedCount = Math.min(
      Math.max(Math.floor(Number(count_per_style) || 1), 1),
      MAX_COUNT_PER_STYLE
    );

    const validStyles = [...new Set(styles)]
      .filter((styleId): styleId is string => typeof styleId === "string")
      .filter((styleId) => AD_STYLES.some((s) => s.id === styleId));

    if (validStyles.length === 0) {
      return NextResponse.json({ error: "No valid styles selected" }, { status: 400 });
    }

    const totalRequested = validStyles.length * normalizedCount;
    if (totalRequested > MAX_TOTAL_IMAGES_PER_REQUEST) {
      return NextResponse.json(
        { error: `Too many images in one request (${totalRequested}). Max is ${MAX_TOTAL_IMAGES_PER_REQUEST}.` },
        { status: 400 }
      );
    }

    const allImages: { style: string; url: string }[] = [];
    const styleErrors: { style: string; message: string }[] = [];

    // Fire ALL styles in parallel — each style batch is itself parallel internally.
    const styleResults = await Promise.allSettled(
      validStyles.map(async (styleId) => {
        const style = AD_STYLES.find((s) => s.id === styleId);
        if (!style) return;

        const images = await generateAdImages(
          russian_text,
          style.prompt_modifier,
          normalizedCount,
          visual_instructions || ""
        );

        for (const url of images) {
          allImages.push({ style: styleId, url });
        }
      })
    );

    // Collect errors from rejected styles
    for (let i = 0; i < styleResults.length; i++) {
      const result = styleResults[i];
      if (result.status === "rejected") {
        styleErrors.push({
          style: validStyles[i],
          message: result.reason instanceof Error ? result.reason.message : "Unknown generation error",
        });
      }
    }

    if (allImages.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate any images", style_errors: styleErrors },
        { status: 502 }
      );
    }

    return NextResponse.json({ images: allImages, style_errors: styleErrors });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json({ error: "Image generation failed" }, { status: 500 });
  }
}
