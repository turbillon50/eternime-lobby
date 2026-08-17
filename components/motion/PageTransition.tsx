"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";

/**
 * Transición de página global: fundido suave con leve desplazamiento.
 * Envuelve el contenido en layouts (shell de /app, /admin y público).
 */
export function PageTransition({ children }: PropsWithChildren) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        style={{ minHeight: "100%" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
