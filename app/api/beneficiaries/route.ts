import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { listBeneficiaries, createBeneficiary } from "@/lib/data/beneficiaries";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireUser();
    const beneficiaries = await listBeneficiaries(session.sub);
    return NextResponse.json({ beneficiaries });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const body = (await request.json()) as {
      name?: string; email?: string | null; relationship?: string | null;
      isPrimary?: boolean; deliveryCondition?: string | null;
    };
    const name = (body.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    const beneficiary = await createBeneficiary({
      userId: session.sub, name,
      email: body.email?.trim() || null,
      relationship: body.relationship?.trim() || null,
      isPrimary: Boolean(body.isPrimary),
      deliveryCondition: body.deliveryCondition?.trim() || null,
    });
    if (!beneficiary) return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 });
    return NextResponse.json({ beneficiary }, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
