import type { MemoryRecord, PersonalAgentState } from "@/lib/eternime/types";
import {
  createGeminiEmbedding,
  createGeminiGuideResponse,
  getGeminiStatus,
} from "@/lib/eternime/gemini";
import {
  createOpenAIEmbedding,
  createGuideResponse as createOpenAIGuideResponse,
  getOpenAIStatus,
} from "@/lib/eternime/openai";

export type LlmProvider = "gemini" | "openai" | "local";

/** Orden de proveedores: Gemini → OpenAI → fallback local (nunca rompe sin keys). */
export function getActiveProvider(): LlmProvider {
  if (getGeminiStatus().connected) return "gemini";
  if (getOpenAIStatus().connected) return "openai";
  return "local";
}

export function getLlmStatus() {
  const provider = getActiveProvider();
  const detail =
    provider === "gemini"
      ? getGeminiStatus()
      : provider === "openai"
        ? getOpenAIStatus()
        : { connected: false, guideModel: "local-fallback", embeddingModel: "eternime-local-hash-v1" };

  return {
    provider,
    connected: provider !== "local",
    guideModel: detail.guideModel,
    embeddingModel: detail.embeddingModel,
  };
}

/** Embedding del proveedor activo. Null → el llamador usa el embedding local. */
export async function createLlmEmbedding(input: string) {
  const provider = getActiveProvider();
  if (provider === "gemini") {
    const result = await createGeminiEmbedding(input);
    return result ? { ...result, provider: "gemini" as const } : null;
  }
  if (provider === "openai") {
    const result = await createOpenAIEmbedding(input);
    return result ? { ...result, provider: "openai" as const } : null;
  }
  return null;
}

/** Respuesta de guía del proveedor activo. Null → el llamador usa el fallback local. */
export async function createLlmGuideResponse(input: {
  state: PersonalAgentState;
  memories: MemoryRecord[];
}) {
  const provider = getActiveProvider();
  if (provider === "gemini") return createGeminiGuideResponse(input);
  if (provider === "openai") return createOpenAIGuideResponse(input);
  return null;
}
