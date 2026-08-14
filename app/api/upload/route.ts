import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireUser, AuthError } from "@/lib/auth";
import { updateUserProfile } from "@/lib/data/users";
import { createFile, kindFromMime } from "@/lib/data/files";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 100 * 1024 * 1024; // 100MB

const ALLOWED_PURPOSES = ["avatar", "cover", "file"] as const;
type Purpose = (typeof ALLOWED_PURPOSES)[number];

const IMAGE_MIMES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif", "image/heic", "image/heif"];
// Para "file" (bóveda) aceptamos media + documentos comunes; nada ejecutable.
const DOC_MIMES = [
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

function mimeAllowed(purpose: Purpose, mime: string): boolean {
  if (purpose === "avatar" || purpose === "cover") return IMAGE_MIMES.includes(mime);
  // purpose === "file"
  return mime.startsWith("image/") || mime.startsWith("audio/") || mime.startsWith("video/") || DOC_MIMES.includes(mime);
}

export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return NextResponse.json({ error: "Almacenamiento no configurado" }, { status: 503 });

    const url = new URL(request.url);
    const purposeRaw = url.searchParams.get("purpose") ?? "file";
    if (!ALLOWED_PURPOSES.includes(purposeRaw as Purpose)) {
      return NextResponse.json({ error: "Destino de subida no permitido" }, { status: 400 });
    }
    const purpose = purposeRaw as Purpose;
    const caption = url.searchParams.get("caption");

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Archivo demasiado grande (max 100MB)" }, { status: 413 });
    }
    if (!mimeAllowed(purpose, file.type || "")) {
      return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 415 });
    }

    const safeName = (file.name || "archivo").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
    const pathname = `eternime/${session.sub}/${purpose}/${Date.now()}-${safeName}`;
    const blob = await put(pathname, file, {
      access: "public",
      token,
      contentType: file.type || undefined,
    });

    if (purpose === "avatar") {
      const user = await updateUserProfile(session.sub, { avatar_url: blob.url });
      return NextResponse.json({ url: blob.url, user });
    }
    if (purpose === "cover") {
      const user = await updateUserProfile(session.sub, { cover_url: blob.url });
      return NextResponse.json({ url: blob.url, user });
    }

    const record = await createFile({
      userId: session.sub,
      kind: kindFromMime(file.type),
      url: blob.url,
      pathname: blob.pathname,
      name: file.name || safeName,
      mime: file.type || null,
      size: file.size,
      caption: caption || null,
    });
    return NextResponse.json({ url: blob.url, file: record });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("[upload]", e);
    return NextResponse.json({ error: "No se pudo subir el archivo" }, { status: 500 });
  }
}
