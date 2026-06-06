/**
 * Streaming chat with the user's personal IA.
 *
 * Pipeline per message:
 *   1. Resolve the signed-in user's isolated tenant DB.
 *   2. Embed the incoming message (also used for RAG).
 *   3. Retrieve the most relevant memories (pgvector cosine).
 *   4. Compose: stored personality system prompt + retrieved memories.
 *   5. Stream Gemini's reply to the client while persisting both turns.
 *
 * The conversation id is returned in the `x-conversation-id` header so the
 * client can continue the same thread.
 */
import { and, asc, eq } from "drizzle-orm";

import { isClerkConfigured } from "@/lib/clerk";
import { isGeminiConfigured, streamChat, generateEmbedding } from "@/lib/ai/gemini";
import { composeSystemPrompt } from "@/lib/ai/prompts";
import { retrieveRelevantMemories } from "@/lib/memory/retrieval";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface ChatBody {
  message?: string;
  conversationId?: string;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as ChatBody;
  const message = body.message?.trim();
  if (!message) {
    return Response.json({ error: "Empty message" }, { status: 400 });
  }

  if (!isClerkConfigured()) {
    return Response.json({ error: "Auth not configured" }, { status: 503 });
  }
  if (!isGeminiConfigured()) {
    return Response.json(
      { error: "La inteligencia aún no está conectada. Intenta más tarde." },
      { status: 503 },
    );
  }

  const { auth, currentUser } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "unauthenticated" }, { status: 401 });

  const { getTenantDb, TenantNotReadyError } = await import("@/lib/db/tenant");
  const { conversations, messages, personalityProfile } = await import(
    "@/lib/db/schema/tenant"
  );

  let db;
  try {
    db = await getTenantDb(userId);
  } catch (error) {
    if (error instanceof TenantNotReadyError) {
      return Response.json({ error: "Tu bóveda aún se está preparando." }, { status: 425 });
    }
    throw error;
  }

  // Personalized base prompt (seeded at provisioning, evolves over time).
  const [profile] = await db
    .select({ systemPrompt: personalityProfile.systemPrompt })
    .from(personalityProfile)
    .limit(1);

  const user = await currentUser();
  const name = user?.firstName ?? "ti";

  // Embed the query and retrieve relevant memories (RAG).
  const queryEmbedding = await generateEmbedding(message);
  const relevant = await retrieveRelevantMemories(db, queryEmbedding, { k: 6 });

  const systemPrompt = composeSystemPrompt({
    name,
    personalizedLayer: profile?.systemPrompt ?? null,
    retrievedMemories: relevant.map((m) => (m.title ? `${m.title}: ${m.content}` : m.content)),
  });

  // Resolve / create the conversation thread.
  let conversationId = body.conversationId;
  if (conversationId) {
    const [exists] = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);
    if (!exists) conversationId = undefined;
  }
  if (!conversationId) {
    const [created] = await db.insert(conversations).values({}).returning({ id: conversations.id });
    conversationId = created.id;
  }

  // Load recent history (oldest → newest) for context.
  const history = await db
    .select({ role: messages.role, content: messages.content })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt))
    .limit(20);

  // Persist the user turn immediately (with its embedding).
  await db.insert(messages).values({
    conversationId,
    role: "user",
    content: message,
    embedding: queryEmbedding,
  });

  const encoder = new TextEncoder();
  const convId = conversationId;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = "";
      try {
        for await (const chunk of streamChat({
          systemPrompt,
          history: history.map((h) => ({ role: h.role, content: h.content })),
          message,
        })) {
          full += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
      } catch {
        const fallback =
          "Perdona, me costó encontrar las palabras. ¿Lo intentamos de nuevo?";
        if (!full) controller.enqueue(encoder.encode(fallback));
        full = full || fallback;
      } finally {
        controller.close();
        // Persist the AI turn + bump the message count (best-effort).
        try {
          let aiEmbedding: number[] | null = null;
          try {
            aiEmbedding = await generateEmbedding(full);
          } catch {
            /* embedding optional */
          }
          await db.insert(messages).values({
            conversationId: convId,
            role: "ai",
            content: full,
            embedding: aiEmbedding,
          });
          const count = await db
            .select({ id: messages.id })
            .from(messages)
            .where(and(eq(messages.conversationId, convId)));
          await db
            .update(conversations)
            .set({ messageCount: count.length })
            .where(eq(conversations.id, convId));
        } catch {
          /* non-fatal */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "x-conversation-id": convId,
    },
  });
}
