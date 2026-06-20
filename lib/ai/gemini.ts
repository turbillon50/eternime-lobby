/**
 * Google Gemini client for Eternime.
 *
 * Models (per spec):
 *   · Chat diario .............. gemini-2.5-flash (rápido, 1M ctx)
 *   · Análisis / síntesis ...... gemini-2.5-pro (con thinking)
 *   · Audio multimodal ......... gemini-2.5-pro
 *   · Embeddings ............... gemini-embedding-001 (3072 dims)
 *
 * Uses the official `@google/genai` SDK. All functions are server-only.
 */
import "server-only";

import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODELS = {
  chat: "gemini-2.5-flash",
  deep: "gemini-2.5-pro",
  embedding: "gemini-embedding-001",
} as const;

export const EMBEDDING_DIMENSIONS = 3072;

function apiKey(): string {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY (or GEMINI_API_KEY).");
  }
  return key;
}

let client: GoogleGenAI | null = null;
function genai(): GoogleGenAI {
  if (!client) client = new GoogleGenAI({ apiKey: apiKey() });
  return client;
}

export function isGeminiConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY,
  );
}

export interface ChatTurn {
  role: "user" | "ai";
  content: string;
}

/**
 * Stream a chat response. Returns an async iterable of text chunks so callers
 * can pipe straight into a streaming HTTP response (latency matters — every AI
 * reply in Eternime streams).
 */
export async function* streamChat(input: {
  systemPrompt: string;
  history: ChatTurn[];
  message: string;
  model?: string;
}): AsyncGenerator<string> {
  const ai = genai();
  // Map Eternime's "ai" role to Gemini's "model" role.
  const contents = [
    ...input.history.map((turn) => ({
      role: turn.role === "ai" ? "model" : "user",
      parts: [{ text: turn.content }],
    })),
    { role: "user", parts: [{ text: input.message }] },
  ];

  const stream = await ai.models.generateContentStream({
    model: input.model ?? GEMINI_MODELS.chat,
    contents,
    config: { systemInstruction: input.systemPrompt },
  });

  for await (const chunk of stream) {
    const text = chunk.text;
    if (text) yield text;
  }
}

/** Generate a 3072-dim embedding for semantic search / RAG over the vault. */
export async function generateEmbedding(text: string): Promise<number[]> {
  const ai = genai();
  const result = await ai.models.embedContent({
    model: GEMINI_MODELS.embedding,
    contents: text,
    config: { outputDimensionality: EMBEDDING_DIMENSIONS },
  });
  const values = result.embeddings?.[0]?.values;
  if (!values) throw new Error("Gemini returned no embedding values.");
  return values;
}

/** One-shot, non-streaming completion (used for daily prompts, summaries). */
export async function complete(input: {
  systemPrompt?: string;
  prompt: string;
  model?: string;
}): Promise<string> {
  const ai = genai();
  const result = await ai.models.generateContent({
    model: input.model ?? GEMINI_MODELS.chat,
    contents: input.prompt,
    config: input.systemPrompt ? { systemInstruction: input.systemPrompt } : undefined,
  });
  return result.text ?? "";
}

/** Describe una imagen (visión) para enriquecer el contexto del recuerdo. */
export async function describeImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const mime = res.headers.get("content-type") || "image/jpeg";
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 8 * 1024 * 1024) return null; // evita imágenes enormes
    const ai = genai();
    const result = await ai.models.generateContent({
      model: GEMINI_MODELS.chat,
      contents: [
        { role: "user", parts: [
          { inlineData: { mimeType: mime, data: buf.toString("base64") } },
          { text: "Describe esta foto en 1-2 frases en español, para preservarla como recuerdo: qué se ve, ambiente y posible significado emocional. Sin inventar nombres." },
        ] },
      ],
    });
    return (result.text ?? "").trim() || null;
  } catch {
    return null;
  }
}
