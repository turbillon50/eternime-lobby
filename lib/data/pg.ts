/** Literal de array Postgres seguro para text[] (parametrizado, sin inyección). */
export function pgTextArray(items: string[]): string {
  if (!items.length) return "{}";
  return "{" + items.map((s) => '"' + String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"').join(",") + "}";
}
