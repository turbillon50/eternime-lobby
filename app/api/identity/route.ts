import { NextResponse } from "next/server";
import { head } from "@vercel/blob";
import { requireUser, AuthError } from "@/lib/auth";
import { TenantNotReadyError } from "@/lib/db/tenant";
import { addIdentityAsset, deleteIdentityAsset, listIdentityAssets } from "@/lib/data/identity-tenant";
import { IDENTITY_POSES } from "@/lib/identity";
import { ensureTenantForUser } from "@/lib/tenant/ensure";
const POSES = new Set<string>([...IDENTITY_POSES.map(p => p.id), "motion"]);
const headers = { "Cache-Control": "private, no-store" };
export const runtime = "nodejs";
export const maxDuration = 60;
function failure(error: unknown) {
  if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status, headers });
  console.error("[identity] unavailable", { type: error instanceof Error ? error.name : "unknown", code: (error as { code?: string })?.code });
  const message = error instanceof TenantNotReadyError
    ? "Tu espacio personal no está listo. Necesitamos repararlo antes de guardar tus fotos."
    : "No pude abrir tu identidad visual. Reintenta antes de subir nuevas fotos.";
  return NextResponse.json({ error: message }, { status: 503, headers });
}
export async function GET() {
  try {
    const session = await requireUser();
    return NextResponse.json({ assets: await listIdentityAssets(session.clerkId) }, { headers });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const body = await request.json();
    if (body?.action === "prepare") {
      const prepared = await ensureTenantForUser(session);
      if (prepared.status !== "ready") throw new TenantNotReadyError(session.clerkId);
      return NextResponse.json({ assets: await listIdentityAssets(session.clerkId) }, { headers });
    }
    if (body?.consent !== true) return NextResponse.json({ error: "Se requiere consentimiento explícito." }, { status: 400 });
    if (typeof body.url !== "string" || typeof body.pose !== "string" || !POSES.has(body.pose)) return NextResponse.json({ error: "Captura no válida." }, { status: 400 });
    let url: URL;
    try { url = new URL(body.url); } catch { return NextResponse.json({ error: "Archivo inválido." }, { status: 400 }); }
    if (url.protocol !== "https:" || !/^[a-z0-9]+\.public\.blob\.vercel-storage\.com$/i.test(url.hostname) ||
        !url.pathname.startsWith(`/eternime/${session.sub}/file/`) || url.username || url.password) {
      return NextResponse.json({ error: "La captura debe ser un archivo subido desde tu cuenta." }, { status: 403 });
    }
    const blob = await head(url.toString());
    if (!blob.pathname.startsWith(`eternime/${session.sub}/file/`) ||
        !blob.contentType.startsWith(body.pose === "motion" ? "video/" : "image/")) {
      return NextResponse.json({ error: "El archivo no corresponde a esta captura." }, { status: 400 });
    }
    const asset = await addIdentityAsset(session.clerkId, { pose: body.pose, url: blob.url, mime: blob.contentType });
    if (!asset) throw new Error("Identity write unavailable");
    return NextResponse.json({ asset }, { status: 201, headers });
  } catch (error) { return failure(error); }
}
export async function DELETE(request: Request) {
  try {
    const session = await requireUser();
    const id = new URL(request.url).searchParams.get("id");
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });
    const ok = await deleteIdentityAsset(session.clerkId, id);
    return NextResponse.json({ ok }, { status: ok ? 200 : 404, headers });
  } catch (error) { return failure(error); }
}
