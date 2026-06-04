/**
 * API admin de usuarios.
 * GET    /api/admin/users?search=&page=     — lista paginada
 * PATCH  /api/admin/users  { id?|email?, role } — promover/degradar
 * DELETE /api/admin/users  { id }           — eliminar usuario + contenido
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import {
  listAdminUsers,
  setUserRole,
  setUserRoleByEmail,
  deleteUserCascade,
} from "@/lib/data/admin";

export const dynamic = "force-dynamic";

function handleError(err: unknown): NextResponse {
  if (err instanceof AuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error("[api/admin/users]", err);
  return NextResponse.json({ error: "Error interno" }, { status: 500 });
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const params = req.nextUrl.searchParams;
    const search = params.get("search") ?? "";
    const page = Number(params.get("page") ?? "1") || 1;
    const { users, total } = await listAdminUsers({ search, page, pageSize: 12 });
    return NextResponse.json({ users, total, page, pageSize: 12 });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = (await req.json()) as { id?: string; email?: string; role?: string };
    const role = body.role === "admin" ? "admin" : body.role === "user" ? "user" : null;
    if (!role) {
      return NextResponse.json({ error: "role debe ser 'user' o 'admin'" }, { status: 400 });
    }
    if (!body.id && !body.email) {
      return NextResponse.json({ error: "Falta id o email" }, { status: 400 });
    }
    // Evita que el admin se degrade a sí mismo y se quede fuera del panel.
    if (role === "user" && body.id === session.sub) {
      return NextResponse.json({ error: "No puedes quitarte tu propio rol admin" }, { status: 400 });
    }
    const user = body.id
      ? await setUserRole(body.id, role)
      : await setUserRoleByEmail(body.email as string, role);
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado o DB no disponible" }, { status: 404 });
    }
    return NextResponse.json({ user });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = (await req.json()) as { id?: string };
    if (!body.id) {
      return NextResponse.json({ error: "Falta id" }, { status: 400 });
    }
    if (body.id === session.sub) {
      return NextResponse.json({ error: "No puedes eliminar tu propia cuenta desde aquí" }, { status: 400 });
    }
    const ok = await deleteUserCascade(body.id);
    if (!ok) {
      return NextResponse.json({ error: "Usuario no encontrado o DB no disponible" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
