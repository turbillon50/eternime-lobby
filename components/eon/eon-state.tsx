"use client";

/**
 * Estado global de EON.
 *
 * REGLA: sólo se conecta a actividad REAL que ya existe en la app.
 *  - thinking  -> hay una petición en vuelo a /api/guide-messages
 *  - listening -> el agente de voz de ElevenLabs está escuchando
 *  - acting    -> se está ejecutando una acción real (guardar, crear, subir)
 *  - success / error -> resultado real de esa acción
 *  - offline   -> navigator.onLine === false
 * Si un estado funcional no existe, NO se simula.
 */

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type PropsWithChildren,
} from "react";
import type { EonState } from "./eon-gl";

type Ctx = {
  state: EonState;
  /** Nivel de audio real 0..1 (sólo con permiso y stream activos). */
  audio: number;
  /** Fija un estado sostenido (thinking, listening, acting…). */
  setState: (s: EonState) => void;
  /** Estado momentáneo que vuelve solo a idle (success / error). */
  pulse: (s: EonState, ms?: number) => void;
  setAudio: (level: number) => void;
  /** Envuelve una promesa real: acting -> success | error. */
  track: <T>(p: Promise<T>, kind?: EonState) => Promise<T>;
};

const EonCtx = createContext<Ctx | null>(null);

export function EonStateProvider({ children }: PropsWithChildren) {
  const [state, setInternal] = useState<EonState>("idle");
  const [audio, setAudioLevel] = useState(0);
  const offlineRef = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Offline real del navegador
  useEffect(() => {
    const sync = () => {
      offlineRef.current = !navigator.onLine;
      setInternal((s) => (!navigator.onLine ? "offline" : s === "offline" ? "idle" : s));
    };
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  const setState = useCallback((s: EonState) => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    setInternal(offlineRef.current && s === "idle" ? "offline" : s);
  }, []);

  const pulse = useCallback((s: EonState, ms = 1500) => {
    if (timer.current) clearTimeout(timer.current);
    setInternal(s);
    timer.current = setTimeout(() => {
      timer.current = null;
      setInternal(offlineRef.current ? "offline" : "idle");
    }, ms);
  }, []);

  const setAudio = useCallback((level: number) => setAudioLevel(level), []);

  const track = useCallback(
    async <T,>(p: Promise<T>, kind: EonState = "acting"): Promise<T> => {
      setState(kind);
      try {
        const out = await p;
        pulse("success", 1200);
        return out;
      } catch (e) {
        pulse("error", 1800);
        throw e;
      }
    },
    [setState, pulse],
  );

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const value = useMemo<Ctx>(
    () => ({ state, audio, setState, pulse, setAudio, track }),
    [state, audio, setState, pulse, setAudio, track],
  );

  return <EonCtx.Provider value={value}>{children}</EonCtx.Provider>;
}

/** Seguro fuera del provider: devuelve un no-op para no romper nada. */
export function useEon(): Ctx {
  const ctx = useContext(EonCtx);
  const fallback = useMemo<Ctx>(
    () => ({
      state: "idle", audio: 0,
      setState: () => {}, pulse: () => {}, setAudio: () => {},
      track: (p) => p,
    }),
    [],
  );
  return ctx ?? fallback;
}
