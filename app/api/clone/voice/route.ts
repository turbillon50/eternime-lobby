import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { findUserById } from "@/lib/data/users";
import { getCloneExchange } from "@/lib/data/clone";
import { personalVoiceId } from "@/lib/voice/samples";
import { VoiceServiceError } from "@/lib/voice/elevenlabs";
import { cloneErrorResponse, UUID } from "@/lib/clone/http";
import { savedSpeech } from "@/lib/clone/audio";
import { boundedJson, sameOrigin } from "@/lib/clone/guard";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const session = await requireUser();
    sameOrigin(request);
    const body = await boundedJson(request);
    if (typeof body?.id !== "string" || !UUID.test(body.id)) return NextResponse.json({ error: "Respuesta inválida." }, { status: 400 });
    const [exchange, user] = await Promise.all([getCloneExchange(session.clerkId, body.id), findUserById(session.sub)]);
    if (!exchange) return NextResponse.json({ error: "No encontré esa respuesta en tu clon." }, { status: 404 });
    const voiceId = personalVoiceId(user?.prefs);
    if (!voiceId) return NextResponse.json({ error: "Primero crea tu voz personal en Mi voz y mi imagen." }, { status: 409 });
    if (exchange.clone_text.length > 4000) return NextResponse.json({ error: "Esta respuesta es demasiado larga para la prueba de voz. Pide una versión breve." }, { status: 400 });
    try {
      const audio = await savedSpeech(session.clerkId, voiceId, exchange.clone_text);
      return new Response(new Uint8Array(audio.bytes), { headers: { "Content-Type": audio.mime, "Cache-Control": "private, no-store" } });
    }
    catch (error) { if (error instanceof VoiceServiceError) return NextResponse.json({ error: error.message }, { status: 502, headers: { "Cache-Control": "private, no-store" } }); throw error; }
  } catch (error) { return cloneErrorResponse(error); }
}
