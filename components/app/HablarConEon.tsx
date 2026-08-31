"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
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

export function HablarConEon() {
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
      audioRef.current?.stopPlayback();
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

  async function start() {
    if (!consent) {
      setError("Autoriza la beta de voz para comenzar.");
      return;
    }
    setError("");
    setCaption("");
    setTurns([]);
    setStatus("connecting");
    try {
      const response = await fetch("/api/voice/gemini/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ freeTierConsent: true }),
      });
      const payload = await response.json() as SessionPayload;
      if (!response.ok) throw new Error(payload.error || "No se pudo iniciar Gemini Live.");
      const bridge = new LiveAudioBridge();
      audioRef.current = bridge;
      await bridge.start((data) => sessionRef.current?.sendRealtimeInput({ audio: { data, mimeType: "audio/pcm;rate=16000" } }));
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: payload.token, httpOptions: { apiVersion: "v1alpha" } });
      const session = await ai.live.connect({
        model: payload.model,
        config: payload.config,
        callbacks: {
          onopen: () => setStatus("listening"),
          onmessage: handleMessage,
          onerror: () => { setError("La conexión de voz tuvo un problema."); setStatus("error"); },
          onclose: () => { if (sessionRef.current) void stop(); },
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
      <motion.button type="button" onClick={active ? stop : start} className={`gemini-live-control is-${status}`} whileTap={{ scale: 0.96 }} aria-label={active ? "Terminar conversación" : "Comenzar conversación"}>
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
          <input type="checkbox" checked={consent} onChange={(event) => { setConsent(event.target.checked); setError(""); }} />
          <span><b>Autorizar esta sesión beta</b>El audio se procesa con Gemini Free Tier y puede ayudar a Google a mejorar sus productos. Eternime no lo guarda como memoria salvo que digas “guarda esto”.</span>
        </label>
      ) : null}
      <p className="gemini-live-safety">No puede borrar nada. Correo y acciones externas requieren confirmación.</p>
    </section>
  );
}
