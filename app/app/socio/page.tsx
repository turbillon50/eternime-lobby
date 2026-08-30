import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getControlDb, controlSchema } from "@/lib/db/control";
import { obtenerOCrearPartner } from "@/lib/referidos";
import { BotonPaquete, CopiarLink } from "@/components/socio-ui";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NOMBRE_TIER: Record<string, string> = { referido: "Referido", socio: "Socio Comercial", master: "Socio Master" };
const ESTADO_LEDGER: Record<string, string> = { pending: "En ventana (30 días)", payable: "Por pagar", paid: "Pagado", reversed: "Revertido" };

function mxn(cents: number) {
  return (cents / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default async function SocioPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in?redirect_url=/app/socio");

  const db = getControlDb();
  let [u] = await db
    .select()
    .from(controlSchema.users)
    .where(eq(controlSchema.users.clerkId, session.clerkId))
    .limit(1);
  if (!u) {
    [u] = await db
      .insert(controlSchema.users)
      .values({ clerkId: session.clerkId, email: session.email, name: session.name })
      .returning();
  }

  const partner = await obtenerOCrearPartner(u.id);
  const referidos = await db
    .select()
    .from(controlSchema.referralAttributions)
    .where(eq(controlSchema.referralAttributions.partnerId, partner.id));
  const ledger = await db
    .select()
    .from(controlSchema.commissionLedger)
    .where(eq(controlSchema.commissionLedger.partnerId, partner.id));

  const suma = (estados: string[]) =>
    ledger.filter((l) => estados.includes(l.status)).reduce((a, l) => a + l.amountCommissionCents, 0);
  const enVentana = suma(["pending"]);
  const porPagar = suma(["payable"]);
  const pagado = suma(["paid"]);
  const linkInvitacion = `https://eternime.org/r/${partner.code}`;

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <p className="text-sm uppercase tracking-widest text-[var(--et-text-muted)]">Programa de socios</p>
      <h1 className="mt-1 text-3xl font-semibold">
        {NOMBRE_TIER[partner.tier] ?? partner.tier} · {partner.pct}% de por vida
      </h1>
      <p className="mt-2 text-[var(--et-text-muted)]">
        Comparte tu link. Cada suscripción activa de tu red te paga el {partner.pct}% cada mes, para siempre.
      </p>

      <div className="et-card mt-8 rounded-[var(--et-radius)] p-5">
        <p className="text-sm font-medium">Tu link de invitación</p>
        <CopiarLink url={linkInvitacion} />
        <p className="mt-2 text-xs text-[var(--et-text-muted)]">
          Tu código: <span className="font-mono">{partner.code}</span> · La atribución se sella con la primera compra y es tuya para siempre.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="et-card rounded-[var(--et-radius)] p-4">
          <p className="text-xs text-[var(--et-text-muted)]">Cuentas referidas</p>
          <p className="mt-1 text-2xl font-semibold">{referidos.length}</p>
        </div>
        <div className="et-card rounded-[var(--et-radius)] p-4">
          <p className="text-xs text-[var(--et-text-muted)]">En ventana</p>
          <p className="mt-1 text-2xl font-semibold">{mxn(enVentana)}</p>
        </div>
        <div className="et-card rounded-[var(--et-radius)] p-4">
          <p className="text-xs text-[var(--et-text-muted)]">Por pagar</p>
          <p className="mt-1 text-2xl font-semibold">{mxn(porPagar)}</p>
        </div>
        <div className="et-card rounded-[var(--et-radius)] p-4">
          <p className="text-xs text-[var(--et-text-muted)]">Pagado</p>
          <p className="mt-1 text-2xl font-semibold">{mxn(pagado)}</p>
        </div>
      </div>

      {ledger.length > 0 ? (
        <div className="et-card mt-6 overflow-x-auto rounded-[var(--et-radius)] p-5">
          <p className="text-sm font-medium">Comisiones</p>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--et-text-muted)]">
                <th className="pb-2">Fecha</th>
                <th className="pb-2">Cobro</th>
                <th className="pb-2">%</th>
                <th className="pb-2">Comisión</th>
                <th className="pb-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((l) => (
                <tr key={l.id} className="border-t border-white/5">
                  <td className="py-2">{l.createdAt?.toLocaleDateString("es-MX")}</td>
                  <td className="py-2">{mxn(l.amountGrossCents)}</td>
                  <td className="py-2">{l.pct}%</td>
                  <td className="py-2 font-medium">{mxn(l.amountCommissionCents)}</td>
                  <td className="py-2">{ESTADO_LEDGER[l.status] ?? l.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-6 text-sm text-[var(--et-text-muted)]">
          Aún no hay comisiones. En cuanto alguien de tu red pague su suscripción, aparece aquí — y a los 30 días pasa a Por pagar.
        </p>
      )}

      {partner.tier === "referido" ? (
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="et-card rounded-[var(--et-radius)] p-5">
            <p className="text-lg font-semibold">Socio Comercial</p>
            <p className="mt-1 text-2xl font-semibold">$50,000 <span className="text-sm font-normal text-[var(--et-text-muted)]">MXN, pago único</span></p>
            <ul className="mt-3 space-y-1 text-sm text-[var(--et-text-muted)]">
              <li>20% de por vida sobre tu red</li>
              <li>Cuentas ilimitadas</li>
              <li>Panel de administración</li>
              <li>Licencia comercial en México</li>
            </ul>
            <BotonPaquete paquete="socio" className="mt-4 w-full rounded-[var(--et-radius)] bg-[var(--et-accent,#c9a86a)] px-4 py-3 text-sm font-medium text-black">
              Convertirme en Socio
            </BotonPaquete>
          </div>
          <div className="et-card rounded-[var(--et-radius)] p-5">
            <p className="text-lg font-semibold">Socio Master</p>
            <p className="mt-1 text-2xl font-semibold">$100,000 <span className="text-sm font-normal text-[var(--et-text-muted)]">MXN, pago único</span></p>
            <ul className="mt-3 space-y-1 text-sm text-[var(--et-text-muted)]">
              <li>40% de por vida sobre tu red</li>
              <li>Panel de administración PLUS</li>
              <li>Venta internacional</li>
              <li>Todo lo del Socio Comercial</li>
            </ul>
            <BotonPaquete paquete="master" className="mt-4 w-full rounded-[var(--et-radius)] border border-[var(--et-accent,#c9a86a)] px-4 py-3 text-sm font-medium">
              Convertirme en Master
            </BotonPaquete>
          </div>
        </div>
      ) : null}

      <p className="mt-10 text-xs text-[var(--et-text-muted)]">
        Las comisiones aplican únicamente sobre suscripciones cobradas de clientes finales, se liberan a los 30 días y se pagan mensualmente. Nunca se paga comisión por reclutar socios.
      </p>
    </div>
  );
}
