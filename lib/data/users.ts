import { getSql } from "@/lib/db";
import type { EternimeUser } from "./types";

type UserWithHash = EternimeUser & { password_hash: string };

export async function findUserByEmail(email: string): Promise<UserWithHash | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql`
    SELECT id, email, password_hash, name, avatar_url, locale, role, created_at
    FROM eternime_users WHERE email = ${email.toLowerCase()} LIMIT 1`;
  return (rows[0] as UserWithHash) ?? null;
}

export async function findUserById(id: string): Promise<EternimeUser | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql`
    SELECT id, email, name, avatar_url, locale, role, created_at
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
    RETURNING id, email, name, avatar_url, locale, role, created_at`;
  return (rows[0] as EternimeUser) ?? null;
}

export async function updateUserProfile(
  id: string,
  patch: { name?: string; avatar_url?: string | null; locale?: string },
): Promise<EternimeUser | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql`
    UPDATE eternime_users SET
      name = COALESCE(${patch.name ?? null}, name),
      avatar_url = COALESCE(${patch.avatar_url ?? null}, avatar_url),
      locale = COALESCE(${patch.locale ?? null}, locale)
    WHERE id = ${id}
    RETURNING id, email, name, avatar_url, locale, role, created_at`;
  return (rows[0] as EternimeUser) ?? null;
}

export async function countUsers(): Promise<number> {
  const sql = getSql();
  if (!sql) return 0;
  const rows = await sql`SELECT count(*)::int AS n FROM eternime_users`;
  return (rows[0]?.n as number) ?? 0;
}
