import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { downloadVideo, heygen } from "@/lib/clone/heygen";
import { getJob, publicJob, storeMedia, updateJob } from "@/lib/clone/media-store";
import { sameOrigin } from "@/lib/clone/guard";
import { cloneErrorResponse, PRIVATE_HEADERS, UUID } from "@/lib/clone/http";
import { CloneError } from "@/lib/clone/errors";
import { getCloneSql } from "@/lib/db/clone";
export const runtime = "nodejs";
export const maxDuration = 120;
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireUser(); sameOrigin(request); const { id } = await context.params;
    if (!UUID.test(id)) throw new CloneError("JOB_NOT_FOUND", "Video no encontrado.", 404);
    const job = await getJob(session.clerkId, id);
    if (!job || job.kind !== "avatar") throw new CloneError("JOB_NOT_FOUND", "Video no encontrado.", 404);
    if (["completed", "failed"].includes(job.status)) return NextResponse.json({ job: publicJob(job) }, { headers: PRIVATE_HEADERS });
    // Cross-device polling lease: no concurrent downloads or provider calls for the same job.
    const sql = await getCloneSql(session.clerkId);
    const locked = await sql`UPDATE clone_media_jobs SET poll_after=now()+interval '120 seconds' WHERE id=${id}::uuid AND (poll_after IS NULL OR poll_after<now()) RETURNING id`;
    if (!locked.length) return NextResponse.json({ job: publicJob(job) }, { headers: PRIVATE_HEADERS });
    try {
    let providerId = job.provider_id;
    if (!providerId && job.payload && ["submitting", "uncertain"].includes(job.status)) {
      // HeyGen retains idempotency keys for 24h. Stop before expiry, never issue a fresh key.
      if (Date.now() - new Date(job.created_at).getTime() > 23 * 3600_000) throw new CloneError("RECONCILE_REQUIRED", "Esta solicitud necesita revisión en HeyGen antes de volver a generarse.", 409);
      const result = await heygen("videos", { method: "POST", headers: { "Content-Type": "application/json" }, body: job.payload }, job.id);
      if (typeof result.video_id !== "string" || !result.video_id) throw new CloneError("PROVIDER_RESPONSE", "HeyGen aún no confirmó el video.", 502);
      providerId = result.video_id;
      await updateJob(session.clerkId, id, { status: "processing", providerId: providerId! });
    }
    if (!providerId) return NextResponse.json({ job: publicJob(job) }, { headers: PRIVATE_HEADERS });
    const result = await heygen(`videos/${encodeURIComponent(providerId)}`);
    if (result.status === "failed") {
      await updateJob(session.clerkId, id, { status: "failed", error: "HeyGen no pudo generar este video. Conservamos el registro para revisar el resultado y el cargo." });
    } else if (result.status === "completed") {
      const bytes = await downloadVideo(result.video_url);
      const resultId = await storeMedia(session.clerkId, "video", bytes, "video/mp4");
      await updateJob(session.clerkId, id, { status: "completed", resultId });
    } else if (!["pending", "waiting", "processing", "generating"].includes(result.status)) {
      throw new CloneError("PROVIDER_RESPONSE", "HeyGen devolvió un estado que todavía no reconocemos. Puedes consultar de nuevo.", 502);
    }
    return NextResponse.json({ job: publicJob((await getJob(session.clerkId, id))!) }, { headers: PRIVATE_HEADERS });
    } finally { await sql`UPDATE clone_media_jobs SET poll_after=now()+interval '8 seconds' WHERE id=${id}::uuid`; }
  } catch (e) { return cloneErrorResponse(e); }
}
