import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getControlDb, controlSchema } from "@/lib/db/control";
import { verifyStripeSignature } from "@/lib/stripe";
import { obtenerOCrearPartner, PCT_POR_TIER } from "@/lib/referidos";

export const runtime = "nodejs";

type Db = ReturnType<typeof getControlDb>;

/** Sella la atribución del referido: la primera gana, para siempre. */
async function sellarAtribucion(db: Db, referredUserId: string, refCode: string) {
  const [p] = await db
    .select()
    .from(controlSchema.partners)
    .where(eq(controlSchema.partners.code, refCode))
    .limit(1);
  if (!p || !p.active || p.userId === referredUserId) return;
  await db
    .insert(controlSchema.referralAttributions)
    .values({ referredUserId, partnerId: p.id, code: p.code })
    .onConflictDoNothing();
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Sin secreto configurado" }, { status: 500 });

  const raw = await request.text();
  if (!verifyStripeSignature(raw, request.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ error: "Firma invalida" }, { status: 400 });
  }

  const event = JSON.parse(raw) as { type: string; data: { object: unknown } };
  const db = getControlDb();

  try {
    if (event.type === "checkout.session.completed") {
      const s = event.data.object as {
        mode?: string;
        client_reference_id?: string | null;
        subscription?: string | null;
        customer?: string | null;
        metadata?: Record<string, string> | null;
      };
      const userId = s.client_reference_id ?? null;

      if (s.mode === "payment" && userId && (s.metadata?.paquete === "socio" || s.metadata?.paquete === "master")) {
        // Compra de paquete: upgrade del partner a su nuevo tier.
        const tier = s.metadata.paquete;
        const partner = await obtenerOCrearPartner(userId);
        await db
          .update(controlSchema.partners)
          .set({ tier, pct: PCT_POR_TIER[tier] ?? partner.pct, active: true })
          .where(eq(controlSchema.partners.id, partner.id));
      } else if (userId) {
        // Suscripción Legado: upsert de la fila + plan del usuario.
        const [existente] = await db
          .select()
          .from(controlSchema.subscriptions)
          .where(eq(controlSchema.subscriptions.userId, userId))
          .limit(1);
        const datos = {
          stripeCustomerId: s.customer ?? null,
          stripeSubscriptionId: s.subscription ?? null,
          plan: "legado",
          status: "active",
        };
        if (existente) {
          await db
            .update(controlSchema.subscriptions)
            .set(datos)
            .where(eq(controlSchema.subscriptions.id, existente.id));
        } else {
          await db.insert(controlSchema.subscriptions).values({ userId, ...datos });
        }
        await db.update(controlSchema.users).set({ plan: "legado" }).where(eq(controlSchema.users.id, userId));
        if (s.metadata?.ref_code) await sellarAtribucion(db, userId, s.metadata.ref_code);
      }
    } else if (event.type === "invoice.paid") {
      // Comisión: solo sobre dinero cobrado. Payable a los 30 días (ventana de contracargos).
      const inv = event.data.object as {
        id: string;
        subscription?: string | null;
        amount_paid?: number;
        currency?: string;
        subscription_details?: { metadata?: Record<string, string> | null } | null;
      };
      const pagado = inv.amount_paid ?? 0;
      if (pagado > 0 && inv.id) {
        const meta = inv.subscription_details?.metadata ?? {};
        let userId: string | null = null;
        if (inv.subscription) {
          const [fila] = await db
            .select()
            .from(controlSchema.subscriptions)
            .where(eq(controlSchema.subscriptions.stripeSubscriptionId, inv.subscription))
            .limit(1);
          if (fila) userId = fila.userId;
        }
        if (!userId && meta.control_user_id) userId = meta.control_user_id;

        if (userId) {
          if (meta.ref_code) await sellarAtribucion(db, userId, meta.ref_code);
          const [attr] = await db
            .select()
            .from(controlSchema.referralAttributions)
            .where(eq(controlSchema.referralAttributions.referredUserId, userId))
            .limit(1);
          if (attr) {
            const [partner] = await db
              .select()
              .from(controlSchema.partners)
              .where(eq(controlSchema.partners.id, attr.partnerId))
              .limit(1);
            if (partner && partner.active) {
              const comision = Math.round((pagado * partner.pct) / 100);
              if (comision > 0) {
                await db
                  .insert(controlSchema.commissionLedger)
                  .values({
                    partnerId: partner.id,
                    referredUserId: userId,
                    stripeInvoiceId: inv.id,
                    amountGrossCents: pagado,
                    pct: partner.pct,
                    amountCommissionCents: comision,
                    currency: inv.currency ?? "mxn",
                    status: "pending",
                    payableAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                  })
                  .onConflictDoNothing();
              }
            }
          }
        }
      }
    } else if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const sub = event.data.object as { id: string; status?: string; current_period_end?: number };
      const status = event.type === "customer.subscription.deleted" ? "canceled" : (sub.status ?? "active");
      const renewal = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;
      const [fila] = await db
        .select()
        .from(controlSchema.subscriptions)
        .where(eq(controlSchema.subscriptions.stripeSubscriptionId, sub.id))
        .limit(1);
      if (fila) {
        await db
          .update(controlSchema.subscriptions)
          .set({ status, renewalAt: renewal })
          .where(eq(controlSchema.subscriptions.id, fila.id));
        const activo = status === "active" || status === "trialing" || status === "past_due";
        await db
          .update(controlSchema.users)
          .set({ plan: activo ? "legado" : "free" })
          .where(eq(controlSchema.users.id, fila.userId));
      }
    } else if (event.type === "invoice.payment_failed") {
      const inv = event.data.object as { subscription?: string | null };
      if (inv.subscription) {
        await db
          .update(controlSchema.subscriptions)
          .set({ status: "past_due" })
          .where(eq(controlSchema.subscriptions.stripeSubscriptionId, inv.subscription));
      }
    }
    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("[stripe webhook]", e);
    return NextResponse.json({ error: "webhook" }, { status: 500 });
  }
}
