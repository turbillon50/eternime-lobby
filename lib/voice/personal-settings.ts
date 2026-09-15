export const PERSONAL_VOICE_MODEL = "eleven_multilingual_v2";
export type VoiceDelivery = "natural" | "steady";
export function voiceDelivery(value: unknown): VoiceDelivery { return value === "steady" ? "steady" : "natural"; }
export function personalVoiceSettings(delivery: VoiceDelivery = "natural") {
  return { stability: delivery === "steady" ? 0.7 : 0.45, similarity_boost: 0.8, style: 0, use_speaker_boost: true, speed: 1 };
}
export function speechSignature(delivery: VoiceDelivery = "natural") {
  return JSON.stringify({ model: PERSONAL_VOICE_MODEL, settings: personalVoiceSettings(delivery), revision: 1 });
}
