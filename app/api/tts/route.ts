/**
 * Text-to-speech via ElevenLabs.
 *
 * Uses the brand default voice (Sarah, multilingual v2) until a user clones
 * their own in Fase 3. Returns audio/mpeg bytes for the client to play.
 */
import { isClerkConfigured } from "@/lib/clerk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// "Sarah" — ElevenLabs stock multilingual voice; override via env if desired.
const DEFAULT_VOICE_ID = process.env.ELEVENLABS_DEFAULT_VOICE_ID || "EXAVITQu4vr4xnSDxMaL";

export async function POST(req: Request) {
  if (!isClerkConfigured()) return Response.json({ error: "Auth not configured" }, { status: 503 });

  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "unauthenticated" }, { status: 401 });

  const apiKey = process.env.ELEVENLABS_API_KEY || process.env.XI_API_KEY;
  if (!apiKey) return Response.json({ error: "Voz no configurada." }, { status: 503 });

  const { text } = (await req.json().catch(() => ({}))) as { text?: string };
  const clean = text?.trim();
  if (!clean) return Response.json({ error: "Texto vacío" }, { status: 400 });

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${DEFAULT_VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: clean.slice(0, 2500),
        model_id: "eleven_multilingual_v2",
      }),
    },
  );

  if (!res.ok || !res.body) {
    return Response.json({ error: "No se pudo generar el audio." }, { status: 502 });
  }

  return new Response(res.body, {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
  });
}
