"use client";

import { GoogleGenAI } from "@google/genai";
import { buildImagePrompt } from "./prompts";
import { AD_STYLES } from "./styles";

/* ------------------------------------------------------------------ */
/*  Single image generation (browser-side)                             */
/* ------------------------------------------------------------------ */

export async function generateAdImage(
    apiKey: string,
    russianText: string,
    styleModifier: string,
    visualInstructions: string = ""
): Promise<string> {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildImagePrompt(russianText, styleModifier, visualInstructions);

    const response = await ai.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: prompt,
        config: {
            responseModalities: ["TEXT", "IMAGE"],
        },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];

    for (const part of parts) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }

    throw new Error("No image generated in the response");
}

/* ------------------------------------------------------------------ */
/*  Batch: multiple images in parallel (browser-side)                  */
/* ------------------------------------------------------------------ */

export async function generateAdImages(
    apiKey: string,
    russianText: string,
    styleModifier: string,
    count: number,
    visualInstructions: string = ""
): Promise<string[]> {
    const results = await Promise.allSettled(
        Array.from({ length: count }, () =>
            generateAdImage(apiKey, russianText, styleModifier, visualInstructions)
        )
    );

    const images = results
        .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
        .map((r) => r.value);

    if (images.length === 0) {
        throw new Error("Failed to generate any images");
    }

    return images;
}

/* ------------------------------------------------------------------ */
/*  Full pipeline: multiple styles x count (browser-side)              */
/* ------------------------------------------------------------------ */

export async function generateImagesForStyles(
    apiKey: string,
    russianText: string,
    styleIds: string[],
    countPerStyle: number,
    visualInstructions: string = ""
): Promise<{
    images: { style: string; url: string }[];
    styleErrors: { style: string; message: string }[];
}> {
    const allImages: { style: string; url: string }[] = [];
    const styleErrors: { style: string; message: string }[] = [];

    const validStyles = [...new Set(styleIds)]
        .filter((styleId) => AD_STYLES.some((s) => s.id === styleId));

    const styleResults = await Promise.allSettled(
        validStyles.map(async (styleId) => {
            const style = AD_STYLES.find((s) => s.id === styleId);
            if (!style) return;

            const images = await generateAdImages(
                apiKey,
                russianText,
                style.prompt_modifier,
                countPerStyle,
                visualInstructions
            );

            for (const url of images) {
                allImages.push({ style: styleId, url });
            }
        })
    );

    for (let i = 0; i < styleResults.length; i++) {
        const result = styleResults[i];
        if (result.status === "rejected") {
            styleErrors.push({
                style: validStyles[i],
                message: result.reason instanceof Error ? result.reason.message : "Unknown generation error",
            });
        }
    }

    return { images: allImages, styleErrors };
}
