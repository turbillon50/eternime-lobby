"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { MAX_VOICE_SAMPLES, recordingExtension, validateVoiceSamples } from "@/lib/voice/samples";

function SamplePlayer({ file, number }: { file: File; number: number }) {
  const player = useRef<HTMLAudioElement>(null);
  useEffect(() => { const url = URL.createObjectURL(file); if (player.current) player.current.src = url; return () => URL.revokeObjectURL(url); }, [file]);
  return <audio ref={player} controls preload="metadata" aria-label={`Escuchar muestra ${number}`} className="w-full" />;
}
export function VoiceClone({ onChange }: { onChange?: () => void } = {}) {
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [available, setAvailable] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [samples, setSamples] = useState<File[]>([]);
  const [consent, setConsent] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const openingMic = useRef(false);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const alive = useRef(true);
  const objectUrl = useRef<string | null>(null);
  const actionLock = useRef(false);

  function load() {
    return fetch("/api/voice/clone", { cache: "no-store" }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No pude consultar tu voz.");
      if (!alive.current) return;
      setVoiceId(data.voiceId ?? null); setAvailable(data.cloningAvailable === true); setReason(data.reason || "");
    }).catch(error => { if (alive.current) { setAvailable(false); setErr(error instanceof Error ? error.message : "Error de conexión."); } })
      .finally(() => { if (alive.current) setLoading(false); });
  }
  useEffect(() => {
    alive.current = true;
    void load();
    return () => {
      alive.current = false;
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach(track => track.stop());
      if (timer.current) clearInterval(timer.current);
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    };
  }, []);

  async function toggleRecord() {
    if (recording) { recorder.current?.stop(); return; }
    if (openingMic.current) return;
    setErr(""); setMsg("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { setErr("Este navegador no permite grabar aquí. Puedes subir un audio desde tu dispositivo."); return; }
    let mic: MediaStream | null = null;
    openingMic.current = true;
    try {
      mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!alive.current) { mic.getTracks().forEach(track => track.stop()); return; }
      stream.current = mic;
      const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"].find(type => MediaRecorder.isTypeSupported(type));
      const rec = new MediaRecorder(mic, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 128000 });
      const chunks: Blob[] = [];
      const startedAt = Date.now();
      rec.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      rec.onstop = () => {
        mic?.getTracks().forEach(track => track.stop());
        if (timer.current) clearInterval(timer.current);
        if (!alive.current) return;
        setRecording(false);
        if ((Date.now() - startedAt) / 1000 < 8) { setErr("La muestra fue muy corta. Intenta hablar entre 20 y 60 segundos."); return; }
        const blob = new Blob(chunks, { type: rec.mimeType || mimeType || "audio/webm" });
        const file = new File([blob], `muestra-${Date.now()}.${recordingExtension(blob.type)}`, { type: blob.type });
        const invalid = validateVoiceSamples([file]);
        if (invalid) { setErr(invalid); return; }
        setSamples(previous => [...previous, file]);
      };
      rec.onerror = () => { mic?.getTracks().forEach(track => track.stop()); if (timer.current) clearInterval(timer.current); setRecording(false); setErr("La grabación se interrumpió. Intenta de nuevo."); };
      recorder.current = rec; setSeconds(0); setRecording(true); rec.start();
      timer.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000); setSeconds(elapsed);
        if (elapsed >= 60 && rec.state === "recording") rec.stop();
      }, 500);
    } catch { mic?.getTracks().forEach(track => track.stop()); setErr("No pude abrir el micrófono. Revisa el permiso o sube un audio."); }
    finally { openingMic.current = false; }
  }
  async function create() {
    if (actionLock.current || !consent || recording) return;
    const invalid = validateVoiceSamples(samples);
    if (invalid) { setErr(invalid); return; }
    if (actionLock.current) return; actionLock.current = true;
    setWorking(true); setErr(""); setMsg("");
    try {
      const form = new FormData(); samples.forEach(file => form.append("files", file)); form.append("consent", String(consent));
      if (voiceId && replacing) form.append("replaceVoiceId", voiceId);
      const response = await fetch("/api/voice/clone", { method: "POST", body: form });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No pude crear tu voz. Revisa el tamaño de los audios y vuelve a consultar su estado.");
      setVoiceId(data.voiceId); setSamples([]); setReplacing(false); setConsent(false); setPreviewUrl(null); onChange?.(); setMsg("Tu voz está guardada. Prueba la frase del panel de abajo.");
    } catch (error) { setErr(error instanceof Error ? error.message : "Error de conexión."); }
    finally { actionLock.current = false; setWorking(false); }
  }
  async function preview() {
    if (actionLock.current) return; actionLock.current = true;
    setWorking(true); setErr("");
    try {
      const response = await fetch("/api/voice/preview", { method: "POST" });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || "No pude generar la prueba."); }
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = URL.createObjectURL(await response.blob()); setPreviewUrl(objectUrl.current);
      setMsg("Pulsa reproducir para escuchar tu voz.");
    } catch (error) { setErr(error instanceof Error ? error.message : "Error de conexión."); }
    finally { actionLock.current = false; setWorking(false); }
  }
  async function remove() {
    if (actionLock.current) return; actionLock.current = true;
    setWorking(true); setErr("");
    try {
      const response = await fetch("/api/voice/clone", { method: "DELETE" }); const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No pude confirmar la eliminación.");
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = null; setPreviewUrl(null); setVoiceId(null); onChange?.(); setConfirmDelete(false); setMsg("Tu voz personal fue eliminada.");
    } catch (error) { setErr(error instanceof Error ? error.message : "Error de conexión."); }
    finally { actionLock.current = false; setWorking(false); }
  }
  const invalid = samples.length ? validateVoiceSamples(samples) : null;
  return <div className="py-3">
    {loading ? <p role="status" className="mt-4">Consultando tu voz…</p> : voiceId && !replacing ? <div className="mt-4 grid gap-3">
      <p>Puedes grabar una muestra mejor sin perder la voz actual durante el proceso.</p>
      <div className="flex flex-wrap gap-2"><Button onClick={() => { setReplacing(true); setErr(""); setMsg(""); }} disabled={working}>Volver a grabar mi voz</Button><Button variant="ghost" onClick={preview} loading={working}>Probar voz actual</Button><Button variant="ghost" disabled={working} onClick={() => setConfirmDelete(true)}>Eliminar mi voz</Button></div>
      {previewUrl && <audio key={previewUrl} controls src={previewUrl} className="w-full" aria-label="Prueba de mi voz personal" />}
      {confirmDelete && <div className="grid gap-2"><p>¿Eliminar tu voz personal? Para recuperarla tendrás que crear otra. Los audios y videos ya generados se conservan.</p><div className="flex gap-2"><Button onClick={remove} loading={working}>Sí, eliminar</Button><Button variant="ghost" disabled={working} onClick={() => setConfirmDelete(false)}>Conservar</Button></div></div>}
    </div> : <div className="mt-4 grid gap-3">
      {reason && <p role="status" className="text-sm">{reason}</p>}
      <input ref={input} hidden type="file" accept="audio/*" multiple onChange={event => { const files = Array.from(event.target.files ?? []); const combined = [...samples, ...files]; const problem = validateVoiceSamples(combined); if (problem) setErr(problem); else { setSamples(combined); setErr(""); } event.target.value = ""; }} />
      <p className="text-sm">Graba entre uno y dos minutos con tu voz habitual, sin música y cerca del micrófono. Cuenta un recuerdo o describe tu día. Escucha la muestra antes de guardarla.</p>
      <div className="flex flex-wrap items-center gap-2"><Button disabled={working || (!recording && samples.length >= MAX_VOICE_SAMPLES)} onClick={toggleRecord}>{recording ? `Terminar muestra · ${seconds}s` : "Grabar una muestra"}</Button><Button variant="ghost" disabled={working || recording} onClick={() => input.current?.click()}>Subir audios</Button></div>
      <ul className="grid gap-1">{samples.map((file, i) => <li key={`${file.name}-${i}`} className="flex flex-wrap items-center gap-2 text-sm"><SamplePlayer file={file} number={i + 1} /><span className="break-all">Muestra {i + 1} · {(file.size / 1_000_000).toFixed(2)} MB</span><button className="min-h-11 px-3 underline" disabled={working || recording} onClick={() => setSamples(previous => previous.filter((_, index) => index !== i))} aria-label={`Quitar muestra ${i + 1}`}>Quitar</button></li>)}</ul>
      {invalid && <p role="alert" className="text-sm">{invalid}</p>}
      <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1" checked={consent} disabled={working} onChange={event => setConsent(event.target.checked)} /><span>Confirmo que es mi propia voz y autorizo a ElevenLabs a procesar estas muestras para crear mi clon de voz.</span></label>
      <div className="flex flex-wrap gap-2"><Button onClick={create} loading={working} disabled={!samples.length || !!invalid || !available || !consent || recording}>{replacing ? "Guardar nueva voz" : "Guardar mi voz"}</Button><Button variant="ghost" disabled={working || recording} onClick={() => { setLoading(true); setErr(""); void load(); }}>Actualizar estado</Button></div>
    </div>}
    {replacing && <Button variant="ghost" disabled={working || recording} onClick={() => { setReplacing(false); setSamples([]); setConsent(false); }}>Conservar mi voz actual</Button>}
    {recording && <progress aria-label="Tiempo de grabación de la muestra" max={60} value={seconds} className="w-full mt-3" />}
    {msg && <p role="status" className="mt-3 text-sm text-[var(--et-primary)]">{msg}</p>}
    {err && <p role="alert" className="mt-3 text-sm text-[var(--et-danger)]">{err}</p>}
  </div>;
}
