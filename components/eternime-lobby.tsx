"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CinematicVideo } from "@/components/layers/cinematic-video";
import { MemoryFragments } from "@/components/layers/memory-fragments";
import { PrimaryButton, QuietButton } from "@/components/ui/buttons";

const WebGLOverlay = dynamic(
  () => import("@/components/layers/webgl-overlay").then((mod) => mod.WebGLOverlay),
  {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_34%)]" />,
  },
);

type LobbyStep = 0 | 1 | 2 | 3 | 4;

const steps = [
  {
    eyebrow: "ETERNIME",
    title: "Every life leaves a trace.",
    action: "Begin",
  },
  {
    eyebrow: "MEMORY SIGNAL",
    title: "Memories fade. Stories don't have to.",
    action: "Continue",
  },
  {
    eyebrow: "DIGITAL LEGACY",
    title: "Build your digital legacy.",
    action: "Create Eternime",
  },
] as const;

const preservationOptions = ["Mine", "My Family", "Someone I Love", "A Company", "A Legacy Project"];
const sequenceLabels = ["Trace", "Signal", "Legacy", "Anchor"];

export function EternimeLobby({ clerkEnabled }: { clerkEnabled: boolean }) {
  const [step, setStep] = useState<LobbyStep>(0);
  const [selectedIntent, setSelectedIntent] = useState(preservationOptions[0]);
  const [pulseKey, setPulseKey] = useState(0);

  const phase = useMemo(() => {
    if (step === 4) return "dashboard";
    if (step === 3) return "auth";
    return "lobby";
  }, [step]);

  const advance = useCallback(() => {
    setPulseKey((current) => current + 1);
    setStep((current) => Math.min(current + 1, 4) as LobbyStep);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        advance();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [advance]);

  return (
    <main className="relative min-h-svh overflow-hidden bg-black text-white">
      <CinematicVideo />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.09),rgba(0,0,0,0.12)_25%,#000_84%)]" />
      <WebGLOverlay intensity={step + 1} lowPower={step >= 3} />
      <MemoryFragments active={step >= 2} />
      <PortalPulse pulseKey={pulseKey} />
      <GameHud step={step} />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <motion.div
          className="eternime-video-halo"
          animate={{
            scale: step === 0 ? 1 : step === 1 ? 1.08 : step === 2 ? 1.16 : 1.24,
            opacity: phase === "dashboard" ? 0.12 : 0.34,
          }}
          transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <section className="relative z-10 flex min-h-svh flex-col items-center justify-center px-5 py-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
        <AnimatePresence mode="wait">
          {(step === 0 || step === 1 || step === 2) && (
            <LobbyPanel
              key={`lobby-${step}`}
              step={step}
              onNext={advance}
            />
          )}

          {phase === "auth" && (
            <AuthPanel
              key="auth"
              selectedIntent={selectedIntent}
              clerkEnabled={clerkEnabled}
              onSelectIntent={setSelectedIntent}
              onContinue={advance}
            />
          )}

          {phase === "dashboard" && <DashboardPanel key="dashboard" />}
        </AnimatePresence>
      </section>
    </main>
  );
}

function GameHud({ step }: { step: LobbyStep }) {
  const progress = Math.min(step, 3);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between px-5 py-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.38em] text-white/45">ETERNIME / LOBBY</p>
          <p className="mt-2 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-white/28">
            Memory link {String(progress + 1).padStart(2, "0")}
          </p>
        </div>
        <div className="hidden text-right sm:block">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-white/42">Digital Legacy Intelligence</p>
          <p className="mt-2 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-white/28">Signal stable</p>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-3xl grid-cols-4 gap-2">
        {sequenceLabels.map((label, index) => (
          <div className="sequence-node" key={label}>
            <span className={index <= progress ? "sequence-bar sequence-bar-active" : "sequence-bar"} />
            <span className={index <= progress ? "sequence-label sequence-label-active" : "sequence-label"}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PortalPulse({ pulseKey }: { pulseKey: number }) {
  return (
    <AnimatePresence>
      <motion.div
        key={pulseKey}
        className="pointer-events-none absolute inset-0 z-[3] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.22),transparent_22%,rgba(255,255,255,0.04)_35%,transparent_58%)]"
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: [0, 1, 0], scale: [0.88, 1.18, 1.42] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.92, ease: [0.22, 1, 0.36, 1] }}
      />
    </AnimatePresence>
  );
}

function LobbyPanel({ step, onNext }: { step: 0 | 1 | 2; onNext: () => void }) {
  const content = steps[step];

  return (
    <motion.div
      className="mx-auto flex w-full max-w-5xl flex-col items-center text-center"
      initial={{ opacity: 0, y: 26, filter: "blur(16px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -18, filter: "blur(12px)" }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="font-mono text-[0.68rem] uppercase tracking-[0.46em] text-white/58">{content.eyebrow}</p>
      <h1 className="mt-8 max-w-4xl text-balance text-5xl font-light leading-[0.98] text-white sm:text-7xl lg:text-8xl">
        {content.title}
      </h1>
      <div className="mt-8 h-px w-36 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      <PrimaryButton className="mt-12" onClick={onNext}>
        {content.action}
      </PrimaryButton>
    </motion.div>
  );
}

function AuthPanel({
  selectedIntent,
  clerkEnabled,
  onSelectIntent,
  onContinue,
}: {
  selectedIntent: string;
  clerkEnabled: boolean;
  onSelectIntent: (value: string) => void;
  onContinue: () => void;
}) {
  return (
    <motion.div
      className="w-full max-w-4xl text-center"
      initial={{ opacity: 0, scale: 0.98, filter: "blur(16px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.98, filter: "blur(12px)" }}
      transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="font-mono text-[0.68rem] uppercase tracking-[0.46em] text-white/52">
        {clerkEnabled ? "SECURE ENTRY" : "DEMO MODE"}
      </p>
      <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-light leading-tight sm:text-6xl">
        Whose story are we preserving?
      </h1>

      <div className="mx-auto mt-9 grid max-w-3xl grid-cols-1 gap-2 sm:grid-cols-5">
        {preservationOptions.map((option) => (
          <button
            className={`intent-option ${selectedIntent === option ? "intent-option-active" : ""}`}
            key={option}
            onClick={() => onSelectIntent(option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>

      {!clerkEnabled && (
        <p className="mx-auto mt-7 max-w-xl text-sm leading-6 text-white/48">
          Clerk publishable keys are not configured, so this lobby is running with a demo auth entry.
        </p>
      )}

      <div className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row sm:justify-center">
        <QuietButton onClick={onContinue}>Continue with Google</QuietButton>
        <QuietButton onClick={onContinue}>Continue with Apple</QuietButton>
        <QuietButton onClick={onContinue}>Continue with Email</QuietButton>
      </div>
    </motion.div>
  );
}

function DashboardPanel() {
  return (
    <motion.div
      className="mx-auto flex w-full max-w-4xl flex-col items-center text-center"
      initial={{ opacity: 0, y: 22, filter: "blur(14px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="font-mono text-[0.68rem] uppercase tracking-[0.46em] text-white/52">PRIVATE UNIVERSE</p>
      <h1 className="mt-7 text-balance text-5xl font-light leading-none sm:text-7xl">Your Memory Universe</h1>
      <p className="mt-6 max-w-xl text-lg leading-8 text-white/58">This space is waiting for its first memory.</p>
      <PrimaryButton className="mt-10" onClick={() => undefined}>Upload First Memory</PrimaryButton>
    </motion.div>
  );
}
