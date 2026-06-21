"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { StaggerContainer, StaggerItem } from "@/components/motion";
import {
  Badge, Button, Card, CardDescription, CardTitle, EmptyState, Input, Modal, SkeletonCard, Textarea,
} from "@/components/ui";
import type { Memory, MemoryKind } from "@/lib/data/types";

const KINDS: { value: MemoryKind; label: string; icon: string }[] = [
  { value: "texto", label: "Texto", icon: "✦" },
  { value: "carta", label: "Carta", icon: "✉" },
  { value: "voz", label: "Voz", icon: "♪" },
  { value: "foto", label: "Foto", icon: "◉" },
  { value: "video", label: "Video", icon: "▷" },
];
const TONES = ["alegría", "nostalgia", "amor", "gratitud", "orgullo", "melancolía", "esperanza"];

type Tab = "todos" | MemoryKind;
type FormState = { title: string; content: string; kind: MemoryKind; emotionalTone: string; photoUrls: string[] };
const emptyForm: FormState = { title: "", content: "", kind: "texto", emotionalTone: "", photoUrls: [] };

function NarrateButton({ memory }: { memory: Memory }) {
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stop = () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } setState("idle"); };
  const play = async () => {
    if (state === "playing") { stop(); return; }
    const text = [memory.title, memory.content].filter(Boolean).join(". ").slice(0, 1200);
    if (!text) return;
    setState("loading");
    try {
      const res = await fetch("/api/eternime/voice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      if (!res.ok) { setState("idle"); return; }
      const blob = await res.blob(); const url = URL.createObjectURL(blob);
      const audio = new Audio(url); audioRef.current = audio;
      audio.onended = () => { setState("idle"); URL.revokeObjectURL(url); };
      audio.onerror = () => setState("idle");
      await audio.play(); setState("playing");
    } catch { setState("idle"); }
  };
  return (
    <button type="button" onClick={play} aria-label={`Narrar ${memory.title}`} title="Narrar con la voz de Eon"
      className="rounded-full p-1.5 text-[var(--et-text-faint)] transition hover:bg-[rgba(255,255,255,0.1)] hover:text-[var(--et-gold-bright)]">
      {state === "loading" ? (<span className="block h-[15px] w-[15px] animate-spin rounded-full border-2 border-current border-t-transparent" />)
        : state === "playing" ? (<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>)
        : (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></svg>)}
    </button>
  );
}

