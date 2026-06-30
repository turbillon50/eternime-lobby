/**
 * Re-aloja un recuerdo importado de redes sociales en nuestro propio Vercel
 * Blob y lo guarda como eternime_files. Es OBLIGATORIO re-alojar: las URLs
 * de Facebook/Instagram son temporales (expiran en horas/dias) — si solo
 * guardaramos esa URL, el recuerdo se volveria una imagen rota con el
 * tiempo. external_id evita duplicados si el usuario importa dos veces.
 */
import { put } from "@vercel/blob";
import { createFile, kindFromMime } from "@/lib/data/files";
import type { EternimeFile } from "@/lib/data/types";

export async function rehostAndSaveImport(input: {
  userId: string;
  remoteUrl: string;
  externalId: string;
  caption?: string | null;
  suggestedName?: string | null;
}): Promise<EternimeFile | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;

  const res = await fetch(input.remoteUrl);
  if (!res.ok) return null;
  const contentType = res.headers.get("content-type") || "application/octet-stream";
  const buffer = await res.arrayBuffer();
  if (buffer.byteLength === 0) return null;

  const ext = contentType.includes("video") ? "mp4" : contentType.includes("png") ? "png" : "jpg";
  const safeName = (input.suggestedName || `import-${input.externalId}`).replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60);
  const pathname = `eternime/${input.userId}/imported/${Date.now()}-${safeName}.${ext}`;

  const blob = await put(pathname, Buffer.from(buffer), { access: "public", token, contentType });

  return createFile({
    userId: input.userId,
    kind: kindFromMime(contentType),
    url: blob.url,
    pathname: blob.pathname,
    name: input.suggestedName ?? null,
    mime: contentType,
    size: buffer.byteLength,
    caption: input.caption ?? null,
    source: "social_import",
    externalId: input.externalId,
  });
}
