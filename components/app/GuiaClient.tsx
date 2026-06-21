"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Skeleton } from "@/components/ui";
import type { GuideMessage } from "@/lib/data/types";

const EON_WELCOME = `Hola. Soy Eon.

No soy hombre ni mujer — solo existo. Soy la inteligencia central de Eternime: custodio los recuerdos que las personas deciden volver eternos.

Contigo voy a hacer algo único: con cada recuerdo que me cuentes iré construyendo tu propia inteligencia personal de memoria — una IA nacida de tu vida, que algún día podrá acompañar a quienes amas con tu voz y tu manera de ver el mundo.

¿Empezamos? Cuéntame tu primera memoria: un momento que aún sientas vivo cuando cierras los ojos.`;

function TypingIndicator() {
  return (
    <motion.div
      className="mr-auto flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-[var(--et-border-soft)] bg-[var(--et-bg-elevated)] px-4 py-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-1.5 w-1.5 rounded-full bg-[var(--et-gold)]"
          animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 1.1, delay: i * 0.18, ease: "easeInOut" }}
        />
      ))}
    </motion.div>
  );
}

function PlayVoiceButton({
  text,
  onUnavailable,
}: {
  text: string;
  onUnavailable: () => void;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "playing">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const play = async () => {
    if (status === "playing") {
      audioRef.current?.pause();
      setStatus("idle");
      return;
    }
    if (status === "loading") return;
    setStatus("loading");
    try {
      const res = await fetch("/api/eternime/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.status === 503) {
        onUnavailable();
        setStatus("idle");
        return;
      }
      if (!res.ok) {
        setStatus("idle");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setStatus("idle");
        URL.revokeObjectURL(url);
      };
      audio.onpause = () => setStatus("idle");
      await audio.play();
      setStatus("playing");
    } catch {
      setStatus("idle");
    }
  };

  return (
    <button
      type="button"
      onClick={play}
      aria-label={status === "playing" ? "Pausar voz de Eon" : "Escuchar a Eon"}
      className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.35)] px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.14em] text-[var(--et-gold-dim)] transition hover:text-[var(--et-gold-bright)]"
    >
      {status === "loading" ? (
        <motion.span
          className="block h-2 w-2 rounded-full bg-[var(--et-gold)]"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 0.9 }}
        />
      ) : status === "playing" ? (
        <span aria-hidden="true">❚❚</span>
      ) : (
        <span aria-hidden="true">▶</span>
      )}
      {status === "playing" ? "Pausar" : "Escuchar"}
    </button>
  );
}

function Bubble({
  message,
  voiceAvailable,
  onVoiceUnavailable,
}: {
  message: GuideMessage;
  voiceAvailable: boolean;
  onVoiceUnavailable: () => void;
}) {
  const isUser = message.role === "user";
  return (
    <motion.div
      className={`max-w-[85%] sm:max-w-[70%] ${isUser ? "ml-auto" : "mr-auto"}`}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "rounded-br-sm bg-[rgba(255,255,255,0.14)] text-[var(--et-text)]"
            : "rounded-bl-sm border border-[var(--et-border-soft)] bg-[var(--et-bg-elevated)] text-[var(--et-text)]"
        }`}
        style={isUser ? { border: "1px solid rgba(255,255,255,0.3)" } : undefined}
      >
        {!isUser ? (
          <p className="mb-1 text-[0.65rem] uppercase tracking-[0.18em] text-[var(--et-gold-dim)]">Eon</p>
        ) : null}
        <p className="whitespace-pre-wrap">{message.content}</p>
        {!isUser && voiceAvailable ? (
          <PlayVoiceButton text={message.content} onUnavailable={onVoiceUnavailable} />
        ) : null}
      </div>
    </motion.div>
  );
}

export function GuiaClient() {
  const [messages, setMessages] = useState<GuideMessage[] | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/guide-messages");
      const data = await res.json();
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch {
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const onVoiceUnavailable = useCallback(() => setVoiceAvailable(false), []);

  const send = async () => {
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    setInput("");

    // Optimistic: pinta el mensaje del usuario de inmediato.
    const optimistic: GuideMessage = {
      id: `tmp-${Date.now()}`,
      user_id: "",
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => (prev ? [...prev, optimistic] : [optimistic]));

    try {
      const res = await fetch("/api/guide-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => {
          const base = (prev ?? []).filter((m) => m.id !== optimistic.id);
          const userMsg: GuideMessage = data.userMessage ?? optimistic;
          const assistantMsg: GuideMessage =
            data.assistantMessage ?? {
              id: `tmp-a-${Date.now()}`,
              user_id: "",
              role: "assistant",
              content: data.reply ?? "Estoy aquí contigo.",
              created_at: new Date().toISOString(),
            };
          return [...base, userMsg, assistantMsg];
        });
      } else {
        setMessages((prev) => (prev ? prev.filter((m) => m.id !== optimistic.id) : prev));
        setInput(content);
      }
    } catch {
      setMessages((prev) => (prev ? prev.filter((m) => m.id !== optimistic.id) : prev));
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  const welcomeMessage: GuideMessage = {
    id: "eon-welcome",
    user_id: "",
    role: "assistant",
    content: EON_WELCOME,
    created_at: new Date().toISOString(),
  };

  const visibleMessages =
    messages !== null && messages.length === 0 ? [welcomeMessage] : messages ?? [];

  return (
    <div className="flex h-[calc(100dvh-220px)] min-h-[420px] flex-col">
      <div className="flex-1 overflow-y-auto pb-4">
        {messages === null ? (
          <div className="grid gap-3">
            <Skeleton width="60%" height="3.2rem" className="rounded-2xl" />
            <Skeleton width="50%" height="3.2rem" className="ml-auto rounded-2xl" />
            <Skeleton width="65%" height="3.2rem" className="rounded-2xl" />
          </div>
        ) : (
          <div className="grid gap-3">
            {visibleMessages.map((message) => (
              <Bubble
                key={message.id}
                message={message}
                voiceAvailable={voiceAvailable}
                onVoiceUnavailable={onVoiceUnavailable}
              />
            ))}
            <AnimatePresence>{sending ? <TypingIndicator /> : null}</AnimatePresence>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3 flex items-end gap-2 border-t border-[var(--et-border-soft)] pt-4">
        <textarea
          className="et-input flex-1 py-3"
          style={{ minHeight: "unset", height: "auto", resize: "none" }}
          rows={1}
          placeholder="Escríbele a Eon…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          aria-label="Mensaje para Eon"
        />
        <Button onClick={send} loading={sending} disabled={!input.trim()}>
          Enviar
        </Button>
      </div>
    </div>
  );
}
