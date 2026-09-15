"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { VoiceClone } from "@/components/app/VoiceClone";
import { IdentityCapture } from "@/components/app/IdentityCapture";
import { CLONE_TOPICS, type CloneSnapshot, type CloneTopic } from "@/lib/clone/profile";
import styles from "./clone-studio.module.css";

class ApiError extends Error {
  constructor(message: string, public code?: string) { super(message); }
}
async function request<T>(url: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method, cache: "no-store",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(data.error || "No pude completar la operación. Intenta de nuevo.", data.code);
  return data;
}

export function CloneStudio() {
  const [snapshot, setSnapshot] = useState<CloneSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"dialogo" | "memoria" | "presencia">("dialogo");
  const [topic, setTopic] = useState<CloneTopic>("historia");
  const [draft, setDraft] = useState("");
  const [revision, setRevision] = useState(0);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const pending = useRef<{ id: string; text: string } | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const audioUrl = useRef<string | null>(null);
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [speechUrl, setSpeechUrl] = useState<string | null>(null);
  const audioRequest = useRef(0);

  function stopAudio() {
    audioRequest.current++;
    audio.current?.pause();
    audio.current = null;
    if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
    audioUrl.current = null;
  }
  useEffect(() => () => stopAudio(), []);
  useEffect(() => {
    let active = true;
    request<CloneSnapshot>("/api/clone").then(data => {
      if (!active) return;
      setSnapshot(data);
      const fact = data.facts.find(f => f.topic === "historia");
      setDraft(fact?.content ?? ""); setRevision(fact?.revision ?? 0);
    }).catch(e => { if (active) { setCode(e.code || ""); setError(e.message); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => { bottom.current?.scrollIntoView({ block: "nearest" }); }, [snapshot?.messages.length, tab]);

  async function operate(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try { await action(); } catch (e) { setError(e instanceof Error ? e.message : "Error de conexión."); }
    finally { setBusy(false); }
  }
  function selectTopic(value: CloneTopic, data = snapshot) {
    const fact = data?.facts.find(f => f.topic === value);
    setTopic(value); setDraft(fact?.content ?? ""); setRevision(fact?.revision ?? 0);
  }
  async function initialize() {
    await operate(async () => {
      const data = await request<CloneSnapshot>("/api/clone", "POST", { action: "initialize", consent: true });
      setSnapshot(data); setCode(""); setTab("memoria"); selectTopic("historia", data);
    });
  }
  async function saveMemory() {
    await operate(async () => {
      const data = await request<CloneSnapshot>("/api/clone", "PATCH", { topic, content: draft, revision, confirmed: true });
      setSnapshot(data); selectTopic(topic, data); setNotice("Guardado como una nueva versión. El clon usará esta información en las siguientes respuestas.");
    });
  }
  async function send() {
    if (!message.trim()) return;
    await operate(async () => {
      const text = message.trim();
      if (pending.current?.text !== text) pending.current = { id: crypto.randomUUID(), text };
      await request("/api/clone/messages", "POST", { id: pending.current.id, content: text });
      // Preserve the same request ID until the refresh succeeds, allowing safe retry.
      const data = await request<CloneSnapshot>("/api/clone");
      setSnapshot(data); setMessage(""); pending.current = null;
    });
  }
  async function review(id: string, recognized: boolean) {
    await operate(async () => {
      setSnapshot(await request<CloneSnapshot>("/api/clone/messages", "PATCH", { id, recognized }));
      if (!recognized) setNotice("Gracias. En Mi memoria puedes corregir el dato o enseñar cómo lo dirías tú.");
    });
  }
  async function listen(id: string) {
    stopAudio(); setSpeechUrl(null);
    if (speaking === id) { setSpeaking(null); return; }
    setSpeaking(id); setError("");
    const requestId = audioRequest.current;
    try {
      const response = await fetch("/api/clone/voice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || "No pude generar el audio."); }
      const blob = await response.blob();
      if (requestId !== audioRequest.current) return;
      const url = URL.createObjectURL(blob); audioUrl.current = url; setSpeechUrl(url);
      setNotice("Tu audio está listo. Pulsa reproducir para escucharlo con tu voz.");
    } catch (e) {
      if (requestId === audioRequest.current) { stopAudio(); setSpeaking(null); setError(e instanceof Error ? e.message : "No pude generar el audio."); }
    }
  }

  const currentTopic = CLONE_TOPICS.find(t => t.id === topic)!;
  return <div className={styles.studio}>
    <div className={styles.intro}>
      <p className="eon-screen-kicker">Mi clon · en formación</p>
      <h1 className="eon-screen-title">Una presencia que construyes contigo.</h1>
      <p className="eon-screen-sub">Conversa, enséñale cómo eres y corrige lo que todavía no te representa.</p>
      <Link href="/app">Volver a Eon →</Link>
    </div>
    <nav className={styles.tabs} aria-label="Espacios de mi clon">
      {([ ["dialogo", "Hablar conmigo"], ["memoria", "Mi memoria"], ["presencia", "Mi voz y mi imagen"] ] as const).map(([id, label]) =>
        <button key={id} type="button" aria-current={tab === id ? "page" : undefined} onClick={() => { stopAudio(); setSpeechUrl(null); setSpeaking(null); setTab(id); }}>{label}</button>)}
    </nav>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {notice && <p role="status" className={styles.notice}>{notice}</p>}
    {tab === "presencia" ? <>
      <VoiceClone />
      <IdentityCapture />
      <Card><h2>Mi avatar</h2><p>La generación del avatar con HeyGen aún no está conectada. Guardar fotos prepara tu archivo visual; todavía no genera un avatar.</p></Card>
    </> : loading ? <p role="status">Abriendo la memoria de tu clon…</p> : !snapshot ? <Card>
      <h2>{(code === "CLONE_NOT_INITIALIZED" || code === "TENANT_UNAVAILABLE") ? "Empieza con tu propia memoria" : "Necesitamos recuperar tu espacio personal"}</h2>
      <p>Tu clon tendrá una memoria independiente. Sus conversaciones y lo que confirmes sobre ti se guardarán aquí.</p>
      {(code === "CLONE_NOT_INITIALIZED" || code === "TENANT_UNAVAILABLE") ? <Button onClick={initialize} loading={busy}>Iniciar la memoria de mi clon</Button> : <Button variant="ghost" onClick={() => window.location.reload()}>Reintentar</Button>}
    </Card> : <>
      <div className={styles.metrics}>
        <Card><p>Cobertura inicial</p><strong>{snapshot.progress.coveragePercent}%</strong><p>{snapshot.progress.covered} de {snapshot.progress.totalTopics} temas con información confirmada.</p><small>Mide este primer cuestionario, no cuánto eres tú.</small></Card>
        <Card><p>Me reconozco en sus respuestas</p><strong>{snapshot.progress.recognitionPercent === null ? "Por evaluar" : `${snapshot.progress.recognitionPercent}%`}</strong><p>{snapshot.progress.reviewCount} respuestas evaluadas con tu versión actual de memoria.</p><small>Tu valoración personal; no es una certificación de identidad.</small></Card>
      </div>
      {tab === "memoria" ? <Card>
        <h2>Lo que confirmo sobre mí</h2>
        <p>Esto nutre al clon. Las conversaciones se conservan como historial; sus respuestas no se convierten solas en recuerdos tuyos.</p>
        <label className={styles.field}>Tema
          <select value={topic} disabled={busy} onChange={e => selectTopic(e.target.value as CloneTopic)}>
            {CLONE_TOPICS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </label>
        <label className={styles.field}>{currentTopic.prompt}
          <textarea rows={7} maxLength={3000} value={draft} disabled={busy} onChange={e => setDraft(e.target.value)} placeholder="Escribe lo que quieres que mi clon sepa de mí…" />
        </label>
        <div className={styles.actions}><Button onClick={saveMemory} loading={busy}>Confirmar y guardar</Button><small>{draft.length}/3,000 · versión actual {revision || "sin iniciar"}</small></div>
        <details className={styles.versions}><summary>Cómo ha cambiado mi memoria</summary>
          {snapshot.versions.filter(v => v.topic === topic).map(v => <article key={`${v.topic}-${v.revision}`}>
            <b>Versión {v.revision}</b><time>{new Date(v.createdAt).toLocaleDateString("es-MX")}</time><p>{v.content || "Sin contenido activo"}</p>
            <Button variant="ghost" disabled={busy} onClick={() => { setDraft(v.content); setNotice("Revisa el texto recuperado y confirma para guardarlo como una nueva versión."); }}>Usar este texto</Button>
          </article>)}
          {!snapshot.versions.some(v => v.topic === topic) && <p>Todavía no hay versiones de este tema.</p>}
        </details>
      </Card> : <Card>
        <div className={styles.chatTitle}><h2>Hablar conmigo</h2><small>Clon digital en formación · conversación por texto</small></div>
        {!snapshot.messages.length && <p>Empieza con una pregunta sobre algo que ya le hayas enseñado. Después, marca si te reconoces en su respuesta.</p>}
        <div className={styles.messages} aria-live="polite" aria-busy={busy}>
          {snapshot.messages.map(m => <article key={m.id} className={m.role === "user" ? styles.userMessage : styles.cloneMessage}>
            <small>{m.role === "user" ? "Tú" : "Tu clon"}</small><p>{m.content}</p>
            {m.role === "clone" && <div className={styles.actions}>
              <button disabled={busy} aria-pressed={m.recognized === true} onClick={() => review(m.id, true)}>Sí me representa</button>
              <button disabled={busy} aria-pressed={m.recognized === false} onClick={() => review(m.id, false)}>Todavía no</button>
              <button onClick={() => listen(m.id)}>{speaking === m.id ? "Detener audio" : "Escuchar con mi voz"}</button>
            </div>}
          </article>)}<div ref={bottom} />
        </div>
        {speechUrl && <audio ref={audio} controls src={speechUrl} className="w-full" aria-label="Respuesta de mi clon con mi voz" />}
        <form className={styles.composer} onSubmit={e => { e.preventDefault(); void send(); }}>
          <label className={styles.field}>Tu mensaje<textarea value={message} onChange={e => setMessage(e.target.value)} maxLength={4000} rows={3} disabled={busy} placeholder="¿Cómo contaría yo esa historia?" /></label>
          <Button type="submit" loading={busy} disabled={!message.trim() || !snapshot.progress.covered}>Enviar a mi clon</Button>
        </form>
        {!snapshot.progress.covered && <button className={styles.textButton} onClick={() => setTab("memoria")}>Primero, enseñarle algo sobre mí →</button>}
      </Card>}
    </>}
  </div>;
}
