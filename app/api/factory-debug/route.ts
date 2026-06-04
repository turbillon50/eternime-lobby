import { NextResponse } from "next/server";
import { getSql, hasDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const out: Record<string, unknown> = { hasDb: hasDb() };
  const sql = getSql();
  if (sql) {
    try {
      const r = await sql`SELECT count(*)::int AS n FROM eternime_users`;
      out.users = r[0]?.n;
    } catch (e) {
      out.error = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    }
  }
  return NextResponse.json(out);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (body?.secret !== "superclaude2025") {
    return NextResponse.json({ error: "no" }, { status: 403 });
  }
  const sql = getSql();
  if (!sql) return NextResponse.json({ error: "sin DB" }, { status: 500 });
  try {
    await sql`CREATE TABLE IF NOT EXISTS eternime_users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      name text NOT NULL,
      avatar_url text,
      locale text NOT NULL DEFAULT 'es',
      role text NOT NULL DEFAULT 'user',
      created_at timestamptz NOT NULL DEFAULT now())`;
    await sql`CREATE TABLE IF NOT EXISTS eternime_memories (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES eternime_users(id),
      title text NOT NULL,
      content text,
      kind text NOT NULL,
      media_url text,
      emotional_tone text,
      created_at timestamptz NOT NULL DEFAULT now())`;
    await sql`CREATE TABLE IF NOT EXISTS eternime_letters (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES eternime_users(id),
      recipient_name text NOT NULL,
      recipient_email text,
      title text NOT NULL,
      body text NOT NULL,
      deliver_on date,
      status text NOT NULL DEFAULT 'draft',
      created_at timestamptz NOT NULL DEFAULT now())`;
    await sql`CREATE TABLE IF NOT EXISTS eternime_beneficiaries (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES eternime_users(id),
      name text NOT NULL,
      email text,
      relationship text,
      created_at timestamptz NOT NULL DEFAULT now())`;
    await sql`CREATE TABLE IF NOT EXISTS eternime_guide_messages (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES eternime_users(id),
      role text NOT NULL,
      content text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now())`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
