"use client";

import { animate, useInView, useMotionValue } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type NumberCounterProps = {
  /** Valor final. */
  value: number;
  /** Duración en segundos. */
  duration?: number;
  /** Decimales a mostrar. */
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
};

/** Contador animado que cuenta desde 0 hasta `value` cuando entra al viewport. */
export function NumberCounter({
  value,
  duration = 1.4,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: NumberCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!inView) return;
    const controls = animate(motionValue, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) =>
        setDisplay(
          latest.toLocaleString("es-MX", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }),
        ),
    });
    return () => controls.stop();
  }, [inView, value, duration, decimals, motionValue]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
