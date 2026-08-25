import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Link de invitación: /r/CODIGO — sella cookie 90 días y manda al landing. */
export async function GET(request: Request) {
  const partes = new URL(request.url).pathname.split("/");
  const crudo = decodeURIComponent(partes[partes.length - 1] ?? "");
  const code = crudo.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
  const res = NextResponse.redirect(new URL("/", request.url));
  if (code.length >= 4) {
    res.cookies.set("eternime_ref", code, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
  }
  return res;
}
