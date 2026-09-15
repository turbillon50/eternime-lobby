import { NextResponse } from "next/server";
import sharp from "sharp";
import { requireUser } from "@/lib/auth";
import { getCloneSql } from "@/lib/db/clone";
import { consumeAllowance, latestPortrait, storeMedia } from "@/lib/clone/media-store";
import { sameOrigin } from "@/lib/clone/guard";
import { cloneErrorResponse, PRIVATE_HEADERS } from "@/lib/clone/http";
import { CloneError } from "@/lib/clone/errors";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET() {
  try {
    const session = await requireUser(); const photo = await latestPortrait(session.clerkId);
    return NextResponse.json({ portrait: photo ? { id: photo.id, url: `/api/clone/media/${photo.id}`, createdAt: photo.created_at } : null }, { headers: PRIVATE_HEADERS });
  } catch (e) { return cloneErrorResponse(e); }
}
export async function POST(request: Request) {
  try {
    const session = await requireUser(); sameOrigin(request);
    if (Number(request.headers.get("content-length")) > 3_800_000) throw new CloneError("PHOTO_SIZE", "Usa una foto de hasta 3.5 MB.", 413);
    const form = await request.formData(); const file = form.get("file");
    if (form.get("consent") !== "true") throw new CloneError("CONSENT_REQUIRED", "Confirma que la foto es tuya y autoriza guardarla.", 400);
    if (!(file instanceof File) || !["image/jpeg", "image/png", "image/webp"].includes(file.type) || !file.size || file.size > 3_500_000) throw new CloneError("PHOTO_INVALID", "Usa una foto JPEG, PNG o WebP de hasta 3.5 MB.", 400);
    const image = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 25_000_000, animated: false });
    const meta = await image.metadata();
    if (!meta.width || !meta.height || Math.min(meta.width, meta.height) < 720) throw new CloneError("PHOTO_RESOLUTION", "La foto necesita al menos 720 píxeles en su lado más corto.", 400);
    await consumeAllowance(session.clerkId, "portrait", 10);
    // Re-encode to remove EXIF/location and normalize orientation; never publish to Blob.
    const bytes = await image.rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 88 }).toBuffer();
    const id = await storeMedia(session.clerkId, "portrait", bytes, "image/jpeg");
    const sql = await getCloneSql(session.clerkId);
    await sql`DELETE FROM clone_private_media WHERE kind='portrait' AND created_at<(SELECT created_at FROM clone_private_media WHERE id=${id}::uuid)`;
    return NextResponse.json({ portrait: { id, url: `/api/clone/media/${id}` } }, { status: 201, headers: PRIVATE_HEADERS });
  } catch (e) { return cloneErrorResponse(e); }
}
export async function DELETE(request: Request) {
  try {
    const session = await requireUser(); sameOrigin(request);
    const photo = await latestPortrait(session.clerkId);
    if (photo) { const sql = await getCloneSql(session.clerkId); await sql`DELETE FROM clone_private_media WHERE kind='portrait' AND id=${photo.id}::uuid`; }
    return NextResponse.json({ ok: true }, { headers: PRIVATE_HEADERS });
  } catch (e) { return cloneErrorResponse(e); }
}
