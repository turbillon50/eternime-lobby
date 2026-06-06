/**
 * Semantic retrieval (RAG) over a user's private vault.
 *
 * Uses pgvector cosine distance to find the memories most relevant to a query
 * embedding. Runs against the per-user tenant DB only — never cross-tenant.
 */
import "server-only";

import { and, cosineDistance, desc, gt, isNull, sql } from "drizzle-orm";

import type { TenantDb } from "@/lib/db/tenant";
import { memories } from "@/lib/db/schema/tenant";

export interface RetrievedMemory {
  title: string | null;
  content: string;
  similarity: number;
}

/**
 * Top-k memories semantically closest to `queryEmbedding`, excluding
 * soft-deleted rows and anything below `minSimilarity`.
 */
export async function retrieveRelevantMemories(
  db: TenantDb,
  queryEmbedding: number[],
  options: { k?: number; minSimilarity?: number } = {},
): Promise<RetrievedMemory[]> {
  const k = options.k ?? 6;
  const minSimilarity = options.minSimilarity ?? 0.2;

  // cosineDistance ∈ [0,2]; similarity = 1 - distance ∈ [-1,1].
  const similarity = sql<number>`1 - (${cosineDistance(memories.embedding, queryEmbedding)})`;

  const rows = await db
    .select({
      title: memories.title,
      content: memories.contentText,
      similarity,
    })
    .from(memories)
    .where(and(isNull(memories.deletedAt), gt(similarity, minSimilarity)))
    .orderBy(desc(similarity))
    .limit(k);

  return rows
    .filter((r) => Boolean(r.content))
    .map((r) => ({
      title: r.title,
      content: r.content as string,
      similarity: Number(r.similarity),
    }));
}
