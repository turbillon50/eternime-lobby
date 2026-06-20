import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { listMemories, createMemory } from "@/lib/data/memories";
import { storeMemoryEmbedding } from "@/lib/ai/rag";
import { describeImage } from "@/lib/ai/gemini";
import { getSql } from "@/lib/db";
import type { MemoryKind } from "@/lib/data/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const KINDS: MemoryKind[] = ["texto", "carta", "voz", "foto", "video"];

export async function GET() {
  try {
    const session = await requireUser();
    const memories = await listMemories(session.sub);
    return NextResponse.json({ memories });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
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
      mediaUrls?: string[] | null;
      emotionalTone?: string | null;
    };

    const title = (body.title ?? "").trim();
    if (!title) return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });

    const photos = Array.isArray(body.mediaUrls) ? body.mediaUrls.filter(Boolean).slice(0, 12) : [];
    const kind = KINDS.includes(body.kind as MemoryKind)
      ? (body.kind as MemoryKind)
      : photos.length
        ? "foto"
        : "texto";

    // Visión: describe hasta 2 fotos para que Eon "vea" y aprenda de ellas.
    let aiContext: string | null = null;
    if (photos.length) {
      const descs = await Promise.all(photos.slice(0, 2).map((u) => describeImage(u).catch(() => null)));
      const joined = descs.filter(Boolean).join(" ");
      aiContext = joined || null;
    }

    const memory = await createMemory({
      userId: session.sub,
      title,
      content: body.content?.trim() || null,
      kind,
      mediaUrls: photos,
      aiContext,
      emotionalTone: body.emotionalTone?.trim() || null,
    });
    if (!memory) return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 });

    // Aprendizaje: incrusta el recuerdo (título + contenido + visión) para el RAG de Eon.
    const embedText = [title, body.content ?? "", aiContext ?? ""].filter(Boolean).join(". ");
    await storeMemoryEmbedding(memory.id, session.sub, embedText);

    return NextResponse.json({ memory }, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("[memories POST]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
