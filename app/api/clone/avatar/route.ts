import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { findUserById } from "@/lib/data/users";
import { getCloneExchange } from "@/lib/data/clone";
import { personalVoiceId } from "@/lib/voice/samples";
import { savedSpeech } from "@/lib/clone/audio";
import { heygen, uploadAsset, videoPayload } from "@/lib/clone/heygen";
import { consumeAllowance, digest, latestPortrait, listJobs, publicJob, readMedia, reserveJob, updateJob } from "@/lib/clone/media-store";
import { boundedJson, sameOrigin } from "@/lib/clone/guard";
import { cloneErrorResponse, PRIVATE_HEADERS, UUID } from "@/lib/clone/http";
import { CloneError } from "@/lib/clone/errors";
import { cloneNeedsSetup, ensureCloneReady } from "@/lib/clone/setup";
import { speechSignature, voiceDelivery } from "@/lib/voice/personal-settings";
export const runtime = "nodejs";
export const maxDuration = 180;
export async function GET() {
  try {
    const session = await requireUser(); const jobs = await listJobs(session.clerkId, "avatar");
    return NextResponse.json({ configured: !!process.env.HEYGEN_API_KEY, jobs: jobs.map(publicJob) }, { headers: PRIVATE_HEADERS });
  } catch (e) { if (cloneNeedsSetup(e)) return NextResponse.json({ configured: !!process.env.HEYGEN_API_KEY, jobs: [] }, { headers: PRIVATE_HEADERS }); return cloneErrorResponse(e); }
}
export async function POST(request: Request) {
  try {
    const session = await requireUser(); sameOrigin(request); const body = await boundedJson(request);
    if (body?.consent !== true || typeof body.portraitId !== "string" || !UUID.test(body.portraitId)) throw new CloneError("AVATAR_INPUT", "Sube tu foto y autoriza el video.", 400);
    const directText = typeof body.text === "string" ? body.text.trim() : null;
    if (directText !== null && (!directText || body.text.length > 350)) throw new CloneError("AVATAR_LENGTH", "Escribe una frase de hasta 350 caracteres.", 400);
    if (directText === null && (typeof body.exchangeId !== "string" || !UUID.test(body.exchangeId))) throw new CloneError("AVATAR_INPUT", "Escribe lo que quieres que diga tu clon.", 400);
    if (!process.env.HEYGEN_API_KEY) throw new CloneError("AVATAR_UNAVAILABLE", "El video no está disponible en este momento.");
    await ensureCloneReady(session);
    const [exchange, photo, user] = await Promise.all([directText === null ? getCloneExchange(session.clerkId, body.exchangeId) : Promise.resolve(null), latestPortrait(session.clerkId), findUserById(session.sub)]);
    const text = directText ?? exchange?.clone_text;
    if (!text || !photo || photo.id !== body.portraitId) throw new CloneError("AVATAR_INPUT", "Actualiza tu foto y escribe la frase de tu clon.", 409);
    if (text.length > 350) throw new CloneError("AVATAR_LENGTH", "Usa una frase de hasta 350 caracteres para este video.", 400);
    const voiceId = personalVoiceId(user?.prefs);
    if (!voiceId) throw new CloneError("VOICE_REQUIRED", "Primero graba o sube tu voz en Mi voz.", 409);
    const delivery = voiceDelivery(body.delivery);
    const { job, fresh } = await reserveJob(session.clerkId, "avatar", digest("spoken-text", text, photo.id, voiceId, speechSignature(delivery)));
    if (!fresh) return NextResponse.json({ job: publicJob(job) }, { status: 200, headers: PRIVATE_HEADERS });
    let submitted = false;
    try {
      await consumeAllowance(session.clerkId, "avatar", 3);
      const image = await readMedia(session.clerkId, photo.id);
      if (!image || image.kind !== "portrait") throw new CloneError("PHOTO_MISSING", "Tu foto ya no está disponible.", 409);
      const speech = await savedSpeech(session.clerkId, voiceId, text, delivery);
      const imageId = await uploadAsset(image.bytes, image.mime, "portrait.jpg", `${job.id}:image`);
      const audioId = await uploadAsset(speech.bytes, speech.mime, "voice.mp3", `${job.id}:audio`);
      const payload = JSON.stringify(videoPayload(imageId, audioId));
      await updateJob(session.clerkId, job.id, { status: "submitting", payload });
      submitted = true;
      const result = await heygen("videos", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload }, job.id);
      if (typeof result.video_id !== "string" || !result.video_id) throw new CloneError("PROVIDER_RESPONSE", "HeyGen no devolvió el identificador del video.", 502);
      await updateJob(session.clerkId, job.id, { status: "processing", providerId: result.video_id });
      return NextResponse.json({ job: publicJob({ ...job, status: "processing" }) }, { status: 202, headers: PRIVATE_HEADERS });
    } catch (e) {
      await updateJob(session.clerkId, job.id, { status: submitted ? "uncertain" : "failed", error: submitted ? "Estamos verificando si HeyGen recibió la solicitud. Actualiza su estado; no generes otra." : e instanceof CloneError ? e.message : "La preparación se interrumpió. No se volvió a generar automáticamente." });
      throw e;
    }
  } catch (e) { return cloneErrorResponse(e); }
}
