export const MAX_VOICE_BYTES = 3_800_000;
export const MAX_VOICE_SAMPLES = 6;
export function validateVoiceSamples(files: { size: number; type: string }[]) {
  if (!files.length || files.some(f => f.size <= 0)) return "Graba o sube al menos una muestra de audio válida.";
  if (files.length > MAX_VOICE_SAMPLES) return "Puedes enviar hasta seis muestras por clon.";
  if (files.some(f => !f.type.startsWith("audio/"))) return "Usa archivos de audio MP3, M4A, WAV, OGG o WebM.";
  if (files.reduce((total, f) => total + f.size, 0) > MAX_VOICE_BYTES) return "Los audios superan 3.8 MB. Usa MP3 o graba muestras más cortas aquí.";
  return null;
}
export function recordingExtension(mime: string) {
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}
export function personalVoiceId(prefs: Record<string, unknown> | null | undefined): string | null {
  const value = prefs?.personal_voice_id ?? prefs?.eon_voice_id;
  return typeof value === "string" && value ? value : null;
}
