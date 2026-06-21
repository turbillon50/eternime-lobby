"use client";

import { useEffect } from "react";

/**
 * Registra el SW y, cuando se activa una versión nueva, recarga al cliente
 * UNA vez para que quien ya tenía la app abierta vea la actualización sin
 * borrar caché a mano.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
        // Si ya hay uno esperando, actívalo.
        if (reg.waiting) reg.waiting.postMessage("SKIP_WAITING");
        reg.addEventListener("updatefound", () => {
          const sw = reg.installing;
          if (!sw) return;
          sw.addEventListener("statechange", () => {
            if (sw.state === "installed" && navigator.serviceWorker.controller) {
              sw.postMessage("SKIP_WAITING");
            }
          });
        });
        // Busca updates al cargar.
        reg.update().catch(() => {});
      } catch (e) {
        console.warn("[pwa] SW no registrado", e);
      }
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  }, []);

  return null;
}
