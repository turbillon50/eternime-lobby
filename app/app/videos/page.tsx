import type { Metadata } from "next";
import Link from "next/link";

import { SocialImport } from "@/components/app/SocialImport";
import { OfficialVideo } from "@/components/public/official-video";
import { SocialShare } from "@/components/public/social-share";
import { ETERNIME_PLANS } from "@/lib/plans";

export const metadata: Metadata = { title: "Videos y redes" };

function PathIcon({ path }: { path: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={path}/></svg>;
}

export default function AppVideosPage() {
  const semilla = ETERNIME_PLANS.find((plan) => plan.nombre === "Semilla");
  const legado = ETERNIME_PLANS.find((plan) => plan.nombre === "Legado");

  return (
    <div className="eon-growth-hub">
      <header className="eon-page-head">
        <span className="eon-page-mark" />
        <div>
          <p className="eon-page-kicker">Expande tu memoria</p>
          <h1>Videos, red y crecimiento</h1>
          <p>Conoce la visión de Eternime, forma tu red y conecta únicamente las fuentes que tú autorices.</p>
        </div>
      </header>

      <section className="eon-growth-priority" aria-labelledby="growth-priority-title">
        <div className="eon-growth-priority__head">
          <p className="eon-page-kicker">Tu sistema</p>
          <h2 id="growth-priority-title">Tres caminos importantes</h2>
          <p>Cada uno abre una función real de tu cuenta; no son enlaces de marketing.</p>
        </div>
        <div className="eon-growth-grid">
          <Link href="/app/red" className="eon-growth-card is-primary">
            <span className="eon-growth-card__icon"><PathIcon path="M4 19c2-3 4.7-4.5 8-4.5S18 16 20 19M8.5 9a3.5 3.5 0 1 0 7 0 3.5 3.5 0 0 0-7 0Z" /></span>
            <small>Mi Red</small><h3>Forma relaciones con contexto.</h3>
            <p>Agrega personas, importa un archivo VCF y conecta fuentes disponibles con tu permiso.</p>
            <b>Abrir Mi Red <span aria-hidden>→</span></b>
          </Link>
          <Link href="/app/integraciones" className="eon-growth-card">
            <span className="eon-growth-card__icon"><PathIcon path="M8 12h8M7 8H5a4 4 0 0 0 0 8h2M17 8h2a4 4 0 0 1 0 8h-2" /></span>
            <small>Conexiones</small><h3>Autoriza servicios, uno por uno.</h3>
            <p>Memoria propia, correo y herramientas externas con permisos visibles y revocables.</p>
            <b>Ver conexiones <span aria-hidden>→</span></b>
          </Link>
          <Link href="/precios" className="eon-growth-card">
            <span className="eon-growth-card__icon"><PathIcon path="M5 5h14v14H5zM8 9h8M8 13h5" /></span>
            <small>Planes y costos</small><h3>{semilla?.nombre} ${semilla?.precio} · {legado?.nombre} ${legado?.precio}</h3>
            <p>{semilla?.periodo}. Legado: {legado?.periodo}. Consulta también el plan Socio.</p>
            <b>Comparar planes <span aria-hidden>→</span></b>
          </Link>
        </div>
      </section>

      <section className="eon-growth-feature">
        <div className="eon-growth-feature__copy">
          <p className="eon-page-kicker">Video oficial</p>
          <h2>Tu hogar de memoria.</h2>
          <p>Una mirada a los recuerdos, relaciones y legado que Eternime mantiene bajo tu control.</p>
        </div>
        <OfficialVideo className="eon-growth-video" />
        <div className="eon-growth-share"><SocialShare /></div>
      </section>

      <section className="eon-network-method" aria-labelledby="network-method-title">
        <div>
          <p className="eon-page-kicker">Cómo se forma</p>
          <h2 id="network-method-title">Tu red nace de datos que tú eliges.</h2>
        </div>
        <ol>
          <li><span>01</span><div><b>Agrega personas</b><p>Registra relaciones manualmente o importa tus contactos mediante VCF.</p></div></li>
          <li><span>02</span><div><b>Autoriza fuentes</b><p>Conecta sólo los servicios disponibles que quieras usar.</p></div></li>
          <li><span>03</span><div><b>Eon conecta contexto</b><p>La relación aparece junto a proyectos, recuerdos y decisiones asociadas.</p></div></li>
        </ol>
      </section>

      <SocialImport />
    </div>
  );
}
