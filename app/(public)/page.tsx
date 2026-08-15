import type { Metadata } from "next";
import Link from "next/link";
import { FadeInOnScroll, StaggerContainer, StaggerItem } from "@/components/motion";

export const metadata: Metadata = {
  title: "Eternime — La luz que se queda",
  description:
    "Eternime guarda tu voz, tu historia y tu forma de ser — para que los tuyos puedan seguir conversando contigo.",
  openGraph: {
    title: "Eternime — La luz que se queda",
    description: "Lo que eres, se queda.",
    locale: "es_MX",
    type: "website",
  },
};

const pasos = [
  { t: "Cuéntale", d: "Le hablas de tu vida, subes tus fotos, escribes cartas." },
  { t: "Eon aprende", d: "Tu voz, tus historias y tu forma de decir las cosas." },
  { t: "Conversan contigo", d: "Los tuyos podrán hablar con él — y escucharte." },
];

export default function HomePage() {
  return (
    <>
      {/* ── HERO ── */}
      <section className="relative isolate flex min-h-[80svh] flex-col items-center justify-center overflow-hidden px-5 py-16 text-center sm:px-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 60% 55% at 50% 45%, rgba(10,10,12,0.6), transparent 70%)" }}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="eternime-video-halo" />
        </div>
        <div className="relative z-10 flex flex-col items-center">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.32em] text-[var(--et-gold)]">Eternime</p>
          <h1 className="et-serif mt-5 max-w-3xl text-4xl leading-[1.08] text-[var(--et-text)] sm:text-6xl">
            Lo que eres, se queda.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--et-text-muted)] sm:text-lg">
            Eternime guarda tu voz, tu historia y tu forma de ser — para que los tuyos puedan seguir conversando contigo.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/crear" className="et-btn et-btn-primary min-h-[3.25rem] px-8 text-sm font-medium">
              Crear mi legado
            </Link>
            <Link href="/como-funciona" className="et-btn et-btn-ghost min-h-[3.25rem] px-7 text-sm">
              Cómo funciona
            </Link>
          </div>
          <p className="mt-6 text-xs text-[var(--et-text-faint)]">
            ¿Ya tienes cuenta?{" "}
            <Link href="/entrar" className="underline underline-offset-4 hover:text-[var(--et-gold)]">
              Entrar
            </Link>
          </p>
        </div>

        <a
          href="#acto-1"
          aria-label="Bajar para leer la historia de Eternime"
          className="group absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-[var(--et-text-faint)] transition hover:text-[var(--et-gold)]"
        >
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.28em]">Descubre más</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="animate-bounce">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </a>
      </section>

      {/* ── ACTO I ── */}
      <section id="acto-1" className="mx-auto w-full max-w-3xl scroll-mt-20 px-5 py-20 sm:px-8">
        <FadeInOnScroll>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-[var(--et-gold)]">Acto I</p>
          <h2 className="et-serif mt-4 text-3xl leading-tight text-[var(--et-text)] sm:text-4xl">
            La memoria no debería morir con nosotros.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-[var(--et-text-muted)] sm:text-lg">
            Las fotos se quedan mudas. Los mensajes se pierden. Eternime nace de una idea simple: que tu voz y tu manera
            de ver el mundo puedan acompañar a los tuyos, incluso cuando tú ya no puedas.
          </p>
        </FadeInOnScroll>
      </section>

      {/* ── ACTO II ── */}
      <section className="mx-auto w-full max-w-3xl px-5 py-20 sm:px-8">
        <FadeInOnScroll>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-[var(--et-gold)]">Acto II</p>
          <h2 className="et-serif mt-4 text-3xl leading-tight text-[var(--et-text)] sm:text-4xl">
            Le cuentas a Eon. Eon te aprende.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-[var(--et-text-muted)] sm:text-lg">
            Hablas con Eon como con alguien de confianza: le cuentas tu vida, subes tus fotos, escribes cartas. Eon
            aprende tu voz, tus historias y tu forma de decir las cosas. Los tuyos podrán conversar con él — y escucharte.
          </p>
        </FadeInOnScroll>
        <StaggerContainer className="mt-10 grid gap-4 sm:grid-cols-3">
          {pasos.map((p, i) => (
            <StaggerItem key={p.t}>
              <div className="et-card h-full rounded-[var(--et-radius)] p-5">
                <p className="et-serif text-2xl text-[var(--et-gold)]">{i + 1}</p>
                <h3 className="et-serif mt-2 text-lg text-[var(--et-text)]">{p.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--et-text-muted)]">{p.d}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* ── ACTO III ── */}
      <section className="mx-auto w-full max-w-3xl px-5 py-20 sm:px-8">
        <FadeInOnScroll>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-[var(--et-gold)]">Acto III</p>
          <h2 className="et-serif mt-4 text-3xl leading-tight text-[var(--et-text)] sm:text-4xl">
            Eon es inteligencia artificial. Y te lo decimos de frente.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-[var(--et-text-muted)] sm:text-lg">
            Eon no es un espíritu ni una promesa mística: es una IA entrenada solo con lo que tú le confías. Puede
            conversar con tu voz y contar tus historias. No puede inventar quién fuiste ni decidir por ti. Esa honestidad
            es la base de todo.
          </p>
        </FadeInOnScroll>
      </section>

      {/* ── ACTO IV ── */}
      <section className="mx-auto w-full max-w-3xl px-5 py-20 sm:px-8">
        <FadeInOnScroll>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-[var(--et-gold)]">Acto IV</p>
          <h2 className="et-serif mt-4 text-3xl leading-tight text-[var(--et-text)] sm:text-4xl">Tú decides todo.</h2>
          <p className="mt-6 text-base leading-relaxed text-[var(--et-text-muted)] sm:text-lg">
            Qué guarda, qué se comparte, quién puede hablar con Eon y cuándo. Cada recuerdo se puede editar o borrar. Y si
            un día quieres apagarlo todo, se borra todo. Sin letras chicas.
          </p>
        </FadeInOnScroll>
      </section>

      {/* ── ACTO V ── */}
      <section className="mx-auto w-full max-w-3xl px-5 py-20 sm:px-8">
        <FadeInOnScroll>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-[var(--et-gold)]">Acto V</p>
          <h2 className="et-serif mt-4 text-3xl leading-tight text-[var(--et-text)] sm:text-4xl">
            Tu memoria es tuya. Punto.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-[var(--et-text-muted)] sm:text-lg">
            Tu bóveda vive cifrada, tus herederos los eliges tú, y puedes exportar todo cuando quieras. Nunca vendemos tus
            datos ni entrenamos con ellos a nadie más.
          </p>
        </FadeInOnScroll>
      </section>

      {/* ── CIERRE ── */}
      <section className="px-5 pb-24 pt-4 sm:px-8">
        <FadeInOnScroll>
          <div className="et-card et-glow-ring mx-auto max-w-2xl rounded-[var(--et-radius)] p-10 text-center">
            <h2 className="et-serif text-2xl text-[var(--et-text)] sm:text-3xl">Empieza con tu voz. Tres minutos bastan.</h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/crear" className="et-btn et-btn-primary px-8">Crear mi legado</Link>
              <Link href="/como-funciona" className="et-btn et-btn-ghost px-6">Cómo funciona</Link>
            </div>
          </div>
        </FadeInOnScroll>
      </section>
    </>
  );
}
