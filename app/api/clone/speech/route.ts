import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { findUserById } from "@/lib/data/users";
import { personalVoiceId } from "@/lib/voice/samples";
import { VoiceServiceError } from "@/lib/voice/elevenlabs";
import { voiceDelivery } from "@/lib/voice/personal-settings";
import { savedSpeech } from "@/lib/clone/audio";
import { ensureCloneReady } from "@/lib/clone/setup";
import { boundedJson, sameOrigin } from "@/lib/clone/guard";
import { cloneErrorResponse, PRIVATE_HEADERS } from "@/lib/clone/http";
import { CloneError } from "@/lib/clone/errors";
export const runtime = "nodejs";
export const maxDuration = 180;
export async function POST(request: Request) {
  try {
    const session = await requireUser(); sameOrigin(request); const body = await boundedJson(request);
    if (typeof body?.text !== "string" || !body.text.trim() || body.text.length > 350) throw new CloneError("TEXT_INVALID", "Escribe una frase de hasta 350 caracteres.", 400);
    const user = await findUserById(session.sub); const voiceId = personalVoiceId(user?.prefs);
    if (!voiceId) throw new CloneError("VOICE_REQUIRED", "Abre Grabar o subir mi voz para guardarla.", 409);
    await ensureCloneReady(session);
    const speech = await savedSpeech(session.clerkId, voiceId, body.text.trim(), voiceDelivery(body.delivery));
    return NextResponse.json({ url: `/api/clone/media/${speech.id}` }, { headers: PRIVATE_HEADERS });
  } catch (e) {
    if (e instanceof VoiceServiceError) return NextResponse.json({ error: e.message }, { status: 502, headers: PRIVATE_HEADERS });
    return cloneErrorResponse(e);
  }
}
