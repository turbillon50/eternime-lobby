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
} from "@/components/ui";
import type { Beneficiary } from "@/lib/data/types";

const RELATIONSHIPS = ["esposa", "esposo", "hija", "hijo", "madre", "padre", "hermana", "hermano", "amiga", "amigo"];

type FormState = { name: string; email: string; relationship: string };

const emptyForm: FormState = { name: "", email: "", relationship: "" };

export function BeneficiariosClient() {
  const [people, setPeople] = useState<Beneficiary[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Beneficiary | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Beneficiary | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/beneficiaries");
      const data = await res.json();
      setPeople(Array.isArray(data.beneficiaries) ? data.beneficiaries : []);
    } catch {
      setPeople([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (person: Beneficiary) => {
    setEditing(person);
    setForm({
      name: person.name,
      email: person.email ?? "",
      relationship: person.relationship ?? "",
    });
    setError("");
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      relationship: form.relationship.trim() || null,
    };
    try {
      const res = editing
        ? await fetch(`/api/beneficiaries/${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/beneficiaries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar");
        return;
      }
      const saved: Beneficiary = data.beneficiary;
      setPeople((prev) => {
        if (!prev) return [saved];
        return editing ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev];
      });
      setModalOpen(false);
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    const target = confirmDelete;
    setPeople((prev) => (prev ? prev.filter((p) => p.id !== target.id) : prev));
    setConfirmDelete(null);
    try {
      const res = await fetch(`/api/beneficiaries/${target.id}`, { method: "DELETE" });
      if (!res.ok) setPeople((prev) => (prev ? [target, ...prev] : [target]));
    } catch {
      setPeople((prev) => (prev ? [target, ...prev] : [target]));
    }
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardTitle>¿Qué recibirán?</CardTitle>
        <CardDescription className="mt-1">
          Tus beneficiarios son las personas de confianza que, llegado el momento, recibirán acceso a tus
          recuerdos preservados, tus cartas de legado programadas y podrán conversar con tu guía personal —
          tu voz, tus historias y tus valores, cuidados para ellos.
        </CardDescription>
      </Card>

      <div className="flex justify-end">
        <Button onClick={openCreate}>Agregar beneficiario</Button>
      </div>

      {people === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>
      ) : people.length === 0 ? (
        <EmptyState
          title="Aún no hay beneficiarios"
          description="Agrega a las personas que amas para que tu legado llegue exactamente a sus manos."
          icon={
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 21s-7.5-4.7-9.5-9C1 8.5 3 5 6.5 5c2 0 3.5 1 4.5 2.5C12 6 13.5 5 15.5 5 19 5 21 8.5 21.5 12c-2 4.3-9.5 9-9.5 9Z" />
            </svg>
          }
          action={<Button onClick={openCreate}>Agregar a alguien que amas</Button>}
        />
      ) : (
        <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((person) => (
            <StaggerItem key={person.id}>
              <Card className="group flex h-full flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="et-glow-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base text-[var(--et-gold-bright)]">
                    {person.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="truncate">{person.name}</CardTitle>
                    {person.email ? (
                      <CardDescription className="truncate">{person.email}</CardDescription>
                    ) : null}
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between pt-1">
                  {person.relationship ? <Badge>{person.relationship}</Badge> : <span />}
                  <div className="flex gap-1 opacity-70 transition group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => openEdit(person)}
                      className="rounded-full p-1.5 text-[var(--et-text-faint)] transition hover:bg-[rgba(245,242,234,0.06)] hover:text-[var(--et-gold-bright)]"
                      aria-label={`Editar ${person.name}`}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                        <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(person)}
                      className="rounded-full p-1.5 text-[var(--et-text-faint)] transition hover:bg-[rgba(224,122,106,0.1)] hover:text-[var(--et-danger)]"
                      aria-label={`Eliminar ${person.name}`}
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
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar beneficiario" : "Agregar beneficiario"}
      >
        <div className="grid gap-4">
          <Input
            label="Nombre"
            placeholder="María Fernanda"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="Correo"
            type="email"
            placeholder="para avisarle llegado el momento (opcional)"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <div className="grid gap-1.5">
            <span className="text-xs uppercase tracking-[0.14em] text-[var(--et-text-faint)]">Relación</span>
            <div className="flex flex-wrap gap-2">
              {RELATIONSHIPS.map((rel) => (
                <button
                  key={rel}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, relationship: f.relationship === rel ? "" : rel }))}
                  className="rounded-full border px-3 py-1 text-xs transition"
                  style={
                    form.relationship === rel
                      ? { borderColor: "var(--et-gold)", color: "var(--et-gold-bright)", background: "rgba(212,175,106,0.1)" }
                      : { borderColor: "var(--et-border-soft)", color: "var(--et-text-muted)" }
                  }
                >
                  {rel}
                </button>
              ))}
            </div>
            <Input
              placeholder="u otra relación…"
              value={RELATIONSHIPS.includes(form.relationship) ? "" : form.relationship}
              onChange={(e) => setForm((f) => ({ ...f, relationship: e.target.value }))}
            />
          </div>
          {error ? <p className="text-sm text-[var(--et-danger)]">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} loading={saving}>
              {editing ? "Guardar cambios" : "Agregar"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="¿Quitar a este beneficiario?"
      >
        <div className="grid gap-4">
          <p className="text-sm text-[var(--et-text-muted)]">
            {confirmDelete?.name} dejará de recibir tu legado. Podrás agregarle de nuevo cuando quieras.
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
              Quitar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
