/**
 * Tenant + auth middleware.
 *
 * When Clerk is configured (production), private app routes require an
 * authenticated session. When keys are absent (local/demo), the middleware is a
 * pass-through so the cinematic lobby keeps working in demo mode.
 *
 * The Clerk webhook (`/api/webhooks/clerk`) is intentionally NOT matched here —
 * it authenticates itself via Svix signature, not a user session.
 */
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

// Authenticated application surface (everything past the public lobby).
const isProtectedRoute = createRouteMatcher([
  "/home(.*)",
  "/onboarding(.*)",
  "/conversar(.*)",
  "/memorias(.*)",
  "/timeline(.*)",
  "/relaciones(.*)",
  "/documentos(.*)",
  "/voz(.*)",
  "/reflexiones(.*)",
  "/perfil(.*)",
  "/mi-boveda(.*)",
]);

const enforced = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export default clerkConfigured ? enforced : () => NextResponse.next();

export const config = {
  matcher: [
    // Skip Next internals and static files unless referenced in search params.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|mp4)).*)",
    // Always run for API/TRPC routes.
    "/(api|trpc)(.*)",
  ],
};
