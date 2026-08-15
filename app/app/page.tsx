import Link from "next/link";
import { getSession } from "@/lib/auth";
import { countMemories, listMemories } from "@/lib/data/memories";
import { countLetters, nextScheduledLetter } from "@/lib/data/letters";
import { countBeneficiaries } from "@/lib/data/beneficiaries";
import { findUserById } from "@/lib/data/users";
import { FadeInOnScroll } from "@/components/motion";
import { AnilloLegado, type Segmento } from "@/components/app/AnilloLegado";

export const dynamic = "force-dynamic";

/** Accesos deslizables bajo la acción principal. */
const ACCESOS: { href: string; label: string; icon: string }[] = [
  { href: "/app/hablar", label: "Hablar con Eon", icon: "M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3ZM5 11a7 7 0 0 0 14 0M12 18v3" },
  { href: "/app/recuerdos", label: "Bóveda", icon: "M4 5h16v14H4zM4 9h16M9 5v4M9 13h6" },
  { href: "/app/cartas", label: "Cartas", icon: "M4 6h16v12H4zM4 7l8 6 8-6" },
  { href: "/app/beneficiarios", label: "Herederos", icon: "M16 11a4 4 0 1 0-8 0M12 7a4 4 0 1 0 0-8M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" },
];

export default async function AppHomePage() {
  const session = await getSession();
  const userId = session?.sub ?? "";
  const [memories, letters, beneficiaries, recentMemories, user, nextLetter] = userId
    ? await Promise.all([
        countMemories(userId),
        countLetters(userId),
        countBeneficiaries(userId),
        listMemories(userId),
        findUserById(userId),
        nextScheduledLetter(userId),
      ])
    : ([0, 0, 0, [], null, null] as const);

  const hasVoice = Boolean((user?.prefs as Record<string, unknown> | null)?.eon_voice_id);
  const hasStory = Boolean(user?.personality_summary?.trim());
  const firstName = session?.name ? session.name.split(" ")[0] : null;

  // Anillo del legado: 5 hitos reales que encienden cada segmento.
  const segmentos: Segmento[] = [
    { key: "voz", label: "Voz", done: hasVoice, href: "/app/hablar" },
    { key: "recuerdos", label: "Recuerdos", done: memories >= 2, href: "/app/recuerdos", count: memories },
    { key: "carta", label: "Carta", done: letters >= 1, href: "/app/cartas", count: letters },
    { key: "heredero", label: "Heredero", done: beneficiaries >= 1, href: "/app/beneficiarios", count: beneficiaries },
    { key: "historia", label: "Historia", done: hasStory, href: "/app/guia" },
  ];

  // La siguiente acción = primer hito pendiente, en orden.
  const siguiente = (() => {
    if (!hasVoice) return { label: "Clona tu voz — 3 minutos", href: "/app/hablar" };
    if (memories < 2)
      return { label: memories === 0 ? "Guarda tu primer recuerdo" : "Guarda un recuerdo más", href: "/app/recuerdos" };
    if (letters < 1) return { label: "Escribe tu primera carta", href: "/app/cartas" };
    if (beneficiaries < 1) return { label: "Nombra a tu primer heredero", href: "/app/beneficiarios" };
    if (!hasStory) return { label: "Completa tu historia con Eon", href: "/app/guia" };
    return { label: "Habla con Eon", href: "/app/hablar" };
  })();

  const lineaRecuerdos =
    memories === 0
      ? "Aún no has guardado recuerdos. Tu legado empieza con el primero."
      : `${memories} ${memories === 1 ? "recuerdo preservado" : "recuerdos preservados"}${
          recentMemories[0]?.title ? ` · el último: "${recentMemories[0].title}"` : ""
        }.`;

  const daysToDelivery = nextLetter?.deliver_on
    ? Math.max(0, Math.ceil((new Date(nextLetter.deliver_on).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-8">
      {/* Saludo + línea de recuerdos */}
      <FadeInOnScroll>
        <h1 className="et-serif text-3xl text-[var(--et-text)] sm:text-4xl">
          Hola{firstName ? `, ${firstName}` : ""}.
        </h1>
        <p className="mt-2 text-sm text-[var(--et-text-muted)]">{lineaRecuerdos}</p>
      </FadeInOnScroll>

      {/* Anillo del legado */}
      <FadeInOnScroll delay={0.08}>
        <AnilloLegado segmentos={segmentos} />
      </FadeInOnScroll>

      {/* La siguiente acción — botón principal único */}
      <FadeInOnScroll delay={0.14} className="flex justify-center">
        <Link href={siguiente.href} className="et-btn et-btn-primary min-h-[3.25rem] px-8 text-sm font-medium">
          {siguiente.label}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </FadeInOnScroll>

      {/* Próxima carta programada (solo si existe) */}
      {nextLetter ? (
        <FadeInOnScroll delay={0.18}>
          <Link
            href="/app/cartas"
            className="et-card flex items-center justify-between gap-4 rounded-[var(--et-radius)] p-4"
          >
            <div className="min-w-0">
              <p className="text-[0.65rem] uppercase tracking-[0.18em] text-[var(--et-gold)]">Próxima carta</p>
              <p className="et-serif mt-1 truncate text-base text-[var(--et-text)]">{nextLetter.title}</p>
              <p className="mt-0.5 truncate text-xs text-[var(--et-text-muted)]">
                Para {nextLetter.recipient_name}
                {daysToDelivery !== null
                  ? daysToDelivery === 0
                    ? " — se entrega hoy"
                    : ` — en ${daysToDelivery} ${daysToDelivery === 1 ? "día" : "días"}`
                  : ""}
              </p>
            </div>
            <span className="shrink-0 text-[var(--et-text-faint)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 6l6 6-6 6" /></svg>
            </span>
          </Link>
        </FadeInOnScroll>
      ) : null}

      {/* Accesos deslizables */}
      <FadeInOnScroll delay={0.22}>
        <p className="mb-3 text-[0.65rem] uppercase tracking-[0.2em] text-[var(--et-text-faint)]">Ir a</p>
        <div className="et-snap -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
          {ACCESOS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="et-card flex min-w-[8.5rem] shrink-0 flex-col gap-3 rounded-[var(--et-radius)] p-4"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--et-border)] text-[var(--et-gold)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={a.icon} /></svg>
              </span>
              <span className="text-sm text-[var(--et-text)]">{a.label}</span>
            </Link>
          ))}
        </div>
      </FadeInOnScroll>
    </div>
  );
}
