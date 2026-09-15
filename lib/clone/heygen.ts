import "server-only";
import { CloneError } from "./errors";

export async function heygen(path: string, init: RequestInit = {}, idempotencyKey?: string) {
  const key = process.env.HEYGEN_API_KEY;
  if (!key) throw new CloneError("AVATAR_UNAVAILABLE", "El servicio de avatar aún no está configurado.", 503);
  const response = await fetch(`https://api.heygen.com/v3/${path}`, {
    ...init, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(45_000),
    headers: { "X-Api-Key": key, ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}), ...init.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = response.status === 402 ? "El servicio de avatar no tiene saldo suficiente."
      : response.status === 429 ? "HeyGen está ocupado o alcanzó su límite. Espera antes de consultar de nuevo."
      : response.status === 401 || response.status === 403 ? "HeyGen necesita revisar el acceso de la cuenta."
      : "HeyGen no pudo completar esta operación. Tu solicitud queda registrada.";
    throw new CloneError("HEYGEN_UNAVAILABLE", message, response.status === 429 ? 429 : 502);
  }
  if (!body.data || typeof body.data !== "object") throw new CloneError("PROVIDER_RESPONSE", "El proveedor respondió sin los datos esperados.", 502);
  return body.data;
}
export async function uploadAsset(bytes: Uint8Array, mime: string, filename: string, key: string) {
  const form = new FormData(); form.append("file", new Blob([new Uint8Array(bytes)], { type: mime }), filename);
  const data = await heygen("assets", { method: "POST", body: form }, key);
  if (typeof data.asset_id !== "string" || !data.asset_id) throw new CloneError("PROVIDER_RESPONSE", "HeyGen no devolvió el identificador del archivo.", 502);
  return data.asset_id as string;
}
export function videoPayload(imageId: string, audioId: string) {
  return { type: "image", image: { type: "asset_id", asset_id: imageId }, audio_asset_id: audioId,
    title: "Mi clon · Eternime", resolution: "720p", aspect_ratio: "auto", output_format: "mp4" };
}
/** Provider URLs only. Never forward the API key to the media host or follow redirects. */
export function trustedVideoUrl(value: unknown) {
  if (typeof value !== "string") throw new CloneError("VIDEO_URL_INVALID", "El enlace del video no es válido.", 502);
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.port ||
      !["files.heygen.ai", "resource.heygen.ai", "files.heygen.com", "resource2.heygen.ai"].includes(url.hostname)) {
    throw new CloneError("VIDEO_URL_INVALID", "El proveedor devolvió un enlace de video no reconocido.", 502);
  }
  return url.toString();
}
export async function downloadVideo(value: unknown) {
  const response = await fetch(trustedVideoUrl(value), { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(45_000) });
  if (!response.ok || !response.body) throw new CloneError("VIDEO_DOWNLOAD", "El video está generado, pero aún no pude guardarlo. Actualiza su estado.", 502);
  const chunks: Uint8Array[] = []; let size = 0; const reader = response.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.length;
      if (size > 16_000_000) { await reader.cancel(); throw new CloneError("VIDEO_SIZE", "El video supera el tamaño admitido para guardarlo en Eternime.", 502); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks);
}
