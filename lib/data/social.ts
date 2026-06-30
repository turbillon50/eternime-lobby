import { getSql } from "@/lib/db";
import { encryptSocialToken, decryptSocialToken } from "@/lib/crypto/social-tokens";
import type { SocialConnection, SocialProvider } from "./types";

export async function getSocialConnection(userId: string, provider: SocialProvider): Promise<SocialConnection | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql`
    SELECT id, user_id, provider, provider_user_id, provider_user_name, connected_at, last_synced_at, last_import_count
    FROM eternime_social_connections WHERE user_id = ${userId} AND provider = ${provider} LIMIT 1`;
  return (rows[0] as SocialConnection) ?? null;
}

export async function listSocialConnections(userId: string): Promise<SocialConnection[]> {
  const sql = getSql();
  if (!sql) return [];
  const rows = await sql`
    SELECT id, user_id, provider, provider_user_id, provider_user_name, connected_at, last_synced_at, last_import_count
    FROM eternime_social_connections WHERE user_id = ${userId} ORDER BY connected_at DESC`;
  return rows as SocialConnection[];
}

/** Guarda/actualiza la conexion. El token se cifra antes de tocar la DB — nunca viaja ni se loguea en claro. */
export async function saveSocialConnection(input: {
  userId: string;
  provider: SocialProvider;
  providerUserId: string;
  providerUserName?: string | null;
  accessToken: string;
  expiresInSeconds?: number | null;
}): Promise<SocialConnection | null> {
  const sql = getSql();
  if (!sql) return null;
  const encrypted = encryptSocialToken(input.accessToken, input.userId);
  const expiresAt = input.expiresInSeconds ? new Date(Date.now() + input.expiresInSeconds * 1000).toISOString() : null;

  const rows = await sql`
    INSERT INTO eternime_social_connections (user_id, provider, provider_user_id, provider_user_name, access_token_encrypted, token_expires_at)
    VALUES (${input.userId}, ${input.provider}, ${input.providerUserId}, ${input.providerUserName ?? null}, ${encrypted}, ${expiresAt})
    ON CONFLICT (user_id, provider) DO UPDATE SET
      provider_user_id = EXCLUDED.provider_user_id,
      provider_user_name = EXCLUDED.provider_user_name,
      access_token_encrypted = EXCLUDED.access_token_encrypted,
      token_expires_at = EXCLUDED.token_expires_at,
      connected_at = now()
    RETURNING id, user_id, provider, provider_user_id, provider_user_name, connected_at, last_synced_at, last_import_count`;
  return (rows[0] as SocialConnection) ?? null;
}

/** Token en claro, SOLO para uso server-side inmediato (llamar a la Graph API). Nunca se devuelve al cliente. */
export async function getDecryptedAccessToken(userId: string, provider: SocialProvider): Promise<string | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql`SELECT access_token_encrypted FROM eternime_social_connections WHERE user_id = ${userId} AND provider = ${provider} LIMIT 1`;
  const encrypted = rows[0]?.access_token_encrypted as string | undefined;
  if (!encrypted) return null;
  return decryptSocialToken(encrypted, userId);
}

export async function markSocialSynced(userId: string, provider: SocialProvider, importCount: number): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  await sql`UPDATE eternime_social_connections SET last_synced_at = now(), last_import_count = ${importCount} WHERE user_id = ${userId} AND provider = ${provider}`;
}

export async function deleteSocialConnection(userId: string, provider: SocialProvider): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  const rows = await sql`DELETE FROM eternime_social_connections WHERE user_id = ${userId} AND provider = ${provider} RETURNING id`;
  return rows.length > 0;
}
