import { GoogleGenerativeAI } from "@google/generative-ai";
import { TextGenerationOutput } from "@/types";
import { buildTextGenerationPrompt } from "./prompts";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

async function generateSingleVariation(
  prompt: string
): Promise<TextGenerationOutput> {
  const model = genAI.getGenerativeModel({
    model: "gemini-3-pro-preview",
    generationConfig: { temperature: 1.2 },
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response as JSON");
  }

  return JSON.parse(jsonMatch[0]);
}

export async function generateRussianAdText(
  hook: string,
  offer: string,
  cta: string,
  instructions: string,
  batchSize: number = 5
): Promise<TextGenerationOutput[]> {
  const prompt = buildTextGenerationPrompt(hook, offer, cta, instructions);

  const results = await Promise.allSettled(
    Array.from({ length: batchSize }, () => generateSingleVariation(prompt))
  );

  const successful = results
    .filter((r): r is PromiseFulfilledResult<TextGenerationOutput> => r.status === "fulfilled")
    .map((r) => r.value);

  if (successful.length === 0) {
    throw new Error("Failed to generate any variations");
  }

  return successful;
}
