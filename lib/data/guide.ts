import { getSql } from "@/lib/db";
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

export async function clearGuideHistory(userId: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  await sql`DELETE FROM eternime_guide_messages WHERE user_id = ${userId}`;
  return true;
}
