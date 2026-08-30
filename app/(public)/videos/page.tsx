import type { Metadata } from "next";
import Link from "next/link";
import { OfficialVideo } from "@/components/public/official-video";
import { SocialShare } from "@/components/public/social-share";
import { ETERNIME_PLANS } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Videos y redes | Eternime",
  description: "Conoce Eternime: un hogar para tu memoria, tus relaciones y el legado que construyes cada día.",
  openGraph: {
    title: "Eternime: tu hogar de memoria",
    description: "Memoria, relaciones y legado que permanecen contigo.",
    type: "video.other",
    locale: "es_MX",
    images: ["https://eternime.org/media/eternime-hogar-poster.webp"],
  },
};

export default function VideosPage() {
  const semilla = ETERNIME_PLANS.find((plan) => plan.nombre === "Semilla");
  const legado = ETERNIME_PLANS.find((plan) => plan.nombre === "Legado");

  return (
    <main className="official-media-page">
      <section className="official-media-hero">
        <p className="eon-kicker">Historias Eternime</p>
        <h1>Tu hogar de memoria.</h1>
        <p>
          Eternime mantiene cerca tus recuerdos, tu contexto, tus relaciones y el legado que construyes mientras vives.
        </p>
      </section>

      <OfficialVideo className="official-media-page__video" />

      <nav className="official-media-paths" aria-label="Explorar Eternime">
        <Link href="/app/red">
          <span>01</span><b>Cómo crece Mi Red</b><small>Personas, vínculos y contexto</small>
        </Link>
        <Link href="/app/integraciones">
          <span>02</span><b>Conexiones</b><small>Servicios bajo tu autorización</small>
        </Link>
        <Link href="/precios">
          <span>03</span><b>Planes y costos</b><small>{semilla?.nombre} ${semilla?.precio} · {legado?.nombre} ${legado?.precio} {legado?.periodo}</small>
        </Link>
      </nav>

      <section className="official-social-panel va-crystal">
        <div>
          <p className="eon-kicker">Videos y redes</p>
          <h2>Comparte la historia.</h2>
          <p>Lleva la visión de Eternime a las personas que también quieren conservar lo importante.</p>
        </div>
        <SocialShare />
      </section>

      <section className="official-media-cta">
        <p>Tu memoria empieza con lo que decides guardar hoy.</p>
        <Link href="/sign-up">Crear mi Eternime →</Link>
      </section>
    </main>
  );
}
