import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getSession } from "@/lib/auth";
import { createFile, kindFromMime } from "@/lib/data/files";
import { createMemory } from "@/lib/data/memories";
import type { MemoryKind } from "@/lib/data/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Web Share Target: recibe lo que el usuario "comparte a Eternime" desde
 * cualquier app del teléfono (foto, video, texto, enlace). Ver public/manifest.json
 * (share_target, method POST, multipart/form-data).
 *
 * - Con sesión: guarda los archivos en la Bóveda (eternime_files) y el
 *   texto/enlace como recuerdo (eternime_memories, source=compartido).
 * - Sin sesión: redirige a iniciar sesión conservando el texto/enlace en la
 *   URL (los archivos no se pueden conservar a través del login, se pide
 *   volver a compartir tras entrar).
 *
 * Nota: el POST de share target pasa por la función serverless (tope ~4.5MB en
 * Vercel), suficiente para fotos; para videos grandes, subirlos desde la Bóveda.
 */
function kindForShare(mime: string): MemoryKind {
  if (mime.startsWith("image/")) return "foto";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "voz";
  return "texto";
}

export async function POST(request: Request) {
  const session = await getSession();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.redirect(new URL("/app/recuerdos", request.url), 303);
  }

  const title = (form.get("title") as string | null)?.trim() || "";
  const text = (form.get("text") as string | null)?.trim() || "";
  const url = (form.get("url") as string | null)?.trim() || "";

  // Recolecta cualquier File compartido (los nombres de campo del manifest:
  // images/videos/files, pero aceptamos todos por robustez).
  const files: File[] = [];
  for (const value of form.values()) {
    if (value instanceof File && value.size > 0) files.push(value);
  }

  // Sin sesión: manda a iniciar sesión conservando texto/enlace.
  if (!session) {
    const dest = new URL("/entrar", request.url);
    dest.searchParams.set("next", "/app/recuerdos");
    if (text) dest.searchParams.set("shared_text", text.slice(0, 500));
    if (url) dest.searchParams.set("shared_url", url.slice(0, 500));
    return NextResponse.redirect(dest, 303);
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;

  // Archivos → Bóveda
  if (token && files.length) {
    for (const file of files) {
      try {
        const safeName = (file.name || "compartido").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
        const pathname = `eternime/${session.sub}/share/${Date.now()}-${safeName}`;
        const blob = await put(pathname, file, { access: "public", token, contentType: file.type || undefined });
        await createFile({
          userId: session.sub,
          kind: kindFromMime(file.type),
          url: blob.url,
          pathname: blob.pathname,
          name: file.name || safeName,
          mime: file.type || null,
          size: file.size,
          caption: title || null,
        });
        // Además, deja un recuerdo con la media para que aparezca en la línea de tiempo.
        await createMemory({
          userId: session.sub,
          title: title || "Compartido a Eternime",
          content: text || null,
          kind: kindForShare(file.type || ""),
          mediaUrl: blob.url,
          source: "compartido",
        });
      } catch (e) {
        console.error("[share] archivo", e);
      }
    }
  }

  // Texto / enlace → recuerdo
  if (!files.length && (text || url)) {
    const content = [text, url].filter(Boolean).join("\n");
    await createMemory({
      userId: session.sub,
      title: title || (url ? "Enlace compartido" : "Nota compartida"),
      content,
      kind: "texto",
      source: "compartido",
    });
  }

  return NextResponse.redirect(new URL("/app/recuerdos?compartido=1", request.url), 303);
}
