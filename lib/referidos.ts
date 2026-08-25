import "server-only";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { getControlDb, controlSchema } from "@/lib/db/control";

/** Escalera firmada 25-ago-2026: referido 5% / socio 20% / master 40%. Todo MXN. */
export const PCT_POR_TIER: Record<string, number> = { referido: 5, socio: 20, master: 40 };

const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generarCodigo(len = 8) {
  let s = "";
  for (let i = 0; i < len; i++) s += ALFABETO[crypto.randomInt(ALFABETO.length)];
  return s;
}

/** Devuelve el partner del usuario (control users.id) o lo crea como referido 5%. */
export async function obtenerOCrearPartner(controlUserId: string) {
  const db = getControlDb();
  const [existente] = await db
    .select()
    .from(controlSchema.partners)
    .where(eq(controlSchema.partners.userId, controlUserId))
    .limit(1);
  if (existente) return existente;
  for (let i = 0; i < 3; i++) {
    try {
      const [nuevo] = await db
        .insert(controlSchema.partners)
        .values({ userId: controlUserId, code: generarCodigo() })
        .returning();
      return nuevo;
    } catch {
      const [carrera] = await db
        .select()
        .from(controlSchema.partners)
        .where(eq(controlSchema.partners.userId, controlUserId))
        .limit(1);
      if (carrera) return carrera;
    }
  }
  throw new Error("No se pudo crear el partner");
}
