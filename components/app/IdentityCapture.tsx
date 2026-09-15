"use client";
import { useEffect, useRef, useState } from "react";
import { FadeInOnScroll } from "@/components/motion";
import { Button, Card, CardDescription, CardTitle } from "@/components/ui";
import { uploadFile } from "@/lib/upload-client";
import { IDENTITY_POSES as POSES, completedIdentityPoses } from "@/lib/identity";

type Asset = { id: string; pose: string; blobUrl: string };
async function inspectPhoto(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image(); image.src = url;
    await image.decode().catch(() => { throw new Error("No pude leer la foto. Usa una imagen JPEG, PNG o WebP."); });
    if (Math.min(image.naturalWidth, image.naturalHeight) < 720) throw new Error("La foto necesita al menos 720 píxeles en su lado más corto. Usa una foto de mayor resolución.");
  } finally { URL.revokeObjectURL(url); }
}
export function IdentityCapture() {
  const input = useRef<HTMLInputElement>(null), videoInput = useRef<HTMLInputElement>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true), [loaded, setLoaded] = useState(false);
  const [working, setWorking] = useState(false), [err, setErr] = useState("");
  const [consent, setConsent] = useState(false), [confirmReset, setConfirmReset] = useState(false);
  function load(prepare = false) {
    return fetch("/api/identity", prepare ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "prepare" }) } : { cache: "no-store" }).then(async response => {
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.assets)) throw new Error(data.error || "No pude abrir tus capturas.");
      setAssets(data.assets); setLoaded(true);
    }).catch(error => { setLoaded(false); setErr(error instanceof Error ? error.message : "Error de conexión."); })
      .finally(() => setLoading(false));
  }
  useEffect(() => { void load(); }, []);
  const done = completedIdentityPoses(assets);
  const next = POSES.find(pose => !done.has(pose.id));
  async function save(file: File, pose: string, label: string) {
    if (!loaded || !consent || working) return;
    setWorking(true); setErr("");
    try {
      if (file.size > 100 * 1024 * 1024) throw new Error("El archivo supera 100 MB. Usa una captura más corta.");
      if (pose !== "motion") await inspectPhoto(file);
      else if (!file.type.startsWith("video/")) throw new Error("Elige un archivo de video.");
      const uploaded = await uploadFile(file, "file", `Identidad visual · ${label}`);
      const response = await fetch("/api/identity", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: uploaded.url, pose, consent: true }) });
      const data = await response.json();
      if (!response.ok || !data.asset) throw new Error(data.error || "La subida terminó, pero no pude asociar la captura. El archivo permanece en tu bóveda.");
      setAssets(previous => [...previous, data.asset]);
    } catch (error) { setErr(error instanceof Error ? error.message : "No pude guardar la captura."); }
    finally { setWorking(false); if (input.current) input.current.value = ""; if (videoInput.current) videoInput.current.value = ""; }
  }
  async function reset() {
    setWorking(true); setErr("");
    try {
      // Track each confirmed deletion so a partial failure never hides remaining captures.
      for (const asset of assets) {
        const response = await fetch(`/api/identity?id=${encodeURIComponent(asset.id)}`, { method: "DELETE" });
        if (!response.ok && response.status !== 404) { const data = await response.json(); throw new Error(data.error || "No pude quitar todas las capturas."); }
        setAssets(previous => previous.filter(item => item.id !== asset.id));
      }
      setConfirmReset(false);
    } catch (error) { setErr(error instanceof Error ? error.message : "No pude quitar las capturas."); }
    finally { setWorking(false); }
  }
  return <FadeInOnScroll delay={.16}><Card>
    <input ref={input} hidden type="file" accept="image/jpeg,image/png,image/webp" capture="user" onChange={event => { const file = event.target.files?.[0]; if (file && next) void save(file, next.id, next.label); }} />
    <input ref={videoInput} hidden type="file" accept="video/*" capture="user" onChange={event => { const file = event.target.files?.[0]; if (file) void save(file, "motion", "Video de presencia"); }} />
    <div className="identity-capture va-crystal va-spatial">
      <div><p className="eon-page-kicker">Mi identidad visual</p><CardTitle>Guarda cómo eres hoy.</CardTitle><CardDescription className="mt-1">Seis ángulos para construir tu archivo visual. La generación del avatar es un paso posterior y requiere tu autorización.</CardDescription></div>
      {loading ? <p role="status">Consultando tus capturas…</p> : loaded ? <>
        <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1" checked={consent} onChange={event => setConsent(event.target.checked)} /><span>Autorizo guardar estas capturas de mi persona en Eternime. Por ahora no se enviarán a HeyGen.</span></label>
        <div className="identity-progress" role="progressbar" aria-label="Ángulos capturados" aria-valuenow={done.size} aria-valuemin={0} aria-valuemax={POSES.length}><span style={{ width: `${Math.round(done.size / POSES.length * 100)}%` }} /></div>
        {next ? <div className="identity-shot"><div className="identity-face-guide"><span /><i /></div><div><small>Captura {done.size + 1} de {POSES.length}</small><h3>{next.label}</h3><p>Luz frontal, sin filtros, rostro completo y fondo sencillo.</p><Button disabled={!consent} onClick={() => input.current?.click()} loading={working}>Tomar o elegir foto</Button></div></div> : <div className="identity-done"><span>✓</span><div><b>Seis ángulos guardados</b><small>Tu archivo visual está preparado. Todavía no hay un avatar generado.</small></div><Button variant="ghost" disabled={!consent || assets.some(asset => asset.pose === "motion")} onClick={() => videoInput.current?.click()} loading={working}>{assets.some(asset => asset.pose === "motion") ? "Video guardado" : "Añadir video de presencia"}</Button></div>}
        {!next && <p className="identity-video-note">Video opcional: 10–20 segundos mirando a cámara y girando ligeramente el rostro.</p>}
        <div className="identity-checks">{POSES.map((pose, i) => <span key={pose.id} className={done.has(pose.id) ? "done" : next?.id === pose.id ? "active" : ""}>{done.has(pose.id) ? "✓" : i + 1} · {pose.label}</span>)}</div>
        {!!assets.length && <Button variant="ghost" disabled={working} onClick={() => setConfirmReset(true)}>Rehacer capturas</Button>}
        {confirmReset && <div className="grid gap-2"><p>Quitar estas capturas del perfil visual para empezar de nuevo. Los archivos originales seguirán en tu bóveda.</p><div className="flex flex-wrap gap-2"><Button loading={working} onClick={reset}>Quitar capturas del perfil</Button><Button variant="ghost" disabled={working} onClick={() => setConfirmReset(false)}>Conservar</Button></div></div>}
      </> : <Button variant="ghost" onClick={() => { setLoading(true); setErr(""); void load(true); }}>Preparar mi archivo visual</Button>}
      {err && <p role="alert" className="text-sm text-[var(--et-danger)]">{err}</p>}
    </div>
  </Card></FadeInOnScroll>;
}
