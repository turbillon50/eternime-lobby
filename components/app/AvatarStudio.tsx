"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button, Card } from "@/components/ui";
import type { CloneMessage } from "@/lib/clone/profile";
import styles from "./clone-studio.module.css";
type Job = { id: string; status: string; error: string | null; createdAt: string; mediaUrl: string | null };
type Portrait = { id: string; url: string };
const labels: Record<string, string> = { preparing: "Preparando tu voz y tu foto", submitting: "Enviando a HeyGen", processing: "Generando el video", completed: "Video listo", failed: "No se completó", uncertain: "Verificando la solicitud" };
async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store" }); const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "No pude completar esta acción. Intenta actualizar el estado.");
  return data;
}
export function AvatarStudio({ messages, onChat, voiceVersion = 0 }: { messages: CloneMessage[]; onChat: () => void; voiceVersion?: number }) {
  const [portrait, setPortrait] = useState<Portrait | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [configured, setConfigured] = useState(false);
  const [voiceReady, setVoiceReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const [photoConsent, setPhotoConsent] = useState(false);
  const [selected, setSelected] = useState("");
  const [remove, setRemove] = useState(false);
  const lock = useRef(false); const input = useRef<HTMLInputElement>(null); const alive = useRef(true);
  const replies = messages.filter(m => m.role === "clone" && m.content.length <= 350);
  const reply = replies.find(m => m.id === selected);
  const load = useCallback(async () => {
    const [photo, videos, voice] = await Promise.all([
      json<{ portrait: Portrait | null }>("/api/clone/portrait"),
      json<{ configured: boolean; jobs: Job[] }>("/api/clone/avatar"),
      json<{ voiceId: string | null }>("/api/voice/clone"),
    ]);
    if (!alive.current) return;
    setPortrait(photo.portrait); setJobs(videos.jobs); setConfigured(videos.configured); setVoiceReady(!!voice.voiceId); setLoaded(true);
  }, []);
  useEffect(() => { alive.current = true; void load().catch(e => { if (alive.current) setError(e.message); }); return () => { alive.current = false; }; }, [load, voiceVersion]);
  const activeIds = jobs.filter(j => ["preparing", "submitting", "processing", "uncertain"].includes(j.status)).map(j => j.id).join(",");
  useEffect(() => {
    if (!activeIds) return;
    let cancelled = false; let timer: ReturnType<typeof setTimeout>; let attempts = 0;
    const poll = async () => {
      if (cancelled) return;
      if (!document.hidden && navigator.onLine) {
        for (const id of activeIds.split(",")) {
          try { const data = await json<{ job: Job }>(`/api/clone/avatar/${id}`, { method: "POST" });
            if (!cancelled) setJobs(previous => previous.map(job => job.id === id ? data.job : job));
          } catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : "No pude consultar el video."); }
        }
        attempts++;
      }
      if (!cancelled && attempts < 30) timer = setTimeout(poll, 15_000);
    };
    timer = setTimeout(poll, 12_000);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [activeIds]);
  async function run(action: () => Promise<void>) {
    if (lock.current) return; lock.current = true; setBusy(true); setError("");
    try { await action(); } catch (e) { setError(e instanceof Error ? e.message : "Error de conexión."); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  }
  async function upload(file: File) {
    if (!photoConsent) return;
    await run(async () => {
      if (file.size > 3_500_000) throw new Error("Elige una foto de hasta 3.5 MB.");
      const body = new FormData(); body.append("file", file); body.append("consent", "true");
      const data = await json<{ portrait: Portrait }>("/api/clone/portrait", { method: "POST", body });
      setPortrait(data.portrait); setConsent(false);
    });
    if (input.current) input.current.value = "";
  }
  async function generate() {
    if (!portrait || !reply || !consent) return;
    await run(async () => {
      try {
        const result = await json<{ job: Job }>("/api/clone/avatar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ portraitId: portrait.id, exchangeId: reply.id, consent: true }) });
        setJobs(previous => [result.job, ...previous.filter(job => job.id !== result.job.id)]); setConsent(false);
      } finally { await load(); }
    });
  }
  return <Card>
    <div className={styles.chatTitle}><div><p className="eon-page-kicker">Mi avatar · HeyGen</p><h2>Tu imagen, tu voz, tus palabras.</h2></div><span className={styles.badge}>{loaded ? configured ? "Servicio configurado" : "Falta conectar" : "Consultando…"}</span></div>
    <p>Genera un video breve con una respuesta de tu clon. Podrás verlo aquí cuando esté listo; la generación puede tardar varios minutos.</p>
    <ol className={styles.checklist}>
      <li>{portrait ? "✓" : "1"} · Foto frontal {portrait ? "guardada" : "pendiente"}</li>
      <li>{voiceReady ? "✓" : "2"} · Voz personal {voiceReady ? "guardada" : "pendiente"}</li>
      <li>{reply ? "✓" : "3"} · Respuesta breve {reply ? "seleccionada" : "por elegir"}</li>
    </ol>
    <div className={styles.portraitRow}>
      {portrait ? <Image unoptimized src={portrait.url} alt="Tu foto elegida para el avatar" width={144} height={180} className={styles.portrait} /> : <div className={styles.portraitEmpty} aria-hidden="true"><svg viewBox="0 0 80 100" fill="none"><circle cx="40" cy="32" r="17" stroke="currentColor" strokeWidth="1.5"/><path d="M12 89c0-35 56-35 56 0" stroke="currentColor" strokeWidth="1.5"/></svg></div>}
      <div><p>Una foto tuya de frente, con buena luz y sin filtros. JPEG, PNG o WebP, hasta 3.5 MB y al menos 720 px por lado.</p>
        <label className={styles.check}><input type="checkbox" checked={photoConsent} disabled={busy} onChange={e => setPhotoConsent(e.target.checked)} />Confirmo que soy yo y autorizo guardar esta foto cifrada en mi clon.</label>
        <input ref={input} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { const file = e.target.files?.[0]; if (file) void upload(file); }} />
        <div className={styles.actions}><Button disabled={!photoConsent || !loaded || busy} onClick={() => input.current?.click()}>{portrait ? "Cambiar foto" : "Elegir mi foto"}</Button>{portrait && <Button variant="ghost" disabled={busy} onClick={() => setRemove(true)}>Eliminar foto</Button>}</div>
      </div>
    </div>
    {remove && <div className={styles.notice}><p>Se eliminará esta foto de Eternime. Los videos ya generados y las copias enviadas a HeyGen permanecen; puedes gestionar esas copias en HeyGen.</p><div className={styles.actions}><Button disabled={busy} onClick={() => void run(async () => { await json("/api/clone/portrait", { method: "DELETE" }); setPortrait(null); setRemove(false); setConsent(false); })}>Eliminar foto guardada</Button><Button variant="ghost" disabled={busy} onClick={() => setRemove(false)}>Conservar</Button></div></div>}
    <label className={styles.field}>Respuesta que dirá el avatar<select value={selected} disabled={busy} onChange={e => { setSelected(e.target.value); setConsent(false); }}><option value="">Elige una respuesta breve</option>{replies.slice().reverse().map(m => <option key={m.id} value={m.id}>{m.content.slice(0, 90)}{m.content.length > 90 ? "…" : ""}</option>)}</select></label>
    {reply && <blockquote className={styles.script}>{reply.content}<footer>{reply.content.length}/350 caracteres · voz personal</footer></blockquote>}
    {!replies.length && <Button variant="ghost" onClick={onChat}>Pedir una respuesta breve al clon</Button>}
    <label className={styles.check}><input type="checkbox" checked={consent} disabled={busy || !reply || !portrait} onChange={e => setConsent(e.target.checked)} /><span>Autorizo enviar mi foto y el audio de esta respuesta a HeyGen para generar este video. Esta acción consume saldo de las APIs.</span></label>
    <div className={styles.actions}><Button loading={busy} disabled={!configured || !voiceReady || !portrait || !reply || !consent} onClick={generate}>Generar mi video</Button><Button variant="ghost" disabled={busy} onClick={() => void run(async () => { await load(); for (const id of activeIds.split(",").filter(Boolean)) { const result = await json<{job: Job}>(`/api/clone/avatar/${id}`, {method:"POST"}); setJobs(previous => previous.map(j => j.id === id ? result.job : j)); } })}>Actualizar estado</Button></div>
    <small className={styles.hint}>Hasta 3 solicitudes de video al día. Repetir la misma selección recupera su solicitud. Los videos se generan por separado de una conversación en tiempo real.</small>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {!!jobs.length && <section className={styles.videoHistory} aria-label="Mis videos"><h3>Mis videos recientes</h3>{jobs.map(job => <article key={job.id} id={`video-${job.id}`}><div className={styles.chatTitle}><strong role="status">{labels[job.status] || "Consultando"}</strong><time dateTime={job.createdAt}>{new Date(job.createdAt).toLocaleString("es-MX")}</time></div>
      {job.mediaUrl && <><video controls playsInline preload="metadata" src={job.mediaUrl} aria-label="Video generado de mi clon" /><p className={styles.hint}>Representación digital generada con IA.</p></>}
      {job.error && <p className={styles.error}>{job.error}</p>}
      {!["completed", "failed"].includes(job.status) && <p className={styles.hint}>Puedes salir y volver. El registro de esta solicitud se conserva.</p>}
    </article>)}</section>}
  </Card>;
}
