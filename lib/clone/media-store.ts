import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { getCloneSql } from "@/lib/db/clone";
import { encryptTenantUrl, decryptTenantUrl } from "@/lib/crypto/tenant-url";
import { CloneError } from "./errors";

export type MediaJob = { id: string; kind: string; input_hash: string; status: string; provider_id: string | null; payload: string | null; result_id: string | null; error: string | null; created_at: string; updated_at: string };
export const digest = (...parts: string[]) => createHash("sha256").update(JSON.stringify(parts)).digest("hex");

/** Additive schema upgrade on explicit mutations, solely in the authenticated clone DB. */
export async function mediaSql(owner: string) {
  const sql = await getCloneSql(owner);
  await sql`CREATE TABLE IF NOT EXISTS clone_private_media (
    id uuid PRIMARY KEY, kind text NOT NULL, encrypted text NOT NULL, mime text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS clone_media_jobs (
    id uuid PRIMARY KEY, kind text NOT NULL, input_hash text NOT NULL, status text NOT NULL,
    poll_after timestamptz, provider_id text, payload text, result_id uuid, error text,
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(kind,input_hash))`;
  await sql`CREATE TABLE IF NOT EXISTS clone_daily_usage (
    day date NOT NULL DEFAULT CURRENT_DATE, kind text NOT NULL, count integer NOT NULL,
    PRIMARY KEY(day,kind))`;
  return sql;
}
export async function consumeAllowance(owner: string, kind: string, limit: number) {
  const sql = await mediaSql(owner);
  const rows = await sql`INSERT INTO clone_daily_usage(day,kind,count) VALUES(CURRENT_DATE,${kind},1)
    ON CONFLICT(day,kind) DO UPDATE SET count=clone_daily_usage.count+1 WHERE clone_daily_usage.count<${limit} RETURNING count`;
  if (!rows.length) throw new CloneError("DAILY_LIMIT", "Llegaste al límite diario de esta función. Puedes volver mañana; tus resultados guardados siguen disponibles.", 429);
}
export async function reserveJob(owner: string, kind: string, hash: string) {
  const sql = await mediaSql(owner); const id = randomUUID();
  const inserted = await sql`INSERT INTO clone_media_jobs(id,kind,input_hash,status) VALUES(${id}::uuid,${kind},${hash},'preparing')
    ON CONFLICT(kind,input_hash) DO NOTHING RETURNING *`;
  if (inserted.length) return { job: inserted[0] as MediaJob, fresh: true };
  const rows = await sql`SELECT * FROM clone_media_jobs WHERE kind=${kind} AND input_hash=${hash}`;
  return { job: rows[0] as MediaJob, fresh: false };
}
export async function updateJob(owner: string, id: string, patch: { status: string; providerId?: string; payload?: string; resultId?: string; error?: string }) {
  const sql = await getCloneSql(owner);
  await sql`UPDATE clone_media_jobs SET status=${patch.status},provider_id=COALESCE(${patch.providerId ?? null},provider_id),
    payload=COALESCE(${patch.payload ?? null},payload),result_id=COALESCE(${patch.resultId ?? null}::uuid,result_id),
    error=${patch.error ?? null},updated_at=now() WHERE id=${id}::uuid`;
}
export async function getJob(owner: string, id: string) {
  const sql = await getCloneSql(owner);
  try { const rows = await sql`SELECT * FROM clone_media_jobs WHERE id=${id}::uuid`; return rows[0] as MediaJob | undefined; }
  catch (e) { if ((e as {code?: string}).code === "42P01") return undefined; throw e; }
}
export async function listJobs(owner: string, kind: string) {
  const sql = await getCloneSql(owner);
  try { return await sql`SELECT id,kind,status,provider_id,result_id,error,created_at,updated_at FROM clone_media_jobs WHERE kind=${kind} ORDER BY created_at DESC LIMIT 20` as MediaJob[]; }
  catch (e) { if ((e as {code?: string}).code === "42P01") return []; throw e; }
}
export async function storeMedia(owner: string, kind: string, bytes: Uint8Array, mime: string) {
  const sql = await mediaSql(owner); const id = randomUUID();
  const encrypted = encryptTenantUrl(Buffer.from(bytes).toString("base64"), `media:${owner}:${id}`);
  await sql`INSERT INTO clone_private_media(id,kind,encrypted,mime) VALUES(${id}::uuid,${kind},${encrypted},${mime})`;
  return id;
}
export async function readMedia(owner: string, id: string) {
  const sql = await getCloneSql(owner);
  try {
    const rows = await sql`SELECT encrypted,mime,kind FROM clone_private_media WHERE id=${id}::uuid`;
    if (!rows[0]) return null;
    return { bytes: Buffer.from(decryptTenantUrl(rows[0].encrypted, `media:${owner}:${id}`), "base64"), mime: rows[0].mime as string, kind: rows[0].kind as string };
  } catch (e) { if ((e as {code?: string}).code === "42P01") return null; throw e; }
}
export async function latestPortrait(owner: string) {
  const sql = await getCloneSql(owner);
  try { const rows = await sql`SELECT id,created_at FROM clone_private_media WHERE kind='portrait' ORDER BY created_at DESC LIMIT 1`; return rows[0] ?? null; }
  catch (e) { if ((e as {code?: string}).code === "42P01") return null; throw e; }
}
export function publicJob(job: MediaJob) {
  const stalled = job.status === "preparing" && Date.now() - new Date(job.updated_at).getTime() > 180_000;
  return { id: job.id, status: stalled ? "uncertain" : job.status, error: stalled ? "La preparación se interrumpió. No se repite automáticamente para evitar otro cargo." : job.error,
    createdAt: job.created_at, mediaUrl: job.result_id ? `/api/clone/media/${job.result_id}` : null };
}
