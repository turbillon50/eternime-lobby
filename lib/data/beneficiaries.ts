import { getSql } from "@/lib/db";
import type { Beneficiary } from "./types";

const COLS = "id, user_id, name, email, relationship, is_primary, delivery_condition, invited_at, photo_url, created_at";

export async function listBeneficiaries(userId: string): Promise<Beneficiary[]> {
  const sql = getSql();
  if (!sql) return [];
  const rows = await sql`
    SELECT id, user_id, name, email, relationship, is_primary, delivery_condition, invited_at, photo_url, created_at
    FROM eternime_beneficiaries WHERE user_id = ${userId}
    ORDER BY is_primary DESC, created_at DESC`;
  return rows as Beneficiary[];
}

export async function getBeneficiary(id: string, userId: string): Promise<Beneficiary | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql`
    SELECT id, user_id, name, email, relationship, is_primary, delivery_condition, invited_at, photo_url, created_at
    FROM eternime_beneficiaries WHERE id = ${id} AND user_id = ${userId} LIMIT 1`;
  return (rows[0] as Beneficiary) ?? null;
}

export async function createBeneficiary(input: {
  userId: string; name: string; email?: string | null; relationship?: string | null;
  isPrimary?: boolean; deliveryCondition?: string | null;
}): Promise<Beneficiary | null> {
  const sql = getSql();
  if (!sql) return null;
  if (input.isPrimary) {
    await sql`UPDATE eternime_beneficiaries SET is_primary = false WHERE user_id = ${input.userId}`;
  }
  const rows = await sql`
    INSERT INTO eternime_beneficiaries (user_id, name, email, relationship, is_primary, delivery_condition)
    VALUES (${input.userId}, ${input.name}, ${input.email ?? null}, ${input.relationship ?? null},
            ${input.isPrimary ?? false}, ${input.deliveryCondition ?? null})
    RETURNING id, user_id, name, email, relationship, is_primary, delivery_condition, invited_at, photo_url, created_at`;
  return (rows[0] as Beneficiary) ?? null;
}

export async function updateBeneficiary(
  id: string, userId: string,
  patch: { name?: string; email?: string | null; relationship?: string | null; isPrimary?: boolean; deliveryCondition?: string | null; invitedAt?: string | null },
): Promise<Beneficiary | null> {
  const sql = getSql();
  if (!sql) return null;
  if (patch.isPrimary) {
    await sql`UPDATE eternime_beneficiaries SET is_primary = false WHERE user_id = ${userId} AND id <> ${id}`;
  }
  const rows = await sql`
    UPDATE eternime_beneficiaries SET
      name = COALESCE(${patch.name ?? null}, name),
      email = CASE WHEN ${patch.email !== undefined} THEN ${patch.email ?? null} ELSE email END,
      relationship = CASE WHEN ${patch.relationship !== undefined} THEN ${patch.relationship ?? null} ELSE relationship END,
      is_primary = COALESCE(${patch.isPrimary ?? null}, is_primary),
      delivery_condition = CASE WHEN ${patch.deliveryCondition !== undefined} THEN ${patch.deliveryCondition ?? null} ELSE delivery_condition END,
      invited_at = CASE WHEN ${patch.invitedAt !== undefined} THEN ${patch.invitedAt ?? null}::timestamptz ELSE invited_at END
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id, user_id, name, email, relationship, is_primary, delivery_condition, invited_at, photo_url, created_at`;
  return (rows[0] as Beneficiary) ?? null;
}

export async function deleteBeneficiary(id: string, userId: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  const rows = await sql`DELETE FROM eternime_beneficiaries WHERE id = ${id} AND user_id = ${userId} RETURNING id`;
  return rows.length > 0;
}

export async function countBeneficiaries(userId: string): Promise<number> {
  const sql = getSql();
  if (!sql) return 0;
  const rows = await sql`SELECT count(*)::int AS n FROM eternime_beneficiaries WHERE user_id = ${userId}`;
  return (rows[0]?.n as number) ?? 0;
}

// ── Targeting: qué recuerdos hereda cada persona ──
export async function listHeirMemoryIds(beneficiaryId: string, userId: string): Promise<string[]> {
  const sql = getSql();
  if (!sql) return [];
  const rows = await sql`
    SELECT memory_id FROM eternime_memory_heirs WHERE beneficiary_id = ${beneficiaryId} AND user_id = ${userId}`;
  return rows.map((r) => r.memory_id as string);
}

export async function setHeirMemories(beneficiaryId: string, userId: string, memoryIds: string[]): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  await sql`DELETE FROM eternime_memory_heirs WHERE beneficiary_id = ${beneficiaryId} AND user_id = ${userId}`;
  for (const mid of memoryIds.slice(0, 200)) {
    await sql`INSERT INTO eternime_memory_heirs (user_id, memory_id, beneficiary_id)
              VALUES (${userId}, ${mid}, ${beneficiaryId}) ON CONFLICT DO NOTHING`;
  }
}

export async function countHeirMemories(beneficiaryId: string, userId: string): Promise<number> {
  const sql = getSql();
  if (!sql) return 0;
  const rows = await sql`SELECT count(*)::int AS n FROM eternime_memory_heirs WHERE beneficiary_id = ${beneficiaryId} AND user_id = ${userId}`;
  return (rows[0]?.n as number) ?? 0;
}
