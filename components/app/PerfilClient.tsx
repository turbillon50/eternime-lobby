"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { FadeInOnScroll } from "@/components/motion";
import { useT } from "@/components/i18n";
import { VoiceClone } from "@/components/app/VoiceClone";
import {
  Badge, Button, Card, CardDescription, CardTitle, Input, Modal, SkeletonCard, Textarea,
} from "@/components/ui";

type ProfileUser = {
  id: string; email: string; name: string; role?: string;
  avatar_url?: string | null; cover_url?: string | null; tagline?: string | null; bio?: string | null;
  birthdate?: string | null; birthplace?: string | null; location?: string | null; phone?: string | null;
  occupation?: string | null; created_at?: string;
};
export function PerfilClient() {
  const t = useT();
  const [user, setUser] = useState<ProfileUser | null | undefined>(undefined);
  const [welcomeMode, setWelcomeMode] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [error, setError] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

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
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { try { if (new URLSearchParams(window.location.search).get("welcome") === "1") setWelcomeMode(true); } catch {} }, []);

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
  const { signOut } = useClerk();
  const logout = async () => {
    setLoggingOut(true);
    try { await signOut({ redirectUrl: "/" }); }
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

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "·";

  return (
    <div className="grid gap-6">
      <input ref={avatarInput} type="file" accept="image/*" hidden onChange={onAvatar} />
      <input ref={coverInput} type="file" accept="image/*" hidden onChange={onCover} />

      {welcomeMode ? (
        <FadeInOnScroll>
          <Card className="border-[rgba(255,255,255,0.18)] text-center">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.34em] text-[var(--et-text-faint)]">Tu legado empieza aquí</p>
            <CardTitle className="mt-2 !text-2xl">Bienvenido a Eternime</CardTitle>
            <CardDescription className="mx-auto mt-2 max-w-md">
              Lo que más importa ahora no es tu foto — es que Eon empiece a conocerte. Cada cosa que le cuentes queda con él para siempre.
            </CardDescription>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link href="/app/hablar" className="et-btn et-btn-primary px-6">Hablar con Eon</Link>
              <Button variant="ghost" onClick={() => avatarInput.current?.click()}>Subir mi foto primero</Button>
            </div>
            <button
              type="button"
              onClick={() => setWelcomeMode(false)}
              className="mt-4 text-xs text-[var(--et-text-faint)] underline-offset-4 hover:underline"
            >
              Más tarde
            </button>
          </Card>
        </FadeInOnScroll>
      ) : null}

      <FadeInOnScroll>
        <Card padded={false} className="overflow-hidden">
          <div className="relative">
            <div
              className="h-40 w-full bg-cover bg-center sm:h-52"
              style={{
                backgroundImage: user?.cover_url
                  ? `linear-gradient(180deg, rgba(10,10,15,0.15), rgba(10,10,15,0.85)), url(${user.cover_url})`
                  : "radial-gradient(120% 140% at 50% 0%, rgba(255,255,255,0.18), transparent 60%), linear-gradient(180deg, #14140f, #0a0a0f)",
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
