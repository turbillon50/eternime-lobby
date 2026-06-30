import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { requireUser, AuthError } from "@/lib/auth";
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

    // Nota: con Clerk no hace falta refrescar ninguna cookie de sesion al
    // cambiar el nombre — getSession() siempre lee el nombre fresco de
    // eternime_users en cada request, no hay claim cacheado que actualizar.
    return NextResponse.json({ user });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await requireUser();
    const { userId: clerkId } = await auth();

    const ok = await deleteUser(session.sub);
    if (!ok) return NextResponse.json({ error: "No se pudo eliminar la cuenta" }, { status: 503 });

    // Borra tambien la identidad de Clerk para que "eliminar cuenta" sea
    // real de verdad (no solo los datos locales) — si esto falla, los datos
    // de Eternime ya quedaron borrados; se loguea el error pero no se le
    // pide al usuario que reintente algo que ya logro su objetivo principal.
    if (clerkId) {
      try {
        const client = await clerkClient();
        await client.users.deleteUser(clerkId);
      } catch (e) {
        console.error("[profile DELETE] no se pudo borrar el usuario de Clerk:", e);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
