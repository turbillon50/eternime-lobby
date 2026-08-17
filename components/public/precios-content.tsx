"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FadeInOnScroll, HoverCard, NumberCounter, StaggerContainer, StaggerItem } from "@/components/motion";
import { Badge } from "@/components/ui";

const planes = [
  {
    nombre: "Semilla",
    precio: 0,
    periodo: "gratis, para siempre",
    descripcion: "Para empezar a sembrar tu historia.",
    destacado: false,
    incluye: ["50 recuerdos en texto, voz o foto", "3 cartas de legado", "1 ser querido designado", "Bóveda privada y cifrada"],
    cta: "Comenzar gratis",
  },
  {
    nombre: "Legado",
    precio: 199,
    periodo: "MXN al mes",
    descripcion: "La memoria viva completa, sin límites.",
    destacado: true,
    incluye: ["Recuerdos ilimitados", "Cartas de legado ilimitadas", "Guía de IA entrenada con tu esencia", "Entregas programadas al futuro", "Seres queridos ilimitados"],
    cta: "Elegir Legado",
  },
  {
    nombre: "Eterno",
    precio: 2999,
    periodo: "MXN, pago único",
    descripcion: "Todo, para siempre. Sin mensualidades.",
    destacado: false,
    incluye: ["Todo lo del plan Legado", "Acceso vitalicio garantizado", "Bóveda familiar compartida", "Herederos digitales designados", "Soporte prioritario"],
    cta: "Hacerlo eterno",
  },
];

const faqs = [
  {
    q: "Qué pasa con mis recuerdos si dejo de pagar?",
    a: "Nunca los pierdes. Tu cuenta pasa al plan Semilla y tus primeros 50 recuerdos y 3 cartas permanecen intactos. Si vuelves, todo sigue donde lo dejaste.",
  },
  {
    q: "Quién puede ver mi memoria viva?",
    a: "Solo tú, mientras vivas. Tu decides que personas y en que momento podran acceder a tu legado. Todo está cifrado y bajo tu control absoluto.",
  },
  {
    q: "Cómo funcionan las entregas programadas?",
    a: "Escribes una carta, eliges al destinatario y la fecha o el evento (un cumpleaños número 18, una boda). Eternime la entrega exactamente en ese momento.",
  },
  {
    q: "El plan Eterno de verdad es para siempre?",
    a: "Sí. Un solo pago cubre la preservación de tu bóveda a perpetuidad, con herederos digitales que garantizan la continuidad de tu legado familiar.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="et-card overflow-hidden rounded-[var(--et-radius)]">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="et-serif text-base">{q}</span>
        <motion.span
          aria-hidden="true"
          animate={{ rotate: abierto ? 45 : 0 }}
          transition={{ duration: 0.25 }}
          className="text-xl leading-none text-[var(--et-gold-bright)]"
        >
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {abierto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="px-5 pb-5 text-sm leading-relaxed text-[var(--et-text-muted)]">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PreciosContent() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-24 pt-16 sm:px-8">
      <FadeInOnScroll>
        <p className="text-center text-xs uppercase tracking-[0.3em] text-[var(--et-gold)]">Precios</p>
        <h1 className="et-serif mt-4 text-center text-3xl leading-tight sm:text-5xl">
          Un legado a la medida de <span className="text-[var(--et-gold-bright)]">tu historia</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-center text-[var(--et-text-muted)]">
          Empieza gratis. Crece cuando tu historia lo pida. Quédate para siempre.
        </p>
      </FadeInOnScroll>

      <StaggerContainer className="mt-16 grid gap-6 md:grid-cols-3">
        {planes.map((plan) => (
          <StaggerItem key={plan.nombre}>
            <HoverCard className="h-full">
              <div className={"et-card relative flex h-full flex-col rounded-[var(--et-radius)] p-7 " + (plan.destacado ? "et-glow-ring" : "")}>
                {plan.destacado && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge>Mas elegido</Badge>
                  </div>
                )}
                <h2 className="et-serif text-xl text-[var(--et-gold-bright)]">{plan.nombre}</h2>
                <p className="mt-1 text-sm text-[var(--et-text-muted)]">{plan.descripcion}</p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="et-serif text-4xl">
                    $<NumberCounter value={plan.precio} />
                  </span>
                  <span className="text-xs text-[var(--et-text-muted)]">{plan.periodo}</span>
                </div>
                <ul className="mt-6 flex flex-1 flex-col gap-2.5">
                  {plan.incluye.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-[var(--et-text-muted)]">
                      <span aria-hidden="true" className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--et-gold)]" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/crear"
                  className={"mt-8 w-full text-center " + (plan.destacado ? "et-btn et-btn-primary" : "et-btn et-btn-ghost")}
                >
                  {plan.cta}
                </Link>
              </div>
            </HoverCard>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <FadeInOnScroll className="mt-24">
        <h2 className="et-serif text-center text-2xl sm:text-3xl">Preguntas frecuentes</h2>
        <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-3">
          {faqs.map((f) => (
            <FaqItem key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </FadeInOnScroll>

      <FadeInOnScroll className="mt-20 text-center">
        <p className="text-[var(--et-text-muted)]">Tu primer recuerdo no cuesta nada.</p>
        <Link href="/crear" className="et-btn et-btn-primary mt-5 inline-flex px-8">
          Crear mi legado
        </Link>
      </FadeInOnScroll>
    </div>
  );
}
