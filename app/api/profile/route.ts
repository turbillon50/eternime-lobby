import { NextResponse } from "next/server";
import { requireUser, AuthError, clearSessionCookie, signSession, setSessionCookie } from "@/lib/auth";
import { updateUserProfile, deleteUser, findUserById, type ProfilePatch } from "@/lib/data/users";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireUser();
    const user = await findUserById(session.sub);
    return NextResponse.json({
      user: user ?? { id: session.sub, email: session.email, name: session.name, role: session.role },
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

const STRING_FIELDS = [
  "tagline", "bio", "birthdate", "birthplace", "location", "phone", "occupation",
  "avatar_url", "cover_url", "locale",
] as const;

export async function PATCH(request: Request) {
  try {
    const session = await requireUser();
    const body = (await request.json()) as Record<string, unknown>;

    const patch: ProfilePatch = {};
    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (!name) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
      patch.name = name;
    }
    for (const f of STRING_FIELDS) {
      if (f in body) {
        const v = body[f];
        (patch as Record<string, unknown>)[f] = v === null || v === "" ? null : String(v);
      }
    }
    if ("socials" in body && body.socials && typeof body.socials === "object") {
      patch.socials = body.socials as Record<string, string>;
    }
    if ("prefs" in body && body.prefs && typeof body.prefs === "object") {
      patch.prefs = body.prefs as Record<string, unknown>;
    }

    const user = await updateUserProfile(session.sub, patch);
    if (!user) return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 });

    if (patch.name) {
      const token = await signSession({ sub: user.id, email: user.email, name: user.name, role: user.role });
      await setSessionCookie(token);
    }
    return NextResponse.json({ user });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await requireUser();
    const ok = await deleteUser(session.sub);
    if (!ok) return NextResponse.json({ error: "No se pudo eliminar la cuenta" }, { status: 503 });
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
