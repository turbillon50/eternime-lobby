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
