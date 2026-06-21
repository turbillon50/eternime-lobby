import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { listHeirMemoryIds, setHeirMemories } from "@/lib/data/beneficiaries";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireUser();
    const { id } = await params;
    const memoryIds = await listHeirMemoryIds(id, session.sub);
    return NextResponse.json({ memoryIds });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireUser();
    const { id } = await params;
    const body = (await request.json()) as { memoryIds?: string[] };
    await setHeirMemories(id, session.sub, Array.isArray(body.memoryIds) ? body.memoryIds : []);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
