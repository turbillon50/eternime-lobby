import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { requireUser, AuthError } from "@/lib/auth";
import { listFiles, deleteFile } from "@/lib/data/files";

export const runtime = "nodejs";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireUser();
    const { id } = await params;
    const mine = (await listFiles(session.sub)).find((f) => f.id === id);
    const ok = await deleteFile(id, session.sub);
    if (!ok) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    if (mine?.url && process.env.BLOB_READ_WRITE_TOKEN) {
      try { await del(mine.url, { token: process.env.BLOB_READ_WRITE_TOKEN }); } catch {}
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
