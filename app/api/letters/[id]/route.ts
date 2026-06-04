import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { updateLetter, deleteLetter } from "@/lib/data/letters";
import type { LetterStatus } from "@/lib/data/types";

export const runtime = "nodejs";

const STATUSES: LetterStatus[] = ["draft", "scheduled", "delivered"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireUser();
    const { id } = await params;
    const body = (await request.json()) as {
      recipientName?: string;
      recipientEmail?: string | null;
      title?: string;
      body?: string;
      deliverOn?: string | null;
      status?: string;
    };

    const letter = await updateLetter(id, session.sub, {
      recipientName: body.recipientName?.trim() || undefined,
      recipientEmail: body.recipientEmail,
      title: body.title?.trim() || undefined,
      body: body.body?.trim() || undefined,
      deliverOn: body.deliverOn,
      status: STATUSES.includes(body.status as LetterStatus)
        ? (body.status as LetterStatus)
        : undefined,
    });
    if (!letter) {
      return NextResponse.json({ error: "Carta no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ letter });
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
    const ok = await deleteLetter(id, session.sub);
    if (!ok) {
      return NextResponse.json({ error: "Carta no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
