import { NextResponse } from "next/server";

import { AuthError, requireUser } from "@/lib/auth";
import { isIntegrationSlug } from "@/lib/integrations/catalog";
import { createIntegrationSession, getComposio } from "@/lib/integrations/composio";

type Context = { params: Promise<{ toolkit: string }> };

export async function POST(_request: Request, context: Context) {
  try {
    const user = await requireUser();
    const { toolkit } = await context.params;
    if (!isIntegrationSlug(toolkit)) {
      return NextResponse.json({ error: "Integración no permitida." }, { status: 404 });
    }

    const session = await createIntegrationSession(user.clerkId, toolkit);
    const state = await session.toolkits({ toolkits: [toolkit] });
    const account = state.items.find((item) => item.slug === toolkit)?.connection?.connectedAccount;
    if (!account?.id) {
      return NextResponse.json({ error: "No hay una conexión activa para pausar." }, { status: 404 });
    }

    await getComposio().connectedAccounts.disable(account.id);
    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Error && error.message === "COMPOSIO_NOT_CONFIGURED") {
      return NextResponse.json({ error: "Las conexiones todavía no están activadas." }, { status: 503 });
    }
    return NextResponse.json({ error: "No fue posible pausar la conexión." }, { status: 502 });
  }
}
