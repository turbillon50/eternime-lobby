"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FadeInOnScroll } from "@/components/motion";
import { useT } from "@/components/i18n";
import { VoiceClone } from "@/components/app/VoiceClone";
import {
  Badge, Button, Card, CardDescription, CardTitle, EmptyState, Input, Modal, SkeletonCard, Textarea,
} from "@/components/ui";

type ProfileUser = {
  id: string; email: string; name: string; role?: string;
  avatar_url?: string | null; cover_url?: string | null; tagline?: string | null; bio?: string | null;
  birthdate?: string | null; birthplace?: string | null; location?: string | null; phone?: string | null;
  occupation?: string | null; created_at?: string;
};
type StoredFile = {
  id: string; kind: "image" | "document" | "audio" | "video" | "other"; url: string;
  name?: string | null; mime?: string | null; size?: number | null; created_at?: string;
};

function fmtSize(n?: number | null) {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function FileIcon({ kind }: { kind: StoredFile["kind"] }) {
  const c = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5 } as const;
  if (kind === "audio") return (<svg {...c}><path d="M9 18V6l10-2v12" /><circle cx="6" cy="18" r="3" /><circle cx="16" cy="16" r="3" /></svg>);
  if (kind === "video") return (<svg {...c}><rect x="3" y="5" width="14" height="14" rx="2" /><path d="m17 9 4-2v10l-4-2" /></svg>);
  if (kind === "document") return (<svg {...c}><path d="M14 3v5h5" /><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /></svg>);
  return (<svg {...c}><path d="M21 15l-5-5L5 21" /><circle cx="9" cy="9" r="2" /><rect x="3" y="3" width="18" height="18" rx="2" /></svg>);
}

