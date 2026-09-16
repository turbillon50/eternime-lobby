"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { LiveConnectConfig, LiveServerMessage } from "@google/genai";
import { EonSignal } from "@/components/visual/VisualArtifacts";
import { EonWave } from "@/components/visual/EonWave";
import { LiveAudioBridge, type LiveAudioDiagnostic } from "@/lib/voice/live-audio-client";
import { LiveVoiceSession, type VoiceStatus } from "@/lib/voice/live-session";
import styles from "./eon-voice.module.css";

type Turn = { role: "user" | "assistant"; content: string };
type SessionPayload = { token: string; model: string; config: LiveConnectConfig; error?: string };
function appendText(current: string, incoming?: string) {
  const text = incoming?.trim(); if (!text || current.endsWith(text)) return current;
  if (text.startsWith(current)) return text;
  return `${current}${current ? " " : ""}${text}`;
}

export function HablarConEon() {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [error, setError] = useState("");
  const [caption, setCaption] = useState("");
  const [consent, setConsent] = useState(false);
  const [muted, setMuted] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const controller = useRef<LiveVoiceSession | null>(null);
  const audio = useRef<LiveAudioBridge | null>(null);
  const playback = useRef(Promise.resolve());
  const playbackGeneration = useRef(0);
  const inputText = useRef(""); const outputText = useRef(""); const unsaved = useRef<Turn[]>([]);

  const diagnostic = useCallback((event: LiveAudioDiagnostic | "session_request" | "session_ready" | "socket_error") => {
    void fetch("/api/voice/diagnostics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event }), keepalive: true }).catch(() => undefined);
  }, []);
  const finishTurn = useCallback(() => {
    const completed: Turn[] = [];
    if (inputText.current.trim()) completed.push({ role: "user", content: inputText.current.trim() });
    if (outputText.current.trim()) completed.push({ role: "assistant", content: outputText.current.trim() });
    inputText.current = ""; outputText.current = "";
    if (completed.length) { unsaved.current = [...unsaved.current, ...completed].slice(-100); setTurns(previous => [...previous, ...completed].slice(-8)); }
  }, []);
  const flush = useCallback(() => {
    playbackGeneration.current++;
    finishTurn(); const saved = unsaved.current; unsaved.current = [];
    if (!saved.length) return;
    const body = JSON.stringify({ turns: saved, captureMemory: false });
    try { if (navigator.sendBeacon?.("/api/voice/transcript", new Blob([body], { type: "application/json" }))) return; } catch { /* keepalive fallback */ }
    void fetch("/api/voice/transcript", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => undefined);
  }, [finishTurn]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => { try { setConsent(localStorage.getItem("eon-live-consent-v1") === "yes"); } catch { /* private browsing */ } });
    const leave = () => controller.current?.stop();
    const offline = () => controller.current?.stop("error", "Se perdió la conexión a internet. Vuelve a conectar cuando regrese.");
    window.addEventListener("pagehide", leave); window.addEventListener("offline", offline);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("pagehide", leave); window.removeEventListener("offline", offline); controller.current?.stop(); };
  }, []);

  async function runTools(message: LiveServerMessage) {
    const calls = message.toolCall?.functionCalls ?? []; const session = controller.current?.session;
    if (!calls.length || !session) return;
    setStatus("acting");
    const responses = await Promise.all(calls.map(async call => {
      try {
        const response = await fetch("/api/voice/gemini/tool", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: call.name, args: call.args ?? {} }), signal: AbortSignal.timeout(30_000) });
        const payload = await response.json();
        return { id: call.id, name: call.name, response: response.ok ? { output: payload.result } : { error: payload.error || "La acción falló." } };
      } catch { return { id: call.id, name: call.name, response: { error: "No se pudo completar la acción." } }; }
    }));
    if (controller.current?.session !== session) return;
    try { session.sendToolResponse({ functionResponses: responses }); setStatus("listening"); }
    catch { controller.current?.stop("error", "La conexión terminó. Vuelve a conectar."); }
  }
  function handleMessage(message: LiveServerMessage) {
    if (message.toolCall) void runTools(message);
    const content = message.serverContent; if (!content) return;
    const bridge = audio.current;
    if (content.interrupted) { playbackGeneration.current++; bridge?.stopPlayback(); setStatus("listening"); }
    if (content.inputTranscription?.text) { setStatus("listening"); inputText.current = appendText(inputText.current, content.inputTranscription.text); setCaption(inputText.current); }
    if (content.outputTranscription?.text) { outputText.current = appendText(outputText.current, content.outputTranscription.text); setCaption(outputText.current); }
    for (const part of content.modelTurn?.parts ?? []) {
      if (!part.inlineData?.data || !part.inlineData.mimeType?.startsWith("audio/pcm")) continue;
      const chunk = part.inlineData.data;
      const generation = playbackGeneration.current;
      setStatus("speaking");
      playback.current = playback.current.then(() => { if (generation === playbackGeneration.current) return bridge?.play(chunk); }).catch(() => { if (audio.current === bridge && generation === playbackGeneration.current) controller.current?.stop("error", "El navegador pausó el sonido. Toca Volver a conectar."); });
    }
    if (content.turnComplete) { finishTurn(); const generation = playbackGeneration.current; playback.current = playback.current.then(() => { if (generation === playbackGeneration.current) bridge?.finishPlayback(); }); }
  }
  function start() {
    if (!consent) { setError("Permite la conversación de voz para comenzar."); return; }
    if (!navigator.onLine) { setError("Necesitas conexión a internet para hablar con Eon."); return; }
    setError(""); setCaption(""); setTurns([]); setMuted(false);
    controller.current ??= new LiveVoiceSession({
      createBridge: () => { const bridge = new LiveAudioBridge(diagnostic, () => { if (controller.current?.active) setStatus(previous => previous === "speaking" ? "listening" : previous); }); playbackGeneration.current++; audio.current = bridge; playback.current = Promise.resolve(); return bridge; },
      status: (value, reason) => { setStatus(value); setError(reason || ""); },
      message: handleMessage,
      ended: flush,
      connect: async (callbacks, signal) => {
        diagnostic("session_request");
        const response = await fetch("/api/voice/gemini/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ freeTierConsent: true }), signal });
        const payload = await response.json() as SessionPayload;
        if (!response.ok) throw new Error(payload.error || "No pude iniciar la voz de Eon.");
        if (signal.aborted) throw new Error("cancelled");
        diagnostic("session_ready");
        const { GoogleGenAI } = await import("@google/genai");
        if (signal.aborted) throw new Error("cancelled");
        return new GoogleGenAI({ apiKey: payload.token, httpOptions: { apiVersion: "v1beta" } }).live.connect({ model: payload.model, config: payload.config, callbacks });
      },
    });
    void controller.current.start();
  }
  function allowVoice(value: boolean) {
    setConsent(value); setError("");
    try { if (value) localStorage.setItem("eon-live-consent-v1", "yes"); else localStorage.removeItem("eon-live-consent-v1"); } catch { /* private browsing */ }
  }
  const active = !["idle", "error"].includes(status);
  const connecting = status === "microphone" || status === "connecting";
  return <section className={styles.page}>
    <header><h1>Hablar con Eon</h1><p>Una conversación por voz. Puedes interrumpirme.</p></header>
    <div className={styles.call}>
      <EonSignal state={status === "error" ? "error" : connecting ? "thinking" : status === "speaking" || status === "acting" ? "acting" : status === "listening" ? "listening" : "idle"} className={styles.signal} />
      <EonWave state={active && muted ? "muted" : status}/>
      <p className={styles.status} role="status">{status === "microphone" ? "Permite el micrófono en tu navegador…" : status === "connecting" ? "Conectando con Eon…" : status === "speaking" ? "Eon está hablando" : status === "acting" ? "Realizando lo que pediste…" : active && muted ? "Micrófono silenciado" : status === "listening" ? "Te escucho" : "Cuando quieras, empezamos."}</p>
      {!active && !consent && <label className={styles.consent}><input type="checkbox" checked={consent} onChange={e => allowVoice(e.target.checked)} />Permitir conversación de voz</label>}
      {caption && active && <p className={styles.mobileCaption} aria-live="polite">{caption}</p>}
      <div className={styles.callActions}>
        {active && !connecting && <button type="button" className={styles.mute} aria-pressed={muted} onClick={() => { const next = !muted; audio.current?.setMuted(next); setMuted(next); }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3ZM5 11a7 7 0 0 0 14 0M12 18v3"/>{muted && <path d="M3 3l18 18"/>}</svg><span>{muted ? "Activar micrófono" : "Silenciar"}</span></button>}
        <button type="button" className={active ? styles.stop : styles.start} onClick={active ? () => controller.current?.stop() : start}><span className={styles.controlIcon} aria-hidden="true">{active ? "■" : "▶"}</span><span>{connecting ? "Cancelar" : active ? "Terminar" : status === "error" ? "Volver a conectar" : "Hablar con Eon"}</span></button>
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <Link href="/app" className={styles.write}>Prefiero escribir</Link>
    </div>
    {caption && active && <p className={styles.caption} aria-live="polite">{caption}</p>}
    {!!turns.length && <details className={styles.transcript}><summary>Ver conversación</summary>{turns.map((turn,index) => <p key={index}><b>{turn.role === "user" ? "Tú" : "Eon"}</b> {turn.content}</p>)}</details>}
    <details className={styles.privacy}><summary>Micrófono y privacidad</summary><p>Permite el micrófono cuando tu navegador lo solicite. Al terminar o salir de esta pantalla, se apaga.</p><p>El audio se procesa con Google Gemini Free Tier y puede ayudar a Google a mejorar sus productos. Eternime conserva la conversación; sólo añade recuerdos cuando se lo pides. Las acciones externas requieren confirmación.</p>{!active && <label className={styles.consent}><input type="checkbox" checked={consent} onChange={e => allowVoice(e.target.checked)} />Permitir conversación de voz en este dispositivo</label>}</details>
  </section>;
}
