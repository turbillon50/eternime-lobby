import { getSql } from "@/lib/db";
import type { Letter, LetterStatus } from "./types";

export async function listLetters(userId: string): Promise<Letter[]> {
  const sql = getSql();
  if (!sql) return [];
  const rows = await sql`
    SELECT * FROM eternime_letters WHERE user_id = ${userId} ORDER BY created_at DESC`;
  return rows as Letter[];
}

export async function getLetter(id: string, userId: string): Promise<Letter | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql`
    SELECT * FROM eternime_letters WHERE id = ${id} AND user_id = ${userId} LIMIT 1`;
  return (rows[0] as Letter) ?? null;
}

export async function createLetter(input: {
  userId: string;
  recipientName: string;
  recipientEmail?: string | null;
  title: string;
  body: string;
  deliverOn?: string | null;
}): Promise<Letter | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql`
    INSERT INTO eternime_letters (user_id, recipient_name, recipient_email, title, body, deliver_on)
    VALUES (${input.userId}, ${input.recipientName}, ${input.recipientEmail ?? null},
            ${input.title}, ${input.body}, ${input.deliverOn ?? null})
    RETURNING *`;
  return (rows[0] as Letter) ?? null;
}

export async function updateLetterStatus(
  id: string,
  userId: string,
  status: LetterStatus,
): Promise<Letter | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql`
    UPDATE eternime_letters SET status = ${status}
    WHERE id = ${id} AND user_id = ${userId} RETURNING *`;
  return (rows[0] as Letter) ?? null;
}

export async function deleteLetter(id: string, userId: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  const rows = await sql`
    DELETE FROM eternime_letters WHERE id = ${id} AND user_id = ${userId} RETURNING id`;
  return rows.length > 0;
}

export async function countLetters(userId: string): Promise<number> {
  const sql = getSql();
  if (!sql) return 0;
  const rows = await sql`SELECT count(*)::int AS n FROM eternime_letters WHERE user_id = ${userId}`;
  return (rows[0]?.n as number) ?? 0;
}

export async function updateLetter(
  id: string,
  userId: string,
  patch: {
    recipientName?: string;
    recipientEmail?: string | null;
    title?: string;
    body?: string;
    deliverOn?: string | null;
    status?: LetterStatus;
  },
): Promise<Letter | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql`
    UPDATE eternime_letters SET
      recipient_name = COALESCE(${patch.recipientName ?? null}, recipient_name),
      recipient_email = CASE WHEN ${patch.recipientEmail !== undefined} THEN ${patch.recipientEmail ?? null} ELSE recipient_email END,
      title = COALESCE(${patch.title ?? null}, title),
      body = COALESCE(${patch.body ?? null}, body),
      deliver_on = CASE WHEN ${patch.deliverOn !== undefined} THEN ${patch.deliverOn ?? null} ELSE deliver_on END,
      status = COALESCE(${patch.status ?? null}, status)
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *`;
  return (rows[0] as Letter) ?? null;
}

/** Próxima carta programada (status scheduled con deliver_on más cercano en el futuro). */
export async function nextScheduledLetter(userId: string): Promise<Letter | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql`
    SELECT * FROM eternime_letters
    WHERE user_id = ${userId} AND status = 'scheduled' AND deliver_on IS NOT NULL
      AND deliver_on >= CURRENT_DATE
    ORDER BY deliver_on ASC LIMIT 1`;
  return (rows[0] as Letter) ?? null;
}

/** Carta vencida con el nombre del remitente (join a eternime_users). */
export type DueLetter = Letter & { sender_name: string | null; sender_email: string | null };

/** Cartas programadas cuya fecha de entrega ya llegó (deliver_on <= hoy). */
export async function listDueLetters(): Promise<DueLetter[]> {
  const sql = getSql();
  if (!sql) return [];
  const rows = await sql`
    SELECT l.*, u.name AS sender_name, u.email AS sender_email
    FROM eternime_letters l
    LEFT JOIN eternime_users u ON u.id = l.user_id
    WHERE l.status = 'scheduled' AND l.deliver_on IS NOT NULL AND l.deliver_on <= CURRENT_DATE
    ORDER BY l.deliver_on ASC`;
  return rows as DueLetter[];
}

/** Marca una carta como entregada (solo si seguía scheduled — idempotente). */
export async function markLetterDelivered(id: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  const rows = await sql`
    UPDATE eternime_letters SET status = 'delivered'
    WHERE id = ${id} AND status = 'scheduled' RETURNING id`;
  return rows.length > 0;
}
