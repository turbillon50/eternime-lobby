import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getControlDb, controlSchema } from "@/lib/db/control";
import { verifyStripeSignature } from "@/lib/stripe";

export const runtime = "nodejs";

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
        client_reference_id?: string | null;
        subscription?: string | null;
        customer?: string | null;
      };
      const userId = s.client_reference_id ?? null;
      if (userId) {
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
