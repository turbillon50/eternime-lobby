import "server-only";
import { getSql } from "@/lib/db";
export async function attachPersonalVoice(userId: string, voiceId: string) {
  const sql = getSql();
  if (!sql) throw new Error("Database unavailable");
  const rows = await sql`UPDATE eternime_users
    SET prefs=COALESCE(prefs,'{}'::jsonb) || jsonb_build_object('personal_voice_id', ${voiceId}::text, 'personal_voice_consented_at', now())
    WHERE id=${userId} AND COALESCE(prefs->>'personal_voice_id',prefs->>'eon_voice_id','')=''
    RETURNING id`;
  return rows.length === 1;
}
export async function detachPersonalVoice(userId: string, voiceId: string) {
  const sql = getSql();
  if (!sql) throw new Error("Database unavailable");
  const rows = await sql`UPDATE eternime_users
    SET prefs=COALESCE(prefs,'{}'::jsonb)-'personal_voice_id'-'personal_voice_consented_at'-'eon_voice_id'-'eon_voice_consented_at'
    WHERE id=${userId} AND COALESCE(prefs->>'personal_voice_id',prefs->>'eon_voice_id')=${voiceId}
    RETURNING id`;
  return rows.length === 1;
}
export async function replacePersonalVoice(userId: string, previousId: string, voiceId: string) {
  const sql = getSql();
  if (!sql) throw new Error("Database unavailable");
  const rows = await sql`UPDATE eternime_users
    SET prefs=COALESCE(prefs,'{}'::jsonb) || jsonb_build_object('personal_voice_id', ${voiceId}::text, 'personal_voice_consented_at', now())
    WHERE id=${userId} AND COALESCE(prefs->>'personal_voice_id',prefs->>'eon_voice_id')=${previousId}
    RETURNING id`;
  return rows.length === 1;
}
