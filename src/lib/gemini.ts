import { GoogleGenerativeAI } from "@google/generative-ai";

export function getGeminiClient(apiKey?: string | null) {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("Gemini API key is not configured");
  }
  return new GoogleGenerativeAI(key);
}

export async function generateGeminiText(
  prompt: string,
  apiKey?: string | null
): Promise<string> {
  const client = getGeminiClient(apiKey);
  const model = client.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export function parseJsonFromText<T>(text: string): T {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
  return JSON.parse(jsonStr.trim()) as T;
}
