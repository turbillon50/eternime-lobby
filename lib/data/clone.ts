import "server-only";
import { getCloneSql } from "@/lib/db/clone";
import { CloneError } from "@/lib/clone/errors";
import { cloneProgress, type CloneFact, type CloneSnapshot, type CloneTopic, type CloneVersion } from "@/lib/clone/profile";

export type CloneExchange = {
  id: string; user_text: string; clone_text: string; profile_versions: string;
  recognized: boolean | null; created_at: string;
};

export function profileSignature(facts: CloneFact[]) {
  return JSON.stringify(facts.map(f => [f.topic, f.revision]).sort((a, b) => String(a[0]).localeCompare(String(b[0]))));
}

export async function cloneSnapshot(clerkId: string): Promise<CloneSnapshot> {
  const sql = await getCloneSql(clerkId);
  const [facts, exchanges, versions, reviews] = await Promise.all([
    sql`SELECT topic, content, revision FROM clone_facts ORDER BY topic`,
    sql`SELECT * FROM (SELECT * FROM clone_exchanges ORDER BY created_at DESC, id DESC LIMIT 30) recent ORDER BY created_at, id`,
    sql`SELECT topic, content, revision, created_at AS "createdAt" FROM clone_fact_versions ORDER BY created_at DESC LIMIT 50`,
    sql`SELECT recognized, profile_versions FROM clone_exchanges WHERE recognized IS NOT NULL`,
  ]);
  const profile = facts as CloneFact[];
  const current = profileSignature(profile);
  return {
    facts: profile,
    versions: versions as CloneVersion[],
    messages: (exchanges as CloneExchange[]).flatMap(e => [
      { id: `${e.id}-user`, role: "user" as const, content: e.user_text, createdAt: e.created_at, recognized: null },
      { id: e.id, role: "clone" as const, content: e.clone_text, createdAt: e.created_at, recognized: e.recognized },
    ]),
    progress: cloneProgress(profile, reviews.filter(r => r.profile_versions === current) as { recognized: boolean }[]),
  };
}

/** Optimistic revision check prevents silently overwriting another device. */
export async function saveCloneFact(clerkId: string, topic: CloneTopic, content: string, revision: number) {
  const sql = await getCloneSql(clerkId);
  const changed = revision === 0
    ? await sql`WITH saved AS (
        INSERT INTO clone_facts(topic, content, revision) VALUES (${topic}, ${content}, 1)
        ON CONFLICT (topic) DO NOTHING RETURNING *
      ) INSERT INTO clone_fact_versions(topic, content, revision)
        SELECT topic, content, revision FROM saved RETURNING topic`
    : await sql`WITH saved AS (
        UPDATE clone_facts SET content=${content}, revision=revision+1
        WHERE topic=${topic} AND revision=${revision} RETURNING *
      ) INSERT INTO clone_fact_versions(topic, content, revision)
        SELECT topic, content, revision FROM saved RETURNING topic`;
  if (!changed.length) throw new CloneError("REVISION_CONFLICT", "Este recuerdo cambió en otra sesión. Recarga antes de guardar.", 409);
}

export async function getCloneExchange(clerkId: string, id: string) {
  const sql = await getCloneSql(clerkId);
  const rows = await sql`SELECT * FROM clone_exchanges WHERE id=${id}::uuid`;
  return rows[0] as CloneExchange | undefined;
}

export async function saveCloneExchange(clerkId: string, input: { id: string; userText: string; cloneText: string; signature: string }) {
  const sql = await getCloneSql(clerkId);
  await sql`INSERT INTO clone_exchanges(id, user_text, clone_text, profile_versions)
    VALUES (${input.id}::uuid, ${input.userText}, ${input.cloneText}, ${input.signature})
    ON CONFLICT(id) DO NOTHING`;
  const saved = await getCloneExchange(clerkId, input.id);
  if (!saved || saved.user_text !== input.userText) throw new CloneError("REQUEST_CONFLICT", "Envía de nuevo tu mensaje.", 409);
  return saved;
}

export async function reviewCloneExchange(clerkId: string, id: string, recognized: boolean) {
  const sql = await getCloneSql(clerkId);
  const rows = await sql`UPDATE clone_exchanges SET recognized=${recognized} WHERE id=${id}::uuid RETURNING id`;
  if (!rows.length) throw new CloneError("MESSAGE_NOT_FOUND", "La respuesta ya no está disponible.", 404);
}
