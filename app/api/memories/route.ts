import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { listMemories, createMemory } from "@/lib/data/memories";
import type { MemoryKind } from "@/lib/data/types";

export const runtime = "nodejs";

const KINDS: MemoryKind[] = ["texto", "carta", "voz", "foto", "video"];

export async function GET() {
  try {
    const session = await requireUser();
    const memories = await listMemories(session.sub);
    return NextResponse.json({ memories });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const body = (await request.json()) as {
      title?: string;
      content?: string | null;
      kind?: string;
      mediaUrl?: string | null;
      emotionalTone?: string | null;
    };

    const title = (body.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
    }
    const kind = KINDS.includes(body.kind as MemoryKind) ? (body.kind as MemoryKind) : "texto";

    const memory = await createMemory({
      userId: session.sub,
      title,
      content: body.content?.trim() || null,
      kind,
      mediaUrl: body.mediaUrl ?? null,
      emotionalTone: body.emotionalTone?.trim() || null,
    });
    if (!memory) {
      return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 });
    }
    return NextResponse.json({ memory }, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
