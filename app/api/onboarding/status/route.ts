/**
 * DEPRECATED: legacy onboarding poll from el flujo Clerk + Neon-branch-per-tenant.
 * La app migro por completo a sesion JWT propia (ver lib/auth.ts). Esta ruta
 * ya no es invocada por ningun componente activo, pero se mantiene neutralizada
 * (sin tocar Clerk) por si algun cliente viejo en cache la sigue pidiendo.
 */
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ status: "ready", deprecated: true });
}
