import { NextResponse } from "next/server";

import { AuthError, requireUser } from "@/lib/auth";
import { executeEonLiveTool } from "@/lib/voice/tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json() as { name?: unknown; args?: unknown };
    if (typeof body.name !== "string" || !body.name || !body.args || typeof body.args !== "object" || Array.isArray(body.args)) {
      return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
    }
    const result = await executeEonLiveTool(
      { userId: user.sub, clerkId: user.clerkId },
      body.name,
      body.args as Record<string, unknown>,
    );
    return NextResponse.json({ ok: true, result }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : "No se pudo ejecutar la acción.";
    return NextResponse.json({ ok: false, error: message }, { status: 422 });
  }
}
