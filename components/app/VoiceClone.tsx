"use client";

import { useEffect, useRef, useState } from "react";
import { FadeInOnScroll } from "@/components/motion";
import { Button, Card, CardDescription, CardTitle } from "@/components/ui";

export function VoiceClone() {
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/voice/clone").then((r) => r.json()).then((d) => {
      setVoiceId(d.voiceId ?? null); setAvailable(d.cloningAvailable ?? true);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []); if (!files.length) return;
    setWorking(true); setErr(""); setMsg("");
    try {
      const fd = new FormData(); files.forEach((f) => fd.append("files", f));
      const res = await fetch("/api/voice/clone", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) { setErr(d.error ?? "No se pudo clonar"); return; }
      setVoiceId(d.voiceId); setMsg("Tu voz quedó lista. Eon narrará con tu voz.");
    } catch { setErr("Error de conexión"); }
    finally { setWorking(false); if (input.current) input.current.value = ""; }
  };

  const forget = async () => {
    setWorking(true); setErr("");
    try { await fetch("/api/voice/clone", { method: "DELETE" }); setVoiceId(null); setMsg(""); }
    catch { setErr("Error de conexión"); }
    finally { setWorking(false); }
  };

  return (
    <FadeInOnScroll delay={0.14}>
      <input ref={input} type="file" accept="audio/*" multiple hidden onChange={onFiles} />
      <Card>
        <CardTitle>Tu voz · Eon habla contigo</CardTitle>
        <CardDescription className="mt-1">
          Clona tu voz para que Eon narre tus recuerdos con ella. Sube 1 a 3 minutos de tu voz hablando claro
          —puedes leer algo o contar un recuerdo— en un lugar silencioso. Formatos: mp3, m4a o wav.
        </CardDescription>

        {loading ? (
          <p className="mt-4 text-sm text-[var(--et-text-faint)]">Cargando…</p>
        ) : voiceId ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(143,200,160,0.3)] bg-[rgba(143,200,160,0.1)] px-3 py-1 text-sm text-[var(--et-success)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg>
              Tu voz está activa
            </span>
            <Button variant="ghost" onClick={() => input.current?.click()} loading={working}>Volver a grabar</Button>
            <Button variant="ghost" onClick={forget} className="!text-[var(--et-danger)]">Quitar mi voz</Button>
          </div>
        ) : !available ? (
          <p className="mt-4 text-sm text-[var(--et-danger)]">El clonado de voz no está disponible en esta cuenta.</p>
        ) : (
          <div className="mt-4">
            <Button onClick={() => input.current?.click()} loading={working}>Clonar mi voz</Button>
          </div>
        )}
        {msg ? <p className="mt-3 text-sm text-[var(--et-success)]">{msg}</p> : null}
        {err ? <p className="mt-3 text-sm text-[var(--et-danger)]">{err}</p> : null}
      </Card>
    </FadeInOnScroll>
  );
}
