import { NextResponse } from "next/server";
import type { MemoryRecord } from "@/lib/eternime/types";
import { createLlmGuideResponse as createGuideResponse } from "@/lib/eternime/llm";
import { createPersonalAgentState, getNextGuidePrompt } from "@/lib/eternime/personal-memory-agent";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    ownerId?: string;
    memories?: MemoryRecord[];
  };

  const ownerId = body.ownerId || "demo-eternime-owner";
  const memories = body.memories ?? [];
  const state = createPersonalAgentState(ownerId, memories);
  let openAIResponse: Awaited<ReturnType<typeof createGuideResponse>> = null;

  try {
    openAIResponse = await createGuideResponse({ state, memories });
  } catch {
    openAIResponse = null;
  }

  return NextResponse.json({
    prompt: openAIResponse || getNextGuidePrompt(state),
    connected: Boolean(openAIResponse),
    state,
  });
}
