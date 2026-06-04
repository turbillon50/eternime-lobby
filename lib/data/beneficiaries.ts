import { getSql } from "@/lib/db";
import type { Beneficiary } from "./types";

export async function listBeneficiaries(userId: string): Promise<Beneficiary[]> {
  const sql = getSql();
  if (!sql) return [];
  const rows = await sql`
    SELECT * FROM eternime_beneficiaries WHERE user_id = ${userId} ORDER BY created_at DESC`;
  return rows as Beneficiary[];
}

export async function createBeneficiary(input: {
  userId: string;
  name: string;
  email?: string | null;
  relationship?: string | null;
}): Promise<Beneficiary | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql`
    INSERT INTO eternime_beneficiaries (user_id, name, email, relationship)
    VALUES (${input.userId}, ${input.name}, ${input.email ?? null}, ${input.relationship ?? null})
    RETURNING *`;
  return (rows[0] as Beneficiary) ?? null;
}

export async function deleteBeneficiary(id: string, userId: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  const rows = await sql`
    DELETE FROM eternime_beneficiaries WHERE id = ${id} AND user_id = ${userId} RETURNING id`;
  return rows.length > 0;
}

export async function countBeneficiaries(userId: string): Promise<number> {
  const sql = getSql();
  if (!sql) return 0;
  const rows = await sql`SELECT count(*)::int AS n FROM eternime_beneficiaries WHERE user_id = ${userId}`;
  return (rows[0]?.n as number) ?? 0;
}

export async function updateBeneficiary(
  id: string,
  userId: string,
  patch: { name?: string; email?: string | null; relationship?: string | null },
): Promise<Beneficiary | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql`
    UPDATE eternime_beneficiaries SET
      name = COALESCE(${patch.name ?? null}, name),
      email = CASE WHEN ${patch.email !== undefined} THEN ${patch.email ?? null} ELSE email END,
      relationship = CASE WHEN ${patch.relationship !== undefined} THEN ${patch.relationship ?? null} ELSE relationship END
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *`;
  return (rows[0] as Beneficiary) ?? null;
}
