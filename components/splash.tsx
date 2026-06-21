"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/** Splash premium: halo de luz blanca viva (el logo de Eternime). */
export function Splash() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("eternime-splash-seen")) return;
      sessionStorage.setItem("eternime-splash-seen", "1");
    } catch { /* noop */ }
    setShow(true);
    const t = setTimeout(() => setShow(false), 2100);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          style={{ background: "radial-gradient(circle at 50% 42%, #15171c, #07070b 72%)" }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        >
          <div className="relative flex h-56 w-56 items-center justify-center">
            {/* Ondas que se expanden */}
            {[0, 0.7, 1.4].map((delay) => (
              <motion.span
                key={delay}
                className="absolute rounded-full"
                style={{ width: 150, height: 150, border: "1px solid rgba(255,255,255,0.5)" }}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1.9, opacity: [0, 0.5, 0] }}
                transition={{ duration: 2.6, repeat: Infinity, delay, ease: "easeOut" }}
              />
            ))}

            {/* Glow exterior suave */}
            <motion.span
              className="absolute rounded-full"
              style={{ width: 220, height: 220, background: "radial-gradient(circle, rgba(255,255,255,0.30), transparent 62%)", filter: "blur(8px)" }}
              animate={{ opacity: [0.55, 0.9, 0.55], scale: [1, 1.05, 1] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Halo con arco de luz viva girando */}
            <motion.svg
              width="170" height="170" viewBox="0 0 170 170"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, rotate: 360 }}
              transition={{ scale: { duration: 1, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.8 }, rotate: { duration: 8, repeat: Infinity, ease: "linear" } }}
            >
              <defs>
                <radialGradient id="core" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                  <stop offset="38%" stopColor="#ffffff" stopOpacity="0.18" />
                  <stop offset="70%" stopColor="#ffffff" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="arc" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                  <stop offset="55%" stopColor="#ffffff" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
                </linearGradient>
              </defs>
              {/* núcleo luminoso */}
              <circle cx="85" cy="85" r="60" fill="url(#core)" />
              {/* anillos finos */}
              <circle cx="85" cy="85" r="62" fill="none" stroke="#ffffff" strokeOpacity="0.85" strokeWidth="1.4" />
              <circle cx="85" cy="85" r="74" fill="none" stroke="#ffffff" strokeOpacity="0.16" strokeWidth="1" />
              {/* arco de luz viva */}
              <circle cx="85" cy="85" r="62" fill="none" stroke="url(#arc)" strokeWidth="3" strokeLinecap="round" strokeDasharray="150 240" />
            </motion.svg>
          </div>

          <motion.p
            className="et-serif mt-9 text-2xl tracking-[0.42em] text-white"
            style={{ textShadow: "0 0 22px rgba(255,255,255,0.45)" }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            ETERNIME
          </motion.p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
