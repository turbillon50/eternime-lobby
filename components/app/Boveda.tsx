"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "@/components/i18n";
import { Button, Card, CardDescription, CardTitle, EmptyState } from "@/components/ui";

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

/**
 * "La Boveda": fotos, videos y documentos reales (cualquier tipo, hasta
 * 100MB via /api/upload). Vive en /app/recuerdos porque ahi es donde el
 * menu dice "Boveda" (nav.vault) — antes esta seccion vivia enterrada en
 * /app/perfil, desconectada de donde el usuario realmente la busca.
 */
export function Boveda() {
  const t = useT();
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const filesInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/files");
      const d = await r.json();
      setFiles(Array.isArray(d.files) ? d.files : []);
    } catch { /* ignore */ }
    finally { setLoaded(true); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []); if (!list.length) return;
    setUploading(true); setError("");
    try {
      for (const file of list) {
        const fd = new FormData(); fd.append("file", file);
        const res = await fetch("/api/upload?purpose=file", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? t("common.connError")); continue; }
        if (data.file) setFiles((cur) => [data.file, ...cur]);
      }
    } catch { setError(t("common.connError")); }
    finally { setUploading(false); if (filesInput.current) filesInput.current.value = ""; }
  };

  const removeFile = async (id: string) => {
    setFiles((cur) => cur.filter((f) => f.id !== id));
    try { await fetch(`/api/files/${id}`, { method: "DELETE" }); } catch { /* ignore */ }
  };

  if (!loaded) return null;

  const images = files.filter((f) => f.kind === "image");
  const others = files.filter((f) => f.kind !== "image");

  return (
    <Card>
      <input ref={filesInput} type="file" multiple hidden onChange={onFiles} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>{t("profile.vault")}</CardTitle>
          <CardDescription className="mt-1">{t("profile.vaultHint")}</CardDescription>
        </div>
        <Button variant="secondary" onClick={() => filesInput.current?.click()} loading={uploading}>
          {t("profile.upload")}
        </Button>
      </div>

      {error ? <p className="mt-3 text-sm text-[var(--et-danger)]">{error}</p> : null}

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
                  <div key={f.id} className="flex items-center gap-3 rounded-[var(--et-radius-sm)] border border-[var(--et-border-soft)] bg-[rgba(255,255,255,0.03)] px-3 py-2.5">
                    <span className="text-[var(--et-gold)]"><FileIcon kind={f.kind} /></span>
                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-sm text-[var(--et-text)] hover:text-[var(--et-gold-bright)]">{f.name ?? f.url}</a>
                    <span className="shrink-0 text-xs text-[var(--et-text-faint)]">{fmtSize(f.size)}</span>
                    <button type="button" onClick={() => removeFile(f.id)} aria-label="x" className="shrink-0 rounded-full p-1 text-[var(--et-text-faint)] transition hover:text-[var(--et-danger)]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </Card>
  );
}
