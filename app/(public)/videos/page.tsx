import type { Metadata } from "next";
import Link from "next/link";
import { OfficialVideo } from "@/components/public/official-video";
import { SocialShare } from "@/components/public/social-share";

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
