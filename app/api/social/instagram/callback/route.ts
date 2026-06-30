import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { exchangeInstagramCode, getInstagramProfile } from "@/lib/social/instagram";
import { verifyOauthState } from "@/lib/social/oauth-state";
import { saveSocialConnection } from "@/lib/data/social";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  const destino = new URL("/app/recuerdos", url.origin);

  if (errorParam) {
    destino.searchParams.set("social_error", "cancelado");
    return NextResponse.redirect(destino);
  }

  const session = await getSession();
  if (!session) {
    destino.pathname = "/sign-in";
    return NextResponse.redirect(destino);
  }

  const stateOk = await verifyOauthState("instagram", state);
  if (!stateOk || !code) {
    destino.searchParams.set("social_error", "estado_invalido");
    return NextResponse.redirect(destino);
  }

  try {
    const redirectUri = new URL("/api/social/instagram/callback", url.origin).toString();
    const { accessToken, igUserId, expiresIn } = await exchangeInstagramCode(code, redirectUri);
    const profile = await getInstagramProfile(accessToken).catch(() => ({ id: igUserId, username: "" }));

    await saveSocialConnection({
      userId: session.sub,
      provider: "instagram",
      providerUserId: profile.id || igUserId,
      providerUserName: profile.username || null,
      accessToken,
      expiresInSeconds: expiresIn,
    });

    destino.searchParams.set("social_connected", "instagram");
    return NextResponse.redirect(destino);
  } catch (e) {
    console.error("[instagram callback]", e);
    destino.searchParams.set("social_error", "conexion_fallida");
    return NextResponse.redirect(destino);
  }
}
