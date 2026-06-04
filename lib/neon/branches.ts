/**
 * Neon Branch API client.
 *
 * Each Eternime account gets its own Neon branch (a copy-on-write fork of the
 * parent), which becomes that user's isolated tenant database. We create the
 * branch with a read_write endpoint so it is immediately connectable.
 *
 * Docs: https://api-docs.neon.tech/reference/createprojectbranch
 */
import "server-only";

const NEON_API_BASE = "https://console.neon.tech/api/v2";

interface NeonConnectionUri {
  connection_uri: string;
  connection_parameters?: {
    host?: string;
    pooler_host?: string;
    database?: string;
    role?: string;
    password?: string;
  };
}

interface CreateBranchResponse {
  branch: { id: string; name: string; parent_id?: string };
  connection_uris?: NeonConnectionUri[];
}

export interface ProvisionedBranch {
  branchId: string;
  /** Direct (unpooled) connection string — use for migrations / DDL. */
  unpooledUrl: string;
  /** Pooled connection string — use for app request traffic. */
  pooledUrl: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

/**
 * Derive the pooled (PgBouncer) URL from the direct one by inserting the
 * `-pooler` suffix into the host, which is Neon's pooled host convention.
 * If a pooler host is provided explicitly we prefer that.
 */
function toPooledUrl(unpooledUrl: string, poolerHost?: string): string {
  try {
    const parsed = new URL(unpooledUrl);
    if (poolerHost) {
      parsed.host = poolerHost;
    } else if (!parsed.host.includes("-pooler.")) {
      parsed.host = parsed.host.replace(/^([^.]+)\./, "$1-pooler.");
    }
    // pgbouncer requires this flag for Neon serverless pooling.
    if (!parsed.searchParams.has("sslmode")) parsed.searchParams.set("sslmode", "require");
    parsed.searchParams.set("pgbouncer", "true");
    return parsed.toString();
  } catch {
    return unpooledUrl;
  }
}

/**
 * Create a new tenant branch for `clerkId` and return its connection strings.
 * Idempotency note: callers should guard against duplicate creation (e.g. the
 * Clerk webhook checks `users.tenantBranchId` first). Neon allows duplicate
 * branch names, so we do not rely on name uniqueness for idempotency.
 */
export async function createTenantBranch(clerkId: string): Promise<ProvisionedBranch> {
  const apiKey = requireEnv("NEON_API_KEY");
  const projectId = requireEnv("NEON_PROJECT_ID");

  const response = await fetch(`${NEON_API_BASE}/projects/${projectId}/branches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      branch: { name: `user_${clerkId}` },
      // Creating the endpoint here means the branch is immediately connectable
      // and the response includes ready-to-use connection URIs.
      endpoints: [{ type: "read_write" }],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Neon branch creation failed (${response.status}): ${detail}`);
  }

  const data = (await response.json()) as CreateBranchResponse;
  const branchId = data.branch?.id;
  const conn = data.connection_uris?.[0];
  if (!branchId || !conn?.connection_uri) {
    throw new Error("Neon response missing branch id or connection URI.");
  }

  return {
    branchId,
    unpooledUrl: conn.connection_uri,
    pooledUrl: toPooledUrl(conn.connection_uri, conn.connection_parameters?.pooler_host),
  };
}

/** Delete a tenant branch (used by cleanup-pending cron and hard-delete flow). */
export async function deleteTenantBranch(branchId: string): Promise<void> {
  const apiKey = requireEnv("NEON_API_KEY");
  const projectId = requireEnv("NEON_PROJECT_ID");
  const response = await fetch(
    `${NEON_API_BASE}/projects/${projectId}/branches/${branchId}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${apiKey}` } },
  );
  if (!response.ok && response.status !== 404) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Neon branch deletion failed (${response.status}): ${detail}`);
  }
}
