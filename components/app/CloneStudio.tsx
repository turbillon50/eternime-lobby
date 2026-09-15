"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card } from "@/components/ui";
import { AvatarStudio } from "./AvatarStudio";
import { CloneDictation } from "./CloneDictation";
import { CLONE_TOPICS, type CloneSnapshot, type CloneTopic } from "@/lib/clone/profile";
import styles from "./clone-studio.module.css";

class ApiError extends Error {
  constructor(message: string, public code?: string) { super(message); }
}
async function request<T>(url: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method, cache: "no-store", signal: AbortSignal.timeout(65000),
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
  const [tab, setTab] = useState<"dialogo" | "memoria" | "presencia">("presencia");
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
  const busyLock = useRef(false);
  const draftCache = useRef<Partial<Record<CloneTopic, { text: string; revision: number }>>>({});
  const audioAbort = useRef<AbortController | null>(null);
  const messagesBox = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const [online, setOnline] = useState(true);
  const [newMessages, setNewMessages] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const savedContent = snapshot?.facts.find(f => f.topic === topic)?.content ?? "";
  const dirty = draft !== savedContent;
  useEffect(() => {
    const update = () => setOnline(navigator.onLine); update();
    window.addEventListener("online", update); window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    if (dirty || message.trim() || Object.keys(draftCache.current).length) window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, message, topic]);
  async function copy(id: string, text: string) {
    try { await navigator.clipboard.writeText(text); setCopied(id); setNotice("Texto copiado."); }
    catch { setError("No pude copiar. Puedes seleccionar el texto y copiarlo manualmente."); }
  }
  function exportSnapshot() {
    if (!snapshot) return;
    const file = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), scope: "Memoria y últimas 30 conversaciones de mi clon", ...snapshot }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(file); const link = document.createElement("a"); link.href = url; link.download = "mi-clon.json"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function scrollToLatest() { nearBottom.current = true; setNewMessages(false); bottom.current?.scrollIntoView({ block: "nearest" }); }
  async function refresh() {
    await operate(async () => { const data = await request<CloneSnapshot>("/api/clone"); setSnapshot(data); if (!dirty) selectTopic(topic, data); setNotice("Conversación y memoria actualizadas."); });
  }

  function stopAudio() {
    audioRequest.current++;
    audioAbort.current?.abort(); audioAbort.current = null;
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
    }).catch(e => { if (active) { setCode(e.code || ""); if (!["CLONE_NOT_INITIALIZED", "TENANT_UNAVAILABLE"].includes(e.code)) setError(e.message); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => { if (nearBottom.current) bottom.current?.scrollIntoView({ block: "nearest" }); else setNewMessages(true); }, [snapshot?.messages.length, tab]);

  async function operate(action: () => Promise<void>) {
    if (busyLock.current) return;
    busyLock.current = true; setBusy(true); setError(""); setNotice("");
    try { await action(); } catch (e) { setError(e instanceof Error ? e.message : "Error de conexión."); }
    finally { busyLock.current = false; setBusy(false); }
  }
  function selectTopic(value: CloneTopic, data = snapshot) {
    if (data === snapshot && dirty) draftCache.current[topic] = { text: draft, revision };
    const fact = data?.facts.find(f => f.topic === value);
    const cached = draftCache.current[value];
    setTopic(value); setDraft(cached?.text ?? fact?.content ?? ""); setRevision(cached?.revision ?? fact?.revision ?? 0);
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
      delete draftCache.current[topic];
      setSnapshot(data); selectTopic(topic, data); setNotice("Guardado como una nueva versión. El clon usará esta información en las siguientes respuestas.");
    });
  }
  async function send() {
    if (!message.trim() || !online) return;
    await operate(async () => {
      const text = message.trim();
      if (pending.current?.text !== text) pending.current = { id: crypto.randomUUID(), text };
      await request("/api/clone/messages", "POST", { id: pending.current.id, content: text });
      // Preserve the same request ID until the refresh succeeds, allowing safe retry.
      const data = await request<CloneSnapshot>("/api/clone");
      setSnapshot(data); setMessage(""); pending.current = null; nearBottom.current = true;
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
      audioAbort.current = new AbortController();
      const response = await fetch("/api/clone/voice", { signal: audioAbort.current.signal, method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
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
    <header className={styles.intro}><h1>Mi clon</h1><p>Tu foto y tu voz. Escribe algo y pruébalo.</p></header>
    <nav className={styles.tabs} aria-label="Espacios de mi clon">
      {([ ["presencia", "Foto y voz"], ["dialogo", "Conversar"], ["memoria", "Memoria"] ] as const).map(([id, label]) =>
        <button key={id} type="button" aria-current={tab === id ? "page" : undefined} onClick={() => { stopAudio(); setSpeechUrl(null); setSpeaking(null); setTab(id); if (id !== "presencia" && !snapshot) { void request<CloneSnapshot>("/api/clone").then(data => { setSnapshot(data); setCode(""); }).catch(() => undefined); } }}>{label}</button>)}
    </nav>
    {!online && <p role="status" className={styles.notice}>Sin conexión. Tu borrador sigue aquí; espera a reconectarte para enviarlo.</p>}
    {error && tab !== "presencia" && <p role="alert" className={styles.error}>{error}</p>}
    {notice && tab !== "presencia" && <p role="status" className={styles.notice}>{notice}</p>}
    {tab === "presencia" ? <AvatarStudio /> : loading ? <div className={styles.skeleton} role="status" aria-label="Abriendo la memoria de tu clon"><span/><span/><span/><p>Abriendo la memoria de tu clon…</p></div> : !snapshot ? <Card>
      <h2>{(code === "CLONE_NOT_INITIALIZED" || code === "TENANT_UNAVAILABLE") ? "Empieza con tu propia memoria" : "Necesitamos recuperar tu espacio personal"}</h2>
      <p>Tu clon tendrá una memoria independiente. Sus conversaciones y lo que confirmes sobre ti se guardarán aquí.</p>
      {(code === "CLONE_NOT_INITIALIZED" || code === "TENANT_UNAVAILABLE") ? <Button onClick={initialize} loading={busy}>Iniciar la memoria de mi clon</Button> : <Button variant="ghost" onClick={() => window.location.reload()}>Reintentar</Button>}
    </Card> : <>
      <div className={styles.actions}><Button variant="ghost" disabled={busy || !online} onClick={refresh}>Actualizar mi espacio</Button><Button variant="ghost" onClick={exportSnapshot}>Descargar mi memoria y conversación reciente</Button></div>
      {tab === "memoria" ? <Card>
        <h2>Lo que confirmo sobre mí</h2>
        <p>Esto nutre al clon. Las conversaciones se conservan como historial; sus respuestas no se convierten solas en recuerdos tuyos.</p>
        <label className={styles.field}>Tema
          <select value={topic} disabled={busy} onChange={e => selectTopic(e.target.value as CloneTopic)}>
            {CLONE_TOPICS.map(t => <option key={t.id} value={t.id}>{t.label}{snapshot.facts.some(f => f.topic === t.id && f.content.trim()) ? " · ✓" : " · pendiente"}</option>)}
          </select>
        </label>
        <label className={styles.field}>{currentTopic.prompt}
          <textarea rows={7} maxLength={3000} value={draft} disabled={busy} onChange={e => setDraft(e.target.value)} placeholder="Escribe lo que quieres que mi clon sepa de mí…" />
        </label>
        <div className={styles.actions}><Button onClick={saveMemory} loading={busy} disabled={!dirty || !online}>Confirmar y guardar</Button><small>{dirty ? "Sin guardar · " : "Guardado · "}{draft.length}/3,000 · versión actual {revision || "sin iniciar"}</small></div>
        {dirty && <Button variant="ghost" disabled={busy} onClick={() => { delete draftCache.current[topic]; setDraft(savedContent); setRevision(snapshot.facts.find(f => f.topic === topic)?.revision ?? 0); }}>Descartar cambios de este tema</Button>}
        <details className={styles.versions}><summary>Cómo ha cambiado mi memoria</summary>
          {snapshot.versions.filter(v => v.topic === topic).map(v => <article key={`${v.topic}-${v.revision}`}>
            <b>Versión {v.revision}</b><time dateTime={v.createdAt}>{new Date(v.createdAt).toLocaleDateString("es-MX")}</time><p>{v.content || "Sin contenido activo"}</p>
            <Button variant="ghost" disabled={busy} onClick={() => { setDraft(v.content); setNotice("Revisa el texto recuperado y confirma para guardarlo como una nueva versión."); }}>Usar este texto</Button>
          </article>)}
          {!snapshot.versions.some(v => v.topic === topic) && <p>Todavía no hay versiones de este tema.</p>}
        </details>
      </Card> : <Card>
        <div className={styles.chatTitle}><h2>Hablar conmigo</h2><small>Texto y voz · memoria independiente de Eon</small></div>
        {!snapshot.messages.length && <p>Empieza con una pregunta sobre algo que ya le hayas enseñado. Después, marca si te reconoces en su respuesta.</p>}
        {!snapshot.messages.length && !!snapshot.progress.covered && <div className={styles.actions}>{["¿Qué es importante para mí?", "¿Cómo contaría yo mi historia?", "¿Qué te falta saber sobre mí?"].map(prompt => <button key={prompt} onClick={() => setMessage(prompt)}>{prompt}</button>)}</div>}
        <div ref={messagesBox} onScroll={() => { const el = messagesBox.current; if (el) nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100; }} className={styles.messages} role="log" aria-label="Conversación con mi clon" aria-live="polite" aria-relevant="additions" aria-busy={busy}>
          {snapshot.messages.map(m => <article key={m.id} className={m.role === "user" ? styles.userMessage : styles.cloneMessage}>
            <div className={styles.chatTitle}><small>{m.role === "user" ? "Tú" : "Tu clon"}</small><time dateTime={m.createdAt}>{new Date(m.createdAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</time></div><p>{m.content}</p>
            {m.role === "clone" && <div className={styles.actions}>
              <button disabled={busy} aria-pressed={m.recognized === true} onClick={() => review(m.id, true)}>Sí me representa</button>
              <button disabled={busy} aria-pressed={m.recognized === false} onClick={() => review(m.id, false)}>Todavía no</button>
              <button disabled={!online} onClick={() => listen(m.id)}>{speaking === m.id ? speechUrl ? "Cerrar audio" : "Cancelar espera de audio" : "Escuchar con mi voz"}</button><button onClick={() => void copy(m.id, m.content)}>{copied === m.id ? "Copiado" : "Copiar respuesta"}</button>
            </div>}
          </article>)}{busy && <p role="status" className={styles.thinking}>Tu clon está procesando la solicitud…</p>}<div ref={bottom} />
        </div>
        {newMessages && <button className={styles.textButton} onClick={scrollToLatest}>Ver mensajes recientes ↓</button>}
        {speaking && !speechUrl && <p role="status">Preparando tu audio…</p>}
        {speechUrl && <audio ref={audio} controls src={speechUrl} className="w-full" aria-label="Respuesta de mi clon con mi voz" />}
        <form className={styles.composer} onSubmit={e => { e.preventDefault(); void send(); }}>
          <label className={styles.field}>Tu mensaje<textarea value={message} onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); void send(); } }} onChange={e => setMessage(e.target.value)} maxLength={4000} rows={3} disabled={busy} placeholder="¿Cómo contaría yo esa historia?" /></label>
          <div className={styles.actions}><Button type="submit" loading={busy} disabled={!online || !message.trim() || !snapshot.progress.covered}>Enviar a mi clon</Button><small>{message.length}/4,000 · Ctrl/⌘ + Enter para enviar</small></div><CloneDictation disabled={busy} onText={text => setMessage(previous => `${previous}${previous ? " " : ""}${text}`.slice(0, 4000))} />
        </form>
        {!snapshot.progress.covered && <button className={styles.textButton} onClick={() => setTab("memoria")}>Primero, enseñarle algo sobre mí →</button>}
      </Card>}
    </>}
  </div>;
}
