"use client";

import { useEffect } from "react";

/** Registra el service worker de la PWA (solo producción/navegadores compatibles). */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.warn("[pwa] no se pudo registrar el service worker", error);
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
