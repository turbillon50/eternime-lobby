import { NextResponse } from "next/server";

import { AuthError, requireUser } from "@/lib/auth";
import { isIntegrationSlug } from "@/lib/integrations/catalog";
import { createIntegrationSession, integrationCallbackUrl } from "@/lib/integrations/composio";

type Context = { params: Promise<{ toolkit: string }> };

function isTrustedConnectUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === "connect.composio.dev" || url.hostname.endsWith(".composio.dev"));
  } catch {
    return false;
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const user = await requireUser();
    const { toolkit } = await context.params;
    if (!isIntegrationSlug(toolkit)) {
      return NextResponse.json({ error: "Integración no permitida." }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as { source?: string };
    const source = body.source === "onboarding" ? "onboarding" : "profile";
    const session = await createIntegrationSession(user.clerkId, toolkit);
    const connection = await session.authorize(toolkit, {
      callbackUrl: integrationCallbackUrl(request.url, source),
    });

    if (!connection.redirectUrl || !isTrustedConnectUrl(connection.redirectUrl)) {
      return NextResponse.json({ error: "Composio no devolvió una conexión segura." }, { status: 502 });
    }

    return NextResponse.json(
      { redirectUrl: connection.redirectUrl },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Error && error.message === "COMPOSIO_NOT_CONFIGURED") {
      return NextResponse.json({ error: "Las conexiones todavía no están activadas." }, { status: 503 });
    }
    return NextResponse.json({ error: "No fue posible iniciar la conexión." }, { status: 502 });
  }
}
