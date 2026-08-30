import "server-only";

import { Composio } from "@composio/core";

import { INTEGRATION_CATALOG, type IntegrationSlug } from "@/lib/integrations/catalog";

let cached: Composio | null = null;

export function isComposioConfigured(): boolean {
  return Boolean(process.env.COMPOSIO_API_KEY);
}

export function getComposio(): Composio {
  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) throw new Error("COMPOSIO_NOT_CONFIGURED");
  if (!cached) cached = new Composio({ apiKey });
  return cached;
}

export function composioUserId(clerkId: string): string {
  return `eternime:${clerkId}`;
}

export function integrationCallbackUrl(requestUrl: string, source: "onboarding" | "profile") {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL;
  const origin = configuredOrigin ? new URL(configuredOrigin).origin : new URL(requestUrl).origin;
  const callback = new URL("/app/integraciones", origin);
  callback.searchParams.set("source", source);
  return callback.toString();
}

export async function createIntegrationSession(clerkId: string, only?: IntegrationSlug) {
  const toolkits = only ? [only] : INTEGRATION_CATALOG.map((item) => item.slug);
  return getComposio().sessions.create(composioUserId(clerkId), {
    toolkits,
    manageConnections: false,
    multiAccount: {
      enable: true,
      maxAccountsPerToolkit: 3,
      requireExplicitSelection: true,
    },
    sandbox: { enable: false },
  });
}
