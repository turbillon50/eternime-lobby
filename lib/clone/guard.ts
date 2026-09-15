import "server-only";
import { CloneError } from "./errors";

/** Reject browser cross-origin writes; authenticated non-browser callers may omit Origin. */
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== new URL(request.url).origin)) {
    throw new CloneError("ORIGIN_INVALID", "Abre esta acción desde Eternime.", 403);
  }
}
export async function boundedJson(request: Request, maxBytes = 20_000) {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new CloneError("INVALID_BODY", "Formato de solicitud inválido.", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new CloneError("INVALID_BODY", "Faltan los datos de la solicitud.", 400);
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maxBytes) { await reader.cancel(); throw new CloneError("BODY_TOO_LARGE", "La solicitud supera el tamaño permitido.", 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
