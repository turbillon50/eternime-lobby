import type { Metadata } from "next";
import Link from "next/link";
import { EonOrb } from "@/components/visual/VisualArtifacts";

export const metadata: Metadata = {
  title: "Eternime — Tu segunda memoria",
  description: "Una memoria personal asistida por IA para recordar, pensar, conectar y construir tu historia mientras vives.",
  openGraph: { title: "Eternime — Tu segunda memoria", description: "Recuerda contigo. Crece contigo. Permanece contigo.", locale: "es_MX", type: "website" },
};

export default function HomePage() {
  return <div className="eon-public-home">
    <section className="eon-public-hero va-crystal va-spatial">
      <div className="eon-public-mesh" aria-hidden />
      <EonOrb className="eon-public-orb" label="EON, la memoria viva de Eternime" />
      <p className="eon-kicker">Eternime · Personal memory intelligence</p>
      <h1>Tu segunda memoria.</h1>
      <p className="lead">Habla con Eon. Guarda lo importante. Recupera ideas, personas, proyectos y decisiones cuando las necesites.</p>
      <div className="actions"><Link href="/crear" className="primary">Empezar</Link><Link href="/entrar" className="secondary">Ya tengo cuenta</Link></div>
      <div className="prompt-preview"><span>¿Qué quieres recordar, crear o entender?</span><b>↗</b></div>
    </section>

    <section className="eon-public-grid">
      <article><small>MEMORIA</small><h2>No vuelvas a empezar de cero.</h2><p>Eon organiza lo que dices, guardas y decides para devolvértelo con contexto cuando importa.</p></article>
      <article><small>RED</small><h2>Recuerda quién sabe qué.</h2><p>Personas, capacidades, proyectos y relaciones se conectan en un grafo vivo de tu mundo.</p></article>
      <article><small>VIDA</small><h2>Tu historia se construye sola.</h2><p>El legado deja de ser una tarea futura: aparece naturalmente porque Eternime te acompaña hoy.</p></article>
    </section>

    <section className="eon-mcp-public va-crystal">
      <div><small>EON TRUST · MCP</small><h2>Tu memoria no pertenece al modelo.</h2><p>Conecta Eternime con distintas inteligencias y decide qué puede conocer cada una. ChatGPT para una cosa, Claude para otra, mañana una IA nueva. Tu contexto permanece contigo.</p></div>
      <div className="eon-mcp-flow"><span>Eternime</span><i>→</i><b>Tu contexto autorizado</b><i>→</i><span>La IA que elijas</span></div>
      <ul><li>Credenciales separadas por IA</li><li>Permisos por memoria, proyectos, pendientes y red</li><li>Acceso revocable y auditable</li><li>La Bóveda queda fuera por defecto</li></ul>
      <Link href="/crear">Crear mi memoria portátil →</Link>
    </section>

    <section className="eon-public-statement va-spatial"><p>Un asistente que no sólo responde.</p><h2>Te conoce porque recuerda contigo.</h2><Link href="/crear">Crear mi memoria →</Link></section>
  </div>;
}
