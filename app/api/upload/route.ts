import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireUser, AuthError } from "@/lib/auth";
import { updateUserProfile } from "@/lib/data/users";
import { createFile, kindFromMime } from "@/lib/data/files";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 100 * 1024 * 1024; // 100MB

export async function POST(request: Request) {
  try {
    const session = await requireUser();
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
