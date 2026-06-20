import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { listFiles } from "@/lib/data/files";
import type { FileKind } from "@/lib/data/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await requireUser();
    const kind = new URL(request.url).searchParams.get("kind") as FileKind | null;
    const files = await listFiles(session.sub, kind ?? undefined);
    return NextResponse.json({ files });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
