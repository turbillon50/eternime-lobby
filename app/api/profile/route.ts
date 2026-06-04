import { NextResponse } from "next/server";
import { requireUser, AuthError, clearSessionCookie, signSession, setSessionCookie } from "@/lib/auth";
import { updateUserProfile, deleteUser, findUserById } from "@/lib/data/users";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireUser();
    const user = await findUserById(session.sub);
    return NextResponse.json({
      user: user ?? { id: session.sub, email: session.email, name: session.name, role: session.role },
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireUser();
    const body = (await request.json()) as { name?: string };
    const name = (body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }
    const user = await updateUserProfile(session.sub, { name });
    if (!user) {
      return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 });
    }
    // Refresca la cookie de sesión para que el nombre nuevo viva en el token.
    const token = await signSession({ sub: user.id, email: user.email, name: user.name, role: user.role });
    await setSessionCookie(token);
    return NextResponse.json({ user });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await requireUser();
    const ok = await deleteUser(session.sub);
    if (!ok) {
      return NextResponse.json({ error: "No se pudo eliminar la cuenta" }, { status: 503 });
    }
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
