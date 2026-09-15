import "server-only";
import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth";
import { CloneError } from "@/lib/clone/errors";

export const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function cloneErrorResponse(error: unknown) {
  if (error instanceof AuthError || error instanceof CloneError) {
    return NextResponse.json({ error: error.message, code: error instanceof CloneError ? error.code : "AUTH_REQUIRED" }, { status: error.status, headers: PRIVATE_HEADERS });
  }
  if (error instanceof SyntaxError) return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  // Database/provider errors may contain personal content or connection strings.
  console.error("[clone] request failed", { type: error instanceof Error ? error.name : "unknown" });
  return NextResponse.json({ error: "No pude completar la acción con tu clon. Intenta de nuevo en unos momentos." }, { status: 503, headers: PRIVATE_HEADERS });
}
