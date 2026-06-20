import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { findUserById, updateUserProfile } from "@/lib/data/users";

export const runtime = "nodejs";
export const maxDuration = 60;

function xiKey() {
  return process.env.ELEVENLABS_API_KEY || process.env.XI_API_KEY || "";
}

/** Estado: ¿ya tiene Luis su voz clonada? */
export async function GET() {
  try {
    const session = await requireUser();
    const user = await findUserById(session.sub);
    const voiceId = (user?.prefs as Record<string, unknown> | null)?.eon_voice_id ?? null;
    return NextResponse.json({ voiceId, cloningAvailable: Boolean(xiKey()) });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

/** Clona la voz a partir de muestras de audio (Instant Voice Cloning). */
export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const key = xiKey();
    if (!key) return NextResponse.json({ error: "Voz no configurada" }, { status: 503 });

    const form = await request.formData();
    const files = form.getAll("files").filter((f): f is File => f instanceof File);
    if (!files.length) return NextResponse.json({ error: "Sube al menos una muestra de audio" }, { status: 400 });

    const user = await findUserById(session.sub);
    const name = `Voz de ${user?.name || "Eternime"}`;

    const xiForm = new FormData();
    xiForm.append("name", name);
    xiForm.append("description", "Voz personal para narrar recuerdos en Eternime.");
    for (const f of files) xiForm.append("files", f, f.name || "muestra.mp3");

    const res = await fetch("https://api.elevenlabs.io/v1/voices/add", {
      method: "POST",
      headers: { "xi-api-key": key },
      body: xiForm,
    });
    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json({ error: "ElevenLabs rechazó el audio", detail: txt.slice(0, 300) }, { status: 502 });
    }
    const data = (await res.json()) as { voice_id?: string };
    const voiceId = data.voice_id;
    if (!voiceId) return NextResponse.json({ error: "No se obtuvo voice_id" }, { status: 502 });

    const prefs = { ...((user?.prefs as Record<string, unknown>) || {}), eon_voice_id: voiceId };
    await updateUserProfile(session.sub, { prefs });

    return NextResponse.json({ voiceId, name });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("[voice/clone]", e);
    return NextResponse.json({ error: "No se pudo clonar la voz" }, { status: 500 });
  }
}

/** Olvida la voz clonada (la quita de Eternime; no borra de ElevenLabs). */
export async function DELETE() {
  try {
    const session = await requireUser();
    const user = await findUserById(session.sub);
    const prefs = { ...((user?.prefs as Record<string, unknown>) || {}) };
    delete prefs.eon_voice_id;
    await updateUserProfile(session.sub, { prefs });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
