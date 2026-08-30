"use client";

import Link from "next/link";
import { useState } from "react";

import { IntegrationHub } from "@/components/app/IntegrationHub";
import { EonSignal } from "@/components/visual/VisualArtifacts";

const STEPS = ["Conoce Eon", "Conecta lo esencial", "Empieza tu memoria"];

export function OnboardingJourney({ initialStep = 1 }: { initialStep?: number }) {
  const [step, setStep] = useState(initialStep);

  function move(next: number) {
    const safeStep = Math.min(Math.max(next, 1), STEPS.length);
    setStep(safeStep);
    document.querySelector<HTMLElement>(".eon-app-main")?.scrollTo({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="onboarding-journey">
      <header className="onboarding-progress" aria-label={`Paso ${step} de ${STEPS.length}`}>
        <div className="onboarding-progress__meta">
          <span>Configuración inicial</span>
          <b>{step}/{STEPS.length}</b>
        </div>
        <div className="onboarding-progress__track" aria-hidden>
          <i style={{ width: `${(step / STEPS.length) * 100}%` }} />
        </div>
        <ol>
          {STEPS.map((label, index) => (
            <li className={index + 1 <= step ? "is-active" : ""} key={label}>
              <span>{index + 1}</span>{label}
            </li>
          ))}
        </ol>
      </header>

      {step === 1 && (
        <section className="onboarding-stage onboarding-stage--intro">
          <EonSignal className="onboarding-stage__signal" label="Eon, tu memoria activa" />
          <p className="eon-page-kicker">Bienvenido a Eternime</p>
          <h1>Tu contexto empieza contigo.</h1>
          <p className="onboarding-stage__lead">
            Eternime mantiene cerca tus recuerdos, relaciones y decisiones. Tú eliges qué conectar y qué puede conocer cada inteligencia.
          </p>
          <div className="onboarding-promises">
            <article><b>01</b><h2>Habla</h2><p>Empieza con una idea, una decisión o algo que no quieras perder.</p></article>
            <article><b>02</b><h2>Conecta</h2><p>Autoriza sólo las herramientas que te ayuden en tu día a día.</p></article>
            <article><b>03</b><h2>Conserva</h2><p>Tu memoria permanece en Eternime aunque mañana cambies de IA.</p></article>
          </div>
          <div className="onboarding-controls">
            <button type="button" className="onboarding-primary" onClick={() => move(2)}>Continuar</button>
            <Link href="/app">Primero hablar con Eon</Link>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="onboarding-stage onboarding-stage--connections">
          <div className="onboarding-stage__head">
            <p className="eon-page-kicker">Paso opcional</p>
            <h1>Conecta lo que ya forma parte de tu vida.</h1>
            <p>Puedes empezar sólo con una conexión. Tus contraseñas no pasan por Eternime y cada acceso puede pausarse después.</p>
          </div>
          <IntegrationHub mode="onboarding" />
          <div className="onboarding-controls is-split">
            <button type="button" className="onboarding-secondary" onClick={() => move(1)}>Atrás</button>
            <button type="button" className="onboarding-primary" onClick={() => move(3)}>Continuar</button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="onboarding-stage onboarding-stage--finish">
          <span className="onboarding-complete-mark" aria-hidden>✓</span>
          <p className="eon-page-kicker">Tu espacio está preparado</p>
          <h1>Empieza a construir una memoria que sí continúa contigo.</h1>
          <p className="onboarding-stage__lead">Habla con Eon ahora o configura qué partes de tu contexto podrá consultar cada IA.</p>
          <div className="onboarding-controls">
            <Link href="/app" className="onboarding-primary">Hablar con Eon</Link>
            <Link href="/app/ias">Configurar mis IAs</Link>
          </div>
          <button type="button" className="onboarding-back" onClick={() => move(2)}>Volver a conexiones</button>
        </section>
      )}
    </div>
  );
}
