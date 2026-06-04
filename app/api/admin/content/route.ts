/**
 * API admin de contenido (recuerdos + cartas).
 * GET    /api/admin/content?type=memories|letters&kind=&status=&limit=
 * DELETE /api/admin/content { type: "memory"|"letter", id }
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import {
  getContentCounts,
  listAdminMemories,
  listAdminLetters,
  adminDeleteMemory,
  adminDeleteLetter,
} from "@/lib/data/admin";

export const dynamic = "force-dynamic";

function handleError(err: unknown): NextResponse {
  if (err instanceof AuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error("[api/admin/content]", err);
  return NextResponse.json({ error: "Error interno" }, { status: 500 });
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const params = req.nextUrl.searchParams;
    const type = params.get("type") ?? "all";
    const limit = Number(params.get("limit") ?? "20") || 20;

    if (type === "memories") {
      const memories = await listAdminMemories({ kind: params.get("kind") ?? "", limit });
      return NextResponse.json({ memories });
    }
    if (type === "letters") {
      const letters = await listAdminLetters({ status: params.get("status") ?? "", limit });
      return NextResponse.json({ letters });
    }
    const [counts, memories, letters] = await Promise.all([
      getContentCounts(),
      listAdminMemories({ limit }),
      listAdminLetters({ limit }),
    ]);
    return NextResponse.json({ counts, memories, letters });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();
    const body = (await req.json()) as { type?: string; id?: string };
    if (!body.id || (body.type !== "memory" && body.type !== "letter")) {
      return NextResponse.json({ error: "Falta id o type ('memory'|'letter')" }, { status: 400 });
    }
    const ok = body.type === "memory" ? await adminDeleteMemory(body.id) : await adminDeleteLetter(body.id);
    if (!ok) {
      return NextResponse.json({ error: "No encontrado o DB no disponible" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
