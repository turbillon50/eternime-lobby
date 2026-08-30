import { NextResponse } from "next/server";

import { AuthError, requireUser } from "@/lib/auth";
import { INTEGRATION_CATALOG } from "@/lib/integrations/catalog";
import { createIntegrationSession, isComposioConfigured } from "@/lib/integrations/composio";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    const disconnected = INTEGRATION_CATALOG.map((integration) => ({
      ...integration,
      active: false,
      status: "DISCONNECTED",
    }));

    if (!isComposioConfigured()) {
      return NextResponse.json(
        { available: false, integrations: disconnected },
        { headers: { "Cache-Control": "private, no-store, max-age=0" } },
      );
    }

    const session = await createIntegrationSession(user.clerkId);
    const state = await session.toolkits();
    const bySlug = new Map(state.items.map((item) => [item.slug, item]));
    const integrations = INTEGRATION_CATALOG.map((integration) => {
      const remote = bySlug.get(integration.slug);
      return {
        ...integration,
        active: remote?.connection?.isActive ?? false,
        status: remote?.connection?.connectedAccount?.status ?? "DISCONNECTED",
      };
    });

    return NextResponse.json(
      { available: true, integrations },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "No fue posible consultar tus integraciones." }, { status: 502 });
  }
}
