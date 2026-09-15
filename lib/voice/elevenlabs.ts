import "server-only";
export function elevenLabsKey() { return process.env.ELEVENLABS_API_KEY || process.env.XI_API_KEY || ""; }

export async function cloningCapability() {
  const key = elevenLabsKey();
  if (!key) return { available: false, reason: "El servicio de voz todavía no está configurado." };
  try {
    const response = await fetch("https://api.elevenlabs.io/v1/user/subscription", {
      headers: { "xi-api-key": key }, cache: "no-store", signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return { available: false, reason: "No pudimos verificar el acceso a clonación en ElevenLabs. Reintenta más tarde." };
    const subscription = await response.json();
    if (subscription.can_use_instant_voice_cloning !== true) return { available: false, reason: "La cuenta de ElevenLabs conectada a Eternime no tiene habilitada la clonación instantánea. Falta activar ese acceso para crear tu voz." };
    return { available: true, reason: null };
  } catch { return { available: false, reason: "No pudimos conectar con ElevenLabs. Reintenta más tarde." }; }
}

export async function voiceFailure(response: Response) {
  const data = await response.json().catch(() => ({}));
  const code = data.detail?.status;
  if (code === "quota_exceeded" || response.status === 429) return "Se alcanzó el límite de uso de voz. Intenta más tarde o revisa el saldo del servicio.";
  if (code === "voice_limit_reached") return "La cuenta de voz alcanzó su límite de clones. Revisa los espacios disponibles en ElevenLabs.";
  if (response.status === 401 || response.status === 403) return "ElevenLabs no autorizó esta operación. Revisa el acceso API y los permisos de clonación.";
  return "ElevenLabs no pudo procesar la solicitud. Revisa que el audio sea claro y vuelve a intentar.";
}

export class VoiceServiceError extends Error {}
export async function synthesizePersonalVoice(voiceId: string, text: string) {
  const key = elevenLabsKey();
  if (!key) throw new VoiceServiceError("El servicio de voz no está configurado.");
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
    method: "POST", headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: "eleven_flash_v2_5" }), signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) throw new VoiceServiceError(await voiceFailure(response));
  return new Response(await response.arrayBuffer(), { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, no-store" } });
}
