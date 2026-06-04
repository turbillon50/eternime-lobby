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
