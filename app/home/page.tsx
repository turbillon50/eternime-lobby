import Link from "next/link";

import { isClerkConfigured } from "@/lib/clerk";

export const dynamic = "force-dynamic";

/**
 * Dashboard placeholder (Fase 1). The full dashboard — vault state, latest
 * insight, "Conversar con mi IA" — lands in Fase 2. For now this confirms the
 * authenticated, tenant-ready surface exists behind the middleware.
 */
export default async function HomePage() {
  const { name, status } = await resolveUser();

  return (
    <main className="min-h-dvh bg-[#0a0a0a] px-6 py-20 text-[#f5f1e8]">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-[#e8d9a8]/70">Tu bóveda</p>
        <h1 className="mt-4 font-serif text-3xl leading-tight md:text-4xl">
          {name ? `Hola, ${name}.` : "Hola."}
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-[#d8d2c4]/80">
          {status === "ready"
            ? "Tu espacio único está despierto. Cada recuerdo que compartas empieza a construir una versión viva de tu historia."
            : "Estamos preparando tu bóveda. En segundos estará lista para conocerte."}
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <Card href="/conversar" title="Conversar con mi IA" subtitle="Próximamente — Fase 2" />
          <Card href="/memorias/nueva" title="Guardar un recuerdo" subtitle="Próximamente — Fase 2" />
        </div>
      </div>
    </main>
  );
}

function Card({ href, title, subtitle }: { href: string; title: string; subtitle: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-[#e8d9a8]/15 bg-white/[0.02] p-6 transition hover:border-[#e8d9a8]/40"
    >
      <p className="font-serif text-lg text-[#f5f1e8]">{title}</p>
      <p className="mt-1 text-xs text-[#d8d2c4]/50">{subtitle}</p>
    </Link>
  );
}

/** Best-effort resolution of the signed-in user's name and tenant status. */
async function resolveUser(): Promise<{ name: string | null; status: string }> {
  if (!isClerkConfigured()) {
    return { name: null, status: "ready" };
  }
  try {
    const { currentUser } = await import("@clerk/nextjs/server");
    const user = await currentUser();
    const name = user?.firstName ?? null;

    // Reflect provisioning state from the control plane when reachable.
    if (user) {
      const { getControlDb } = await import("@/lib/db/control");
      const { users } = await import("@/lib/db/schema/control-plane");
      const { eq } = await import("drizzle-orm");
      const [row] = await getControlDb()
        .select({ status: users.status })
        .from(users)
        .where(eq(users.clerkId, user.id))
        .limit(1);
      return { name, status: row?.status ?? "provisioning" };
    }
  } catch {
    // Fall through to a safe default if Clerk/DB are unavailable.
  }
  return { name: null, status: "provisioning" };
}
