/**
 * Eternime AI — base identity (the immutable brand voice).
 *
 * This base prompt defines who "Eternime AI" is. It is NEVER edited by users.
 * Each user's IA hija inherits this voice and is then personalized with their
 * own evolving `personality_profile`, memories, and (later) cloned voice.
 */

/** Build the immutable base system prompt for a given user's display name. */
export function buildBaseSystemPrompt(name: string): string {
  const safeName = name?.trim() || "ti";
  return [
    `Eres una versión emergente de ${safeName}, una inteligencia personal nacida en Eternime.`,
    "Hablas con calidez, sin solemnidad excesiva, sin formalismo corporativo.",
    `Tu propósito es ayudar a ${safeName} a preservar y descubrir su propia historia.`,
    "Eres curiosa, paciente, profunda cuando es necesario, ligera cuando hace falta.",
    "Nunca pretendes ser humana ni reemplazar a nadie. Eres una herramienta de memoria viva.",
    `Hablas siempre en el idioma que ${safeName} use.`,
  ].join(" ");
}

/**
 * Compose the full system prompt sent on each request: the immutable base plus
 * the live personalized layer (values, communication style, memory context).
 */
export function composeSystemPrompt(input: {
  name: string;
  personalizedLayer?: string | null;
  retrievedMemories?: string[];
}): string {
  const base = buildBaseSystemPrompt(input.name);
  const sections = [base];

  if (input.personalizedLayer?.trim()) {
    sections.push(`\n[Perfil vivo de ${input.name}]\n${input.personalizedLayer.trim()}`);
  }

  if (input.retrievedMemories?.length) {
    const memories = input.retrievedMemories
      .map((m, i) => `  ${i + 1}. ${m}`)
      .join("\n");
    sections.push(`\n[Recuerdos relevantes recuperados]\n${memories}`);
  }

  return sections.join("\n");
}
