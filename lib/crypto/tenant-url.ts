/**
 * AES-256-GCM encryption for tenant database connection strings.
 *
 * The tenant DB URL is the single most sensitive secret in the system: it
 * grants full read/write access to one person's entire vault. It is therefore
 * encrypted at rest in the control plane (`users.tenant_db_url_encrypted`) and
 * only ever decrypted inside server code, just-in-time, to open a connection.
 *
 * Key derivation (per spec): the 256-bit key is derived from
 * `CLERK_SECRET_KEY` (the master secret) salted with the per-user `clerkId`.
 * This means each user's URL is encrypted under a distinct key, so a leak of a
 * single ciphertext cannot be reused to forge or decrypt another user's URL.
 *
 * Format of the stored string (all base64url, dot-separated):
 *   v1.<iv>.<authTag>.<ciphertext>
 */
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto";

const VERSION = "v1";
const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12; // GCM standard nonce length
const KEY_BYTES = 32;

function masterSecret(): string {
  const secret = process.env.TENANT_URL_ENCRYPTION_KEY || process.env.CLERK_SECRET_KEY;
  if (!secret) {
    throw new Error(
      "Missing encryption secret: set CLERK_SECRET_KEY (or TENANT_URL_ENCRYPTION_KEY).",
    );
  }
  return secret;
}

/** Derive a stable per-user 256-bit key. `clerkId` acts as the salt. */
function deriveKey(clerkId: string): Buffer {
  return scryptSync(masterSecret(), `eternime:tenant:${clerkId}`, KEY_BYTES);
}

function toB64Url(buf: Buffer): string {
  return buf.toString("base64url");
}

export function encryptTenantUrl(plainUrl: string, clerkId: string): string {
  const key = deriveKey(clerkId);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plainUrl, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [VERSION, toB64Url(iv), toB64Url(authTag), toB64Url(ciphertext)].join(".");
}

export function decryptTenantUrl(encrypted: string, clerkId: string): string {
  const parts = encrypted.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error("Invalid encrypted tenant URL format.");
  }
  const [, ivB64, tagB64, dataB64] = parts;
  const key = deriveKey(clerkId);
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, "base64url"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64url")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
