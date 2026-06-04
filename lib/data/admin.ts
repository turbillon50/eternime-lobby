/**
 * Capa de datos del panel /admin — SOLO del agente admin.
 *
 * Patrón de la casa: si DATABASE_URL no existe, getSql() devuelve null y
 * cada función degrada a null/[]/0 — la UI muestra EmptyStates elegantes.
 */
import { getSql } from "@/lib/db";
import type { EternimeUser, Letter, LetterStatus, Memory } from "./types";

// ── Tipos del panel ──────────────────────────────────────────

export type AdminKpis = {
  totalUsers: number;
  newUsers7d: number;
  totalMemories: number;
  scheduledLetters: number;
  guideMessages: number;
};

export type SignupPoint = { day: string; count: number };

export type AdminUserRow = EternimeUser & {
  memories_count: number;
  letters_count: number;
};

export type AdminMemoryRow = Memory & { user_email: string; user_name: string };
export type AdminLetterRow = Letter & { user_email: string; user_name: string };

export type ContentCounts = {
  memoriesByKind: { kind: string; count: number }[];
  lettersByStatus: { status: string; count: number }[];
};

export type TableHealth = {
  table: string;
  count: number;
  lastCreatedAt: string | null;
};

// ── KPIs dashboard ───────────────────────────────────────────

export async function getAdminKpis(): Promise<AdminKpis | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql`
    SELECT
      (SELECT count(*)::int FROM eternime_users) AS total_users,
      (SELECT count(*)::int FROM eternime_users WHERE created_at >= now() - interval '7 days') AS new_users_7d,
      (SELECT count(*)::int FROM eternime_memories) AS total_memories,
      (SELECT count(*)::int FROM eternime_letters WHERE status = 'scheduled') AS scheduled_letters,
      (SELECT count(*)::int FROM eternime_guide_messages) AS guide_messages`;
  const r = rows[0] as Record<string, number> | undefined;
  if (!r) return null;
  return {
    totalUsers: r.total_users ?? 0,
    newUsers7d: r.new_users_7d ?? 0,
    totalMemories: r.total_memories ?? 0,
    scheduledLetters: r.scheduled_letters ?? 0,
    guideMessages: r.guide_messages ?? 0,
  };
}

/** Registros por día, últimos 14 días (incluye días en cero). */
export async function getSignupsByDay(): Promise<SignupPoint[]> {
  const sql = getSql();
  if (!sql) return [];
  const rows = await sql`
    SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
           count(u.id)::int AS count
    FROM generate_series(
      date_trunc('day', now()) - interval '13 days',
      date_trunc('day', now()),
      interval '1 day'
    ) AS d(day)
    LEFT JOIN eternime_users u ON date_trunc('day', u.created_at) = d.day
    GROUP BY d.day
    ORDER BY d.day ASC`;
  return rows as SignupPoint[];
}

/** Últimas N altas de usuarios. */
export async function getRecentSignups(limit = 10): Promise<EternimeUser[]> {
  const sql = getSql();
  if (!sql) return [];
  const rows = await sql`
    SELECT id, email, name, avatar_url, locale, role, created_at
    FROM eternime_users
    ORDER BY created_at DESC
    LIMIT ${limit}`;
  return rows as EternimeUser[];
}

// ── Usuarios ─────────────────────────────────────────────────

export async function listAdminUsers(opts: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ users: AdminUserRow[]; total: number }> {
  const sql = getSql();
  if (!sql) return { users: [], total: 0 };
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, opts.pageSize ?? 12));
  const offset = (page - 1) * pageSize;
  const search = `%${(opts.search ?? "").trim()}%`;

  const rows = await sql`
    SELECT u.id, u.email, u.name, u.avatar_url, u.locale, u.role, u.created_at,
           (SELECT count(*)::int FROM eternime_memories m WHERE m.user_id = u.id) AS memories_count,
           (SELECT count(*)::int FROM eternime_letters l WHERE l.user_id = u.id) AS letters_count
    FROM eternime_users u
    WHERE u.email ILIKE ${search} OR u.name ILIKE ${search}
    ORDER BY u.created_at DESC
    LIMIT ${pageSize} OFFSET ${offset}`;

  const countRows = await sql`
    SELECT count(*)::int AS n FROM eternime_users u
    WHERE u.email ILIKE ${search} OR u.name ILIKE ${search}`;

  return {
    users: rows as AdminUserRow[],
    total: (countRows[0]?.n as number) ?? 0,
  };
}

export async function setUserRole(id: string, role: "user" | "admin"): Promise<EternimeUser | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql`
    UPDATE eternime_users SET role = ${role}
    WHERE id = ${id}
    RETURNING id, email, name, avatar_url, locale, role, created_at`;
  return (rows[0] as EternimeUser) ?? null;
}

export async function setUserRoleByEmail(email: string, role: "user" | "admin"): Promise<EternimeUser | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql`
    UPDATE eternime_users SET role = ${role}
    WHERE email = ${email.toLowerCase().trim()}
    RETURNING id, email, name, avatar_url, locale, role, created_at`;
  return (rows[0] as EternimeUser) ?? null;
}

