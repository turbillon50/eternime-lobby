/**
 * Create and list memories in the signed-in user's private vault.
 *
 * POST accepts multipart/form-data:
 *   - title?:   string
 *   - content?: string (the memory text / description)
 *   - type?:    text | audio | video | photo | document
 *   - file?:    optional binary (uploaded to Vercel Blob under /users/{id}/…)
 *
 * A Gemini embedding is generated from the text so the memory becomes
 * retrievable by the chat RAG immediately.
 */
import { desc, isNull } from "drizzle-orm";

import { isClerkConfigured } from "@/lib/clerk";
import { isGeminiConfigured, generateEmbedding } from "@/lib/ai/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const VALID_TYPES = ["text", "audio", "video", "photo", "document"] as const;
type MemoryType = (typeof VALID_TYPES)[number];

async function requireUser() {
  if (!isClerkConfigured()) return { error: "Auth not configured", status: 503 as const };
  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  if (!userId) return { error: "unauthenticated", status: 401 as const };
  return { userId };
}

export async function POST(req: Request) {
  const u = await requireUser();
  if ("error" in u) return Response.json({ error: u.error }, { status: u.status });

  const form = await req.formData().catch(() => null);
  if (!form) return Response.json({ error: "Invalid form data" }, { status: 400 });

  const title = (form.get("title") as string | null)?.trim() || null;
  const content = (form.get("content") as string | null)?.trim() || null;
  const rawType = (form.get("type") as string | null)?.trim();
  const type: MemoryType = VALID_TYPES.includes(rawType as MemoryType)
    ? (rawType as MemoryType)
    : "text";
  const file = form.get("file");

  if (!content && !(file instanceof File)) {
    return Response.json({ error: "Comparte un texto o un archivo." }, { status: 400 });
  }

  const { getTenantDb, TenantNotReadyError } = await import("@/lib/db/tenant");
  const { memories } = await import("@/lib/db/schema/tenant");

  let db;
  try {
    db = await getTenantDb(u.userId);
  } catch (error) {
    if (error instanceof TenantNotReadyError) {
      return Response.json({ error: "Tu bóveda aún se está preparando." }, { status: 425 });
    }
    throw error;
  }

  // Upload binary to Blob (ownership-scoped path) when present.
  let blobUrl: string | null = null;
  if (file instanceof File && file.size > 0) {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import("@vercel/blob");
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const uploaded = await put(`users/${u.userId}/${Date.now()}-${safeName}`, file, {
        access: "public",
        addRandomSuffix: true,
      });
      blobUrl = uploaded.url;
    } else {
      return Response.json({ error: "Almacenamiento no configurado." }, { status: 503 });
    }
  }

  // Embed the text so the memory is searchable right away (best-effort).
  let embedding: number[] | null = null;
  const embedText = [title, content].filter(Boolean).join(". ");
  if (embedText && isGeminiConfigured()) {
    try {
      embedding = await generateEmbedding(embedText);
    } catch {
      /* embedding optional */
    }
  }

  const [created] = await db
    .insert(memories)
    .values({
      type,
      title,
      contentText: content,
      blobUrl,
      embedding,
      source: "manual",
      capturedAt: new Date(),
    })
    .returning({ id: memories.id });

  return Response.json({ ok: true, id: created.id });
}

export async function GET() {
  const u = await requireUser();
  if ("error" in u) return Response.json({ error: u.error }, { status: u.status });

  const { getTenantDb, TenantNotReadyError } = await import("@/lib/db/tenant");
  const { memories } = await import("@/lib/db/schema/tenant");

  try {
    const db = await getTenantDb(u.userId);
    const rows = await db
      .select({
        id: memories.id,
        title: memories.title,
        content: memories.contentText,
        type: memories.type,
        blobUrl: memories.blobUrl,
        createdAt: memories.createdAt,
      })
      .from(memories)
      .where(isNull(memories.deletedAt))
      .orderBy(desc(memories.createdAt))
      .limit(100);
    return Response.json({ memories: rows });
  } catch (error) {
    if (error instanceof TenantNotReadyError) return Response.json({ memories: [] });
    throw error;
  }
}
