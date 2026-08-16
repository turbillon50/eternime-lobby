import Link from "next/link";
import { getSession } from "@/lib/auth";
import { countMemories, listMemories } from "@/lib/data/memories";
import { countLetters, nextScheduledLetter } from "@/lib/data/letters";
import { countBeneficiaries } from "@/lib/data/beneficiaries";
import { findUserById } from "@/lib/data/users";
import { FadeInOnScroll } from "@/components/motion";

export const dynamic = "force-dynamic";

const quickActions = [
  { href: "/app/recuerdos", label: "Guardar algo", detail: "Texto, voz, foto o documento" },
  { href: "/app/hablar", label: "Hablar con Eon", detail: "Cuéntale algo o pregúntale" },
  { href: "/app/cartas", label: "Escribir una carta", detail: "Ahora o para el futuro" },
  { href: "/app/perfil", label: "Mi identidad", detail: "Lo que Eon sabe de ti" },
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

  const firstName = session?.name?.split(" ")[0] || "";
  const hasVoice = Boolean((user?.prefs as Record<string, unknown> | null)?.eon_voice_id);
  const latest = recentMemories.slice(0, 3);
  const nextLetterDate = nextLetter?.deliver_on ? new Date(nextLetter.deliver_on) : null;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-12">
      <FadeInOnScroll>
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-black/20 backdrop-blur-2xl sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-white/[0.08] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-52 w-52 rounded-full bg-sky-300/[0.07] blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1.35fr_.65fr] lg:items-stretch">
            <div className="flex min-h-[300px] flex-col justify-between">
              <div>
                <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-white/45">
                  Eon · Tu segunda memoria
                </p>
                <h1 className="mt-5 max-w-3xl text-4xl font-medium leading-[1.02] tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
                  {firstName ? `Hola, ${firstName}.` : "Hola."}
                  <span className="mt-2 block text-white/58">¿Qué quieres que recuerde por ti?</span>
                </h1>
              </div>

              <div className="mt-8">
                <Link
                  href="/app/hablar"
                  className="group flex min-h-16 w-full max-w-2xl items-center gap-4 rounded-2xl border border-white/12 bg-black/25 px-5 py-4 transition hover:border-white/20 hover:bg-black/35"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black shadow-lg shadow-white/10">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                      <rect x="9" y="3" width="6" height="11" rx="3" />
                      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
                    </svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-white">Habla con Eon</span>
                    <span className="mt-0.5 block truncate text-xs text-white/42">Cuenta una idea, un pendiente, una historia o pregunta algo que ya viviste.</span>
                  </span>
                  <span className="text-white/30 transition group-hover:translate-x-1 group-hover:text-white/70">→</span>
                </Link>
              </div>
            </div>

            <div className="flex min-h-[300px] flex-col justify-between rounded-[1.65rem] border border-white/10 bg-black/35 p-6">
              <div>
                <div className="relative flex h-20 w-20 items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-white/15 blur-2xl" />
                  <div className="absolute inset-2 rounded-full border border-white/20 bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,.95),rgba(170,190,210,.45)_23%,rgba(40,44,50,.9)_58%,rgba(8,8,12,1)_100%)] shadow-[0_0_45px_rgba(255,255,255,.12)]" />
                </div>
                <h2 className="mt-6 text-xl font-medium tracking-tight text-white">Eon aprende contigo.</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-white/48">
                  Organiza lo que recuerdas, lo que decides y lo que quieres conservar. No necesitas empezar de cero cada vez.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-2 text-[0.66rem] uppercase tracking-[0.14em] text-white/32">
                <span>Memoria</span><span>·</span><span>Contexto</span><span>·</span><span>Voz</span><span>·</span><span>Historia</span>
              </div>
            </div>
          </div>
        </section>
      </FadeInOnScroll>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Memoria", memories, memories === 1 ? "recuerdo guardado" : "recuerdos guardados", "/app/recuerdos"],
          ["Personas", beneficiaries, beneficiaries === 1 ? "persona designada" : "personas designadas", "/app/beneficiarios"],
          ["Cartas", letters, letters === 1 ? "carta preservada" : "cartas preservadas", "/app/cartas"],
          ["Voz", hasVoice ? "Lista" : "Pendiente", hasVoice ? "Eon puede usar tu voz" : "Aún no has configurado tu voz", "/app/hablar"],
        ].map(([label, value, detail, href], index) => (
          <FadeInOnScroll key={String(label)} delay={0.05 * index}>
            <Link href={String(href)} className="block min-h-36 rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-white/16 hover:bg-white/[0.065]">
              <p className="text-[0.65rem] uppercase tracking-[0.18em] text-white/32">{label}</p>
              <p className="mt-5 text-2xl font-medium tracking-tight text-white">{value}</p>
              <p className="mt-2 text-xs leading-5 text-white/42">{detail}</p>
            </Link>
          </FadeInOnScroll>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
        <FadeInOnScroll>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl sm:p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.18em] text-white/32">Acciones rápidas</p>
                <h2 className="mt-2 text-xl font-medium tracking-tight text-white">Guarda lo que importa mientras ocurre.</h2>
              </div>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {quickActions.map((item) => (
                <Link key={item.href + item.label} href={item.href} className="group rounded-2xl border border-white/[0.08] bg-black/20 p-4 transition hover:border-white/15 hover:bg-black/30">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-white/88">{item.label}</span>
                    <span className="text-white/22 transition group-hover:text-white/60">→</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-white/36">{item.detail}</p>
                </Link>
              ))}
            </div>
          </div>
        </FadeInOnScroll>

        <FadeInOnScroll delay={0.08}>
          <div className="h-full rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl sm:p-6">
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-white/32">Eon considera importante</p>
            <div className="mt-5 space-y-4">
              {latest.length > 0 ? latest.map((memory) => (
                <Link key={memory.id} href="/app/recuerdos" className="block border-b border-white/[0.07] pb-4 last:border-0 last:pb-0">
                  <p className="text-sm font-medium text-white/82">{memory.title || "Recuerdo guardado"}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/38">{memory.content || "Contenido preservado en tu memoria."}</p>
                </Link>
              )) : (
                <div className="rounded-2xl border border-dashed border-white/12 p-4">
                  <p className="text-sm text-white/58">Tu segunda memoria todavía está vacía.</p>
                  <p className="mt-1 text-xs leading-5 text-white/34">Guarda algo hoy y Eon empezará a construir contexto contigo.</p>
                </div>
              )}

              {nextLetter && (
                <Link href="/app/cartas" className="block rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                  <p className="text-[0.62rem] uppercase tracking-[0.16em] text-white/28">Próxima carta</p>
                  <p className="mt-2 text-sm font-medium text-white/78">{nextLetter.title}</p>
                  <p className="mt-1 text-xs text-white/36">
                    {nextLetterDate ? nextLetterDate.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }) : "Programada"}
                  </p>
                </Link>
              )}
            </div>
          </div>
        </FadeInOnScroll>
      </section>

      <FadeInOnScroll delay={0.1}>
        <section className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,.055),rgba(130,170,210,.04))] p-6 backdrop-blur-xl sm:p-8">
          <p className="text-[0.65rem] uppercase tracking-[0.18em] text-white/32">Tu historia</p>
          <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-medium tracking-tight text-white">No tienes que preparar un legado.</h2>
              <p className="mt-2 text-sm leading-6 text-white/44">
                Úsalo hoy. Guarda tus ideas, recuerdos y decisiones. Con el tiempo, Eternime construye una memoria de tu vida porque te ayuda a vivirla sin perder contexto.
              </p>
            </div>
            <Link href="/app/guia" className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/14 bg-white px-5 text-sm font-medium text-black transition hover:bg-white/90">
              Construir mi historia
            </Link>
          </div>
        </section>
      </FadeInOnScroll>
    </div>
  );
}
