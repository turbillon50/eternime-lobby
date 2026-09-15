"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui";
const subscribe = () => () => {};
const hasDictation = () => "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
type Recognition = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null; onend: (() => void) | null;
  start(): void; stop(): void; abort(): void;
};
export function CloneDictation({ disabled, onText }: { disabled: boolean; onText: (text: string) => void }) {
  const supported = useSyncExternalStore(subscribe, hasDictation, () => false); const [listening, setListening] = useState(false); const [error, setError] = useState("");
  const recognition = useRef<Recognition | null>(null); const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callback = useRef(onText); useEffect(() => { callback.current = onText; }, [onText]);
  useEffect(() => {
    const browser = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const Constructor = browser.SpeechRecognition || browser.webkitSpeechRecognition;
    if (!Constructor) return;
    const rec = new Constructor(); recognition.current = rec;
    rec.lang = "es-MX"; rec.continuous = false; rec.interimResults = false;
    rec.onresult = event => callback.current(Array.from(event.results).map(result => result[0].transcript).join(" "));
    rec.onerror = event => { if (event.error !== "aborted") setError(event.error === "not-allowed" ? "Revisa el permiso del micrófono. También puedes escribir." : "No pude completar el dictado. Puedes intentarlo otra vez o escribir."); };
    rec.onend = () => { setListening(false); if (timeout.current) clearTimeout(timeout.current); };
    return () => { rec.onresult = rec.onerror = rec.onend = null; rec.abort(); if (timeout.current) clearTimeout(timeout.current); };
  }, []);
  useEffect(() => { if (disabled) recognition.current?.abort(); }, [disabled]);
  if (!supported) return null;
  return <div><Button variant="ghost" disabled={disabled} onClick={() => {
    if (listening) { recognition.current?.stop(); return; }
    setError(""); try { recognition.current?.start(); setListening(true); timeout.current = setTimeout(() => recognition.current?.stop(), 60_000); }
    catch { setError("No pude iniciar el dictado. Intenta de nuevo."); }
  }}>{listening ? "Terminar dictado" : "Dictar mensaje"}</Button>
    {listening && <span role="status"> Escuchando…</span>}
    <small className="block mt-1">El dictado usa el servicio de voz de tu navegador. Revisa el texto antes de enviarlo.</small>
    {error && <p role="alert">{error}</p>}
  </div>;
}
