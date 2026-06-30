import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { buildInstagramAuthUrl, isInstagramConfigured } from "@/lib/social/instagram";
import { createOauthState } from "@/lib/social/oauth-state";

export const runtime = "nodejs";

function redirectUri(req: Request): string {
  return new URL("/api/social/instagram/callback", req.url).toString();
}

export async function GET(request: Request) {
  try {
    await requireUser();
    if (!isInstagramConfigured()) {
      return NextResponse.json({ error: "Instagram no esta configurado todavia" }, { status: 503 });
    }
    const state = await createOauthState("instagram");
    const url = buildInstagramAuthUrl(redirectUri(request), state);
    return NextResponse.redirect(url);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
