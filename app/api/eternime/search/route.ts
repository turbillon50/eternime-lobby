import { NextResponse } from "next/server";
import type { MemoryRecord } from "@/lib/eternime/types";
import { createLlmEmbedding } from "@/lib/eternime/llm";
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

  const canUseRemote =
    memories.length > 0 && memories.every((memory) => memory.embeddingProvider !== "local");
  let llmEmbedding: Awaited<ReturnType<typeof createLlmEmbedding>> = null;

  try {
    llmEmbedding = canUseRemote ? await createLlmEmbedding(query) : null;
  } catch {
    llmEmbedding = null;
  }

  const results = llmEmbedding
    ? searchMemoriesByVector(llmEmbedding.embedding, memories)
    : searchSemanticMemories(query, memories);

  return NextResponse.json({
    results,
    connected: Boolean(llmEmbedding),
  });
}
