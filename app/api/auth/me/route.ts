import { NextResponse } from "next/server";
import { getSession, getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  // Intenta enriquecer con DB; si no hay DB, responde con lo del token.
  const user = await getSessionUser();
  return NextResponse.json({
    user: user ?? { id: session.sub, email: session.email, name: session.name, role: session.role },
  });
}
