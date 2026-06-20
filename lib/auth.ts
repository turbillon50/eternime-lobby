/**
 * Auth propia de Eternime — email + password con bcryptjs y JWT (jose)
 * en cookie httpOnly `eternime_session`.
 *
 * PUNTO ÚNICO DE SESIÓN: todo el código de la app lee la sesión vía
 * getSession()/requireUser(). Para migrar a Clerk después, solo se
 * reimplementan estas funciones — el resto de la app no cambia.
 */
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { findUserByEmail, findUserById, createUser, countUsers } from "@/lib/data/users";
import type { EternimeUser } from "@/lib/data/types";

export const SESSION_COOKIE = "eternime_session";
const SESSION_DAYS = 30;

export type SessionPayload = {
  sub: string; // user id
  email: string;
  name: string;
  role: "user" | "admin";
};

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || "eternime-dev-secret-cámbiame-en-producción";
  return new TextEncoder().encode(secret);
}

// ── JWT ──────────────────────────────────────────────────────

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ email: payload.email, name: payload.name, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      role: payload.role === "admin" ? "admin" : "user",
    };
  } catch {
    return null;
  }
}

// ── Cookie helpers (server only) ─────────────────────────────

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

/** Sesión actual desde la cookie, o null. Seguro en Server Components y Route Handlers. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** Usuario completo de DB para la sesión actual, o null. */
export async function getSessionUser(): Promise<EternimeUser | null> {
  const session = await getSession();
  if (!session) return null;
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

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// ── Registro / Login ─────────────────────────────────────────

export async function registerUser(input: {
  email: string;
  password: string;
  name: string;
  inviteCode?: string;
}): Promise<{ user: EternimeUser; token: string } | { error: string; status: number }> {
  // Registro PRIVADO por defecto. Se reabre con REGISTRATION_OPEN=true o un
  // codigo de invitacion (REGISTRATION_INVITE_CODE). El primer usuario (DB vacia)
  // siempre puede registrarse para el bootstrap inicial.
  const open = process.env.REGISTRATION_OPEN === "true";
  const inviteOk = Boolean(
    process.env.REGISTRATION_INVITE_CODE &&
      input.inviteCode &&
      input.inviteCode === process.env.REGISTRATION_INVITE_CODE,
  );
  if (!open && !inviteOk) {
    const total = await countUsers();
    if (total > 0) {
      return {
        error: "Eternime esta en acceso privado por ahora. El registro abierto llegara pronto.",
        status: 403,
      };
    }
  }
  const email = input.email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "Correo inválido", status: 400 };
  }
  if (input.password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres", status: 400 };
  }
  if (!input.name.trim()) {
    return { error: "El nombre es obligatorio", status: 400 };
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return { error: "Ya existe una cuenta con ese correo", status: 409 };
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await createUser({ email, passwordHash, name: input.name.trim() });
  if (!user) {
    return { error: "Base de datos no disponible", status: 503 };
  }

  const token = await signSession({ sub: user.id, email: user.email, name: user.name, role: user.role });
  return { user, token };
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<{ user: EternimeUser; token: string } | { error: string; status: number }> {
  const record = await findUserByEmail(input.email.trim().toLowerCase());
  if (!record) {
    return { error: "Correo o contraseña incorrectos", status: 401 };
  }
  const ok = await bcrypt.compare(input.password, record.password_hash);
  if (!ok) {
    return { error: "Correo o contraseña incorrectos", status: 401 };
  }
  const { password_hash: _hash, ...user } = record;
  void _hash;
  const token = await signSession({ sub: user.id, email: user.email, name: user.name, role: user.role });
  return { user: user as EternimeUser, token };
}
