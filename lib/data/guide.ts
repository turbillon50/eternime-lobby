import { getSql } from "@/lib/db";
import { pgTextArray } from "./pg";
import type { GuideMessage } from "./types";

export async function listGuideMessages(userId: string, limit = 50): Promise<GuideMessage[]> {
  const sql = getSql();
  if (!sql) return [];
  const rows = await sql`
    SELECT * FROM (
      SELECT * FROM eternime_guide_messages
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    ) sub ORDER BY created_at ASC`;
  return rows as GuideMessage[];
}

export async function appendGuideMessage(input: {
  userId: string;
  role: "user" | "assistant";
  content: string;
}): Promise<GuideMessage | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql`
    INSERT INTO eternime_guide_messages (user_id, role, content)
    VALUES (${input.userId}, ${input.role}, ${input.content})
    RETURNING *`;
  return (rows[0] as GuideMessage) ?? null;
}

/**
 * Inserta varios mensajes de guía en UNA sola query (evita el N+1 de llamar
 * appendGuideMessage por cada turno de una conversación de voz). Conserva el
 * orden de los turnos vía unnest de arrays paralelos.
 */
export async function appendGuideMessages(
  userId: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<number> {
  const sql = getSql();
  if (!sql || !messages.length) return 0;
  const roles = messages.map((m) => m.role);
  const contents = messages.map((m) => m.content);
  const rows = await sql`
    INSERT INTO eternime_guide_messages (user_id, role, content)
    SELECT ${userId}, x.role, x.content
    FROM unnest(${pgTextArray(roles)}::text[], ${pgTextArray(contents)}::text[]) AS x(role, content)
    RETURNING id`;
  return rows.length;
}

export async function clearGuideHistory(userId: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  await sql`DELETE FROM eternime_guide_messages WHERE user_id = ${userId}`;
  return true;
}
