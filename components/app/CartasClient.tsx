"use client";

import { useCallback, useEffect, useState } from "react";
import { StaggerContainer, StaggerItem } from "@/components/motion";
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardTitle,
  EmptyState,
  Input,
  Modal,
  SkeletonCard,
  Textarea,
} from "@/components/ui";
import type { Letter, LetterStatus } from "@/lib/data/types";

const STATUS_LABEL: Record<LetterStatus, string> = {
  draft: "Borrador",
  scheduled: "Programada",
  delivered: "Entregada",
};

const STATUS_TONE: Record<LetterStatus, "muted" | "gold" | "success"> = {
  draft: "muted",
  scheduled: "gold",
  delivered: "success",
};

type FormState = {
  recipientName: string;
  recipientEmail: string;
  title: string;
  body: string;
  deliverOn: string;
};

const emptyForm: FormState = {
  recipientName: "",
  recipientEmail: "",
  title: "",
  body: "",
  deliverOn: "",
};

function formatDate(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function CartasClient() {
  const [letters, setLetters] = useState<Letter[] | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState<Letter | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<Letter | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Letter | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/letters");
      const data = await res.json();
      setLetters(Array.isArray(data.letters) ? data.letters : []);
    } catch {
      setLetters([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setComposerOpen(true);
  };

  const openEdit = (letter: Letter) => {
    setEditing(letter);
    setForm({
      recipientName: letter.recipient_name,
      recipientEmail: letter.recipient_email ?? "",
      title: letter.title,
      body: letter.body,
      deliverOn: letter.deliver_on ? letter.deliver_on.slice(0, 10) : "",
    });
    setError("");
    setComposerOpen(true);
  };

  const save = async (status: "draft" | "scheduled") => {
    if (!form.recipientName.trim() || !form.title.trim() || !form.body.trim()) {
      setError("Destinatario, título y cuerpo son obligatorios");
      return;
    }
    if (status === "scheduled" && !form.deliverOn) {
      setError("Elige la fecha de entrega para programarla");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      recipientName: form.recipientName.trim(),
      recipientEmail: form.recipientEmail.trim() || null,
      title: form.title.trim(),
      body: form.body.trim(),
      deliverOn: form.deliverOn || null,
      status,
    };
    try {
      const res = editing
        ? await fetch(`/api/letters/${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/letters", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar la carta");
        return;
      }
      const saved: Letter = data.letter;
      setLetters((prev) => {
        if (!prev) return [saved];
        return editing ? prev.map((l) => (l.id === saved.id ? saved : l)) : [saved, ...prev];
      });
      setComposerOpen(false);
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    const target = confirmDelete;
    setLetters((prev) => (prev ? prev.filter((l) => l.id !== target.id) : prev));
    setConfirmDelete(null);
    try {
      const res = await fetch(`/api/letters/${target.id}`, { method: "DELETE" });
      if (!res.ok) setLetters((prev) => (prev ? [target, ...prev] : [target]));
    } catch {
      setLetters((prev) => (prev ? [target, ...prev] : [target]));
    }
  };

  return (
    <div className="grid gap-6">
      <div className="flex justify-end">
        <Button onClick={openCreate}>Escribir una carta</Button>
      </div>

      {letters === null ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </div>
      ) : letters.length === 0 ? (
        <EmptyState
          title="Aún no hay cartas"
          description="Escribe hoy lo que quieres que alguien lea mañana. Cada carta puede programarse para llegar en una fecha especial."
          icon={
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
          }
          action={<Button onClick={openCreate}>Escribir mi primera carta</Button>}
        />
      ) : (
        <StaggerContainer className="grid gap-4 sm:grid-cols-2">
          {letters.map((letter) => (
            <StaggerItem key={letter.id}>
              <Card className="group flex h-full flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle>{letter.title}</CardTitle>
                  <Badge tone={STATUS_TONE[letter.status]}>{STATUS_LABEL[letter.status]}</Badge>
                </div>
                <CardDescription>
                  Para {letter.recipient_name}
                  {letter.deliver_on ? ` · ${formatDate(letter.deliver_on)}` : ""}
                </CardDescription>
                <p className="et-serif line-clamp-2 text-sm italic text-[var(--et-text-muted)]">
                  «{letter.body.slice(0, 120)}»
                </p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <Button variant="ghost" onClick={() => setPreview(letter)} className="!px-3 !py-1.5 !text-xs">
                    Vista previa
                  </Button>
                  <div className="flex gap-1 opacity-70 transition group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => openEdit(letter)}
                      className="rounded-full p-1.5 text-[var(--et-text-faint)] transition hover:bg-[rgba(245,242,234,0.06)] hover:text-[var(--et-gold-bright)]"
                      aria-label={`Editar ${letter.title}`}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                        <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(letter)}
                      className="rounded-full p-1.5 text-[var(--et-text-faint)] transition hover:bg-[rgba(224,122,106,0.1)] hover:text-[var(--et-danger)]"
                      aria-label={`Eliminar ${letter.title}`}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
                      </svg>
                    </button>
                  </div>
                </div>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      <Modal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        title={editing ? "Editar carta" : "Carta de legado"}
      >
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Para"
              placeholder="Nombre de quien la recibirá"
              value={form.recipientName}
              onChange={(e) => setForm((f) => ({ ...f, recipientName: e.target.value }))}
            />
            <Input
              label="Su correo"
              type="email"
              placeholder="opcional"
              value={form.recipientEmail}
              onChange={(e) => setForm((f) => ({ ...f, recipientEmail: e.target.value }))}
            />
          </div>
          <Input
            label="Título"
            placeholder="Para cuando cumplas dieciocho"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <Textarea
            label="Tu carta"
            placeholder="Querida…"
            rows={7}
            className="et-serif !text-base"
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          />
          <Input
            label="Fecha de entrega"
            type="date"
            value={form.deliverOn}
            onChange={(e) => setForm((f) => ({ ...f, deliverOn: e.target.value }))}
          />
          {error ? <p className="text-sm text-[var(--et-danger)]">{error}</p> : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => setComposerOpen(false)}>
              Cancelar
            </Button>
            <Button variant="secondary" onClick={() => save("draft")} loading={saving}>
              Guardar borrador
            </Button>
            <Button onClick={() => save("scheduled")} loading={saving}>
              Programar entrega
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={Boolean(preview)} onClose={() => setPreview(null)} title="">
        {preview ? (
          <div
            className="rounded-[var(--et-radius)] border p-6 sm:p-8"
            style={{
              borderColor: "rgba(212,175,106,0.35)",
              background: "linear-gradient(160deg, rgba(212,175,106,0.08), rgba(10,10,15,0.6) 55%)",
              boxShadow: "inset 0 0 40px rgba(212,175,106,0.06)",
            }}
          >
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--et-gold-dim)]">
              Para {preview.recipient_name}
              {preview.deliver_on ? ` · se entregará el ${formatDate(preview.deliver_on)}` : ""}
            </p>
            <h3 className="et-serif mt-3 text-2xl text-[var(--et-gold-bright)]">{preview.title}</h3>
            <div className="mt-5 max-h-[45vh] overflow-y-auto">
              <p className="et-serif whitespace-pre-wrap text-base leading-relaxed text-[var(--et-text)]">
                {preview.body}
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-[rgba(212,175,106,0.2)] pt-4">
              <Badge tone={STATUS_TONE[preview.status]}>{STATUS_LABEL[preview.status]}</Badge>
              <span className="et-serif text-sm italic text-[var(--et-gold-dim)]">Eternime</span>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} title="¿Eliminar esta carta?">
        <div className="grid gap-4">
          <p className="text-sm text-[var(--et-text-muted)]">
            «{confirmDelete?.title}» para {confirmDelete?.recipient_name} se perderá para siempre.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Conservar
            </Button>
            <Button
              variant="secondary"
              onClick={remove}
              className="!border-[rgba(224,122,106,0.4)] !bg-[rgba(224,122,106,0.12)] !text-[var(--et-danger)]"
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
