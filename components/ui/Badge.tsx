import type { PropsWithChildren } from "react";

type Tone = "gold" | "muted" | "success" | "danger";

const toneStyle: Record<Tone, string> = {
  gold: "border-[var(--et-border)] bg-[rgba(255,255,255,0.1)] text-[var(--et-gold-bright)]",
  muted: "border-[rgba(245,242,234,0.14)] bg-[rgba(245,242,234,0.05)] text-[var(--et-text-muted)]",
  success: "border-[rgba(143,200,160,0.3)] bg-[rgba(143,200,160,0.1)] text-[var(--et-success)]",
  danger: "border-[rgba(224,122,106,0.3)] bg-[rgba(224,122,106,0.1)] text-[var(--et-danger)]",
};

export function Badge({ children, tone = "gold", className = "" }: PropsWithChildren<{ tone?: Tone; className?: string }>) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.68rem] uppercase tracking-[0.12em] ${toneStyle[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
