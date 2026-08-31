import { NextResponse } from "next/server";

import { AuthError, requireUser } from "@/lib/auth";
import { searchMemories } from "@/lib/ai/rag";

export const runtime = "nodejs";

/** Compatibilidad del prototipo antiguo, sin aceptar memorias ni ownerId del cliente. */
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json() as { query?: unknown };
    const query = typeof body.query === "string" ? body.query.trim().slice(0, 1000) : "";
    if (!query) return NextResponse.json({ results: [], connected: true });
    const memories = await searchMemories(user.sub, query, 6);
    return NextResponse.json({
      results: memories.map((memory) => ({ memory, score: memory.score })),
      connected: true,
    });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "No se pudo buscar en la memoria." }, { status: 500 });
  }
}
