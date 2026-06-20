"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

const MESSAGES = [
  "Preparando tu bóveda…",
  "Asignando espacio único…",
  "Despertando tu IA…",
  "Lista para conocerte",
];

/**
 * Cinematic tenant-creation loader (~5–8s). Polls onboarding status and, once
 * the branch is ready, glides into the 3-step onboarding. If it takes longer
 * than 15s, offers to continue in the background.
 */
export default function OnboardingLoadingPage() {
  const router = useRouter();
  const [messageIndex, setMessageIndex] = useState(0);
  const [showBackground, setShowBackground] = useState(false);

  useEffect(() => {
    const cycle = setInterval(() => {
      setMessageIndex((i) => Math.min(i + 1, MESSAGES.length - 1));
    }, 2200);
    const slow = setTimeout(() => setShowBackground(true), 15000);

    let active = true;

    // Kick off provisioning directly (fallback for when the Clerk webhook
    // hasn't fired yet). Idempotent server-side, so it's safe to call here.
    fetch("/api/onboarding/provision", { method: "POST" }).catch(() => {});

    const poll = async () => {
      try {
        const res = await fetch("/api/onboarding/status", { cache: "no-store" });
        const data = await res.json();
        if (active && data.status === "ready") {
          router.replace("/onboarding");
          return;
        }
      } catch {
        // keep polling
      }
      if (active) setTimeout(poll, 1500);
    };
    poll();

    return () => {
      active = false;
      clearInterval(cycle);
      clearTimeout(slow);
    };
  }, [router]);

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#0a0a0a] px-6 text-center">
      <motion.div
        className="absolute h-64 w-64 rounded-full bg-[#e8d9a8]/10 blur-3xl"
        animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          <motion.p
            key={messageIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.6 }}
            className="font-serif text-2xl text-[#f5f1e8] md:text-3xl"
          >
            {MESSAGES[messageIndex]}
          </motion.p>
        </AnimatePresence>

        {showBackground && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => router.replace("/app")}
            className="mt-10 text-sm text-[#e8d9a8]/80 underline-offset-4 hover:underline"
          >
            Continuar en segundo plano — te avisamos por correo cuando esté lista
          </motion.button>
        )}
      </div>
    </main>
  );
}
