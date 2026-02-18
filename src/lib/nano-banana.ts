import { GoogleGenAI } from "@google/genai";
import { buildImagePrompt } from "./prompts";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });

export async function generateAdImage(
  russianText: string,
  styleModifier: string,
  visualInstructions: string = ""
): Promise<string> {
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

export async function generateAdImages(
  russianText: string,
  styleModifier: string,
  count: number,
  visualInstructions: string = ""
): Promise<string[]> {
  const results = await Promise.allSettled(
    Array.from({ length: count }, () =>
      generateAdImage(russianText, styleModifier, visualInstructions)
    )
  );

  const images = results
    .filter(
      (r): r is PromiseFulfilledResult<string> => r.status === "fulfilled"
    )
    .map((r) => r.value);

  if (images.length === 0) {
    throw new Error("Failed to generate any images");
  }

  return images;
}
