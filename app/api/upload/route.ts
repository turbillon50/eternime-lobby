import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireUser, AuthError } from "@/lib/auth";
import { updateUserProfile } from "@/lib/data/users";
import { createFile, kindFromMime } from "@/lib/data/files";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 100 * 1024 * 1024; // 100MB

/** Purpose válidos. */
function normPurpose(p: unknown): "avatar" | "cover" | "file" {
  return p === "avatar" || p === "cover" ? p : "file";
}

/**
 * Registra en la base de datos un blob que el navegador ya subió directo a
 * Vercel Blob (client upload de @vercel/blob/client). Es el "POST posterior"
 * al token de /api/upload/token. Revalida que el pathname pertenezca al
 * usuario antes de escribir nada, para que nadie registre un blob ajeno.
 */
async function registerUploadedBlob(userId: string, body: unknown): Promise<NextResponse> {
  const b = (body ?? {}) as Record<string, unknown>;
  const url = typeof b.url === "string" ? b.url : "";
  const pathname = typeof b.pathname === "string" ? b.pathname : "";
  const purpose = normPurpose(b.purpose);
  if (!url || !pathname) return NextResponse.json({ error: "Faltan datos del archivo" }, { status: 400 });
  if (!pathname.startsWith(`eternime/${userId}/`)) {
    return NextResponse.json({ error: "Ruta no permitida" }, { status: 403 });
  }

  if (purpose === "avatar") {
    const user = await updateUserProfile(userId, { avatar_url: url });
    return NextResponse.json({ url, user });
  }
  if (purpose === "cover") {
    const user = await updateUserProfile(userId, { cover_url: url });
    return NextResponse.json({ url, user });
  }

  const mime = typeof b.mime === "string" ? b.mime : null;
  const record = await createFile({
    userId,
    kind: kindFromMime(mime),
    url,
    pathname,
    name: typeof b.name === "string" ? b.name : null,
    mime,
    size: typeof b.size === "number" ? b.size : null,
    caption: typeof b.caption === "string" ? b.caption : null,
  });
  return NextResponse.json({ url, file: record });
}

export async function POST(request: Request) {
  try {
    const session = await requireUser();

    // ── POST posterior al client upload (@vercel/blob/client) ──
    // El navegador subió el archivo DIRECTO a Blob (sin tope de 4.5MB) y ahora
    // registra el resultado con un JSON.
    if ((request.headers.get("content-type") || "").includes("application/json")) {
      return await registerUploadedBlob(session.sub, await request.json());
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return NextResponse.json({ error: "Almacenamiento no configurado" }, { status: 503 });

    const url = new URL(request.url);
    const purpose = url.searchParams.get("purpose") ?? "file"; // avatar | cover | file
    const caption = url.searchParams.get("caption");

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Archivo demasiado grande (max 100MB)" }, { status: 413 });
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
