"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { LiveConnectConfig, LiveServerMessage, Session } from "@google/genai";

import { EonSignal, LightSweep, LivingMesh, PresenceHalo } from "@/components/visual/VisualArtifacts";
import { LiveAudioBridge } from "@/lib/voice/live-audio-client";

type Status = "idle" | "connecting" | "listening" | "speaking" | "acting" | "error";
type Turn = { role: "user" | "assistant"; content: string };
type SessionPayload = { token: string; model: string; config: LiveConnectConfig; error?: string };

function appendText(current: string, incoming?: string): string {
  const text = incoming?.trim();
  if (!text) return current;
  if (text.startsWith(current)) return text;
  if (current.endsWith(text)) return current;
  return `${current}${current ? " " : ""}${text}`.trim();
}

export function HablarConEon({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [caption, setCaption] = useState("");
  const [action, setAction] = useState("");
  const [consent, setConsent] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const sessionRef = useRef<Session | null>(null);
  const audioRef = useRef<LiveAudioBridge | null>(null);
  const turnsRef = useRef<Turn[]>([]);
  const inputTextRef = useRef("");
  const outputTextRef = useRef("");
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const wantsLiveRef = useRef(false);
  const [compactOpen, setCompactOpen] = useState(false);

  const finishTurn = useCallback(() => {
    const next: Turn[] = [];
    if (inputTextRef.current.trim()) next.push({ role: "user", content: inputTextRef.current.trim() });
    if (outputTextRef.current.trim()) next.push({ role: "assistant", content: outputTextRef.current.trim() });
    inputTextRef.current = "";
    outputTextRef.current = "";
    if (!next.length) return;
    turnsRef.current = [...turnsRef.current, ...next].slice(-100);
    setTurns((value) => [...value, ...next].slice(-8));
  }, []);

  const flushTranscript = useCallback(() => {
    finishTurn();
    const savedTurns = turnsRef.current;
    turnsRef.current = [];
    if (!savedTurns.length) return;
    const body = JSON.stringify({ turns: savedTurns, captureMemory: false });
    try {
      if (navigator.sendBeacon?.("/api/voice/transcript", new Blob([body], { type: "application/json" }))) return;
    } catch { /* use keepalive fallback */ }
    void fetch("/api/voice/transcript", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => undefined);
  }, [finishTurn]);

  const stop = useCallback(async () => {
    wantsLiveRef.current = false;
    reconnectAttemptsRef.current = 0;
    if (reconnectTimerRef.current !== null) window.clearTimeout(reconnectTimerRef.current);
    reconnectTimerRef.current = null;
    try { sessionRef.current?.sendRealtimeInput({ audioStreamEnd: true }); } catch { /* already closed */ }
    try { sessionRef.current?.close(); } catch { /* already closed */ }
    sessionRef.current = null;
    await audioRef.current?.close();
    audioRef.current = null;
    flushTranscript();
    setStatus("idle");
    setAction("");
  }, [flushTranscript]);

  useEffect(() => () => { void stop(); }, [stop]);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try { setConsent(window.localStorage.getItem("eon-live-consent-v1") === "yes"); } catch { /* storage disabled */ }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const runTools = useCallback(async (message: LiveServerMessage) => {
    const calls = message.toolCall?.functionCalls ?? [];
    if (!calls.length || !sessionRef.current) return;
    setStatus("acting");
    setAction(calls.length === 1 ? "Eon está realizando una acción…" : "Eon está realizando acciones…");
    const responses = await Promise.all(calls.map(async (call) => {
      try {
        const response = await fetch("/api/voice/gemini/tool", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: call.name, args: call.args ?? {} }),
        });
        const payload = await response.json();
        return { id: call.id, name: call.name, response: response.ok ? { output: payload.result } : { error: payload.error ?? "La acción falló." } };
      } catch {
        return { id: call.id, name: call.name, response: { error: "No se pudo completar la acción." } };
      }
    }));
    sessionRef.current?.sendToolResponse({ functionResponses: responses });
    setAction("");
    setStatus("listening");
  }, []);

  const handleMessage = useCallback((message: LiveServerMessage) => {
    if (message.toolCall?.functionCalls?.length) void runTools(message);
    const content = message.serverContent;
    if (!content) return;
    if (content.interrupted) {
      audioRef.current?.stopPlayback();
      setStatus("listening");
    }
    const inputText = content.inputTranscription?.text;
    if (inputText) {
      inputTextRef.current = appendText(inputTextRef.current, inputText);
      setCaption(inputTextRef.current);
    }
    const outputText = content.outputTranscription?.text;
    if (outputText) {
      outputTextRef.current = appendText(outputTextRef.current, outputText);
      setCaption(outputTextRef.current);
    }
    if (message.data) {
      setStatus("speaking");
      void audioRef.current?.play(message.data);
    }
    if (content.turnComplete) {
      finishTurn();
      setStatus("listening");
    }
  }, [finishTurn, runTools]);

  async function start(options: { reconnect?: boolean } = {}) {
    const reconnecting = options.reconnect === true;
    if (!consent) {
      setError("Autoriza la beta de voz para comenzar.");
      setCompactOpen(true);
      return;
    }
    wantsLiveRef.current = true;
    if (!reconnecting) reconnectAttemptsRef.current = 0;
    setError("");
    if (!reconnecting) {
      setCaption("");
      setTurns([]);
    }
    setStatus("connecting");
    try {
      // Pedimos el micrófono antes del token: así el diálogo de permisos del
      // navegador no consume la ventana de 60 segundos del token temporal.
      const bridge = new LiveAudioBridge();
      audioRef.current = bridge;
      await bridge.start((data) => sessionRef.current?.sendRealtimeInput({ audio: { data, mimeType: "audio/pcm;rate=16000" } }));
      const response = await fetch("/api/voice/gemini/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ freeTierConsent: true }),
      });
      const payload = await response.json() as SessionPayload;
      if (!response.ok) throw new Error(payload.error || "No se pudo iniciar Gemini Live.");
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: payload.token, httpOptions: { apiVersion: "v1beta" } });
      const session = await ai.live.connect({
        model: payload.model,
        config: payload.config,
        callbacks: {
          onopen: () => { reconnectAttemptsRef.current = 0; setStatus("listening"); },
          onmessage: handleMessage,
          onerror: (event) => {
            console.error("[gemini-live] websocket error", event.message || event.type);
            setError("La conexión se interrumpió. Eon está intentando volver.");
            setStatus("connecting");
          },
          onclose: (event) => {
            // stop() nulifica la referencia antes de cerrar, por lo que sólo
            // llegamos aquí cuando Gemini terminó la sesión inesperadamente.
            if (!sessionRef.current) return;
            console.error("[gemini-live] websocket closed", { code: event.code, reason: event.reason });
            sessionRef.current = null;
            void audioRef.current?.close();
            audioRef.current = null;
            flushTranscript();
            if (wantsLiveRef.current && reconnectAttemptsRef.current < 2) {
              reconnectAttemptsRef.current += 1;
              setStatus("connecting");
              reconnectTimerRef.current = window.setTimeout(() => void start({ reconnect: true }), 900);
              return;
            }
            wantsLiveRef.current = false;
            setError("La sesión de voz terminó. Toca para volver a conectar.");
            setStatus("error");
          },
        },
      });
      sessionRef.current = session;
    } catch (caught) {
      await audioRef.current?.close();
      audioRef.current = null;
      const message = caught instanceof Error && caught.name === "NotAllowedError"
        ? "Necesito permiso de micrófono para escucharte."
        : caught instanceof Error ? caught.message : "No se pudo iniciar la voz.";
      setError(message);
      setStatus("error");
    }
  }

  const active = status !== "idle" && status !== "error";
  const setVoiceConsent = (allowed: boolean) => {
    setConsent(allowed);
    setError("");
    try {
      if (allowed) window.localStorage.setItem("eon-live-consent-v1", "yes");
      else window.localStorage.removeItem("eon-live-consent-v1");
    } catch { /* storage disabled */ }
  };

  if (compact) {
    return (
      <aside className={`eon-live-presence is-${status} ${compactOpen ? "is-open" : ""}`} aria-live="polite">
        {compactOpen ? <section className="eon-live-presence__panel">
          <header><span><i /> EON</span><button type="button" onClick={() => setCompactOpen(false)} aria-label="Cerrar">×</button></header>
          <b>{status === "speaking" ? "Estoy contigo" : status === "acting" ? "Lo estoy haciendo" : status === "listening" ? "Te escucho" : status === "connecting" ? "Volviendo contigo…" : "Sigo aquí"}</b>
          <p>{caption || action || error || (consent ? "Habla conmigo sin salir de lo que estás haciendo." : "Autoriza la voz una vez en este dispositivo.")}</p>
          {!consent ? <label><input type="checkbox" checked={consent} onChange={(event) => setVoiceConsent(event.target.checked)} /><span>Autorizar voz con Gemini Live</span></label> : null}
          <footer>
            <button type="button" className={active ? "is-stop" : "is-start"} onClick={active ? stop : () => void start()}>{active ? "Terminar" : "Hablar ahora"}</button>
            <Link href="/app/hablar">Abrir completo</Link>
          </footer>
        </section> : null}
        <button type="button" className="eon-live-presence__orb" onClick={() => {
          if (status === "idle" && consent) void start();
          else setCompactOpen((value) => !value);
        }} aria-label={active ? "Eon está presente" : "Hablar con Eon"}>
          <EonSignal state={status === "error" ? "error" : status === "acting" || status === "speaking" ? "acting" : status === "listening" ? "listening" : status === "connecting" ? "thinking" : "idle"} />
          <span>{status === "listening" ? "Escuchando" : status === "speaking" ? "Hablando" : status === "acting" ? "Haciendo" : status === "connecting" ? "Conectando" : "Eon"}</span>
        </button>
      </aside>
    );
  }

  return (
    <section className="gemini-live-shell va-crystal va-spatial" aria-live="polite">
      <LivingMesh />
      {active ? <PresenceHalo /> : null}
      <LightSweep />
      <div className="gemini-live-hero">
        <span className="gemini-live-beta">Gemini Live · beta</span>
        <EonSignal state={status === "error" ? "error" : status === "acting" || status === "speaking" ? "acting" : status === "listening" ? "listening" : status === "connecting" ? "thinking" : "idle"} className="gemini-live-signal" />
        <p className="eon-kicker">Eon · voz y acciones en tiempo real</p>
        <h1>{status === "connecting" ? "Abriendo la conversación…" : status === "speaking" ? "Eon está contigo" : status === "acting" ? "Haciéndolo" : active ? "Te escucho" : "Habla. Recuerda. Haz."}</h1>
        <p className="gemini-live-lede">Interrúmpelo como a una persona. Busca en tu memoria, guarda lo importante y mueve tus pendientes sin abandonar la conversación.</p>
      </div>
      <motion.button type="button" onClick={active ? stop : () => void start()} className={`gemini-live-control is-${status}`} whileTap={{ scale: 0.96 }} aria-label={active ? "Terminar conversación" : "Comenzar conversación"}>
        {status === "connecting" ? <span className="loader" /> : active ? <span className="stop-square" /> : <span className="voice-bars"><i /><i /><i /></span>}
      </motion.button>
      <p className="gemini-live-status">
        {status === "idle" && "Toca para hablar con Eon"}
        {status === "connecting" && "Creando un canal privado temporal"}
        {status === "listening" && "Escuchando · puedes pedirme que recuerde o haga algo"}
        {status === "speaking" && "Hablando · interrúmpeme cuando quieras"}
        {status === "acting" && (action || "Realizando la acción")}
        {status === "error" && error}
      </p>
      {caption && active ? <p className="gemini-live-caption">{caption}</p> : null}
      {turns.length > 0 && active ? (
        <div className="gemini-live-transcript">
          {turns.slice(-4).map((turn, index) => <p key={`${turn.role}-${index}`} className={turn.role}><b>{turn.role === "user" ? "Tú" : "Eon"}</b><span>{turn.content}</span></p>)}
        </div>
      ) : null}
      {!active ? (
        <label className="gemini-live-consent">
          <input type="checkbox" checked={consent} onChange={(event) => setVoiceConsent(event.target.checked)} />
          <span><b>Autorizar voz en este dispositivo</b>El audio se procesa con Gemini Free Tier y puede ayudar a Google a mejorar sus productos. Eternime no lo guarda como memoria salvo que digas “guarda esto”.</span>
        </label>
      ) : null}
      <p className="gemini-live-safety">No puede borrar nada. Correo y acciones externas requieren confirmación.</p>
    </section>
  );
}
