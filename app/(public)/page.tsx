import type { Metadata } from "next";
import Link from "next/link";
import { FadeInOnScroll, StaggerContainer, StaggerItem } from "@/components/motion";
import {
  ActoVisualStyles,
  VisualHistoria,
  VisualGuia,
  VisualCartas,
  VisualTrasciende,
} from "@/components/public/acto-visuals";

export const metadata: Metadata = {
  title: "Eternime — Tu legado vive para siempre",
  description:
    "Preserva tus recuerdos, tu voz y tus cartas para quienes amas. Eon, tu guía de IA, te va conociendo con el tiempo. Un legado digital que de verdad te entiende.",
  openGraph: {
    title: "Eternime — Tu legado vive para siempre",
    description: "Cada vida deja una huella. Preserva la tuya.",
    locale: "es_MX",
    type: "website",
  },
};

const actos = [
  {
    numero: "01",
    titulo: "Tu bóveda de recuerdos",
    texto:
      "Guarda recuerdos en texto, foto o audio, a tu ritmo, sin checklist agresivo. Cada cosa que compartes queda protegida y organizada, lista para quien tú decidas.",
  },
  {
    numero: "02",
    titulo: "Eon, tu guía de IA",
    texto:
      "Eon conversa contigo y, con cada intercambio, aprende un poco más de quién eres: tu forma de hablar, tus valores, tus patrones. No es un chatbot genérico — es una memoria que crece contigo.",
  },
  {
    numero: "03",
    titulo: "Cartas que llegan a tiempo",
    texto:
      "Escribe cartas para cumpleaños, bodas o los días difíciles que aún no llegan. Eternime las entrega exactamente cuando deben llegar, a quien tú elijas.",
  },
  {
    numero: "04",
    titulo: "Herederos, bajo tus reglas",
    texto:
      "Tú decides quién recibe qué y cuándo. Nada se comparte sin tu permiso explícito — ni en vida, ni después. Tu legado, gobernado por ti.",
  },
] as const;

const visuales = [VisualHistoria, VisualGuia, VisualCartas, VisualTrasciende];

export default function HomePage() {
  return (
    <>
      {/* Hero — usa el fondo aurora global (montado en layout.tsx), sin video */}
      <section className="relative isolate flex min-h-[78svh] flex-col items-center justify-center overflow-hidden px-5 py-16 text-center sm:px-8">
        {/* Velo radial: garantiza contraste del texto sobre el aurora sin importar donde caigan los blobs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 60% 55% at 50% 45%, rgba(8,8,12,0.6), transparent 70%)" }}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="eternime-video-halo" />
        </div>
        <div className="relative z-10 flex flex-col items-center">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.32em] text-white/45">
            Digital Legacy Intelligence
          </p>
          <h1 className="et-serif mt-5 max-w-3xl text-4xl leading-[1.1] text-white sm:text-6xl">
            Cada vida deja una huella.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">
            Eternime preserva tus recuerdos, tu voz y tus cartas para quienes amas —
            y te conoce un poco más con cada conversación.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/crear" className="et-btn et-btn-primary !min-h-[3.25rem] px-8 text-sm font-medium">
              Crear mi legado
            </Link>
            <Link href="/como-funciona" className="et-btn et-btn-ghost !min-h-[3.25rem] px-7 text-sm">
              Cómo funciona
            </Link>
          </div>
          <p className="mt-6 text-xs text-white/35">¿Ya tienes cuenta? <Link href="/entrar" className="underline underline-offset-4 hover:text-white/60">Entrar</Link></p>
        </div>

        <a
          href="#que-es-eternime"
          aria-label="Bajar para ver qué es Eternime"
          className="group absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-white/45 transition hover:text-white/80"
        >
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.28em]">Descubre más</span>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
            className="animate-bounce"
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </a>
      </section>

      {/* Que es Eternime, en concreto */}
      <section id="que-es-eternime" className="mx-auto w-full max-w-5xl scroll-mt-20 px-5 pb-24 pt-16 sm:px-8">
        <ActoVisualStyles />
        <FadeInOnScroll>
          <p className="text-center text-xs uppercase tracking-[0.3em] text-[var(--et-gold)]">Qué es Eternime</p>
          <h2 className="et-serif mt-4 text-center text-2xl leading-tight sm:text-4xl">
            No es una app de notas. Es alguien que <span className="text-[var(--et-gold-bright)]">te va conociendo</span>.
          </h2>
        </FadeInOnScroll>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {actos.map((acto, i) => {
            const Visual = visuales[i];
            return (
              <StaggerContainer key={acto.numero}>
                <StaggerItem>
                  <div className="et-card flex h-full flex-col gap-4 rounded-[var(--et-radius)] p-6">
                    <div className="h-16 w-16">
                      <Visual />
                    </div>
                    <p className="text-xs uppercase tracking-[0.3em] text-[var(--et-gold)]">{acto.numero}</p>
                    <h3 className="et-serif text-xl">{acto.titulo}</h3>
                    <p className="text-sm leading-relaxed text-[var(--et-text-muted)]">{acto.texto}</p>
                  </div>
                </StaggerItem>
              </StaggerContainer>
            );
          })}
        </div>

        <FadeInOnScroll className="mt-10 text-center">
          <Link href="/como-funciona" className="et-btn et-btn-ghost px-6">
            Ver los cuatro actos completos
          </Link>
        </FadeInOnScroll>
      </section>

      {/* CTA final */}
      <section className="px-5 pb-24 sm:px-8">
        <FadeInOnScroll>
          <div className="et-card et-glow-ring mx-auto max-w-2xl rounded-[var(--et-radius)] p-10 text-center">
            <h2 className="et-serif text-2xl sm:text-3xl">Tu historia merece ser eterna</h2>
            <p className="mt-3 text-[var(--et-text-muted)]">
              Empieza hoy. Tu primer recuerdo es gratis, y para siempre.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/crear" className="et-btn et-btn-primary px-6">Crear mi legado</Link>
              <Link href="/precios" className="et-btn et-btn-ghost px-6">Ver precios</Link>
            </div>
          </div>
        </FadeInOnScroll>
      </section>
    </>
  );
}
