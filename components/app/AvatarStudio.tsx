"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button, Card } from "@/components/ui";
import { VoiceClone } from "./VoiceClone";
import type { VoiceDelivery } from "@/lib/voice/personal-settings";
import styles from "./clone-studio.module.css";
type Job = { id: string; status: string; error: string | null; createdAt: string; mediaUrl: string | null };
type Portrait = { id: string; url: string };
const labels: Record<string, string> = { preparing: "Preparando tu video…", submitting: "Enviando tu video…", processing: "Generando tu video…", completed: "Tu clon hablando", failed: "El video no se completó", uncertain: "Verificando tu video…" };
async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store" }); const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "No pude completar esta acción. Intenta de nuevo.");
  return data;
}
// Compress phone photos before upload; Safari applies orientation when decoding.
async function preparePhoto(file: File): Promise<File> {
  if (file.size > 30_000_000) throw new Error("Elige una foto de menos de 30 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = new window.Image(); image.src = url;
    await image.decode().catch(() => { throw new Error("No pude abrir esa foto. Exporta una copia en JPEG o elige otra de tu galería."); });
    if (Math.min(image.naturalWidth, image.naturalHeight) < 720) throw new Error("Elige una foto más grande, de al menos 720 píxeles por lado.");
    const scale = Math.min(1, 2000 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas"); canvas.width = Math.round(image.naturalWidth * scale); canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext("2d"); if (!context) throw new Error("No pude preparar la foto. Intenta con otro navegador.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", .9));
    if (!blob || blob.size > 3_500_000) throw new Error("Prueba con una foto de menor tamaño.");
    return new File([blob], "mi-foto.jpg", { type: "image/jpeg" });
  } finally { URL.revokeObjectURL(url); }
}
export function AvatarStudio() {
  const [portrait, setPortrait] = useState<Portrait | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [configured, setConfigured] = useState(false);
  const [voiceReady, setVoiceReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<"photo" | "audio" | "video" | "refresh" | null>(null);
  const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const [consent, setConsent] = useState(false); const [photoConsent, setPhotoConsent] = useState(false);
  const [text, setText] = useState("Hola, soy yo. Esta es una prueba de mi voz. ¿Qué te parece cómo sueno?");
  const [delivery, setDelivery] = useState<VoiceDelivery>("natural");
  const [speech, setSpeech] = useState<{ url: string; text: string } | null>(null);
  const [remove, setRemove] = useState(false);
  const lock = useRef(false); const input = useRef<HTMLInputElement>(null); const alive = useRef(true); const player = useRef<HTMLAudioElement>(null);
  const load = useCallback(async () => {
    const results = await Promise.allSettled([
      json<{ portrait: Portrait | null }>("/api/clone/portrait").then(data => { if (alive.current) setPortrait(data.portrait); }),
      json<{ configured: boolean; jobs: Job[] }>("/api/clone/avatar").then(data => { if (alive.current) { setJobs(data.jobs); setConfigured(data.configured); } }),
      json<{ voiceId: string | null }>("/api/voice/clone").then(data => { if (alive.current) setVoiceReady(!!data.voiceId); }),
    ]);
    if (!alive.current) return;
    setLoaded(true);
    const failed = results.find(result => result.status === "rejected");
    if (failed?.status === "rejected") throw failed.reason;
  }, []);
  useEffect(() => { alive.current = true; void load().catch(e => { if (alive.current) setError(e.message); }); return () => { alive.current = false; }; }, [load]);
  const activeIds = jobs.filter(j => ["preparing", "submitting", "processing", "uncertain"].includes(j.status)).map(j => j.id).join(",");
  const refreshJobs = useCallback(async () => {
    for (const id of activeIds.split(",").filter(Boolean)) {
      const data = await json<{ job: Job }>(`/api/clone/avatar/${id}`, { method: "POST" });
      if (alive.current) setJobs(previous => previous.map(job => job.id === id ? data.job : job));
    }
  }, [activeIds]);
  useEffect(() => {
    if (!activeIds) return;
    let cancelled = false; let timer: ReturnType<typeof setTimeout>; let attempts = 0;
    const poll = async () => {
      if (cancelled) return;
      if (!document.hidden && navigator.onLine) {
        try { await refreshJobs(); } catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : "No pude consultar tu video."); }
        attempts++;
      }
      if (!cancelled && attempts < 40) timer = setTimeout(poll, 15_000);
    };
    timer = setTimeout(poll, 8_000);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [activeIds, refreshJobs]);
  useEffect(() => { if (speech) void player.current?.play().catch(() => setNotice("Tu audio está listo. Pulsa ▶ para escucharlo.")); }, [speech]);
  async function run(kind: NonNullable<typeof busy>, action: () => Promise<void>) {
    if (lock.current) return; lock.current = true; setBusy(kind); setError(""); setNotice("");
    try { await action(); } catch (e) { if (alive.current) setError(e instanceof Error ? e.message : "Error de conexión."); }
    finally { lock.current = false; if (alive.current) setBusy(null); }
  }
  async function upload(file: File) {
    if (!photoConsent) return;
    await run("photo", async () => {
      const body = new FormData(); body.append("file", await preparePhoto(file)); body.append("consent", "true");
      const data = await json<{ portrait: Portrait }>("/api/clone/portrait", { method: "POST", body });
      setPortrait(data.portrait); setConsent(false); setNotice("Foto guardada.");
    });
    if (input.current) input.current.value = "";
  }
  async function listen() {
    await run("audio", async () => {
      player.current?.pause();
      const data = await json<{url: string}>("/api/clone/speech", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: text.trim(), delivery }) });
      setSpeech({ url: data.url, text: text.trim() });
    });
  }
  async function generate() {
    if (!portrait || !text.trim() || !consent) return;
    await run("video", async () => {
      const result = await json<{ job: Job }>("/api/clone/avatar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ portraitId: portrait.id, text: text.trim(), delivery, consent: true }) });
      setJobs(previous => [result.job, ...previous.filter(job => job.id !== result.job.id)]); setConsent(false);
      setNotice(result.job.status === "completed" ? "Tu video ya está listo abajo." : "Tu video está en proceso. Aparecerá aquí cuando esté listo.");
    });
  }
  return <Card>
    <div className={styles.portraitRow}>
      {portrait ? <Image unoptimized src={portrait.url} alt="Mi foto para el clon" width={112} height={140} className={styles.portrait} /> : <div className={styles.portraitEmpty} aria-hidden="true"><svg viewBox="0 0 80 100" fill="none"><circle cx="40" cy="32" r="17" stroke="currentColor" strokeWidth="1.5"/><path d="M12 89c0-35 56-35 56 0" stroke="currentColor" strokeWidth="1.5"/></svg></div>}
      <div><h2>Mi foto</h2><p className={styles.hint}>De frente y con buena luz.</p>
        <label className={styles.check}><input type="checkbox" checked={photoConsent} disabled={!!busy} onChange={e => setPhotoConsent(e.target.checked)} />La foto es mía y autorizo guardarla.</label>
        <input ref={input} hidden type="file" accept="image/*" onChange={e => { const file = e.target.files?.[0]; if (file) void upload(file); }} />
        <Button loading={busy === "photo"} disabled={!photoConsent || !!busy} onClick={() => input.current?.click()}>{portrait ? "Cambiar foto" : "Subir mi foto"}</Button>
      </div>
    </div>
    {!loaded ? <p role="status" className={styles.hint}>Buscando tu voz guardada…</p> : <details className={styles.voiceSettings} open={voiceReady ? undefined : true}><summary>{voiceReady ? "✓ Mi voz guardada · cambiar o volver a grabar" : "Grabar o subir mi voz"}</summary><VoiceClone onChange={() => { setSpeech(null); void load().catch(e => setError(e.message)); }} /></details>}
    <label className={styles.field}>¿Qué quieres que diga?<textarea rows={3} maxLength={350} value={text} disabled={!!busy} onChange={e => { setText(e.target.value); setConsent(false); }} /></label>
    <div className={styles.chatTitle}><span className={styles.hint}>{text.length}/350</span><label className={styles.delivery}>Cómo suena <select value={delivery} disabled={!!busy} onChange={e => { setDelivery(e.target.value as VoiceDelivery); setConsent(false); }}><option value="natural">Natural</option><option value="steady">Más estable</option></select></label></div>
    <div className={styles.actions}><Button onClick={listen} loading={busy === "audio"} disabled={!!busy || !voiceReady || !text.trim()}>Escuchar mi voz</Button></div>
    {speech && <div className={styles.audioResult}><audio key={speech.url} ref={player} controls playsInline preload="auto" src={speech.url} aria-label="Mi frase con mi voz" onError={() => setError("No pude reproducir el audio. Pulsa Escuchar mi voz para recuperarlo.")} /><p className={styles.hint}>{speech.text}</p></div>}
    <div className={styles.videoAction}>
      <label className={styles.check}><input type="checkbox" checked={consent} disabled={!!busy || !portrait || !voiceReady} onChange={e => setConsent(e.target.checked)} /><span>Autorizo enviar mi foto y voz a HeyGen para crear este video con mi saldo.</span></label>
      <Button loading={busy === "video"} disabled={!!busy || !configured || !voiceReady || !portrait || !text.trim() || !consent} onClick={generate}>Verme hablando</Button>
      <p className={styles.hint}>{!portrait ? "Sube tu foto para crear el video." : !voiceReady ? "Guarda tu voz para crear el video." : !configured && loaded ? "El servicio de video todavía no está conectado." : "El video puede tardar unos minutos. Podrás reproducirlo aquí."}</p>
    </div>
    {busy === "audio" && <p role="status" className={styles.hint}>Preparando tu voz. La primera vez puede tardar un poco más…</p>}
    {notice && <p role="status" className={styles.notice}>{notice}</p>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {(error || !!activeIds) && <Button variant="ghost" disabled={!!busy} onClick={() => void run("refresh", async () => { await refreshJobs(); await load(); })}>Actualizar estado</Button>}
    {!!jobs.length && <section className={styles.videoHistory} aria-label="Mis videos"><h3>Mis videos</h3>{jobs.map(job => <article key={job.id} id={`video-${job.id}`}><div className={styles.chatTitle}><strong role="status">{labels[job.status] || "Consultando…"}</strong><time dateTime={job.createdAt}>{new Date(job.createdAt).toLocaleString("es-MX")}</time></div>
      {job.mediaUrl && <><video controls playsInline preload="metadata" src={job.mediaUrl} aria-label="Mi clon hablando" /><p className={styles.hint}>Video generado con IA.</p></>}
      {job.error && <p className={styles.error}>{job.error}</p>}
      {!["completed", "failed"].includes(job.status) && <p className={styles.hint}>Puedes salir y volver; tu solicitud queda guardada.</p>}
    </article>)}</section>}
    <details className={styles.versions}><summary>Mi foto y consumo</summary><p className={styles.hint}>Tu foto se guarda cifrada. Las pruebas de voz y los videos consumen saldo; repetir la misma frase y configuración recupera el resultado guardado. Hasta 3 solicitudes de video al día.</p>
      {portrait && <Button variant="ghost" disabled={!!busy} onClick={() => setRemove(true)}>Eliminar foto</Button>}
      {remove && <div className={styles.notice}><p>¿Eliminar esta foto? Los videos ya creados y las copias enviadas al servicio de video se conservan.</p><div className={styles.actions}><Button disabled={!!busy} onClick={() => void run("photo", async () => { await json("/api/clone/portrait", { method: "DELETE" }); setPortrait(null); setRemove(false); setConsent(false); })}>Sí, eliminar foto</Button><Button variant="ghost" onClick={() => setRemove(false)}>Conservar</Button></div></div>}
    </details>
  </Card>;
}
