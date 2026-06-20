"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

/**
 * 3-step cinematic onboarding (Fase 1):
 *   1. ¿Cómo te gusta que te llamen?
 *   2. Cuéntame algo importante de ti  → first memory (embedded in the vault)
 *   3. Sube algo que te represente     → deferred to Fase 2 (Blob upload)
 */
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [firstMemory, setFirstMemory] = useState("");
  const [saving, setSaving] = useState(false);

  const next = () => setStep((s) => s + 1);

  const finish = async () => {
    setSaving(true);
    try {
      await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, firstMemory }),
      });
    } catch {
      // Non-fatal: the user can revisit captures later from the dashboard.
    } finally {
      router.replace("/app");
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#0a0a0a] px-6 py-16 text-[#f5f1e8]">
      <div className="w-full max-w-md">
        <StepDots total={3} current={step} />

        <AnimatePresence mode="wait">
          {step === 0 && (
            <Step key="s0" title="¿Cómo te gusta que te llamen?">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full rounded-xl border border-[#e8d9a8]/20 bg-white/[0.03] px-4 py-3 text-lg outline-none placeholder:text-[#d8d2c4]/30 focus:border-[#e8d9a8]/60"
              />
              <PrimaryButton disabled={!name.trim()} onClick={next}>
                Continuar
              </PrimaryButton>
            </Step>
          )}

          {step === 1 && (
            <Step key="s1" title="Cuéntame algo importante de ti">
              <textarea
                autoFocus
                value={firstMemory}
                onChange={(e) => setFirstMemory(e.target.value)}
                rows={5}
                placeholder="Un recuerdo, un valor, una historia…"
                className="w-full resize-none rounded-xl border border-[#e8d9a8]/20 bg-white/[0.03] px-4 py-3 text-base outline-none placeholder:text-[#d8d2c4]/30 focus:border-[#e8d9a8]/60"
              />
              <PrimaryButton disabled={!firstMemory.trim()} onClick={next}>
                Continuar
              </PrimaryButton>
            </Step>
          )}

          {step === 2 && (
            <Step key="s2" title="Sube una foto, audio o video que te represente">
              <p className="text-sm leading-relaxed text-[#d8d2c4]/60">
                Podrás añadir tus primeros archivos en cuanto entres a tu bóveda.
                Por ahora, guardemos lo esencial.
              </p>
              <PrimaryButton disabled={saving} onClick={finish}>
                {saving ? "Guardando…" : "Entrar a mi Eternime"}
              </PrimaryButton>
            </Step>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.5 }}
      className="mt-8"
    >
      <h1 className="font-serif text-2xl leading-snug md:text-3xl">{title}</h1>
      <div className="mt-6 flex flex-col gap-5">{children}</div>
    </motion.div>
  );
}

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1 flex-1 rounded-full transition-colors ${
            i <= current ? "bg-[#e8d9a8]" : "bg-[#e8d9a8]/15"
          }`}
        />
      ))}
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-full bg-[#e8d9a8] px-7 py-3 text-sm font-medium text-[#0a0a0a] transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#f0e4bd]"
    >
      {children}
    </button>
  );
}
