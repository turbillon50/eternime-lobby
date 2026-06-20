import { getSql } from "@/lib/db";
import type { EternimeUser } from "./types";

type UserWithHash = EternimeUser & { password_hash: string };

const COLS = `id, email, name, avatar_url, cover_url, tagline, bio,
  to_char(birthdate, 'YYYY-MM-DD') AS birthdate, birthplace, location, phone,
  occupation, socials, prefs, locale, role, created_at`;

export async function findUserByEmail(email: string): Promise<UserWithHash | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql`
    SELECT id, email, password_hash, name, avatar_url, cover_url, tagline, bio,
      to_char(birthdate, 'YYYY-MM-DD') AS birthdate, birthplace, location, phone,
      occupation, socials, prefs, locale, role, created_at
    FROM eternime_users WHERE email = ${email.toLowerCase()} LIMIT 1`;
  return (rows[0] as UserWithHash) ?? null;
}

export async function findUserById(id: string): Promise<EternimeUser | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql`
    SELECT id, email, name, avatar_url, cover_url, tagline, bio,
      to_char(birthdate, 'YYYY-MM-DD') AS birthdate, birthplace, location, phone,
      occupation, socials, prefs, locale, role, created_at
    FROM eternime_users WHERE id = ${id} LIMIT 1`;
  return (rows[0] as EternimeUser) ?? null;
}

export async function createUser(input: {
  email: string;
  passwordHash: string;
  name: string;
}): Promise<EternimeUser | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql`
    INSERT INTO eternime_users (email, password_hash, name)
    VALUES (${input.email.toLowerCase()}, ${input.passwordHash}, ${input.name})
    RETURNING id, email, name, avatar_url, cover_url, tagline, bio,
      to_char(birthdate, 'YYYY-MM-DD') AS birthdate, birthplace, location, phone,
      occupation, socials, prefs, locale, role, created_at`;
  return (rows[0] as EternimeUser) ?? null;
}

export type ProfilePatch = {
  name?: string;
  avatar_url?: string | null;
  cover_url?: string | null;
  tagline?: string | null;
  bio?: string | null;
  birthdate?: string | null;
  birthplace?: string | null;
  location?: string | null;
  phone?: string | null;
  occupation?: string | null;
  socials?: Record<string, string> | null;
  prefs?: Record<string, unknown> | null;
  locale?: string;
};

export async function updateUserProfile(id: string, patch: ProfilePatch): Promise<EternimeUser | null> {
  const sql = getSql();
  if (!sql) return null;
  const socialsJson = patch.socials !== undefined ? JSON.stringify(patch.socials ?? {}) : null;
  const prefsJson = patch.prefs !== undefined ? JSON.stringify(patch.prefs ?? {}) : null;
  const rows = await sql`
    UPDATE eternime_users SET
      name        = COALESCE(${patch.name ?? null}, name),
      avatar_url  = CASE WHEN ${patch.avatar_url !== undefined} THEN ${patch.avatar_url ?? null} ELSE avatar_url END,
      cover_url   = CASE WHEN ${patch.cover_url !== undefined} THEN ${patch.cover_url ?? null} ELSE cover_url END,
      tagline     = CASE WHEN ${patch.tagline !== undefined} THEN ${patch.tagline ?? null} ELSE tagline END,
      bio         = CASE WHEN ${patch.bio !== undefined} THEN ${patch.bio ?? null} ELSE bio END,
      birthdate   = CASE WHEN ${patch.birthdate !== undefined} THEN ${patch.birthdate ?? null}::date ELSE birthdate END,
      birthplace  = CASE WHEN ${patch.birthplace !== undefined} THEN ${patch.birthplace ?? null} ELSE birthplace END,
      location    = CASE WHEN ${patch.location !== undefined} THEN ${patch.location ?? null} ELSE location END,
      phone       = CASE WHEN ${patch.phone !== undefined} THEN ${patch.phone ?? null} ELSE phone END,
      occupation  = CASE WHEN ${patch.occupation !== undefined} THEN ${patch.occupation ?? null} ELSE occupation END,
      socials     = CASE WHEN ${socialsJson !== null} THEN ${socialsJson}::jsonb ELSE socials END,
      prefs       = CASE WHEN ${prefsJson !== null} THEN ${prefsJson}::jsonb ELSE prefs END,
      locale      = COALESCE(${patch.locale ?? null}, locale)
    WHERE id = ${id}
    RETURNING id, email, name, avatar_url, cover_url, tagline, bio,
      to_char(birthdate, 'YYYY-MM-DD') AS birthdate, birthplace, location, phone,
      occupation, socials, prefs, locale, role, created_at`;
  return (rows[0] as EternimeUser) ?? null;
}

export async function countUsers(): Promise<number> {
  const sql = getSql();
  if (!sql) return 0;
  const rows = await sql`SELECT count(*)::int AS n FROM eternime_users`;
  return (rows[0]?.n as number) ?? 0;
}

export async function deleteUser(id: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  await sql`DELETE FROM eternime_files WHERE user_id = ${id}`;
  await sql`DELETE FROM eternime_guide_messages WHERE user_id = ${id}`;
  await sql`DELETE FROM eternime_beneficiaries WHERE user_id = ${id}`;
  await sql`DELETE FROM eternime_letters WHERE user_id = ${id}`;
  await sql`DELETE FROM eternime_memories WHERE user_id = ${id}`;
  const rows = await sql`DELETE FROM eternime_users WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}
