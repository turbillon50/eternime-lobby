import { getSql } from "@/lib/db";
import type { Memory, MemoryKind } from "./types";

export async function listMemories(userId: string): Promise<Memory[]> {
  const sql = getSql();
  if (!sql) return [];
  const rows = await sql`
    SELECT * FROM eternime_memories WHERE user_id = ${userId} ORDER BY created_at DESC`;
  return rows as Memory[];
}

export async function getMemory(id: string, userId: string): Promise<Memory | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql`
    SELECT * FROM eternime_memories WHERE id = ${id} AND user_id = ${userId} LIMIT 1`;
  return (rows[0] as Memory) ?? null;
}

export async function createMemory(input: {
  userId: string;
  title: string;
  content?: string | null;
  kind: MemoryKind;
  mediaUrl?: string | null;
  emotionalTone?: string | null;
}): Promise<Memory | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql`
    INSERT INTO eternime_memories (user_id, title, content, kind, media_url, emotional_tone)
    VALUES (${input.userId}, ${input.title}, ${input.content ?? null}, ${input.kind},
            ${input.mediaUrl ?? null}, ${input.emotionalTone ?? null})
    RETURNING *`;
  return (rows[0] as Memory) ?? null;
}

export async function deleteMemory(id: string, userId: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  const rows = await sql`
    DELETE FROM eternime_memories WHERE id = ${id} AND user_id = ${userId} RETURNING id`;
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
    RETURNING *`;
  return (rows[0] as Memory) ?? null;
}
