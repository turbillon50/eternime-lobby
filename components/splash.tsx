"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/** Splash de carga con el anillo de Eon. Se muestra una vez por sesión al abrir. */
export function Splash() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("eternime-splash-seen")) return;
      sessionStorage.setItem("eternime-splash-seen", "1");
    } catch { /* noop */ }
    setShow(true);
    const t = setTimeout(() => setShow(false), 1300);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          style={{ background: "radial-gradient(circle at 50% 45%, #14140f, #0a0a0f 70%)" }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <motion.div
            className="relative flex h-28 w-28 items-center justify-center rounded-full border border-[var(--et-gold)]"
            style={{ boxShadow: "var(--et-glow-strong)" }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 1, 0.96, 1], opacity: 1 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.span className="absolute inset-0 rounded-full border border-[var(--et-gold-dim)]"
              animate={{ scale: [1, 1.35], opacity: [0.6, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }} />
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--et-gold-bright)" strokeWidth="1.3">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
            </svg>
          </motion.div>
          <motion.p
            className="et-serif mt-7 text-2xl tracking-[0.32em] text-[var(--et-gold-bright)]"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.7 }}
          >
            ETERNIME
          </motion.p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
