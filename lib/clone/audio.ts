import "server-only";
import { speechSignature, type VoiceDelivery } from "@/lib/voice/personal-settings";
import { synthesizePersonalVoice } from "@/lib/voice/elevenlabs";
import { consumeAllowance, digest, readMedia, reserveJob, storeMedia, updateJob } from "./media-store";
import { CloneError } from "./errors";

export async function savedSpeech(owner: string, voiceId: string, text: string, delivery: VoiceDelivery = "natural") {
  const { job, fresh } = await reserveJob(owner, "audio", digest(voiceId, text, speechSignature(delivery)));
  if (!fresh) {
    if (job.result_id) { const stored = await readMedia(owner, job.result_id); if (stored) return { ...stored, id: job.result_id }; }
    throw new CloneError("AUDIO_PENDING", job.error || "Este audio ya se está preparando. Espera un momento antes de volver a escucharlo.", 409);
  }
  try {
    await consumeAllowance(owner, "audio", 30);
    const response = await synthesizePersonalVoice(voiceId, text, delivery);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length > 4_000_000) throw new CloneError("AUDIO_TOO_LARGE", "Pide una respuesta más breve para escucharla.");
    const id = await storeMedia(owner, "audio", bytes, "audio/mpeg");
    await updateJob(owner, job.id, { status: "completed", resultId: id });
    return { id, bytes, mime: "audio/mpeg" };
  } catch (error) {
    await updateJob(owner, job.id, { status: "failed", error: "El audio se interrumpió. Cambia la frase para volver a probar; no repetimos esta generación automáticamente." });
    throw error;
  }
}
