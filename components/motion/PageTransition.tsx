"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";
import { motionTokens } from "@/lib/motion-tokens";

/**
 * Transición de página global: fundido suave con leve desplazamiento.
 * Envuelve el contenido en layouts (shell de /app, /admin y público).
 */
export function PageTransition({ children }: PropsWithChildren) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="sync" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8, scale: 0.995 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -5, scale: 1.002 }}
        transition={{ duration: motionTokens.standard, ease: motionTokens.ease }}
        style={{ minHeight: "100%" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
