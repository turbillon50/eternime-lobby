/**
 * Middleware Eternime — auth propia (JWT en cookie `eternime_session`,
 * verificada con jose en edge runtime): protege `/app/*` y `/admin/*`.
 * Admin exige role='admin'. Punto único de sesión.
 *
 * NOTA: el gate legado de Clerk sobre /home, /onboarding, /conversar, etc.
 * se retiró porque la app migró por completo a la sesión JWT propia. Mantener
 * el gate de Clerk dejaba esas rutas en _not-found para usuarios JWT (404).
 * ClerkProvider sigue montado en el layout solo para el webhook/legado.
 */
import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "eternime_session";

function jwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET no configurado. No se permite fallback a un secreto por defecto en produccion."
    );
  }
  return new TextEncoder().encode(secret);
}

async function verifyEternimeSession(req: NextRequest): Promise<{ role: string } | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, jwtSecret());
    if (!payload.sub) return null;
    return { role: payload.role === "admin" ? "admin" : "user" };
  } catch {
    return null;
  }
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApp = pathname === "/app" || pathname.startsWith("/app/");
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  if (!isApp && !isAdmin) return NextResponse.next();

  const session = await verifyEternimeSession(req);
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = "";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (isAdmin && session.role !== "admin") {
    const url = req.nextUrl.clone();
    url.pathname = "/app";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|mp4)).*)",
    "/(api|trpc)(.*)",
  ],
};
