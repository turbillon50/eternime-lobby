import type { MemoryRecord, PersonalAgentState } from "@/lib/eternime/types";
import { eternimeMasterAgent } from "@/lib/eternime/master-agent";

const openAIBaseUrl = "https://api.openai.com/v1";
const defaultGuideModel = "gpt-5-mini";
const defaultEmbeddingModel = "text-embedding-3-small";

export function getOpenAIStatus() {
  return {
    connected: Boolean(process.env.OPENAI_API_KEY),
    guideModel: process.env.OPENAI_MODEL || defaultGuideModel,
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || defaultEmbeddingModel,
  };
}

export async function createOpenAIEmbedding(input: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_EMBEDDING_MODEL || defaultEmbeddingModel;
  const response = await fetch(`${openAIBaseUrl}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input,
      encoding_format: "float",
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI embeddings request failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    data?: Array<{ embedding?: number[] }>;
    model?: string;
  };

  const embedding = payload.data?.[0]?.embedding;
  if (!embedding?.length) {
    throw new Error("OpenAI embeddings response did not include an embedding.");
  }

  return {
    embedding,
    model: payload.model || model,
  };
}

export async function createGuideResponse(input: {
  state: PersonalAgentState;
  memories: MemoryRecord[];
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODEL || defaultGuideModel;
  const recentMemories = input.memories.slice(0, 8).map((memory) => ({
    kind: memory.kind,
    title: memory.title,
    text: memory.text,
    tags: memory.tags,
    emotionalWeight: memory.emotionalWeight,
  }));

  const response = await fetch(`${openAIBaseUrl}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      instructions: [
        eternimeMasterAgent.mission,
        ...eternimeMasterAgent.principles,
        "You are the user's Personal Memory Agent. Be intimate, calm, precise, and never pretend a memory is known if it was inferred. Always respond in warm, dignified Spanish.",
        "Return a short next question and a one-sentence identity insight. Do not mention implementation details.",
      ].join("\n"),
      input: JSON.stringify({
        guideMode: input.state.guideMode,
        identityProfile: input.state.identityProfile,
        recentMemories,
      }),
      max_output_tokens: 260,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI guide request failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };

  return extractResponseText(payload);
}

function extractResponseText(payload: {
  output_text?: string;
  output?: Array<{ content?: Array<{ text?: string }> }>;
}) {
  if (payload.output_text) return payload.output_text;

  const text = payload.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter(Boolean)
    .join("\n")
    .trim();

  return text || null;
}
