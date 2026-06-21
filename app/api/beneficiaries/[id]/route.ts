import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { updateBeneficiary, deleteBeneficiary } from "@/lib/data/beneficiaries";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireUser();
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const patch: Parameters<typeof updateBeneficiary>[2] = {};
    if (typeof body.name === "string") patch.name = body.name.trim();
    if ("email" in body) patch.email = body.email ? String(body.email).trim() : null;
    if ("relationship" in body) patch.relationship = body.relationship ? String(body.relationship) : null;
    if ("isPrimary" in body) patch.isPrimary = Boolean(body.isPrimary);
    if ("deliveryCondition" in body) patch.deliveryCondition = body.deliveryCondition ? String(body.deliveryCondition) : null;
    const b = await updateBeneficiary(id, session.sub, patch);
    if (!b) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ beneficiary: b });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireUser();
    const { id } = await params;
    const ok = await deleteBeneficiary(id, session.sub);
    if (!ok) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
