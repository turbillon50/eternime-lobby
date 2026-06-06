"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface Msg {
  role: "user" | "ai";
  content: string;
}

export default function ConversarPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const conversationId = useRef<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setBusy(true);
    setMessages((m) => [...m, { role: "user", content: text }, { role: "ai", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationId: conversationId.current }),
      });

      const cid = res.headers.get("x-conversation-id");
      if (cid) conversationId.current = cid;

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        appendToLast(data.error || "No pude responder en este momento.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        appendToLast(decoder.decode(value, { stream: true }));
      }
    } catch {
      appendToLast("Se interrumpió la conexión. ¿Lo intentamos de nuevo?");
    } finally {
      setBusy(false);
    }
  }

  async function speak(text: string) {
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      audio.play().catch(() => {});
    } catch {
      /* ignore playback errors */
    }
  }

  function appendToLast(chunk: string) {
    setMessages((m) => {
      const next = [...m];
      const last = next[next.length - 1];
      if (last?.role === "ai") next[next.length - 1] = { ...last, content: last.content + chunk };
      return next;
    });
  }

  return (
    <main className="flex min-h-dvh flex-col bg-[#0a0a0a] text-[#f5f1e8]">
      <header className="flex items-center justify-between border-b border-[#e8d9a8]/10 px-5 py-4">
        <Link href="/home" className="text-sm text-[#d8d2c4]/60 hover:text-[#e8d9a8]">
          ← Mi bóveda
        </Link>
        <p className="font-serif text-sm tracking-wide text-[#e8d9a8]">Conversar con mi IA</p>
        <span className="w-16" />
      </header>

      <div ref={scrollRef} className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-5 py-8">
        {messages.length === 0 ? (
          <div className="mt-24 text-center">
            <p className="font-serif text-2xl leading-snug text-[#f5f1e8]/90">
              Estoy aquí para escucharte.
            </p>
            <p className="mt-3 text-sm text-[#d8d2c4]/50">
              Cuéntame algo, pregúntame, o recordemos juntos.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                <div
                  className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
                    m.role === "user"
                      ? "bg-[#e8d9a8] text-[#0a0a0a]"
                      : "border border-[#e8d9a8]/15 bg-white/[0.03] text-[#f5f1e8]"
                  }`}
                >
                  {m.content || <span className="opacity-40">…</span>}
                </div>
                {m.role === "ai" && m.content && !busy && (
                  <button
                    onClick={() => speak(m.content)}
                    className="mt-1 block text-xs text-[#d8d2c4]/40 hover:text-[#e8d9a8]"
                  >
                    ♪ Escuchar
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-[#e8d9a8]/10 px-5 py-4">
        <div className="mx-auto flex w-full max-w-2xl items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Escribe aquí…"
            className="max-h-40 flex-1 resize-none rounded-2xl border border-[#e8d9a8]/20 bg-white/[0.03] px-4 py-3 text-[15px] outline-none placeholder:text-[#d8d2c4]/30 focus:border-[#e8d9a8]/50"
          />
          <button
            onClick={send}
            disabled={busy || !input.trim()}
            className="rounded-full bg-[#e8d9a8] px-5 py-3 text-sm font-medium text-[#0a0a0a] transition disabled:opacity-40 hover:bg-[#f0e4bd]"
          >
            {busy ? "…" : "Enviar"}
          </button>
        </div>
      </div>
    </main>
  );
}
