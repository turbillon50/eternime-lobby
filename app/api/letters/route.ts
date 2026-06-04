import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { listLetters, createLetter, updateLetterStatus } from "@/lib/data/letters";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireUser();
    const letters = await listLetters(session.sub);
    return NextResponse.json({ letters });
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
      recipientName?: string;
      recipientEmail?: string | null;
      title?: string;
      body?: string;
      deliverOn?: string | null;
      status?: string;
    };

    const recipientName = (body.recipientName ?? "").trim();
    const title = (body.title ?? "").trim();
    const letterBody = (body.body ?? "").trim();
    if (!recipientName || !title || !letterBody) {
      return NextResponse.json(
        { error: "Destinatario, título y cuerpo son obligatorios" },
        { status: 400 },
      );
    }

    let letter = await createLetter({
      userId: session.sub,
      recipientName,
      recipientEmail: body.recipientEmail?.trim() || null,
      title,
      body: letterBody,
      deliverOn: body.deliverOn || null,
    });
    if (!letter) {
      return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 });
    }
    if (body.status === "scheduled" && body.deliverOn) {
      letter = (await updateLetterStatus(letter.id, session.sub, "scheduled")) ?? letter;
    }
    return NextResponse.json({ letter }, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
