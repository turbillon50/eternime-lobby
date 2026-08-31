import { NextResponse } from "next/server";

import { AuthError, requireUser } from "@/lib/auth";
import { createMemory } from "@/lib/data/memories";
import { storeMemoryEmbedding } from "@/lib/ai/rag";

export const runtime = "nodejs";

/** Compatibilidad del prototipo antiguo, ahora sobre la memoria canónica. */
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json() as { text?: unknown; title?: unknown };
    const text = typeof body.text === "string" ? body.text.trim().slice(0, 8000) : "";
    if (text.length < 8) return NextResponse.json({ error: "La memoria es demasiado corta." }, { status: 400 });
    const requestedTitle = typeof body.title === "string" ? body.title.trim().slice(0, 160) : "";
    const title = requestedTitle || (text.length > 64 ? `${text.slice(0, 61)}…` : text);
    const memory = await createMemory({ userId: user.sub, title, content: text, kind: "texto", source: "manual" });
    if (!memory) return NextResponse.json({ error: "Base de datos no disponible." }, { status: 503 });
    const embedded = await storeMemoryEmbedding(memory.id, user.sub, `${title}. ${text}`);
    return NextResponse.json({ memory, connected: embedded }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "No se pudo guardar la memoria." }, { status: 500 });
  }
}
