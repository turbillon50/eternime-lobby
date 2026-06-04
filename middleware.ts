/**
 * Middleware Eternime — dos capas de protección:
 *
 * 1. Auth propia (JWT en cookie `eternime_session`, verificada con jose en
 *    edge runtime): protege `/app/*` y `/admin/*`. Admin exige role='admin'.
 *    Punto único de sesión → migrar a Clerk después solo toca este archivo
 *    y lib/auth.ts.
 *
 * 2. Clerk (legado): cuando hay keys configuradas, sigue protegiendo las
 *    rutas históricas (/home, /onboarding, …) para no romper flujos previos.
 *    El webhook `/api/webhooks/clerk` se autentica solo vía Svix.
 */
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "eternime_session";

const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

function jwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || "eternime-dev-secret-cámbiame-en-producción";
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

/** Capa 1: JWT propio para /app/* y /admin/*. Devuelve una respuesta o null (continuar). */
async function eternimeGuard(req: NextRequest): Promise<NextResponse | null> {
  const { pathname } = req.nextUrl;
  const isApp = pathname === "/app" || pathname.startsWith("/app/");
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  if (!isApp && !isAdmin) return null;

  const session = await verifyEternimeSession(req);
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/entrar";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (isAdmin && session.role !== "admin") {
    const url = req.nextUrl.clone();
    url.pathname = "/app";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return null;
}

// Capa 2: rutas legadas protegidas por Clerk cuando está configurado.
const isClerkProtectedRoute = createRouteMatcher([
  "/home(.*)",
  "/onboarding(.*)",
  "/conversar(.*)",
  "/memorias(.*)",
  "/timeline(.*)",
  "/relaciones(.*)",
  "/documentos(.*)",
  "/voz(.*)",
  "/reflexiones(.*)",
  "/mi-boveda(.*)",
]);

const withClerk = clerkMiddleware(async (auth, req) => {
  const guarded = await eternimeGuard(req as NextRequest);
  if (guarded) return guarded;
  if (isClerkProtectedRoute(req)) {
    await auth.protect();
  }
});

async function withoutClerk(req: NextRequest) {
  const guarded = await eternimeGuard(req);
  return guarded ?? NextResponse.next();
}

export default clerkConfigured ? withClerk : withoutClerk;

export const config = {
  matcher: [
    // Skip Next internals and static files unless referenced in search params.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|mp4)).*)",
    // Always run for API/TRPC routes.
    "/(api|trpc)(.*)",
  ],
};
