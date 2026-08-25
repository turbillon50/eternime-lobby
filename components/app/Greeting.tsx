"use client";

import { useSyncExternalStore } from "react";

/**
 * El saludo depende de la hora LOCAL de quien mira, no de la del servidor.
 * useSyncExternalStore da un snapshot distinto en servidor ("Hola") y en
 * cliente, sin hydration mismatch y sin setState dentro de un efecto.
 */
const subscribe = () => () => {};

function clientSnapshot(): string {
  const h = new Date().getHours();
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

const serverSnapshot = () => "Hola";

export function Greeting({ name }: { name?: string }) {
  const part = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  return (
    <h1 className="eon-greeting">
      {part}
      {name ? `, ${name}` : ""}
    </h1>
  );
}
