/**
 * API admin de cola de entrega de cartas.
 * GET   /api/admin/letters?days=30  — cartas con deliver_on próximas
 * PATCH /api/admin/letters { id, status } — p.ej. marcar como entregada
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { getDeliveryQueue, adminSetLetterStatus } from "@/lib/data/admin";
import type { LetterStatus } from "@/lib/data/types";

export const dynamic = "force-dynamic";

const VALID_STATUS: LetterStatus[] = ["draft", "scheduled", "delivered"];

function handleError(err: unknown): NextResponse {
  if (err instanceof AuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error("[api/admin/letters]", err);
  return NextResponse.json({ error: "Error interno" }, { status: 500 });
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const days = Math.min(365, Math.max(1, Number(req.nextUrl.searchParams.get("days") ?? "30") || 30));
    const letters = await getDeliveryQueue(days);
    return NextResponse.json({ letters, days });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const body = (await req.json()) as { id?: string; status?: string };
    if (!body.id || !VALID_STATUS.includes(body.status as LetterStatus)) {
      return NextResponse.json(
        { error: "Falta id o status válido ('draft'|'scheduled'|'delivered')" },
        { status: 400 },
      );
    }
    const letter = await adminSetLetterStatus(body.id, body.status as LetterStatus);
    if (!letter) {
      return NextResponse.json({ error: "Carta no encontrada o DB no disponible" }, { status: 404 });
    }
    return NextResponse.json({ letter });
  } catch (err) {
    return handleError(err);
  }
}
