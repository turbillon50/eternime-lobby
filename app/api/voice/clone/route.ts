import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { findUserById } from "@/lib/data/users";
import { cloningCapability, elevenLabsKey, voiceFailure } from "@/lib/voice/elevenlabs";
import { personalVoiceId, validateVoiceSamples, MAX_VOICE_BYTES } from "@/lib/voice/samples";

export const runtime = "nodejs";
export const maxDuration = 60;

const xiKey = elevenLabsKey;

export async function GET() {
  try {
    const session = await requireUser();
    const user = await findUserById(session.sub);
    const voiceId = personalVoiceId(user?.prefs);
    const capability = await cloningCapability();
    return NextResponse.json({ voiceId, cloningAvailable: capability.available, reason: capability.reason }, { headers: { "Cache-Control": "private, no-store" } });
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
    if (Number(request.headers.get("content-length")) > MAX_VOICE_BYTES + 100_000) return NextResponse.json({ error: "Los audios superan 3.8 MB." }, { status: 413 });
    const form = await request.formData();
    if (form.get("consent") !== "true") return NextResponse.json({ error: "Necesitamos tu autorización explícita para crear el clon de voz" }, { status: 400 });
    const entries = form.getAll("files");
    const files = entries.filter((f): f is File => f instanceof File);
    const invalid = files.length !== entries.length ? "Muestras inválidas." : validateVoiceSamples(files);
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
    const capability = await cloningCapability();
    if (!capability.available) return NextResponse.json({ error: capability.reason }, { status: 503 });
    const user = await findUserById(session.sub);
    if (!user) return NextResponse.json({ error: "No pude encontrar tu perfil." }, { status: 404 });
    if (personalVoiceId(user.prefs)) return NextResponse.json({ error: "Ya tienes una voz personal. Escúchala antes de eliminarla y crear otra." }, { status: 409 });
    const xiForm = new FormData();
    xiForm.append("name", `Voz de ${user?.name || "Eternime"}`);
    xiForm.append("description", "Voz personal autorizada por su titular para su clon digital en Eternime.");
    for (const f of files) xiForm.append("files", f, f.name || "muestra.webm");
    const res = await fetch("https://api.elevenlabs.io/v1/voices/add", { method: "POST", headers: { "xi-api-key": key }, body: xiForm, signal: AbortSignal.timeout(40000) });
    if (!res.ok) {
      return NextResponse.json({ error: await voiceFailure(res) }, { status: 502 });
    }
    const data = await res.json() as { voice_id?: string };
    if (!data.voice_id) return NextResponse.json({ error: "No se obtuvo voice_id" }, { status: 502 });
    const { attachPersonalVoice } = await import("@/lib/data/personal-voice");
    const attached = await attachPersonalVoice(session.sub, data.voice_id);
    if (!attached) {
        // Clean up only the new, unattached voice created by this request.
        await fetch(`https://api.elevenlabs.io/v1/voices/${encodeURIComponent(data.voice_id)}`, { method: "DELETE", headers: { "xi-api-key": key }, signal: AbortSignal.timeout(8000) }).catch(() => null);
    }
    if (!attached) return NextResponse.json({ error: "Tu voz cambió en otra sesión. Recarga antes de continuar." }, { status: 409 });
    return NextResponse.json({ voiceId: data.voice_id, name: `Voz de ${user?.name || "Eternime"}` });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("[voice/clone] request failed", { type: e instanceof Error ? e.name : "unknown" });
    return NextResponse.json({ error: "No se pudo clonar la voz" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await requireUser();
    const user = await findUserById(session.sub);
    const prefs = { ...((user?.prefs as Record<string, unknown>) || {}) };
    if (!user) return NextResponse.json({ error: "No pude encontrar tu perfil." }, { status: 404 });
    const voiceId = personalVoiceId(prefs);
    if (voiceId) {
      if (!xiKey()) return NextResponse.json({ error: "No pude conectar con el servicio para eliminar tu voz." }, { status: 503 });
      const response = await fetch(`https://api.elevenlabs.io/v1/voices/${encodeURIComponent(voiceId)}`, { method: "DELETE", headers: { "xi-api-key": xiKey() }, signal: AbortSignal.timeout(15000) });
      if (!response.ok && response.status !== 404) return NextResponse.json({ error: await voiceFailure(response) }, { status: 502 });
      const { detachPersonalVoice } = await import("@/lib/data/personal-voice");
      if (!await detachPersonalVoice(session.sub, voiceId)) return NextResponse.json({ error: "Tu voz cambió en otra sesión. Recarga para consultar su estado." }, { status: 409 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "No se pudo eliminar la voz" }, { status: 500 });
  }
}