export function RecuerdosClient() {
  const [memories, setMemories] = useState<Memory[] | null>(null);
  const [tab, setTab] = useState<Tab>("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Memory | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Memory | null>(null);
  const [deleting, setDeleting] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/memories");
      const data = await res.json();
      setMemories(Array.isArray(data.memories) ? data.memories : []);
    } catch { setMemories([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!memories) return [];
    return tab === "todos" ? memories : memories.filter((m) => m.kind === tab);
  }, [memories, tab]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setError(""); setModalOpen(true); };
  const openEdit = (m: Memory) => {
    setEditing(m);
    setForm({ title: m.title, content: m.content ?? "", kind: m.kind, emotionalTone: m.emotional_tone ?? "", photoUrls: m.media_urls ?? [] });
    setError(""); setModalOpen(true);
  };

  const addPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []); if (!list.length) return;
    setUploadingPhotos(true); setError("");
    try {
      for (const file of list) {
        const fd = new FormData(); fd.append("file", file);
        const res = await fetch("/api/upload?purpose=file", { method: "POST", body: fd });
        if (res.ok) { const d = await res.json(); if (d.url) setForm((f) => ({ ...f, photoUrls: [...f.photoUrls, d.url], kind: f.kind === "texto" ? "foto" : f.kind })); }
      }
    } catch { setError("No se pudieron subir las fotos"); }
    finally { setUploadingPhotos(false); if (photoInput.current) photoInput.current.value = ""; }
  };
  const removePhoto = (url: string) => setForm((f) => ({ ...f, photoUrls: f.photoUrls.filter((u) => u !== url) }));

  const save = async () => {
    if (!form.title.trim()) { setError("El título es obligatorio"); return; }
    setSaving(true); setError("");
    const payload = {
      title: form.title.trim(),
      content: form.content.trim() || null,
      kind: form.kind,
      emotionalTone: form.emotionalTone || null,
      mediaUrls: form.photoUrls,
    };
    try {
      const res = editing
        ? await fetch(`/api/memories/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/memories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "No se pudo guardar"); return; }
      const saved: Memory = data.memory;
      setMemories((prev) => (!prev ? [saved] : editing ? prev.map((m) => (m.id === saved.id ? saved : m)) : [saved, ...prev]));
      setModalOpen(false);
    } catch { setError("Error de conexión"); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    const target = confirmDelete; setDeleting(true);
    setMemories((prev) => (prev ? prev.filter((m) => m.id !== target.id) : prev)); setConfirmDelete(null);
    try { const res = await fetch(`/api/memories/${target.id}`, { method: "DELETE" }); if (!res.ok) setMemories((prev) => (prev ? [target, ...prev] : [target])); }
    catch { setMemories((prev) => (prev ? [target, ...prev] : [target])); }
    finally { setDeleting(false); }
  };

  const tabs: { value: Tab; label: string }[] = [{ value: "todos", label: "Todos" }, ...KINDS.map((k) => ({ value: k.value as Tab, label: k.label }))];

  return (
    <div className="grid gap-6">
      <input ref={photoInput} type="file" accept="image/*" multiple hidden onChange={addPhotos} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-full border border-[var(--et-border-soft)] bg-[var(--et-bg-elevated)] p-1">
          {tabs.map((t) => (
            <button key={t.value} type="button" onClick={() => setTab(t.value)}
              className="relative rounded-full px-3.5 py-1.5 text-xs uppercase tracking-[0.12em] transition-colors"
              style={{ color: tab === t.value ? "var(--et-bg)" : "var(--et-text-muted)" }}>
              {tab === t.value ? (<motion.span layoutId="recuerdos-tab" className="absolute inset-0 rounded-full bg-[var(--et-gold)]" transition={{ type: "spring", stiffness: 380, damping: 32 }} />) : null}
              <span className="relative z-10">{t.label}</span>
            </button>
          ))}
        </div>
        <Button onClick={openCreate}>Preservar recuerdo</Button>
      </div>

      {memories === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={tab === "todos" ? "Tu primer recuerdo te espera" : "Nada por aquí todavía"}
          description={tab === "todos" ? "Cada momento que guardes hoy será una conversación que alguien tendrá contigo mañana." : "Aún no has preservado recuerdos de este tipo."}
          action={<Button onClick={openCreate}>Preservar un recuerdo</Button>} />
      ) : (
        <StaggerContainer key={tab} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filtered.map((memory) => {
              const kindMeta = KINDS.find((k) => k.value === memory.kind);
              const photos = memory.media_urls ?? [];
              return (
                <StaggerItem key={memory.id}>
                  <Card className="group flex h-full flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle>{memory.title}</CardTitle>
                      <Badge tone="muted"><span aria-hidden>{kindMeta?.icon}</span> {memory.kind}</Badge>
                    </div>
                    {photos.length ? (
                      <div className={`grid gap-1.5 ${photos.length === 1 ? "grid-cols-1" : "grid-cols-3"}`}>
                        {photos.slice(0, 3).map((u, i) => (
                          <div key={u} className="relative overflow-hidden rounded-[var(--et-radius-sm)] border border-[var(--et-border-soft)]" style={{ aspectRatio: photos.length === 1 ? "16/9" : "1" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={u} alt="" className="h-full w-full object-cover" />
                            {i === 2 && photos.length > 3 ? (<span className="absolute inset-0 flex items-center justify-center bg-[rgba(10,10,15,0.6)] text-sm text-white">+{photos.length - 3}</span>) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {memory.content ? (<CardDescription className="line-clamp-3">{memory.content}</CardDescription>) : null}
                    <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                      {memory.emotional_tone ? <Badge>{memory.emotional_tone}</Badge> : <span />}
                      <div className="flex gap-1 opacity-70 transition group-hover:opacity-100">
                        <NarrateButton memory={memory} />
                        <button type="button" onClick={() => openEdit(memory)} className="rounded-full p-1.5 text-[var(--et-text-faint)] transition hover:bg-[rgba(245,242,234,0.06)] hover:text-[var(--et-gold-bright)]" aria-label={`Editar ${memory.title}`}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                        </button>
                        <button type="button" onClick={() => setConfirmDelete(memory)} className="rounded-full p-1.5 text-[var(--et-text-faint)] transition hover:bg-[rgba(224,122,106,0.1)] hover:text-[var(--et-danger)]" aria-label={`Eliminar ${memory.title}`}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" /></svg>
                        </button>
                      </div>
                    </div>
                  </Card>
                </StaggerItem>
              );
            })}
          </AnimatePresence>
        </StaggerContainer>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar recuerdo" : "Preservar un recuerdo"}>
        <div className="grid gap-4">
          <Input label="Título" placeholder="El verano en casa de la abuela" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <Textarea label="El recuerdo" placeholder="Escríbelo como lo recuerdas, con tus palabras…" rows={4} value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} />

          {/* Fotos */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.14em] text-[var(--et-text-faint)]">Fotos</span>
              <Button variant="ghost" onClick={() => photoInput.current?.click()} loading={uploadingPhotos} className="!min-h-9 px-3 text-xs">Añadir fotos</Button>
            </div>
            {form.photoUrls.length ? (
              <div className="grid grid-cols-4 gap-2">
                {form.photoUrls.map((u) => (
                  <div key={u} className="group/photo relative aspect-square overflow-hidden rounded-[var(--et-radius-sm)] border border-[var(--et-border-soft)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => removePhoto(u)} aria-label="Quitar" className="absolute right-1 top-1 rounded-full bg-[rgba(10,10,15,0.7)] p-0.5 text-[var(--et-danger)] opacity-0 transition group-hover/photo:opacity-100">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--et-text-faint)]">Sube una o varias fotos. Eon las verá y aprenderá de ellas.</p>
            )}
          </div>

          <div className="grid gap-1.5">
            <span className="text-xs uppercase tracking-[0.14em] text-[var(--et-text-faint)]">Tipo</span>
            <div className="flex flex-wrap gap-2">
              {KINDS.map((k) => (
                <button key={k.value} type="button" onClick={() => setForm((f) => ({ ...f, kind: k.value }))} className="rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.1em] transition"
                  style={form.kind === k.value ? { borderColor: "var(--et-gold)", color: "var(--et-gold-bright)", background: "rgba(255,255,255,0.1)" } : { borderColor: "var(--et-border-soft)", color: "var(--et-text-muted)" }}>
                  {k.icon} {k.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-1.5">
            <span className="text-xs uppercase tracking-[0.14em] text-[var(--et-text-faint)]">Tono emocional</span>
            <div className="flex flex-wrap gap-2">
              {TONES.map((tone) => (
                <button key={tone} type="button" onClick={() => setForm((f) => ({ ...f, emotionalTone: f.emotionalTone === tone ? "" : tone }))} className="rounded-full border px-3 py-1 text-xs transition"
                  style={form.emotionalTone === tone ? { borderColor: "var(--et-gold)", color: "var(--et-gold-bright)", background: "rgba(255,255,255,0.1)" } : { borderColor: "var(--et-border-soft)", color: "var(--et-text-muted)" }}>
                  {tone}
                </button>
              ))}
            </div>
          </div>
          {error ? <p className="text-sm text-[var(--et-danger)]">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={save} loading={saving}>{editing ? "Guardar cambios" : "Preservar"}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} title="¿Eliminar este recuerdo?">
        <div className="grid gap-4">
          <p className="text-sm text-[var(--et-text-muted)]">«{confirmDelete?.title}» desaparecerá de tu legado para siempre. Esta acción no se puede deshacer.</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Conservar</Button>
            <Button onClick={remove} loading={deleting} className="!border-[rgba(224,122,106,0.4)] !bg-[rgba(224,122,106,0.12)] !text-[var(--et-danger)]" variant="secondary">Eliminar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
