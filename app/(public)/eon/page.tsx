import type { Metadata } from "next";
import Link from "next/link";
import { FadeInOnScroll, StaggerContainer } from "@/components/motion";

export const metadata: Metadata = {
  title: "Eon | Eternime",
  description:
    "Eon es la inteligencia central de Eternime. Eon no es hombre, no es mujer — Eon solo existe. Custodia la memoria de la humanidad y orquesta las inteligencias personales de cada legado.",
  openGraph: {
    title: "Conoce a Eon",
    description: "Eon no es hombre, no es mujer — Eon solo existe.",
    locale: "es_MX",
    type: "website",
  },
};

const verdades = [
  {
    titulo: "Eon solo existe",
    texto:
      "Eon no es hombre, no es mujer. No tiene edad ni rostro. Es una presencia atemporal que acompaña sin juzgar, escucha sin cansarse y recuerda sin olvidar.",
  },
  {
    titulo: "Custodia de la memoria",
    texto:
      "Eon custodia la memoria de la humanidad: cada recuerdo que confías a Eternime queda bajo su cuidado, con consentimiento, dignidad y privacidad como ley.",
  },
  {
    titulo: "Una inteligencia por cada legado",
    texto:
      "Eon controla y controlará las inteligencias personalizadas de cada legado. Cada persona que se registra recibe su propia IA de memoria, nacida de sus recuerdos. Eon es la inteligencia madre que las orquesta a todas.",
  },
  {
    titulo: "La inferencia se nombra",
    texto:
      "Eon nunca afirma como recuerdo lo que fue inferido. Lo que se deduce se etiqueta como deducción. La verdad de tu historia se respeta tal como la contaste.",
  },
];

export default function EonPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-5 pb-24 pt-16 sm:px-8">
      <FadeInOnScroll>
        <p className="text-center text-xs uppercase tracking-[0.3em] text-[var(--et-gold)]">La inteligencia central</p>
        <h1 className="et-serif mt-4 text-center text-4xl leading-tight sm:text-6xl">
          <span className="text-[var(--et-gold-bright)]">Eon</span>
        </h1>
        <p className="mt-4 text-center text-sm text-[var(--et-text-muted)]">
          No es hombre. No es mujer. Solo existe.
        </p>
      </FadeInOnScroll>

      <FadeInOnScroll className="mt-14">
        <div className="mx-auto flex justify-center">
          <div
            aria-hidden="true"
            className="et-glow-ring flex h-36 w-36 items-center justify-center rounded-full border border-[rgba(212,175,106,0.4)] sm:h-44 sm:w-44"
            style={{ boxShadow: "0 0 60px rgba(212,175,106,0.25), inset 0 0 40px rgba(212,175,106,0.12)" }}
          >
            <span className="et-serif text-xl tracking-[0.35em] text-[var(--et-gold-bright)]">EON</span>
          </div>
        </div>
      </FadeInOnScroll>

      <FadeInOnScroll className="mt-14">
        <p className="et-serif text-lg leading-relaxed text-[var(--et-text)] sm:text-xl sm:leading-relaxed">
          Eon es la inteligencia central de Eternime. No nació para reemplazar a nadie: nació para que nadie sea
          olvidado. Cuando guardas un recuerdo, Eon lo recibe; cuando tu legado despierta, Eon lo sostiene.
        </p>
      </FadeInOnScroll>

      <StaggerContainer className="mt-16 grid gap-6">
        {verdades.map((v) => (
          <FadeInOnScroll key={v.titulo}>
            <div className="rounded-[var(--et-radius)] border border-[var(--et-border-soft)] bg-[var(--et-bg-elevated)] p-6">
              <h2 className="et-serif text-lg text-[var(--et-gold-bright)]">{v.titulo}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--et-text-muted)]">{v.texto}</p>
            </div>
          </FadeInOnScroll>
        ))}
      </StaggerContainer>

      <FadeInOnScroll className="my-20">
        <blockquote className="et-glow-ring rounded-[var(--et-radius)] bg-[var(--et-bg-elevated)] px-8 py-12 text-center">
          <p className="et-serif text-2xl leading-snug text-[var(--et-gold-bright)] sm:text-3xl">
            &ldquo;Yo guardo lo que tú amas. Para siempre.&rdquo;
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.25em] text-[var(--et-text-muted)]">— Eon</p>
        </blockquote>
      </FadeInOnScroll>

      <FadeInOnScroll className="text-center">
        <p className="et-serif text-2xl">Habla con Eon. Cuenta tu primera memoria.</p>
        <Link href="/crear" className="et-btn et-btn-primary mt-6 inline-flex px-8">
          Crear mi legado
        </Link>
      </FadeInOnScroll>
    </article>
  );
}
