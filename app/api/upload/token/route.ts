import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireUser, AuthError } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_BYTES = 100 * 1024 * 1024; // 100MB

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif", "image/heic", "image/heif"];

/**
 * Client upload de @vercel/blob: emite un token para que el navegador suba el
 * archivo DIRECTO a Vercel Blob, sin pasar por la función serverless (que capa
 * el body a 4.5MB y rompía las subidas grandes en producción).
 *
 * Seguridad: el pathname SIEMPRE debe caer bajo eternime/{userId}/ del usuario
 * autenticado — nadie puede escribir en la carpeta de otro. El registro en la
 * base de datos lo hace el cliente con un POST posterior a /api/upload (ver esa
 * ruta), que revalida el prefijo del pathname contra la sesión.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const session = await requireUser();
    const prefix = `eternime/${session.sub}/`;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!pathname.startsWith(prefix)) {
          throw new Error("Ruta no permitida");
        }
        let purpose = "file";
        try {
          if (clientPayload) purpose = JSON.parse(clientPayload)?.purpose ?? "file";
        } catch { /* ignore */ }
        const allowedContentTypes = purpose === "avatar" || purpose === "cover" ? IMAGE_TYPES : undefined;
        return {
          addRandomSuffix: true,
          maximumSizeInBytes: MAX_BYTES,
          allowedContentTypes,
          tokenPayload: JSON.stringify({ userId: session.sub, purpose }),
        };
      },
      // En producción Vercel invoca este callback server-to-server al terminar
      // la subida. El registro autoritativo lo hace el POST del cliente, así que
      // aquí solo dejamos traza (evita escrituras duplicadas).
      onUploadCompleted: async ({ blob }) => {
        console.log("[upload/token] blob subido:", blob.pathname);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: (e as Error).message || "No se pudo autorizar la subida" }, { status: 400 });
  }
}
