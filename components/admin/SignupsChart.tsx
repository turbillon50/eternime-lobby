"use client";

/** Gráfica de barras de registros por día (14 días) — CSS + Framer, sin librerías. */
import { motion } from "framer-motion";
import type { SignupPoint } from "@/lib/data/admin";

export function SignupsChart({ data }: { data: SignupPoint[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="grid gap-3">
      <div className="flex h-36 items-end gap-1.5 sm:gap-2">
        {data.map((d, i) => {
          const pct = (d.count / max) * 100;
          return (
            <div key={d.day} className="group relative flex h-full flex-1 flex-col justify-end">
              <motion.div
                className="w-full rounded-t-[4px]"
                style={{
                  background:
                    d.count > 0
                      ? "linear-gradient(180deg, var(--et-gold) 0%, rgba(212,175,106,0.35) 100%)"
                      : "rgba(245,242,234,0.08)",
                  minHeight: 3,
                }}
                initial={{ height: 0 }}
                whileInView={{ height: `${Math.max(pct, 2)}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              />
              <div className="pointer-events-none absolute -top-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--et-border)] bg-[var(--et-bg)] px-2 py-0.5 text-[0.65rem] text-[var(--et-gold-bright)] opacity-0 transition group-hover:opacity-100">
                {d.count} · {d.day.slice(5)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[0.62rem] uppercase tracking-[0.12em] text-[var(--et-text-faint)]">
        <span>{data[0]?.day.slice(5) ?? ""}</span>
        <span>Registros por día — últimos 14 días</span>
        <span>{data[data.length - 1]?.day.slice(5) ?? "hoy"}</span>
      </div>
    </div>
  );
}
