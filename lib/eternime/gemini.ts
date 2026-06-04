import type { MemoryRecord, PersonalAgentState } from "@/lib/eternime/types";
import { eternimeMasterAgent } from "@/lib/eternime/master-agent";

const geminiBaseUrl = "https://generativelanguage.googleapis.com/v1beta/models";
const defaultGuideModel = "gemini-2.0-flash";
const defaultEmbeddingModel = "text-embedding-004";

function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
}

export function getGeminiStatus() {
  return {
    connected: Boolean(getGeminiApiKey()),
    guideModel: process.env.GEMINI_MODEL || defaultGuideModel,
    embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || defaultEmbeddingModel,
  };
}

export async function createGeminiEmbedding(input: string) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const model = process.env.GEMINI_EMBEDDING_MODEL || defaultEmbeddingModel;
  const response = await fetch(`${geminiBaseUrl}/${model}:embedContent`, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: { parts: [{ text: input }] },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini embeddings request failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    embedding?: { values?: number[] };
  };

  const embedding = payload.embedding?.values;
  if (!embedding?.length) {
    throw new Error("Gemini embeddings response did not include an embedding.");
  }

  return { embedding, model };
}

export async function createGeminiGuideResponse(input: {
  state: PersonalAgentState;
  memories: MemoryRecord[];
}) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || defaultGuideModel;
  const recentMemories = input.memories.slice(0, 8).map((memory) => ({
    kind: memory.kind,
    title: memory.title,
    text: memory.text,
    tags: memory.tags,
    emotionalWeight: memory.emotionalWeight,
  }));

  const systemInstruction = [
    eternimeMasterAgent.mission,
    ...eternimeMasterAgent.principles,
    "Eres la Guía Personal de Memoria del usuario en Eternime. Responde SIEMPRE en español, con un tono cálido, digno, íntimo y preciso.",
    "Nunca afirmes como recuerdo algo que fue inferido; etiqueta la inferencia como inferencia.",
    "Usa los recuerdos del usuario como contexto para acompañarlo. Devuelve una respuesta breve, una pregunta siguiente suave y una observación de identidad en una sola frase. No menciones detalles de implementación.",
  ].join("\n");

  const response = await fetch(`${geminiBaseUrl}/${model}:generateContent`, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: JSON.stringify({
                guideMode: input.state.guideMode,
                identityProfile: input.state.identityProfile,
                recentMemories,
              }),
            },
          ],
        },
      ],
      generationConfig: { maxOutputTokens: 320, temperature: 0.7 },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini guide request failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join("\n")
    .trim();

  return text || null;
}
