/**
 * Completes onboarding: saves the user's preferred name to the control plane
 * and writes their first memory into their isolated tenant vault (with an
 * embedding when Gemini is configured).
 */
import { NextResponse } from "next/server";

import { isClerkConfigured } from "@/lib/clerk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CompleteBody {
  name?: string;
  firstMemory?: string;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as CompleteBody;
  const name = body.name?.trim();
  const firstMemory = body.firstMemory?.trim();

  if (!isClerkConfigured()) {
    // Demo mode: accept and no-op so the UI flow can be exercised locally.
    return NextResponse.json({ ok: true, demo: true });
  }

  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // 1) Persist the preferred name on the control-plane user row.
  if (name) {
    const { getControlDb } = await import("@/lib/db/control");
    const { users } = await import("@/lib/db/schema/control-plane");
    const { eq } = await import("drizzle-orm");
    await getControlDb()
      .update(users)
      .set({ name, updatedAt: new Date() })
      .where(eq(users.clerkId, userId));
  }

  // 2) Store the first memory in the user's private vault.
  if (firstMemory) {
    try {
      const { getTenantDb } = await import("@/lib/db/tenant");
      const { memories } = await import("@/lib/db/schema/tenant");
      const db = await getTenantDb(userId);

      let embedding: number[] | null = null;
      try {
        const { isGeminiConfigured, generateEmbedding } = await import("@/lib/ai/gemini");
        if (isGeminiConfigured()) embedding = await generateEmbedding(firstMemory);
      } catch {
        // Embedding is best-effort; the memory is still saved without it.
      }

      await db.insert(memories).values({
        type: "text",
        title: "Primer recuerdo",
        contentText: firstMemory,
        source: "manual",
        importanceScore: 0.8,
        embedding,
        capturedAt: new Date(),
      });
    } catch {
      // Tenant not ready yet — name is saved; the memory can be re-captured.
      return NextResponse.json({ ok: true, memorySaved: false });
    }
  }

  return NextResponse.json({ ok: true, memorySaved: Boolean(firstMemory) });
}
