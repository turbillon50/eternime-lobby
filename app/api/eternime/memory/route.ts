import { NextResponse } from "next/server";
import type { MemoryKind } from "@/lib/eternime/types";
import { createLlmEmbedding } from "@/lib/eternime/llm";
import { createMemoryRecord } from "@/lib/eternime/vector-memory";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    ownerId?: string;
    kind?: MemoryKind;
    text?: string;
  };

  if (!body.ownerId || !body.kind || !body.text || body.text.trim().length < 8) {
    return NextResponse.json({ error: "Missing or invalid memory payload." }, { status: 400 });
  }

  let llmEmbedding: Awaited<ReturnType<typeof createLlmEmbedding>> = null;

  try {
    llmEmbedding = await createLlmEmbedding(body.text);
  } catch {
    llmEmbedding = null;
  }

  const memory = createMemoryRecord({
    ownerId: body.ownerId,
    kind: body.kind,
    text: body.text,
    embedding: llmEmbedding?.embedding,
    embeddingModel: llmEmbedding?.model,
    embeddingProvider: llmEmbedding?.provider ?? "local",
  });

  return NextResponse.json({
    memory,
    connected: Boolean(llmEmbedding),
  });
}
