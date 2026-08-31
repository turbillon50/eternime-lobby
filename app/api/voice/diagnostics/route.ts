import { NextResponse } from "next/server";

import { AuthError, requireUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EVENTS = new Set([
  "playback_ready",
  "playback_blocked",
  "mic_ready",
  "first_audio",
  "closed",
  "session_request",
  "session_ready",
  "socket_open",
  "socket_error",
  "socket_close",
]);

function browserFamily(userAgent: string): string {
  if (/Edg\//.test(userAgent)) return "edge";
  if (/Chrome\//.test(userAgent)) return "chrome";
  if (/Firefox\//.test(userAgent)) return "firefox";
  if (/Safari\//.test(userAgent)) return "safari";
  return "other";
}

export async function POST(request: Request) {
  try {
    await requireUser();
    const body = await request.json().catch(() => ({})) as { event?: string; detail?: string };
    if (!body.event || !EVENTS.has(body.event)) {
      return NextResponse.json({ error: "Evento inválido." }, { status: 400 });
    }
    console.info("[voice/client]", {
      event: body.event,
      detail: typeof body.detail === "string" ? body.detail.slice(0, 120) : undefined,
      browser: browserFamily(request.headers.get("user-agent") || ""),
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[voice/client] diagnostic failed", error);
    return NextResponse.json({ error: "No se pudo registrar el diagnóstico." }, { status: 500 });
  }
}
