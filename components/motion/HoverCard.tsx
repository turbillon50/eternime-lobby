"use client";

import { motion } from "framer-motion";
import type { PropsWithChildren } from "react";
import { motionTokens } from "@/lib/motion-tokens";

type HoverCardProps = PropsWithChildren<{
  /** Escala al hacer hover. */
  scale?: number;
  /** Elevación (translateY negativa) en px al hover. */
  lift?: number;
  className?: string;
  onClick?: () => void;
}>;

/** Wrapper con micro-interacción premium: lift + glow sutil al hover, press al tap. */
export function HoverCard({ children, scale = 1.008, lift = 3, className, onClick }: HoverCardProps) {
  return (
    <motion.div
      className={className}
      onClick={onClick}
      whileHover={{ scale, y: -lift }}
      whileTap={{ scale: 0.985 }}
      transition={motionTokens.spring}
    >
      {children}
    </motion.div>
  );
}
