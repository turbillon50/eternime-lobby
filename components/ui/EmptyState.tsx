"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
};

/** Estado vacío elegante — regla de Luis: nunca mock hardcodeado, siempre esto. */
export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-4 rounded-[var(--et-radius)] border border-dashed border-[var(--et-border-soft)] px-6 py-14 text-center"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="et-glow-ring et-pulse flex h-16 w-16 items-center justify-center rounded-full text-[var(--et-gold)]"
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
      >
        {icon ?? (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        )}
      </motion.div>
      <h3 className="et-serif text-lg text-[var(--et-text)]">{title}</h3>
      {description ? <p className="max-w-sm text-sm text-[var(--et-text-muted)]">{description}</p> : null}
      {action}
    </motion.div>
  );
}
