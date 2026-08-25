"use client";

import { useEffect, useState } from "react";

/**
 * El saludo depende de la hora LOCAL de quien mira, no de la del servidor.
 * Se resuelve en cliente tras montar para no producir hydration mismatch.
 */
export function Greeting({ name }: { name?: string }) {
  const [part, setPart] = useState<string | null>(null);

  useEffect(() => {
    const h = new Date().getHours();
    setPart(h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches");
  }, []);

  return (
    <h1 className="eon-greeting">
      {part ?? "Hola"}
      {name ? `, ${name}` : ""}
    </h1>
  );
}
