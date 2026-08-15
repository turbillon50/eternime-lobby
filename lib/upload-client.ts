"use client";

import { upload } from "@vercel/blob/client";

export type UploadPurpose = "file" | "avatar" | "cover";

export type UploadResult = {
  url: string;
  // Presente cuando purpose === "file"
  file?: {
    id: string;
    kind: "image" | "document" | "audio" | "video" | "other";
    url: string;
    name?: string | null;
    mime?: string | null;
    size?: number | null;
    created_at?: string;
  } | null;
  // Presente cuando purpose === "avatar" | "cover"
  user?: unknown;
};

let cachedUserId: string | null = null;

async function getUserId(): Promise<string> {
  if (cachedUserId) return cachedUserId;
  const r = await fetch("/api/auth/me");
  const d = await r.json().catch(() => ({}));
  const id = d?.user?.id;
  if (!id) throw new Error("Sesión no válida");
  cachedUserId = id;
  return id;
}

/**
 * Sube un archivo DIRECTO a Vercel Blob desde el navegador (client upload),
 * evitando el tope de 4.5MB de las funciones serverless. Después registra el
 * resultado en la base de datos con un POST a /api/upload.
 *
 * El pathname se ancla a eternime/{userId}/ — el token de /api/upload/token
 * rechaza cualquier ruta fuera de la carpeta del usuario.
 */
export async function uploadFile(file: File, purpose: UploadPurpose, caption?: string): Promise<UploadResult> {
  const userId = await getUserId();
  const safeName = (file.name || "archivo").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const pathname = `eternime/${userId}/${purpose}/${Date.now()}-${safeName}`;

  const blob = await upload(pathname, file, {
    access: "public",
    handleUploadUrl: "/api/upload/token",
    contentType: file.type || undefined,
    clientPayload: JSON.stringify({ purpose }),
  });

  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      purpose,
      url: blob.url,
      pathname: blob.pathname,
      name: file.name || safeName,
      mime: file.type || null,
      size: file.size,
      caption: caption ?? null,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "No se pudo registrar el archivo");
  return data as UploadResult;
}
