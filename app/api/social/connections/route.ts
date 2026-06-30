import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { listSocialConnections, deleteSocialConnection } from "@/lib/data/social";
import { isFacebookConfigured } from "@/lib/social/facebook";
import { isInstagramConfigured } from "@/lib/social/instagram";
import type { SocialProvider } from "@/lib/data/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireUser();
    const connections = await listSocialConnections(session.sub);
    return NextResponse.json({
      connections,
      available: { facebook: isFacebookConfigured(), instagram: isInstagramConfigured() },
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireUser();
    const provider = new URL(request.url).searchParams.get("provider") as SocialProvider | null;
    if (provider !== "facebook" && provider !== "instagram") {
      return NextResponse.json({ error: "Proveedor invalido" }, { status: 400 });
    }
    const ok = await deleteSocialConnection(session.sub, provider);
    return NextResponse.json({ ok });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
