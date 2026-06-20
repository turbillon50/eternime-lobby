import "server-only";
import { getSql } from "@/lib/db";
import { generateEmbedding } from "@/lib/ai/gemini";

function toVectorLiteral(values: number[]): string {
  return `[${values.join(",")}]`;
}

/** Embedding 3072-dim de Gemini. Devuelve null si falla (degradar con gracia). */
export async function embedText(text: string): Promise<number[] | null> {
  const clean = (text ?? "").trim();
  if (!clean) return null;
  try {
    return await generateEmbedding(clean.slice(0, 8000));
  } catch (e) {
    console.error("[rag] embedText failed:", e instanceof Error ? e.message : e);
    return null;
  }
}

/** Genera y guarda el embedding de un recuerdo. Best-effort. */
export async function storeMemoryEmbedding(memoryId: string, userId: string, text: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  const vec = await embedText(text);
  if (!vec) return false;
  try {
    await sql`UPDATE eternime_memories SET embedding = ${toVectorLiteral(vec)}::vector
              WHERE id = ${memoryId} AND user_id = ${userId}`;
    return true;
  } catch (e) {
    console.error("[rag] store failed:", e instanceof Error ? e.message : e);
    return false;
  }
}

export type RetrievedMemory = {
  id: string;
  title: string;
  content: string | null;
  kind: string;
  emotional_tone: string | null;
  score: number;
};

/** Recupera los recuerdos más relevantes para una consulta (búsqueda semántica). */
export async function searchMemories(userId: string, query: string, k = 6): Promise<RetrievedMemory[]> {
  const sql = getSql();
  if (!sql) return [];
  const vec = await embedText(query);
  if (!vec) return [];
  try {
    const rows = await sql`
      SELECT id, title, content, kind, emotional_tone,
             1 - (embedding <=> ${toVectorLiteral(vec)}::vector) AS score
      FROM eternime_memories
      WHERE user_id = ${userId} AND embedding IS NOT NULL
      ORDER BY embedding <=> ${toVectorLiteral(vec)}::vector
      LIMIT ${k}`;
    return rows as RetrievedMemory[];
  } catch (e) {
    console.error("[rag] search failed:", e instanceof Error ? e.message : e);
    return [];
  }
}

/** Cuántos recuerdos tienen embedding (para diagnósticos). */
export async function countEmbedded(userId: string): Promise<number> {
  const sql = getSql();
  if (!sql) return 0;
  const rows = await sql`SELECT count(*)::int AS n FROM eternime_memories WHERE user_id = ${userId} AND embedding IS NOT NULL`;
  return (rows[0]?.n as number) ?? 0;
}
