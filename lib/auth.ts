/**
 * Auth de Eternime — backend real: Clerk.
 *
 * PUNTO ÚNICO DE SESIÓN: todo el código de la app lee la sesión vía
 * getSession()/requireUser()/requireAdmin(). Esta es la única capa que sabe
 * que el proveedor es Clerk — el resto de la app (rutas, paginas, lib/data/*)
 * no cambia ni le importa.
 *
 * Identidad vs datos de la app: Clerk es la fuente de verdad de QUIEN es el
 * usuario (email, nombre, sesion). Los DATOS de Eternime (recuerdos, cartas,
 * herederos, role admin/user) siguen viviendo en eternime_users y se
 * relacionan con Clerk via la columna clerk_id. session.sub sigue siendo el
 * id LOCAL (eternime_users.id), no el id de Clerk — asi todas las foreign
 * keys existentes (memories.user_id, letters.user_id, etc.) siguen
 * funcionando sin tocar una sola tabla mas.
 */
import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { findUserByClerkId, upsertUserFromClerk } from "@/lib/data/users";
import type { EternimeUser } from "@/lib/data/types";

export type SessionPayload = {
  sub: string; // eternime_users.id (LOCAL, no el id de Clerk)
  email: string;
  name: string;
  role: "user" | "admin";
};

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Sesión actual, o null. Hace el lookup/auto-creacion de la fila local por
 * clerk_id. Si el webhook de Clerk aun no proceso el alta (carrera entre
 * signup y el webhook), se crea aqui mismo de forma idempotente para que el
 * usuario nunca se quede bloqueado esperando.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const { userId } = await auth();
  if (!userId) return null;

  let local = await findUserByClerkId(userId);
  if (!local) {
    const cu = await currentUser();
    if (!cu) return null;
    const email = cu.primaryEmailAddress?.emailAddress ?? cu.emailAddresses[0]?.emailAddress ?? "";
    const name = [cu.firstName, cu.lastName].filter(Boolean).join(" ").trim() || cu.username || email.split("@")[0] || "Sin nombre";
    local = await upsertUserFromClerk({ clerkId: userId, email, name });
    if (!local) return null;
  }

  return { sub: local.id, email: local.email, name: local.name, role: local.role };
}

/** Usuario completo de DB para la sesión actual, o null. */
export async function getSessionUser(): Promise<EternimeUser | null> {
  const session = await getSession();
  if (!session) return null;
  const { findUserById } = await import("@/lib/data/users");
  return findUserById(session.sub);
}

/** Lanza si no hay sesión — para Route Handlers protegidos. */
export async function requireUser(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new AuthError("No autenticado", 401);
  }
  return session;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireUser();
  if (session.role !== "admin") {
    throw new AuthError("Requiere rol admin", 403);
  }
  return session;
}
