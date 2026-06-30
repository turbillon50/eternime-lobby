import { getSql } from "@/lib/db";
import type { Memory, MemoryKind } from "./types";

/** Literal de array Postgres seguro para text[]. */
function pgTextArray(items: string[]): string {
  if (!items.length) return "{}";
  return "{" + items.map((s) => '"' + String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"').join(",") + "}";
}

export async function listMemories(userId: string): Promise<Memory[]> {
  const sql = getSql();
  if (!sql) return [];
  const rows = await sql`
    SELECT id, user_id, title, content, kind, media_url, media_urls, emotional_tone, created_at
    FROM eternime_memories WHERE user_id = ${userId} ORDER BY created_at DESC`;
  return rows as Memory[];
}

export async function getMemory(id: string, userId: string): Promise<Memory | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql`
    SELECT id, user_id, title, content, kind, media_url, media_urls, emotional_tone, created_at
    FROM eternime_memories WHERE id = ${id} AND user_id = ${userId} LIMIT 1`;
  return (rows[0] as Memory) ?? null;
}

export async function createMemory(input: {
  userId: string;
  title: string;
  content?: string | null;
  kind: MemoryKind;
  mediaUrl?: string | null;
  mediaUrls?: string[] | null;
  aiContext?: string | null;
  emotionalTone?: string | null;
  source?: "manual" | "conversacion";
}): Promise<Memory | null> {
  const sql = getSql();
  if (!sql) return null;
  const media = input.mediaUrls ?? [];
  const rows = await sql`
    INSERT INTO eternime_memories (user_id, title, content, kind, media_url, media_urls, ai_context, emotional_tone, source)
    VALUES (${input.userId}, ${input.title}, ${input.content ?? null}, ${input.kind},
            ${input.mediaUrl ?? (media[0] ?? null)}, ${pgTextArray(media)}::text[],
            ${input.aiContext ?? null}, ${input.emotionalTone ?? null}, ${input.source ?? "manual"})
    RETURNING id, user_id, title, content, kind, media_url, media_urls, emotional_tone, created_at`;
  return (rows[0] as Memory) ?? null;
}

export async function countConversationMemories(userId: string): Promise<number> {
  const sql = getSql();
  if (!sql) return 0;
  const rows = await sql`SELECT count(*)::int AS n FROM eternime_memories WHERE user_id = ${userId} AND source = 'conversacion'`;
  return (rows[0]?.n as number) ?? 0;
}

export async function deleteMemory(id: string, userId: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  const rows = await sql`DELETE FROM eternime_memories WHERE id = ${id} AND user_id = ${userId} RETURNING id`;
  return rows.length > 0;
}

export async function countMemories(userId: string): Promise<number> {
  const sql = getSql();
  if (!sql) return 0;
  const rows = await sql`SELECT count(*)::int AS n FROM eternime_memories WHERE user_id = ${userId}`;
  return (rows[0]?.n as number) ?? 0;
}

export async function updateMemory(
  id: string,
  userId: string,
  patch: {
    title?: string;
    content?: string | null;
    kind?: MemoryKind;
    mediaUrl?: string | null;
    emotionalTone?: string | null;
  },
): Promise<Memory | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql`
    UPDATE eternime_memories SET
      title = COALESCE(${patch.title ?? null}, title),
      content = CASE WHEN ${patch.content !== undefined} THEN ${patch.content ?? null} ELSE content END,
      kind = COALESCE(${patch.kind ?? null}, kind),
      media_url = CASE WHEN ${patch.mediaUrl !== undefined} THEN ${patch.mediaUrl ?? null} ELSE media_url END,
      emotional_tone = CASE WHEN ${patch.emotionalTone !== undefined} THEN ${patch.emotionalTone ?? null} ELSE emotional_tone END
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id, user_id, title, content, kind, media_url, media_urls, emotional_tone, created_at`;
  return (rows[0] as Memory) ?? null;
}
