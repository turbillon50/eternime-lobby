import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { findUserById, updateUserProfile } from "@/lib/data/users";

export const runtime = "nodejs";
export const maxDuration = 60;

function xiKey() { return process.env.ELEVENLABS_API_KEY || process.env.XI_API_KEY || ""; }

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

export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const key = xiKey();
    if (!key) return NextResponse.json({ error: "Voz no configurada" }, { status: 503 });
    const form = await request.formData();
    if (form.get("consent") !== "true") return NextResponse.json({ error: "Necesitamos tu autorización explícita para crear el clon de voz" }, { status: 400 });
    const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    if (!files.length) return NextResponse.json({ error: "Graba o sube al menos una muestra de audio" }, { status: 400 });
    const user = await findUserById(session.sub);
    const previous = (user?.prefs as Record<string, unknown> | null)?.eon_voice_id;
    const xiForm = new FormData();
    xiForm.append("name", `Voz de ${user?.name || "Eternime"}`);
    xiForm.append("description", "Voz personal autorizada por su titular para Eon en Eternime.");
    for (const f of files.slice(0, 6)) xiForm.append("files", f, f.name || "muestra.webm");
    const res = await fetch("https://api.elevenlabs.io/v1/voices/add", { method: "POST", headers: { "xi-api-key": key }, body: xiForm });
    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json({ error: "ElevenLabs rechazó las muestras", detail: txt.slice(0, 300) }, { status: 502 });
    }
    const data = await res.json() as { voice_id?: string };
    if (!data.voice_id) return NextResponse.json({ error: "No se obtuvo voice_id" }, { status: 502 });
    const prefs = { ...((user?.prefs as Record<string, unknown>) || {}), eon_voice_id: data.voice_id, eon_voice_consented_at: new Date().toISOString() };
    await updateUserProfile(session.sub, { prefs });
    if (typeof previous === "string" && previous && previous !== data.voice_id) {
      await fetch(`https://api.elevenlabs.io/v1/voices/${encodeURIComponent(previous)}`, { method: "DELETE", headers: { "xi-api-key": key } }).catch(() => null);
    }
    return NextResponse.json({ voiceId: data.voice_id, name: `Voz de ${user?.name || "Eternime"}` });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("[voice/clone]", e);
    return NextResponse.json({ error: "No se pudo clonar la voz" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await requireUser();
    const user = await findUserById(session.sub);
    const prefs = { ...((user?.prefs as Record<string, unknown>) || {}) };
    const voiceId = typeof prefs.eon_voice_id === "string" ? prefs.eon_voice_id : null;
    if (voiceId && xiKey()) {
      await fetch(`https://api.elevenlabs.io/v1/voices/${encodeURIComponent(voiceId)}`, { method: "DELETE", headers: { "xi-api-key": xiKey() } }).catch(() => null);
    }
    delete prefs.eon_voice_id;
    delete prefs.eon_voice_consented_at;
    await updateUserProfile(session.sub, { prefs });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "No se pudo eliminar la voz" }, { status: 500 });
  }
}
