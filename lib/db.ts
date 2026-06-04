/**
 * Cliente Postgres (Neon serverless) para las tablas eternime_*.
 *
 * Regla de Luis: si DATABASE_URL no está definida, la capa de datos devuelve
 * null/[] y la UI muestra EmptyStates elegantes — nunca mock hardcodeado.
 *
 * Uso:
 *   import { sql, hasDb } from "@/lib/db";
 *   if (!hasDb()) return [];
 *   const rows = await sql`SELECT ...`;
 */
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let client: NeonQueryFunction<false, false> | null = null;

export function hasDb(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/** Devuelve el cliente neon (tagged template) o null si no hay DATABASE_URL. */
export function getSql(): NeonQueryFunction<false, false> | null {
  if (!hasDb()) return null;
  if (!client) client = neon(process.env.DATABASE_URL as string);
  return client;
}

/**
 * Tagged template que lanza si no hay DB. Úsalo solo después de checar hasDb().
 * Para flujos tolerantes usa getSql() y maneja el null.
 */
export const sql: NeonQueryFunction<false, false> = ((...args: Parameters<NeonQueryFunction<false, false>>) => {
  const c = getSql();
  if (!c) {
    throw new Error("DATABASE_URL no está configurada — la capa de datos debe degradar a EmptyState.");
  }
  return c(...args);
}) as NeonQueryFunction<false, false>;
