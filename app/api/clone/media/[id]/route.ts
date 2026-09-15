import { requireUser } from "@/lib/auth";
import { readMedia } from "@/lib/clone/media-store";
import { cloneErrorResponse, PRIVATE_HEADERS, UUID } from "@/lib/clone/http";
import { CloneError } from "@/lib/clone/errors";
export const runtime = "nodejs";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireUser(); const { id } = await context.params;
    if (!UUID.test(id)) throw new CloneError("MEDIA_NOT_FOUND", "Archivo no encontrado.", 404);
    const media = await readMedia(session.clerkId, id);
    if (!media) throw new CloneError("MEDIA_NOT_FOUND", "Archivo no encontrado.", 404);
    const headers = { ...PRIVATE_HEADERS, "Content-Type": media.mime, "X-Content-Type-Options": "nosniff", "Accept-Ranges": "bytes", "Content-Security-Policy": "default-src 'none'" };
    let start = 0; let end = media.bytes.length - 1; const range = request.headers.get("range");
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || (!match[1] && !match[2])) return new Response(null, { status: 416, headers: { ...headers, "Content-Range": `bytes */${media.bytes.length}` } });
      if (!match[1]) start = Math.max(0, media.bytes.length - Number(match[2]));
      else { start = Number(match[1]); if (match[2]) end = Math.min(end, Number(match[2])); }
      if (start > end || start >= media.bytes.length) return new Response(null, { status: 416, headers: { ...headers, "Content-Range": `bytes */${media.bytes.length}` } });
    }
    let offset = start;
    const stream = new ReadableStream({ pull(controller) {
      if (offset > end) { controller.close(); return; }
      const next = Math.min(offset + 64 * 1024, end + 1); controller.enqueue(new Uint8Array(media.bytes.subarray(offset, next))); offset = next;
    } });
    return new Response(stream, { status: range ? 206 : 200, headers: { ...headers, ...(range ? { "Content-Range": `bytes ${start}-${end}/${media.bytes.length}` } : {}) } });
  } catch (e) { return cloneErrorResponse(e); }
}
