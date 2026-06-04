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
  title: "Cómo funciona | Eternime",
  description:
    "Cuenta tu historia, deja que tu guía aprenda de ti, escribe cartas al futuro y trasciende. Así funciona Eternime, tu legado digital.",
  openGraph: {
    title: "Cómo funciona Eternime",
    description: "Cuatro actos para que tu memoria viva para siempre.",
    locale: "es_MX",
    type: "website",
  },
};

const actos = [
  {
    numero: "Acto I",
    titulo: "Cuenta tu historia",
    texto:
      "Graba tus recuerdos en texto, voz o fotografía. Cada anécdota, cada consejo, cada momento que te hizo quien eres, queda guardado con el cuidado que merece.",
    detalles: ["Recuerdos en texto, voz y foto", "Organizados por capítulos de tu vida", "Privados hasta que tu decidas"],
  },
  {
    numero: "Acto II",
    titulo: "Tu guía aprende de ti",
    texto:
      "Con cada recuerdo, la inteligencia de Eternime construye tu memoria viva: aprende tu forma de hablar, tus valores y tu manera única de ver el mundo.",
    detalles: ["Una memoria viva que crece contigo", "Tu voz, tu tono, tu esencia", "Siempre bajo tu control"],
  },
  {
    numero: "Acto III",
    titulo: "Escribe cartas al futuro",
    texto:
      "Deja cartas para los cumpleaños, las bodas y los dias difíciles que aún no llegan. Eternime las entrega a tus seres queridos exactamente cuando deben llegar.",
    detalles: ["Entregas programadas en fechas especiales", "Para hijos, nietos y quienes amas", "Palabras que llegan en el momento justo"],
  },
  {
    numero: "Acto IV",
    titulo: "Trasciende",
    texto:
      "Tu esencia queda disponible para quienes amas: podrán escucharte, leerte y conversar con tu memoria. No es un adiós, es una forma nueva de seguir presente.",
    detalles: ["Tu memoria viva para tu familia", "Bóveda protegida por generaciones", "Una celebración de tu vida"],
  },
];

const visuales = [VisualHistoria, VisualGuia, VisualCartas, VisualTrasciende];

export default function ComoFuncionaPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-24 pt-16 sm:px-8">
      <ActoVisualStyles />
      <FadeInOnScroll>
        <p className="text-center text-xs uppercase tracking-[0.3em] text-[var(--et-gold)]">Cómo funciona</p>
        <h1 className="et-serif mt-4 text-center text-3xl leading-tight sm:text-5xl">
          Tu historia, contada en <span className="text-[var(--et-gold-bright)]">cuatro actos</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-center text-[var(--et-text-muted)]">
          Eternime convierte tus recuerdos en un legado vivo. Así es el camino, paso a paso.
        </p>
      </FadeInOnScroll>

      <div className="mt-20 flex flex-col gap-24">
        {actos.map((acto, i) => {
          const Visual = visuales[i];
          const invertido = i % 2 === 1;
          return (
            <section key={acto.numero} className="grid items-center gap-10 md:grid-cols-2">
              <FadeInOnScroll className={invertido ? "md:order-2" : ""}>
                <Visual />
              </FadeInOnScroll>
              <StaggerContainer className={invertido ? "md:order-1" : ""}>
                <StaggerItem>
                  <p className="text-xs uppercase tracking-[0.3em] text-[var(--et-gold)]">{acto.numero}</p>
                </StaggerItem>
                <StaggerItem>
                  <h2 className="et-serif mt-3 text-2xl sm:text-3xl">{acto.titulo}</h2>
                </StaggerItem>
                <StaggerItem>
                  <p className="mt-4 leading-relaxed text-[var(--et-text-muted)]">{acto.texto}</p>
                </StaggerItem>
                <StaggerItem>
                  <ul className="mt-6 flex flex-col gap-2">
                    {acto.detalles.map((d) => (
                      <li key={d} className="flex items-start gap-3 text-sm text-[var(--et-text-muted)]">
                        <span aria-hidden="true" className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--et-gold-bright)]" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </StaggerItem>
              </StaggerContainer>
            </section>
          );
        })}
      </div>

      <FadeInOnScroll className="mt-28">
        <div className="et-card et-glow-ring mx-auto max-w-2xl rounded-[var(--et-radius)] p-10 text-center">
          <h2 className="et-serif text-2xl sm:text-3xl">Tu historia merece ser eterna</h2>
          <p className="mt-3 text-[var(--et-text-muted)]">Empieza hoy. Tu primer recuerdo es gratis, y para siempre.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/crear" className="et-btn et-btn-primary px-6">Crear mi legado</Link>
            <Link href="/precios" className="et-btn et-btn-ghost px-6">Ver precios</Link>
          </div>
        </div>
      </FadeInOnScroll>
    </div>
  );
}