export function PerfilClient() {
  const t = useT();
  const [user, setUser] = useState<ProfileUser | null | undefined>(undefined);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [error, setError] = useState("");
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const filesInput = useRef<HTMLInputElement>(null);

  const fields: Array<{ key: string; label: string; ph?: string; type?: string }> = [
    { key: "tagline", label: t("profile.tagline"), ph: t("profile.taglinePh") },
    { key: "occupation", label: t("profile.occupation"), ph: t("profile.occupationPh") },
    { key: "birthdate", label: t("profile.birthdate"), type: "date" },
    { key: "birthplace", label: t("profile.birthplace"), ph: t("profile.birthplacePh") },
    { key: "location", label: t("profile.location"), ph: t("profile.locationPh") },
    { key: "phone", label: t("profile.phone"), ph: "+52 ..." },
  ];

  const hydrate = (u: ProfileUser) => {
    setUser(u);
    setForm({
      name: u.name ?? "", tagline: u.tagline ?? "", occupation: u.occupation ?? "",
      birthdate: u.birthdate ?? "", birthplace: u.birthplace ?? "", location: u.location ?? "",
      phone: u.phone ?? "", bio: u.bio ?? "",
    });
  };

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.user) hydrate(data.user); else setUser(null);
    } catch { setUser(null); }
    try {
      const r = await fetch("/api/files");
      const d = await r.json();
      setFiles(d.files ?? []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setField = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name?.trim()) { setError(t("profile.name")); return; }
    setSaving(true); setError(""); setSavedOk(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(), tagline: form.tagline, occupation: form.occupation,
          birthdate: form.birthdate, birthplace: form.birthplace, location: form.location,
          phone: form.phone, bio: form.bio,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? t("common.connError")); return; }
      hydrate(data.user); setSavedOk(true); setTimeout(() => setSavedOk(false), 2500);
    } catch { setError(t("common.connError")); }
    finally { setSaving(false); }
  };

  const uploadOne = async (file: File, purpose: "avatar" | "cover" | "file") => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/upload?purpose=${purpose}`, { method: "POST", body: fd });
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? t("common.connError")); }
    return res.json();
  };

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingAvatar(true); setError("");
    try { const data = await uploadOne(file, "avatar"); if (data.user) hydrate(data.user); }
    catch (err) { setError(err instanceof Error ? err.message : t("common.connError")); }
    finally { setUploadingAvatar(false); if (avatarInput.current) avatarInput.current.value = ""; }
  };
  const onCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingCover(true); setError("");
    try { const data = await uploadOne(file, "cover"); if (data.user) hydrate(data.user); }
    catch (err) { setError(err instanceof Error ? err.message : t("common.connError")); }
    finally { setUploadingCover(false); if (coverInput.current) coverInput.current.value = ""; }
  };
  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []); if (!list.length) return;
    setUploadingFiles(true); setError("");
    try { for (const file of list) { const data = await uploadOne(file, "file"); if (data.file) setFiles((cur) => [data.file, ...cur]); } }
    catch (err) { setError(err instanceof Error ? err.message : t("common.connError")); }
    finally { setUploadingFiles(false); if (filesInput.current) filesInput.current.value = ""; }
  };
  const removeFile = async (id: string) => {
    setFiles((cur) => cur.filter((f) => f.id !== id));
    try { await fetch(`/api/files/${id}`, { method: "DELETE" }); } catch { /* ignore */ }
  };

  const logout = async () => {
    setLoggingOut(true);
    try { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/"; }
    catch { setLoggingOut(false); }
  };
  const deleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/profile", { method: "DELETE" });
      if (res.ok) { window.location.href = "/"; return; }
      const data = await res.json(); setError(data.error ?? t("common.connError")); setConfirmDelete(false);
    } catch { setError(t("common.connError")); setConfirmDelete(false); }
    finally { setDeleting(false); }
  };

  if (user === undefined) {
    return (<div className="grid gap-4"><SkeletonCard lines={2} /><SkeletonCard lines={4} /></div>);
  }

  const images = files.filter((f) => f.kind === "image");
  const others = files.filter((f) => f.kind !== "image");
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "·";

  return (
    <div className="grid gap-6">
      <input ref={avatarInput} type="file" accept="image/*" hidden onChange={onAvatar} />
      <input ref={coverInput} type="file" accept="image/*" hidden onChange={onCover} />
      <input ref={filesInput} type="file" multiple hidden onChange={onFiles} />

      <FadeInOnScroll>
        <Card padded={false} className="overflow-hidden">
          <div className="relative">
            <div
              className="h-40 w-full bg-cover bg-center sm:h-52"
              style={{
                backgroundImage: user?.cover_url
                  ? `linear-gradient(180deg, rgba(10,10,15,0.15), rgba(10,10,15,0.85)), url(${user.cover_url})`
                  : "radial-gradient(120% 140% at 50% 0%, rgba(212,175,106,0.18), transparent 60%), linear-gradient(180deg, #14140f, #0a0a0f)",
              }}
            />
            <button
              type="button"
              onClick={() => coverInput.current?.click()}
              className="absolute right-3 top-3 rounded-full border border-[var(--et-border)] bg-[rgba(10,10,15,0.6)] px-3 py-1.5 text-xs text-[var(--et-text-muted)] backdrop-blur transition hover:text-[var(--et-text)]"
            >
              {uploadingCover ? t("profile.uploading") : user?.cover_url ? t("profile.changeCover") : t("profile.addCover")}
            </button>

            <div className="px-5 pb-5 sm:px-6 sm:pb-6">
              <div className="-mt-12 flex flex-wrap items-end gap-4 sm:-mt-14">
                <div className="relative">
                  <div
                    className="et-glow-ring flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-[var(--et-border)] bg-[var(--et-bg-elevated)] text-3xl text-[var(--et-gold-bright)] sm:h-28 sm:w-28"
                    style={user?.avatar_url ? { backgroundImage: `url(${user.avatar_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
                  >
                    {!user?.avatar_url ? initial : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => avatarInput.current?.click()}
                    aria-label={t("profile.name")}
                    className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--et-border)] bg-[var(--et-bg-elevated)] text-[var(--et-gold-bright)] transition hover:shadow-[var(--et-glow)]"
                  >
                    {uploadingAvatar ? (
                      <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                    )}
                  </button>
                </div>

                <div className="min-w-0 flex-1 pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="et-serif truncate text-2xl text-[var(--et-text)]">{user?.name ?? "—"}</h2>
                    {user?.role === "admin" ? <Badge>admin</Badge> : null}
                  </div>
                  {user?.tagline ? <p className="mt-1 text-sm italic text-[var(--et-gold-dim)]">“{user.tagline}”</p> : null}
                  <p className="mt-1 truncate text-sm text-[var(--et-text-muted)]">{user?.email}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--et-text-faint)]">
                    {user?.occupation ? <span>{user.occupation}</span> : null}
                    {user?.location ? <span>· {user.location}</span> : null}
                    {user?.created_at ? <span>· {t("profile.memberSince")} {new Date(user.created_at).getFullYear()}</span> : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.06}>
        <Card>
          <CardTitle>{t("profile.identity")}</CardTitle>
          <CardDescription className="mt-1">{t("profile.identityHint")}</CardDescription>
          <div className="mt-5 grid gap-4">
            <Input label={t("profile.name")} value={form.name ?? ""} onChange={(e) => setField("name", e.target.value)} />
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((f) => (
                <Input key={f.key} label={f.label} type={f.type ?? "text"} placeholder={f.ph}
                  value={form[f.key] ?? ""} onChange={(e) => setField(f.key, e.target.value)} />
              ))}
            </div>
            <Textarea label={t("profile.bio")} rows={5} placeholder={t("profile.bioPh")}
              value={form.bio ?? ""} onChange={(e) => setField("bio", e.target.value)} />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button onClick={save} loading={saving}>{t("profile.save")}</Button>
            {savedOk ? <span className="text-sm text-[var(--et-success)]">{t("profile.saved")}</span> : null}
            {error ? <span className="text-sm text-[var(--et-danger)]">{error}</span> : null}
          </div>
        </Card>
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.1}>
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>{t("profile.vault")}</CardTitle>
              <CardDescription className="mt-1">{t("profile.vaultHint")}</CardDescription>
            </div>
            <Button variant="secondary" onClick={() => filesInput.current?.click()} loading={uploadingFiles}>
              {t("profile.upload")}
            </Button>
          </div>

          {files.length === 0 ? (
            <div className="mt-5">
              <EmptyState title={t("profile.emptyTitle")} description={t("profile.emptyDesc")}
                action={<Button variant="ghost" onClick={() => filesInput.current?.click()}>{t("profile.choose")}</Button>} />
            </div>
          ) : (
            <div className="mt-5 grid gap-6">
              {images.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.14em] text-[var(--et-text-faint)]">{t("profile.gallery")}</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {images.map((f) => (
                      <div key={f.id} className="group relative aspect-square overflow-hidden rounded-[var(--et-radius-sm)] border border-[var(--et-border-soft)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={f.url} alt={f.name ?? ""} className="h-full w-full object-cover transition group-hover:scale-105" />
                        <button type="button" onClick={() => removeFile(f.id)} aria-label="x"
                          className="absolute right-1.5 top-1.5 rounded-full bg-[rgba(10,10,15,0.7)] p-1 text-[var(--et-danger)] opacity-0 transition group-hover:opacity-100">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {others.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.14em] text-[var(--et-text-faint)]">{t("profile.docs")}</p>
                  <div className="grid gap-2">
                    {others.map((f) => (
                      <div key={f.id} className="flex items-center gap-3 rounded-[var(--et-radius-sm)] border border-[var(--et-border-soft)] bg-[rgba(212,175,106,0.03)] px-3 py-2.5">
                        <span className="text-[var(--et-gold)]"><FileIcon kind={f.kind} /></span>
                        <a href={f.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-sm text-[var(--et-text)] hover:text-[var(--et-gold-bright)]">{f.name ?? f.url}</a>
                        <span className="shrink-0 text-xs text-[var(--et-text-faint)]">{fmtSize(f.size)}</span>
                        <button type="button" onClick={() => removeFile(f.id)} aria-label="x" className="shrink-0 rounded-full p-1 text-[var(--et-text-faint)] transition hover:text-[var(--et-danger)]">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </Card>
      </FadeInOnScroll>

      <VoiceClone />

      <FadeInOnScroll delay={0.16}>
        <Card>
          <CardTitle>{t("profile.session")}</CardTitle>
          <CardDescription className="mt-1">{t("profile.sessionHint")}</CardDescription>
          <div className="mt-4"><Button variant="secondary" onClick={logout} loading={loggingOut}>{t("nav.logout")}</Button></div>
        </Card>
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.2}>
        <Card className="!border-[rgba(224,122,106,0.35)]">
          <CardTitle className="!text-[var(--et-danger)]">{t("profile.danger")}</CardTitle>
          <CardDescription className="mt-1">{t("profile.dangerHint")}</CardDescription>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => { setDeleteText(""); setConfirmDelete(true); }}
              className="!border-[rgba(224,122,106,0.4)] !bg-[rgba(224,122,106,0.12)] !text-[var(--et-danger)]">
              {t("profile.deleteAccount")}
            </Button>
          </div>
        </Card>
      </FadeInOnScroll>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title={t("profile.deleteAccount")}>
        <div className="grid gap-4">
          <p className="text-sm text-[var(--et-text-muted)]">{t("profile.dangerHint")}</p>
          <Input value={deleteText} onChange={(e) => setDeleteText(e.target.value)} placeholder="ELIMINAR / DELETE" aria-label="confirm" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>✕</Button>
            <Button variant="secondary" onClick={deleteAccount} loading={deleting}
              disabled={!["ELIMINAR", "DELETE"].includes(deleteText.trim().toUpperCase())}
              className="!border-[rgba(224,122,106,0.4)] !bg-[rgba(224,122,106,0.12)] !text-[var(--et-danger)]">
              {t("profile.deleteAccount")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
