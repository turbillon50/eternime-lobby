import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { exchangeFacebookCode, getFacebookProfile } from "@/lib/social/facebook";
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
    // El usuario cancelo el dialogo de Meta — no es un error nuestro.
    destino.searchParams.set("social_error", "cancelado");
    return NextResponse.redirect(destino);
  }

  const session = await getSession();
  if (!session) {
    destino.pathname = "/sign-in";
    return NextResponse.redirect(destino);
  }

  const stateOk = await verifyOauthState("facebook", state);
  if (!stateOk || !code) {
    destino.searchParams.set("social_error", "estado_invalido");
    return NextResponse.redirect(destino);
  }

  try {
    const redirectUri = new URL("/api/social/facebook/callback", url.origin).toString();
    const { accessToken, expiresIn } = await exchangeFacebookCode(code, redirectUri);
    const profile = await getFacebookProfile(accessToken);

    await saveSocialConnection({
      userId: session.sub,
      provider: "facebook",
      providerUserId: profile.id,
      providerUserName: profile.name,
      accessToken,
      expiresInSeconds: expiresIn,
    });

    destino.searchParams.set("social_connected", "facebook");
    return NextResponse.redirect(destino);
  } catch (e) {
    console.error("[facebook callback]", e);
    destino.searchParams.set("social_error", "conexion_fallida");
    return NextResponse.redirect(destino);
  }
}