/** Elimina usuario y su contenido (memories, letters, beneficiaries, guide). */
export async function deleteUserCascade(id: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  await sql`DELETE FROM eternime_guide_messages WHERE user_id = ${id}`;
  await sql`DELETE FROM eternime_beneficiaries WHERE user_id = ${id}`;
  await sql`DELETE FROM eternime_letters WHERE user_id = ${id}`;
  await sql`DELETE FROM eternime_memories WHERE user_id = ${id}`;
  const rows = await sql`DELETE FROM eternime_users WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}

// ── Contenido (recuerdos + cartas) ───────────────────────────

export async function getContentCounts(): Promise<ContentCounts | null> {
  const sql = getSql();
  if (!sql) return null;
  const memories = await sql`
    SELECT kind, count(*)::int AS count
    FROM eternime_memories GROUP BY kind ORDER BY count DESC`;
  const letters = await sql`
    SELECT status, count(*)::int AS count
    FROM eternime_letters GROUP BY status ORDER BY count DESC`;
  return {
    memoriesByKind: memories as { kind: string; count: number }[],
    lettersByStatus: letters as { status: string; count: number }[],
  };
}

export async function listAdminMemories(opts: {
  kind?: string;
  limit?: number;
}): Promise<AdminMemoryRow[]> {
  const sql = getSql();
  if (!sql) return [];
  const limit = Math.min(100, Math.max(1, opts.limit ?? 20));
  const kind = (opts.kind ?? "").trim();
  const rows = kind
    ? await sql`
        SELECT m.*, u.email AS user_email, u.name AS user_name
        FROM eternime_memories m
        JOIN eternime_users u ON u.id = m.user_id
        WHERE m.kind = ${kind}
        ORDER BY m.created_at DESC LIMIT ${limit}`
    : await sql`
        SELECT m.*, u.email AS user_email, u.name AS user_name
        FROM eternime_memories m
        JOIN eternime_users u ON u.id = m.user_id
        ORDER BY m.created_at DESC LIMIT ${limit}`;
  return rows as AdminMemoryRow[];
}

export async function listAdminLetters(opts: {
  status?: string;
  limit?: number;
}): Promise<AdminLetterRow[]> {
  const sql = getSql();
  if (!sql) return [];
  const limit = Math.min(100, Math.max(1, opts.limit ?? 20));
  const status = (opts.status ?? "").trim();
  const rows = status
    ? await sql`
        SELECT l.*, u.email AS user_email, u.name AS user_name
        FROM eternime_letters l
        JOIN eternime_users u ON u.id = l.user_id
        WHERE l.status = ${status}
        ORDER BY l.created_at DESC LIMIT ${limit}`
    : await sql`
        SELECT l.*, u.email AS user_email, u.name AS user_name
        FROM eternime_letters l
        JOIN eternime_users u ON u.id = l.user_id
        ORDER BY l.created_at DESC LIMIT ${limit}`;
  return rows as AdminLetterRow[];
}

export async function adminDeleteMemory(id: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  const rows = await sql`DELETE FROM eternime_memories WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}

export async function adminDeleteLetter(id: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  const rows = await sql`DELETE FROM eternime_letters WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}

// ── Cola de entrega de cartas ────────────────────────────────

/** Cartas con deliver_on en los próximos `days` días (incluye vencidas no entregadas). */
export async function getDeliveryQueue(days = 30): Promise<AdminLetterRow[]> {
  const sql = getSql();
  if (!sql) return [];
  const rows = await sql`
    SELECT l.*, u.email AS user_email, u.name AS user_name
    FROM eternime_letters l
    JOIN eternime_users u ON u.id = l.user_id
    WHERE l.deliver_on IS NOT NULL
      AND l.status <> 'delivered'
      AND l.deliver_on <= now() + make_interval(days => ${days})
    ORDER BY l.deliver_on ASC`;
  return rows as AdminLetterRow[];
}

export async function adminSetLetterStatus(id: string, status: LetterStatus): Promise<Letter | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql`
    UPDATE eternime_letters SET status = ${status}
    WHERE id = ${id}
    RETURNING *`;
  return (rows[0] as Letter) ?? null;
}

// ── Salud del sistema ────────────────────────────────────────

export async function getSystemHealth(): Promise<TableHealth[]> {
  const sql = getSql();
  if (!sql) return [];
  const rows = await sql`
    SELECT 'eternime_users' AS tbl, count(*)::int AS count, max(created_at)::text AS last_created_at FROM eternime_users
    UNION ALL
    SELECT 'eternime_memories', count(*)::int, max(created_at)::text FROM eternime_memories
    UNION ALL
    SELECT 'eternime_letters', count(*)::int, max(created_at)::text FROM eternime_letters
    UNION ALL
    SELECT 'eternime_beneficiaries', count(*)::int, max(created_at)::text FROM eternime_beneficiaries
    UNION ALL
    SELECT 'eternime_guide_messages', count(*)::int, max(created_at)::text FROM eternime_guide_messages`;
  return (rows as { tbl: string; count: number; last_created_at: string | null }[]).map((r) => ({
    table: r.tbl,
    count: r.count,
    lastCreatedAt: r.last_created_at,
  }));
}
