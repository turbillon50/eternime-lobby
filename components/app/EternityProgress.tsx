"use client";

import { motion } from "framer-motion";
import { NumberCounter } from "@/components/motion";

type EternityProgressProps = {
  /** 0 a 100 */
  percent: number;
  label: string;
};

/** Barra de progreso animada del nivel de eternidad. */
export function EternityProgress({ percent, label }: EternityProgressProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="grid gap-3">
      <div className="flex items-end justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--et-text-faint)]">Nivel de eternidad</p>
        <p className="et-serif text-2xl text-[var(--et-gold-bright)]">
          <NumberCounter value={clamped} suffix="%" />
        </p>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full"
        style={{ background: "rgba(245,242,234,0.07)" }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, var(--et-gold-dim), var(--et-gold), var(--et-gold-bright))",
            boxShadow: "0 0 14px rgba(255,255,255,0.45)",
          }}
          initial={{ width: 0 }}
          whileInView={{ width: `${clamped}%` }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />
      </div>
      <p className="text-sm text-[var(--et-text-muted)]">{label}</p>
    </div>
  );
}
