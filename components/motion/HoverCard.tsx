"use client";

import { motion } from "framer-motion";
import type { PropsWithChildren } from "react";

type HoverCardProps = PropsWithChildren<{
  /** Escala al hacer hover. */
  scale?: number;
  /** Elevación (translateY negativa) en px al hover. */
  lift?: number;
  className?: string;
  onClick?: () => void;
}>;

/** Wrapper con micro-interacción premium: lift + glow sutil al hover, press al tap. */
export function HoverCard({ children, scale = 1.015, lift = 4, className, onClick }: HoverCardProps) {
  return (
    <motion.div
      className={className}
      onClick={onClick}
      whileHover={{ scale, y: -lift }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
    >
      {children}
    </motion.div>
  );
}
