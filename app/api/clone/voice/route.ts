import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { findUserById } from "@/lib/data/users";
import { getCloneExchange } from "@/lib/data/clone";
import { personalVoiceId } from "@/lib/voice/samples";
import { synthesizePersonalVoice, VoiceServiceError } from "@/lib/voice/elevenlabs";
import { cloneErrorResponse, UUID } from "@/lib/clone/http";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const body = await request.json();
    if (typeof body?.id !== "string" || !UUID.test(body.id)) return NextResponse.json({ error: "Respuesta inválida." }, { status: 400 });
    const [exchange, user] = await Promise.all([getCloneExchange(session.clerkId, body.id), findUserById(session.sub)]);
    if (!exchange) return NextResponse.json({ error: "No encontré esa respuesta en tu clon." }, { status: 404 });
    const voiceId = personalVoiceId(user?.prefs);
    if (!voiceId) return NextResponse.json({ error: "Primero crea tu voz personal en Mi voz y mi imagen." }, { status: 409 });
    if (exchange.clone_text.length > 4000) return NextResponse.json({ error: "Esta respuesta es demasiado larga para la prueba de voz. Pide una versión breve." }, { status: 400 });
    try { return await synthesizePersonalVoice(voiceId, exchange.clone_text); }
    catch (error) { return NextResponse.json({ error: error instanceof VoiceServiceError ? error.message : "No pude generar el audio." }, { status: 502 }); }
  } catch (error) { return cloneErrorResponse(error); }
}
