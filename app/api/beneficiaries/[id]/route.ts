import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { updateBeneficiary, deleteBeneficiary } from "@/lib/data/beneficiaries";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireUser();
    const { id } = await params;
    const body = (await request.json()) as {
      name?: string;
      email?: string | null;
      relationship?: string | null;
    };

    const beneficiary = await updateBeneficiary(id, session.sub, {
      name: body.name?.trim() || undefined,
      email: body.email,
      relationship: body.relationship,
    });
    if (!beneficiary) {
      return NextResponse.json({ error: "Beneficiario no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ beneficiary });
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
    const ok = await deleteBeneficiary(id, session.sub);
    if (!ok) {
      return NextResponse.json({ error: "Beneficiario no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
