import { NextResponse } from "next/server";
import type { MemoryKind } from "@/lib/eternime/types";
import { createOpenAIEmbedding } from "@/lib/eternime/openai";
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

  let openAIEmbedding: Awaited<ReturnType<typeof createOpenAIEmbedding>> = null;

  try {
    openAIEmbedding = await createOpenAIEmbedding(body.text);
  } catch {
    openAIEmbedding = null;
  }

  const memory = createMemoryRecord({
    ownerId: body.ownerId,
    kind: body.kind,
    text: body.text,
    embedding: openAIEmbedding?.embedding,
    embeddingModel: openAIEmbedding?.model,
    embeddingProvider: openAIEmbedding ? "openai" : "local",
  });

  return NextResponse.json({
    memory,
    connected: Boolean(openAIEmbedding),
  });
}
