import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { updateMemory, deleteMemory } from "@/lib/data/memories";
import type { MemoryKind } from "@/lib/data/types";

export const runtime = "nodejs";

const KINDS: MemoryKind[] = ["texto", "carta", "voz", "foto", "video"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireUser();
    const { id } = await params;
    const body = (await request.json()) as {
      title?: string;
      content?: string | null;
      kind?: string;
      mediaUrl?: string | null;
      emotionalTone?: string | null;
    };

    const memory = await updateMemory(id, session.sub, {
      title: body.title?.trim() || undefined,
      content: body.content,
      kind: KINDS.includes(body.kind as MemoryKind) ? (body.kind as MemoryKind) : undefined,
      mediaUrl: body.mediaUrl,
      emotionalTone: body.emotionalTone,
    });
    if (!memory) {
      return NextResponse.json({ error: "Recuerdo no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ memory });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireUser();
    const { id } = await params;
    const ok = await deleteMemory(id, session.sub);
    if (!ok) {
      return NextResponse.json({ error: "Recuerdo no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
