import { getSql } from "@/lib/db";
import type { EternimeFile, FileKind } from "./types";

export function kindFromMime(mime: string | null | undefined): FileKind {
  const m = (mime ?? "").toLowerCase();
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("audio/")) return "audio";
  if (m.startsWith("video/")) return "video";
  if (
    m.startsWith("application/pdf") ||
    m.includes("word") ||
    m.includes("document") ||
    m.includes("text") ||
    m.includes("spreadsheet") ||
    m.includes("presentation")
  ) {
    return "document";
  }
  return "other";
}

export async function listFiles(userId: string, kind?: FileKind): Promise<EternimeFile[]> {
  const sql = getSql();
  if (!sql) return [];
  const rows = kind
    ? await sql`SELECT * FROM eternime_files WHERE user_id = ${userId} AND kind = ${kind} ORDER BY created_at DESC`
    : await sql`SELECT * FROM eternime_files WHERE user_id = ${userId} ORDER BY created_at DESC`;
  return rows as EternimeFile[];
}

export async function createFile(input: {
  userId: string;
  kind: FileKind;
  url: string;
  pathname?: string | null;
  name?: string | null;
  mime?: string | null;
  size?: number | null;
  caption?: string | null;
}): Promise<EternimeFile | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql`
    INSERT INTO eternime_files (user_id, kind, url, pathname, name, mime, size, caption)
    VALUES (${input.userId}, ${input.kind}, ${input.url}, ${input.pathname ?? null},
            ${input.name ?? null}, ${input.mime ?? null}, ${input.size ?? null}, ${input.caption ?? null})
    RETURNING *`;
  return (rows[0] as EternimeFile) ?? null;
}

export async function deleteFile(id: string, userId: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  const rows = await sql`DELETE FROM eternime_files WHERE id = ${id} AND user_id = ${userId} RETURNING id`;
  return rows.length > 0;
}

export async function countFiles(userId: string): Promise<number> {
  const sql = getSql();
  if (!sql) return 0;
  const rows = await sql`SELECT count(*)::int AS n FROM eternime_files WHERE user_id = ${userId}`;
  return (rows[0]?.n as number) ?? 0;
}
