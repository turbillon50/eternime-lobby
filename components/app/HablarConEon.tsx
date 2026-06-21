"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Status = "idle" | "connecting" | "connected" | "error";
type Mode = "listening" | "speaking";

// Tipo laxo para la sesión del SDK (evita acoplarnos a su versión exacta).
type Session = { endSession: () => Promise<void> | void };

export function HablarConEon() {
  const [status, setStatus] = useState<Status>("idle");
  const [mode, setMode] = useState<Mode>("listening");
  const [error, setError] = useState("");
  const [caption, setCaption] = useState("");
  const [usingCloned, setUsingCloned] = useState(false);
  const sessionRef = useRef<Session | null>(null);

  const stop = useCallback(async () => {
    try { await sessionRef.current?.endSession(); } catch { /* noop */ }
    sessionRef.current = null;
    setStatus("idle");
    setMode("listening");
  }, []);

  useEffect(() => () => { void stop(); }, [stop]);

  const start = async () => {
    setError(""); setStatus("connecting"); setCaption("");
    try {
      // Permiso de micrófono explícito (mejor UX que dejarlo al SDK).
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const res = await fetch("/api/voice/agent", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "No se pudo iniciar"); setStatus("error"); return; }
      setUsingCloned(Boolean(data.usingClonedVoice));

      const { Conversation } = await import("@elevenlabs/client");
      const session = await Conversation.startSession({
        signedUrl: data.signedUrl,
        overrides: data.overrides,
        onConnect: () => setStatus("connected"),
        onDisconnect: () => { setStatus("idle"); setMode("listening"); },
        onError: (msg: unknown) => { setError(String(msg)); setStatus("error"); },
        onModeChange: (m: { mode: Mode }) => setMode(m.mode),
        onMessage: (m: { message: string; source: string }) => {
          if (m?.message) setCaption(m.message);
        },
      });
      sessionRef.current = session as unknown as Session;
    } catch (e) {
      setError(e instanceof Error && e.name === "NotAllowedError"
        ? "Necesito permiso de micrófono para escucharte."
        : (e instanceof Error ? e.message : "No se pudo iniciar"));
      setStatus("error");
    }
  };

  const active = status === "connected";
  const speaking = active && mode === "speaking";

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <p className="font-mono text-[0.62rem] uppercase tracking-[0.34em] text-[var(--et-gold-dim)]">Eon · voz en tiempo real</p>
      <h1 className="et-serif mt-3 text-3xl text-[var(--et-text)] sm:text-4xl">Habla con Eon</h1>
      <p className="mt-2 max-w-md text-sm text-[var(--et-text-muted)]">
        Presiona el círculo, da permiso al micrófono y habla con naturalidad. Eon te escucha, te conoce y te responde con su voz. Puedes interrumpirlo cuando quieras.
      </p>

      {/* Anillo de Eon */}
      <div className="relative mt-12 flex h-64 w-64 items-center justify-center">
        <AnimatePresence>
          {active ? (
            <>
              <motion.span key="r1" className="absolute rounded-full border border-[var(--et-gold-dim)]"
                style={{ width: "100%", height: "100%" }}
                animate={speaking ? { scale: [1, 1.18, 1], opacity: [0.5, 0.15, 0.5] } : { scale: [1, 1.06, 1], opacity: [0.4, 0.25, 0.4] }}
                transition={{ duration: speaking ? 1.1 : 3.2, repeat: Infinity, ease: "easeInOut" }} />
              <motion.span key="r2" className="absolute rounded-full border border-[var(--et-gold)]"
                style={{ width: "78%", height: "78%" }}
                animate={speaking ? { scale: [1, 1.12, 1], opacity: [0.8, 0.4, 0.8] } : { scale: 1, opacity: 0.5 }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }} />
            </>
          ) : null}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={active || status === "connecting" ? stop : start}
          aria-label={active ? "Terminar conversación" : "Hablar con Eon"}
          className="relative z-10 flex h-40 w-40 items-center justify-center rounded-full border text-[var(--et-gold-bright)]"
          style={{
            borderColor: "var(--et-gold)",
            background: "radial-gradient(circle at 50% 40%, rgba(255,255,255,0.22), rgba(18,18,26,0.9) 70%)",
            boxShadow: speaking ? "var(--et-glow-strong)" : "var(--et-glow)",
          }}
          animate={speaking ? { scale: [1, 1.05, 1] } : { scale: 1 }}
          transition={{ duration: 0.8, repeat: speaking ? Infinity : 0, ease: "easeInOut" }}
          whileTap={{ scale: 0.96 }}
        >
          {status === "connecting" ? (
            <span className="block h-9 w-9 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : active ? (
            <svg width="42" height="42" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
          ) : (
            <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
            </svg>
          )}
        </motion.button>
      </div>

      {/* Estado */}
      <div className="mt-8 h-6">
        {status === "idle" ? <span className="text-sm text-[var(--et-text-faint)]">Toca para hablar</span> : null}
        {status === "connecting" ? <span className="text-sm text-[var(--et-text-muted)]">Conectando con Eon…</span> : null}
        {active ? (
          <span className="inline-flex items-center gap-2 text-sm text-[var(--et-gold-bright)]">
            <span className="h-2 w-2 rounded-full bg-[var(--et-gold)]" />
            {speaking ? "Eon está hablando…" : "Te escucho…"}
          </span>
        ) : null}
        {status === "error" ? <span className="text-sm text-[var(--et-danger)]">{error}</span> : null}
      </div>

      {caption && active ? (
        <p className="mt-3 max-w-lg text-sm italic text-[var(--et-text-muted)]">“{caption}”</p>
      ) : null}

      {active ? (
        <p className="mt-6 text-xs text-[var(--et-text-faint)]">
          {usingCloned ? "Hablando con tu voz clonada." : "Voz multilingüe (clona tu voz en Perfil para que Eon hable con la tuya)."}
        </p>
      ) : null}
    </div>
  );
}
