import { NextResponse } from "next/server";
import type { MemoryRecord } from "@/lib/eternime/types";
import { createOpenAIEmbedding } from "@/lib/eternime/openai";
import { searchMemoriesByVector, searchSemanticMemories } from "@/lib/eternime/vector-memory";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    query?: string;
    memories?: MemoryRecord[];
  };

  const query = body.query?.trim();
  const memories = body.memories ?? [];
  if (!query) {
    return NextResponse.json({ results: [], connected: false });
  }

  const canUseOpenAI =
    memories.length > 0 && memories.every((memory) => memory.embeddingProvider === "openai");
  let openAIEmbedding: Awaited<ReturnType<typeof createOpenAIEmbedding>> = null;

  try {
    openAIEmbedding = canUseOpenAI ? await createOpenAIEmbedding(query) : null;
  } catch {
    openAIEmbedding = null;
  }

  const results = openAIEmbedding
    ? searchMemoriesByVector(openAIEmbedding.embedding, memories)
    : searchSemanticMemories(query, memories);

  return NextResponse.json({
    results,
    connected: Boolean(openAIEmbedding),
  });
}
