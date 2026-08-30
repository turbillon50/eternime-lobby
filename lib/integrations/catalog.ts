export type IntegrationSlug = "neon" | "gmail" | "outlook" | "googlecalendar" | "googledrive";

export type IntegrationDefinition = {
  slug: IntegrationSlug;
  name: string;
  eyebrow: string;
  description: string;
  permission: string;
  group: "ownership" | "daily" | "context";
  recommended?: boolean;
};

export const INTEGRATION_CATALOG: readonly IntegrationDefinition[] = [
  {
    slug: "neon",
    name: "Mi Neon",
    eyebrow: "Propiedad de memoria",
    description: "Conecta una cuenta Neon que esté a tu nombre y prepara tu infraestructura privada.",
    permission: "Eternime sólo habilitará operaciones de configuración autorizadas. Nunca borrar proyectos.",
    group: "ownership",
    recommended: true,
  },
  {
    slug: "gmail",
    name: "Gmail",
    eyebrow: "Correo",
    description: "Convierte conversaciones importantes en contexto, relaciones y pendientes.",
    permission: "Lectura contextual y borradores. Enviar siempre requerirá una acción explícita.",
    group: "daily",
    recommended: true,
  },
  {
    slug: "outlook",
    name: "Outlook",
    eyebrow: "Correo Microsoft",
    description: "Conecta tu correo de Microsoft si ahí vive tu actividad principal.",
    permission: "Lectura contextual y borradores. Sin envíos ni borrados automáticos.",
    group: "daily",
  },
  {
    slug: "googlecalendar",
    name: "Google Calendar",
    eyebrow: "Agenda",
    description: "Relaciona reuniones y fechas con las personas, proyectos y decisiones de tu memoria.",
    permission: "Consulta de agenda. Crear o modificar eventos requerirá confirmación.",
    group: "context",
    recommended: true,
  },
  {
    slug: "googledrive",
    name: "Google Drive",
    eyebrow: "Documentos",
    description: "Encuentra archivos relevantes sin convertir Eternime en otra carpeta de documentos.",
    permission: "Buscar y leer archivos autorizados. Sin eliminar ni compartir automáticamente.",
    group: "context",
  },
] as const;

const INTEGRATION_SLUGS = new Set<string>(INTEGRATION_CATALOG.map((item) => item.slug));

export function isIntegrationSlug(value: string): value is IntegrationSlug {
  return INTEGRATION_SLUGS.has(value);
}

export function integrationDefinition(slug: IntegrationSlug): IntegrationDefinition {
  return INTEGRATION_CATALOG.find((item) => item.slug === slug)!;
}
