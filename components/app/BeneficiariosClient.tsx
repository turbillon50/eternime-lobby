"use client";

import { useCallback, useEffect, useState } from "react";
import { StaggerContainer, StaggerItem } from "@/components/motion";
import { Badge, Button, Card, CardDescription, CardTitle, EmptyState, Input, Modal, SkeletonCard } from "@/components/ui";
import type { Beneficiary, Memory } from "@/lib/data/types";
import { useT } from "@/components/i18n";

const RELATIONSHIPS = ["esposa", "esposo", "hija", "hijo", "madre", "padre", "hermana", "hermano", "amiga", "amigo"];
const CONDITIONS = ["Al confirmar mi fallecimiento", "En una fecha especial", "De inmediato"];

type FormState = { name: string; email: string; relationship: string; isPrimary: boolean; deliveryCondition: string };
const emptyForm: FormState = { name: "", email: "", relationship: "", isPrimary: false, deliveryCondition: CONDITIONS[0] };

export function BeneficiariosClient() {
  const t = useT();
  const [people, setPeople] = useState<Beneficiary[] | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Beneficiary | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Beneficiary | null>(null);
  const [inviting, setInviting] = useState<string | null>(null);
  const [invited, setInvited] = useState<Record<string, boolean>>({});
  // asignación de recuerdos
  const [assignFor, setAssignFor] = useState<Beneficiary | null>(null);
  const [assignSel, setAssignSel] = useState<Set<string>>(new Set());
  const [assignSaving, setAssignSaving] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/beneficiaries");
      const data = await res.json();
      const list: Beneficiary[] = Array.isArray(data.beneficiaries) ? data.beneficiaries : [];
      setPeople(list);
      const inv: Record<string, boolean> = {};
      list.forEach((p) => { if (p.invited_at) inv[p.id] = true; });
      setInvited(inv);
    } catch { setPeople([]); }
    try { const r = await fetch("/api/memories"); const d = await r.json(); setMemories(Array.isArray(d.memories) ? d.memories : []); } catch { /* */ }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setError(""); setModalOpen(true); };
  const openEdit = (b: Beneficiary) => {
    setEditing(b);
    setForm({ name: b.name, email: b.email ?? "", relationship: b.relationship ?? "", isPrimary: b.is_primary, deliveryCondition: b.delivery_condition ?? CONDITIONS[0] });
    setError(""); setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) { setError("El nombre es obligatorio"); return; }
    setSaving(true); setError("");
    const payload = { name: form.name.trim(), email: form.email.trim() || null, relationship: form.relationship || null, isPrimary: form.isPrimary, deliveryCondition: form.deliveryCondition || null };
    try {
      const res = editing
        ? await fetch(`/api/beneficiaries/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/beneficiaries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "No se pudo guardar"); return; }
      await load(); setModalOpen(false);
    } catch { setError("Error de conexión"); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    const t = confirmDelete; setConfirmDelete(null);
    setPeople((p) => (p ? p.filter((x) => x.id !== t.id) : p));
    try { await fetch(`/api/beneficiaries/${t.id}`, { method: "DELETE" }); } catch { /* */ }
  };

  const invite = async (b: Beneficiary) => {
    if (!b.email) { setError("Agrega un correo para invitar"); return; }
    setInviting(b.id);
    try {
      const res = await fetch(`/api/beneficiaries/${b.id}/invite`, { method: "POST" });
      if (res.ok) setInvited((m) => ({ ...m, [b.id]: true }));
      else { const d = await res.json(); setError(d.error ?? "No se pudo invitar"); }
    } catch { setError("Error de conexión"); }
    finally { setInviting(null); }
  };

  const openAssign = async (b: Beneficiary) => {
    setAssignFor(b); setAssignSel(new Set());
    try { const r = await fetch(`/api/beneficiaries/${b.id}/memories`); const d = await r.json(); setAssignSel(new Set(d.memoryIds ?? [])); } catch { /* */ }
  };
  const toggleSel = (id: string) => setAssignSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const saveAssign = async () => {
    if (!assignFor) return;
    setAssignSaving(true);
    try {
      await fetch(`/api/beneficiaries/${assignFor.id}/memories`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memoryIds: [...assignSel] }) });
      setCounts((c) => ({ ...c, [assignFor.id]: assignSel.size }));
      setAssignFor(null);
    } catch { /* */ } finally { setAssignSaving(false); }
  };

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-end">
        <Button onClick={openCreate}>{t("heirs.add")}</Button>
      </div>

      {people === null ? (
        <div className="grid gap-4 sm:grid-cols-2"><SkeletonCard /><SkeletonCard /></div>
      ) : people.length === 0 ? (
        <EmptyState title={t("heirs.emptyTitle")}
          description={t("heirs.emptyDesc")}
          action={<Button onClick={openCreate}>{t("heirs.emptyAction")}</Button>} />
      ) : (
        <StaggerContainer className="grid gap-4 sm:grid-cols-2">
          {people.map((b) => {
            const initial = b.name.charAt(0).toUpperCase();
            const assigned = counts[b.id];
            return (
              <StaggerItem key={b.id}>
                <Card className="flex h-full flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <span className="et-glow-ring flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--et-bg-elevated)] text-lg text-[var(--et-text)]">{initial}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle>{b.name}</CardTitle>
                        {b.is_primary ? <Badge>{t("heirs.primary")}</Badge> : null}
                      </div>
                      <CardDescription className="mt-0.5">
                        {b.relationship ? <span className="capitalize">{b.relationship}</span> : "Heredero(a)"}{b.email ? ` · ${b.email}` : ""}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-[var(--et-text-faint)]">
                    {b.delivery_condition ? <span className="rounded-full border border-[var(--et-border-soft)] px-2.5 py-1">⏷ {b.delivery_condition}</span> : null}
                    {typeof assigned === "number" ? <span className="rounded-full border border-[var(--et-border-soft)] px-2.5 py-1">{assigned} recuerdo(s)</span> : null}
                    {invited[b.id] ? <span className="rounded-full border border-[rgba(143,200,160,0.3)] px-2.5 py-1 text-[var(--et-success)]">Invitado ✓</span> : null}
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2 pt-1">
                    <Button variant="ghost" className="!min-h-9 px-3 text-xs" onClick={() => openAssign(b)}>{t("heirs.assign")}</Button>
                    <Button variant="ghost" className="!min-h-9 px-3 text-xs" onClick={() => invite(b)} loading={inviting === b.id} disabled={!b.email}>
                      {invited[b.id] ? t("heirs.reinvite") : t("heirs.invite")}
                    </Button>
                    <button type="button" onClick={() => openEdit(b)} aria-label="Editar" className="ml-auto rounded-full p-1.5 text-[var(--et-text-faint)] transition hover:text-[var(--et-text)]">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                    </button>
                    <button type="button" onClick={() => setConfirmDelete(b)} aria-label="Eliminar" className="rounded-full p-1.5 text-[var(--et-text-faint)] transition hover:text-[var(--et-danger)]">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                    </button>
                  </div>
                </Card>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      )}
      {error ? <p className="text-sm text-[var(--et-danger)]">{error}</p> : null}

      {/* Crear / editar */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t("heirs.editTitle") : t("heirs.newTitle")}>
        <div className="grid gap-4">
          <Input label={t("heirs.name")} placeholder="Sofía" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input label={t("heirs.email")} type="email" placeholder="sofia@correo.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <div className="grid gap-1.5">
            <span className="text-xs uppercase tracking-[0.14em] text-[var(--et-text-faint)]">{t("heirs.relation")}</span>
            <div className="flex flex-wrap gap-2">
              {RELATIONSHIPS.map((r) => (
                <button key={r} type="button" onClick={() => setForm((f) => ({ ...f, relationship: f.relationship === r ? "" : r }))} className="rounded-full border px-3 py-1 text-xs capitalize transition"
                  style={form.relationship === r ? { borderColor: "var(--et-gold)", color: "var(--et-gold-bright)", background: "rgba(255,255,255,0.1)" } : { borderColor: "var(--et-border-soft)", color: "var(--et-text-muted)" }}>{r}</button>
              ))}
            </div>
          </div>
          <div className="grid gap-1.5">
            <span className="text-xs uppercase tracking-[0.14em] text-[var(--et-text-faint)]">{t("heirs.condition")}</span>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map((c) => (
                <button key={c} type="button" onClick={() => setForm((f) => ({ ...f, deliveryCondition: c }))} className="rounded-full border px-3 py-1.5 text-xs transition"
                  style={form.deliveryCondition === c ? { borderColor: "var(--et-gold)", color: "var(--et-gold-bright)", background: "rgba(255,255,255,0.1)" } : { borderColor: "var(--et-border-soft)", color: "var(--et-text-muted)" }}>{c}</button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-3 text-sm text-[var(--et-text-muted)]">
            <input type="checkbox" checked={form.isPrimary} onChange={(e) => setForm((f) => ({ ...f, isPrimary: e.target.checked }))} className="h-4 w-4 accent-white" />
            {t("heirs.isPrimary")}
          </label>
          {error ? <p className="text-sm text-[var(--et-danger)]">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={save} loading={saving}>{editing ? t("heirs.saveEdit") : t("heirs.save")}</Button>
          </div>
        </div>
      </Modal>

      {/* Asignar recuerdos */}
      <Modal open={Boolean(assignFor)} onClose={() => setAssignFor(null)} title={`${t("heirs.memOf")} ${assignFor?.name ?? ""}`}>
        <div className="grid gap-3">
          {memories.length === 0 ? (
            <p className="text-sm text-[var(--et-text-muted)]">{t("heirs.noMem")}</p>
          ) : (
            <div className="grid max-h-72 gap-2 overflow-y-auto pr-1">
              {memories.map((m) => (
                <label key={m.id} className="flex cursor-pointer items-center gap-3 rounded-[var(--et-radius-sm)] border border-[var(--et-border-soft)] px-3 py-2.5 text-sm">
                  <input type="checkbox" checked={assignSel.has(m.id)} onChange={() => toggleSel(m.id)} className="h-4 w-4 accent-white" />
                  <span className="min-w-0 flex-1 truncate text-[var(--et-text)]">{m.title}</span>
                  <span className="shrink-0 text-xs text-[var(--et-text-faint)]">{m.kind}</span>
                </label>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAssignFor(null)}>{t("common.cancel")}</Button>
            <Button onClick={saveAssign} loading={assignSaving} disabled={memories.length === 0}>{t("heirs.saveAssign")}</Button>
          </div>
        </div>
      </Modal>

      {/* Eliminar */}
      <Modal open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} title={t("heirs.delTitle")}>
        <div className="grid gap-4">
          <p className="text-sm text-[var(--et-text-muted)]">«{confirmDelete?.name}» dejará de ser heredero(a) de tu legado.</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>{t("vault.delKeep")}</Button>
            <Button onClick={remove} variant="secondary" className="!border-[rgba(224,122,106,0.4)] !bg-[rgba(224,122,106,0.12)] !text-[var(--et-danger)]">{t("heirs.remove")}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
