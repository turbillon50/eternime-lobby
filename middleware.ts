/**
 * Middleware Eternime — Clerk. Protege /app/* y /admin/* exigiendo sesion
 * activa; el chequeo fino de rol admin vive en app/admin/layout.tsx
 * (Server Component, puede consultar la DB local sin las limitaciones del
 * edge runtime) como defensa en profundidad ademas de requireAdmin() en
 * cada ruta /api/admin/*.
 */
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/app(.*)", "/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      const url = req.nextUrl.clone();
      url.pathname = "/sign-in";
      url.search = "";
      url.searchParams.set("redirect_url", req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|mp4)).*)",
    "/(api|trpc)(.*)",
  ],
};
