import type { Metadata } from "next";
import Link from "next/link";
import { FadeInOnScroll } from "@/components/motion";

export const metadata: Metadata = {
  title: "Manifiesto | Eternime",
  description:
    "Creemos que ninguna historia merece el olvido. El manifiesto de Eternime: por qué construimos un hogar eterno para tu memoria.",
  openGraph: {
    title: "El manifiesto de Eternime",
    description: "Ninguna historia merece el olvido.",
    locale: "es_MX",
    type: "website",
  },
};

const parrafos = [
  "Toda vida es una historia irrepetible. La risa de tu abuela, los consejos de tu padre, la receta que solo tú sabes hacer como debe ser. Cuando alguien se va, no se va una persona: se va una biblioteca entera.",
  "En México sabemos algo que el mundo está apenas aprendiendo: la muerte no es el final de la presencia. Recordamos, celebramos, ponemos la mesa para los que ya no están. La memoria es nuestra forma de amar hacia atrás y hacia adelante.",
  "Eternime nace de esa certeza. No construimos un cementerio digital: construimos un hogar para tu voz, tus palabras y tu manera de ver el mundo, para que sigan acompañando a quienes amas.",
  "Creemos que dejar un legado no debería ser privilegio de quienes escriben libros o aparecen en enciclopedias. Tu historia, la de todos los días, también merece ser eterna.",
];

const compromisos = [
  "Tu memoria es tuya. Siempre. Nunca la venderemos ni la usaremos sin tu permiso.",
  "Hablamos de la vida, no de la muerte. Eternime es una celebración, no un duelo.",
  "Construimos para generaciones, no para trimestres.",
];

export default function ManifiestoPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-5 pb-24 pt-16 sm:px-8">
      <FadeInOnScroll>
        <p className="text-center text-xs uppercase tracking-[0.3em] text-[var(--et-gold)]">Manifiesto</p>
        <h1 className="et-serif mt-4 text-center text-3xl leading-tight sm:text-5xl">
          Ninguna historia merece <span className="text-[var(--et-gold-bright)]">el olvido</span>
        </h1>
      </FadeInOnScroll>

      <div className="mt-16 flex flex-col gap-10">
        {parrafos.slice(0, 2).map((p, i) => (
          <FadeInOnScroll key={i} delay={0.05 * i}>
            <p className="et-serif text-lg leading-relaxed text-[var(--et-text)] sm:text-xl sm:leading-relaxed">{p}</p>
          </FadeInOnScroll>
        ))}
      </div>

      <FadeInOnScroll className="my-20">
        <blockquote className="et-glow-ring rounded-[var(--et-radius)] bg-[var(--et-bg-elevated)] px-8 py-12 text-center">
          <p className="et-serif text-2xl leading-snug text-[var(--et-gold-bright)] sm:text-3xl">
            "Morir es inevitable. Ser olvidado, no."
          </p>
        </blockquote>
      </FadeInOnScroll>

      <div className="flex flex-col gap-10">
        {parrafos.slice(2).map((p, i) => (
          <FadeInOnScroll key={i} delay={0.05 * i}>
            <p className="et-serif text-lg leading-relaxed text-[var(--et-text)] sm:text-xl sm:leading-relaxed">{p}</p>
          </FadeInOnScroll>
        ))}
      </div>

      <FadeInOnScroll className="mt-20">
        <h2 className="et-serif text-xl text-[var(--et-gold-bright)]">Nuestros compromisos</h2>
        <ul className="mt-6 flex flex-col gap-4">
          {compromisos.map((c) => (
            <li key={c} className="flex items-start gap-3 text-[var(--et-text-muted)]">
              <span aria-hidden="true" className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--et-gold-bright)]" />
              {c}
            </li>
          ))}
        </ul>
      </FadeInOnScroll>

      <FadeInOnScroll className="mt-24 text-center">
        <p className="et-serif text-2xl">Tu historia empieza a ser eterna hoy.</p>
        <Link href="/crear" className="et-btn et-btn-primary mt-6 inline-flex px-8">
          Crear mi legado
        </Link>
      </FadeInOnScroll>
    </article>
  );
}
