import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";

export const runtime = "nodejs";

// Voz neutra del catálogo de ElevenLabs (River — neutral) como default.
const DEFAULT_VOICE_ID = "SAz9YHcvj6GT2YYXdXww";

/** POST { text } → audio/mpeg con la voz de Eon (ElevenLabs TTS). */
export async function POST(request: Request) {
  try {
    await requireUser();

    const apiKey = process.env.ELEVENLABS_API_KEY || process.env.XI_API_KEY || "";
    if (!apiKey) {
      return NextResponse.json({ voice: "unavailable" }, { status: 503 });
    }

    const body = (await request.json()) as { text?: string };
    const text = (body.text ?? "").trim().slice(0, 1200);
    if (!text) {
      return NextResponse.json({ error: "Texto vacío" }, { status: 400 });
    }

    const voiceId = process.env.EON_VOICE_ID || DEFAULT_VOICE_ID;
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.55, similarity_boost: 0.7 },
        }),
      },
    );

    if (!response.ok || !response.body) {
      return NextResponse.json({ voice: "unavailable" }, { status: 503 });
    }

    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
