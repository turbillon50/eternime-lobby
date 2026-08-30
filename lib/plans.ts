export type EternimePlan = {
  nombre: string;
  precio: number | null;
  periodo: string;
  descripcion: string;
  destacado: boolean;
  incluye: readonly string[];
  cta: string;
  modo: "gratis" | "checkout" | "pronto";
};

export const ETERNIME_PLANS: readonly EternimePlan[] = [
  {
    nombre: "Semilla",
    precio: 0,
    periodo: "gratis, para siempre",
    descripcion: "Para empezar a sembrar tu historia.",
    destacado: false,
    incluye: ["50 recuerdos en texto, voz o foto", "3 cartas de legado", "1 ser querido designado", "Bóveda privada y cifrada"],
    cta: "Comenzar gratis",
    modo: "gratis",
  },
  {
    nombre: "Legado",
    precio: 199,
    periodo: "MXN al mes",
    descripcion: "La memoria viva completa, sin límites.",
    destacado: true,
    incluye: ["Recuerdos ilimitados", "Cartas de legado ilimitadas", "Guía de IA entrenada con tu esencia", "Entregas programadas al futuro", "Seres queridos ilimitados"],
    cta: "Elegir Legado",
    modo: "checkout",
  },
  {
    nombre: "Socio",
    precio: null,
    periodo: "",
    descripcion: "Vende Eternime y gana de por vida.",
    destacado: false,
    incluye: ["Comparte tu link y gana 5% siendo suscriptor", "Socio Comercial: 20% de por vida", "Socio Master: 40% + venta internacional", "Panel de administración con tu red en vivo", "Comisiones sobre cada cobro, para siempre"],
    cta: "Entra a tu panel de socio",
    modo: "pronto",
  },
];
