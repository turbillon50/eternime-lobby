import { NextResponse } from "next/server";
import { AuthError, requireUser } from "@/lib/auth";
import { findUserById } from "@/lib/data/users";
import { personalVoiceId } from "@/lib/voice/samples";
import { synthesizePersonalVoice, VoiceServiceError } from "@/lib/voice/elevenlabs";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST() {
  try {
    const session = await requireUser();
    const user = await findUserById(session.sub);
    const voiceId = personalVoiceId(user?.prefs);
    if (!voiceId) return NextResponse.json({ error: "Todavía no tienes una voz personal creada." }, { status: 404 });
    try { return await synthesizePersonalVoice(voiceId, "Esta es una prueba de mi voz personal en Eternime. Poco a poco voy construyendo mi presencia digital."); }
    catch (error) { return NextResponse.json({ error: error instanceof VoiceServiceError ? error.message : "No pude generar la prueba de voz." }, { status: 502 }); }
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "No pude consultar tu voz." }, { status: 503 });
  }
}
