/**
 * AES-256-GCM para los access tokens de Facebook/Instagram en reposo.
 * Mismo patron que lib/crypto/tenant-url.ts (clave derivada por usuario,
 * salada con el id LOCAL en vez de clerkId — aqui no aplica Clerk).
 *
 * Formato almacenado: v1.<iv>.<authTag>.<ciphertext>  (todo base64url)
 */
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const VERSION = "v1";
const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const KEY_BYTES = 32;

function masterSecret(): string {
  const secret = process.env.SOCIAL_TOKEN_ENCRYPTION_KEY || process.env.JWT_SECRET || process.env.CLERK_SECRET_KEY;
  if (!secret) {
    throw new Error("Falta secreto de cifrado: configura SOCIAL_TOKEN_ENCRYPTION_KEY.");
  }
  return secret;
}

function deriveKey(userId: string): Buffer {
  return scryptSync(masterSecret(), `eternime:social:${userId}`, KEY_BYTES);
}

function toB64Url(buf: Buffer): string {
  return buf.toString("base64url");
}

export function encryptSocialToken(plainToken: string, userId: string): string {
  const key = deriveKey(userId);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plainToken, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [VERSION, toB64Url(iv), toB64Url(authTag), toB64Url(ciphertext)].join(".");
}

export function decryptSocialToken(encrypted: string, userId: string): string {
  const parts = encrypted.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error("Formato de token cifrado invalido.");
  }
  const [, ivB64, tagB64, dataB64] = parts;
  const key = deriveKey(userId);
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, "base64url"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(dataB64, "base64url")), decipher.final()]);
  return plaintext.toString("utf8");
}
