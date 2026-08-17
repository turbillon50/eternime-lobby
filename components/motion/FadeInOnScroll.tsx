"use client";

import { motion, type Variants } from "framer-motion";
import type { PropsWithChildren } from "react";
import { motionTokens } from "@/lib/motion-tokens";

type FadeInOnScrollProps = PropsWithChildren<{
  /** Retraso en segundos antes de iniciar la animación. */
  delay?: number;
  /** Duración en segundos. */
  duration?: number;
  /** Desplazamiento vertical inicial en px. */
  y?: number;
  /** Solo animar la primera vez que entra al viewport. */
  once?: boolean;
  className?: string;
}>;

export function FadeInOnScroll({
  children,
  delay = 0,
  duration = motionTokens.entrance,
  y = 18,
  once = true,
  className,
}: FadeInOnScrollProps) {
  const variants: Variants = {
    hidden: { opacity: 0, y },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration, delay, ease: motionTokens.ease },
    },
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.2 }}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}
