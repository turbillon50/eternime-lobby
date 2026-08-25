import { getSession } from "@/lib/auth";
import { listTasks } from "@/lib/data/operations";
import { listLetters } from "@/lib/data/letters";
import { listMemories } from "@/lib/data/memories";
import { EonHome, type AttentionRow, type TimelineRow } from "@/components/app/EonHome";

export const dynamic = "force-dynamic";

const TZ = "America/Mexico_City";
const DAY = 86_400_000;

const fmtTime = new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ });
const fmtDay = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: TZ });

/** Etiqueta de día relativa y humana, como en el timeline de la referencia. */
function dayLabel(d: Date, now: Date): string {
  const a = new Date(d.toLocaleString("en-US", { timeZone: TZ }));
  const b = new Date(now.toLocaleString("en-US", { timeZone: TZ }));
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  const diff = Math.round((b.getTime() - a.getTime()) / DAY);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  if (diff > 1 && diff < 30) return `${diff} días · ${fmtDay.format(d)}`;
  return fmtDay.format(d);
}

/** "en 3 h", "hace 2 días" — sin librerías. */
function relative(target: Date, now: Date): string {
  const ms = target.getTime() - now.getTime();
  const abs = Math.abs(ms);
  const mins = Math.round(abs / 60000);
  const unit = abs < 3600_000 ? `${mins} min`
    : abs < DAY ? `${Math.round(abs / 3600_000)} h`
    : `${Math.round(abs / DAY)} día${Math.round(abs / DAY) === 1 ? "" : "s"}`;
  return ms >= 0 ? `en ${unit}` : `hace ${unit}`;
}

export default async function AppHomePage() {
  const session = await getSession();
  const firstName = session?.name?.split(" ")[0] || "";
  const now = new Date();

  // Fuentes reales. Si alguna falla, esa sección simplemente no aporta filas.
  const [tasks, letters, memories] = await Promise.all([
    session ? listTasks(session.sub).catch(() => []) : [],
    session ? listLetters(session.sub).catch(() => []) : [],
    session ? listMemories(session.sub).catch(() => []) : [],
  ]);

  /* ── "Esto necesita tu atención": sólo registros reales que lo ameritan ── */
  const attention: AttentionRow[] = [];

  for (const t of tasks) {
    if (t.status !== "open" || !t.due_at) continue;
    const due = new Date(t.due_at);
    const overdue = due.getTime() < now.getTime();
    const soon = due.getTime() - now.getTime() < 2 * DAY;
    if (!overdue && !soon) continue;
    attention.push({
      id: `task-${t.id}`,
      tone: overdue ? "amber" : "violet",
      glyph: "task",
      title: overdue ? `Pendiente vencido · ${t.title}` : `${t.title} · vence ${relative(due, now)}`,
      detail: t.project_name ? `Proyecto · ${t.project_name}` : t.notes || "Pendiente sin proyecto asignado.",
      href: "/app/pendientes",
      cta: overdue ? "Resolver" : "Ver",
    });
  }

  for (const l of letters) {
    if (l.status !== "scheduled" || !l.deliver_on) continue;
    const on = new Date(l.deliver_on);
    if (on.getTime() - now.getTime() > 7 * DAY) continue;
    attention.push({
      id: `letter-${l.id}`,
      tone: "amber",
      glyph: "letter",
      title: `Carta programada · ${l.title}`,
      detail: `Se entrega ${relative(on, now)} a ${l.recipient_name}.`,
      href: "/app/cartas",
      cta: "Revisar",
    });
  }

  attention.sort((a, b) => (a.tone === "amber" ? -1 : 1) - (b.tone === "amber" ? -1 : 1));

  /* ── Timeline: actividad real agregada de las fuentes que sí existen ── */
  type Raw = { at: Date; row: Omit<TimelineRow, "day" | "time"> };
  const raw: Raw[] = [];

  for (const m of memories.slice(0, 24)) {
    raw.push({
      at: new Date(m.created_at),
      row: {
        id: `mem-${m.id}`,
        kind: m.kind === "voz" ? "Voz" : m.kind === "carta" ? "Carta" : m.kind === "foto" ? "Foto" : m.kind === "video" ? "Video" : "Recuerdo",
        title: m.title,
        meta: null,
        tone: "violet",
        glyph: m.kind === "voz" ? "voice" : m.kind === "carta" ? "letter" : "memory",
        href: `/app/recuerdos?memory=${encodeURIComponent(m.id)}`,
      },
    });
  }

  for (const l of letters.slice(0, 12)) {
    raw.push({
      at: new Date(l.created_at),
      row: {
        id: `let-${l.id}`,
        kind: l.status === "delivered" ? "Carta entregada" : l.status === "scheduled" ? "Carta programada" : "Borrador",
        title: l.title,
        meta: `Para ${l.recipient_name}`,
        tone: l.status === "scheduled" ? "amber" : "violet",
        glyph: "letter",
        href: "/app/cartas",
      },
    });
  }

  for (const t of tasks.slice(0, 12)) {
    raw.push({
      at: new Date(t.created_at),
      row: {
        id: `task-${t.id}`,
        kind: t.status === "open" ? "Pendiente" : "Completado",
        title: t.title,
        meta: t.project_name ? `Proyecto · ${t.project_name}` : null,
        tone: "violet",
        glyph: "task",
        href: "/app/pendientes",
      },
    });
  }

  const timeline: TimelineRow[] = raw
    .filter((r) => !Number.isNaN(r.at.getTime()))
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 14)
    .map((r) => ({ ...r.row, day: dayLabel(r.at, now), time: fmtTime.format(r.at) }));

  return <EonHome firstName={firstName} attention={attention} timeline={timeline} />;
}
