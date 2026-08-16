import Link from "next/link";
import { getSession } from "@/lib/auth";
import { countMemories, listMemories } from "@/lib/data/memories";
import { countLetters } from "@/lib/data/letters";
import { countBeneficiaries } from "@/lib/data/beneficiaries";

export const dynamic = "force-dynamic";

export default async function AppHomePage() {
  const session = await getSession();
  const userId = session?.sub ?? "";
  const [memories, letters, people, recent] = userId ? await Promise.all([countMemories(userId), countLetters(userId), countBeneficiaries(userId), listMemories(userId)]) : [0,0,0,[]];
  const firstName = session?.name?.split(" ")[0] || "";
  return <div className="eon-chat-home">
    <section className="eon-welcome">
      <div className="eon-presence" aria-hidden><span/><span/><span/></div>
      <p className="eon-kicker">Eon está aquí</p>
      <h1>¿En qué puedo ayudarte{firstName ? `, ${firstName}` : ""}?</h1>
      <p className="eon-sub">Pregunta, recuerda, crea o conecta ideas. No tienes que organizar nada antes.</p>
    </section>

    <section className="eon-compose-card">
      <p>Pregúntale lo que quieras a Eon…</p>
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2"><Link href="/app/recuerdos" className="compose-action" aria-label="Guardar algo">＋</Link><Link href="/app/recuerdos" className="hidden sm:inline-flex eon-pill">Guardar algo</Link></div>
        <Link href="/app/hablar" className="eon-voice-btn" aria-label="Hablar con Eon"><span className="voice-bars"><i/><i/><i/></span></Link>
      </div>
    </section>

    <div className="eon-suggestions">
      <Link href="/app/hablar">¿Qué tengo pendiente?</Link><Link href="/app/recuerdos">Busca en mi memoria</Link><Link href="/app/guia">Ayúdame a pensar</Link><Link href="/app/beneficiarios">¿A quién conozco?</Link>
    </div>

    {(memories > 0 || letters > 0 || people > 0) && <section className="eon-context-strip"><span><b>{memories}</b> memorias</span><span><b>{people}</b> personas</span><span><b>{letters}</b> cartas</span></section>}

    {recent.length > 0 && <section className="eon-recent"><div className="flex items-center justify-between"><h2>Reciente</h2><Link href="/app/recuerdos">Ver memoria</Link></div><div className="mt-3 grid gap-2 sm:grid-cols-3">{recent.slice(0,3).map((m)=><Link href="/app/recuerdos" key={m.id} className="eon-recent-item"><span>{m.title || "Recuerdo"}</span><small>{m.kind || "memoria"}</small></Link>)}</div></section>}
  </div>;
}
