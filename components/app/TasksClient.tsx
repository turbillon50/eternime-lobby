"use client";

import { useEffect, useState, type FormEvent } from "react";

type Task = { id: string; title: string; status: string; due_at?: string | null; project_name?: string | null };
type Project = { id: string; name: string };

function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function parseMexicanDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day, 12, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

export function TasksClient() {
  const [items, setItems] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => Promise.all([
    fetch("/api/tasks", { cache: "no-store" }).then((r) => r.json()),
    fetch("/api/projects", { cache: "no-store" }).then((r) => r.json()),
  ]).then(([tasks, projectData]) => {
    setItems(tasks.tasks || []);
    setProjects(projectData.projects || []);
  }).catch(() => {});

  useEffect(() => { void load(); }, []);

  async function add(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || busy) return;
    const parsedDate = dueDate ? parseMexicanDate(dueDate) : null;
    if (dueDate && !parsedDate) {
      setDateError("Usa una fecha válida en formato dd/mm/aaaa.");
      return;
    }
    setBusy(true);
    setDateError("");
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, projectId: projectId || null, dueAt: parsedDate?.toISOString() ?? null }),
    });
    if (response.ok) {
      setTitle("");
      setDueDate("");
      await load();
    }
    setBusy(false);
  }

  async function toggle(task: Task) {
    await fetch(`/api/tasks/${task.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: task.status === "open" ? "done" : "open" }) });
    await load();
  }

  return (
    <div className="ops-layout va-crystal">
      <form onSubmit={add} className="ops-create va-crystal va-spatial">
        <p className="eon-page-kicker">Nueva acción</p>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="¿Qué no quieres olvidar?" />
        <select value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="">Sin proyecto</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={10}
          placeholder="dd/mm/aaaa"
          aria-label="Fecha límite en formato día, mes y año"
          aria-invalid={Boolean(dateError)}
          value={dueDate}
          onChange={(event) => { setDueDate(formatDateInput(event.target.value)); setDateError(""); }}
        />
        {dateError ? <p className="ops-date-error" role="alert">{dateError}</p> : null}
        <button disabled={!title.trim() || busy}>{busy ? "Guardando…" : "Agregar pendiente"}</button>
      </form>
      <section className="ops-list va-crystal">
        <div className="ops-list-head"><h2>Pendientes</h2><span>{items.filter((item) => item.status === "open").length}</span></div>
        {items.length ? items.map((task) => <button key={task.id} onClick={() => toggle(task)} className={`task-row ${task.status === "done" ? "done" : ""}`}><span className="task-check">{task.status === "done" ? "✓" : ""}</span><span><b>{task.title}</b><small>{task.project_name || "Personal"}{task.due_at ? ` · ${new Date(task.due_at).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}` : ""}</small></span></button>) : <div className="ops-empty">No tienes pendientes. Cuando Eon detecte compromisos en tus conversaciones, aquí es donde deben vivir.</div>}
      </section>
    </div>
  );
}
