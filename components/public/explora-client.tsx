"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLang } from "@/components/i18n";

type Item = { key: string; icon: React.ReactNode; es: { t: string; d: string }; en: { t: string; d: string } };

function Ic({ d }: { d: string }) {
  return <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}

const ITEMS: Item[] = [
  { key: "voz", icon: <Ic d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3ZM5 11a7 7 0 0 0 14 0M12 18v3" />,
    es: { t: "Tu voz", d: "Clónala y que siga hablándole a quienes amas, viva para siempre." },
    en: { t: "Your voice", d: "Clone it so it keeps speaking to those you love, alive forever." } },
  { key: "fotos", icon: <Ic d="M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M8.5 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />,
    es: { t: "Fotos", d: "Los rostros, los lugares y los momentos que te hicieron quien eres." },
    en: { t: "Photos", d: "The faces, places and moments that made you who you are." } },
  { key: "video", icon: <Ic d="M3 6h12v12H3zM15 10l6-3v10l-6-3" />,
    es: { t: "Video", d: "Verte y oírte en movimiento: tu mirada, tu risa, tu manera de ser." },
    en: { t: "Video", d: "See and hear you in motion: your gaze, your laugh, your way of being." } },
  { key: "docs", icon: <Ic d="M14 3v5h5M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM8 13h8M8 17h6" />,
    es: { t: "Documentos", d: "Lo que escribiste, firmaste y guardaste, a salvo y ordenado." },
    en: { t: "Documents", d: "What you wrote, signed and kept — safe and in order." } },
  { key: "cartas", icon: <Ic d="M4 6h16v12H4zM4 7l8 6 8-6M9 21l3-3 3 3" />,
    es: { t: "Cartas", d: "Palabras que esperarán el día exacto para llegar a su destino." },
    en: { t: "Letters", d: "Words that will wait for the exact day to reach their destination." } },
  { key: "legado", icon: <Ic d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 21l-4.9 2.6.9-5.5-4-3.9 5.5-.8z" />,
    es: { t: "Legado y valores", d: "Tu esencia: lo que creíste, enseñaste y quieres que perdure." },
    en: { t: "Legacy & values", d: "Your essence: what you believed, taught and want to endure." } },
];

export function ExploraClient() {
  const lang = useLang();
  return (
    <div className="relative">
      {/* Hero */}
      <section className="px-5 pt-10 text-center sm:px-8 sm:pt-16">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="et-glow-ring mx-auto flex h-16 w-16 items-center justify-center rounded-full"
          style={{ boxShadow: "0 0 40px rgba(255,255,255,0.3)" }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.3"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
        </motion.div>
        <h1 className="et-serif mx-auto mt-7 max-w-2xl text-balance text-3xl leading-tight text-white sm:text-5xl" style={{ textShadow: "0 0 30px rgba(255,255,255,0.25)" }}>
          {lang === "en" ? "Everything you are, kept forever." : "Todo lo que eres, guardado para siempre."}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[var(--et-text-muted)]">
          {lang === "en"
            ? "Eternime preserves your voice, your memories and your essence — and an AI, Eon, learns from you so your legacy keeps living."
            : "Eternime preserva tu voz, tus recuerdos y tu esencia — y una IA, Eon, aprende de ti para que tu legado siga vivo."}
        </p>
      </section>

      {/* Carrusel deslizable */}
      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between px-5 sm:px-8">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-[var(--et-text-faint)]">
            {lang === "en" ? "What you can preserve" : "Lo que puedes preservar"}
          </p>
          <span className="text-xs text-[var(--et-text-faint)]">{lang === "en" ? "swipe →" : "desliza →"}</span>
        </div>
        <div className="et-snap flex gap-4 overflow-x-auto px-5 pb-4 sm:px-8" style={{ scrollSnapType: "x mandatory" }}>
          {ITEMS.map((it, i) => {
            const c = lang === "en" ? it.en : it.es;
            return (
              <motion.article key={it.key}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="et-card relative flex min-w-[78%] flex-col gap-4 p-6 sm:min-w-[320px]"
                style={{ scrollSnapAlign: "center" }}>
                <span className="absolute right-5 top-5 h-16 w-16 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.16), transparent 70%)", filter: "blur(6px)" }} />
                <span className="et-glow-ring flex h-14 w-14 items-center justify-center rounded-2xl text-white">{it.icon}</span>
                <div>
                  <h3 className="et-serif text-2xl text-white">{c.t}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--et-text-muted)]">{c.d}</p>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-12 text-center sm:px-8">
        <p className="mx-auto max-w-md text-[var(--et-text-muted)]">
          {lang === "en" ? "Your story deserves to outlive you." : "Tu historia merece vivir más que tú."}
        </p>
        <Link href="/crear" className="et-btn et-btn-primary mt-6 inline-flex px-8">
          {lang === "en" ? "Start my legacy" : "Comenzar mi legado"}
        </Link>
      </section>
    </div>
  );
}
