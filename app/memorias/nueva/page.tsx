"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function NuevaMemoriaPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-[#0a0a0a]" />}>
      <NuevaMemoriaForm />
    </Suspense>
  );
}

function NuevaMemoriaForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(params.get("prompt") ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!content.trim() && !file) {
      setError("Comparte un texto o un archivo.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const form = new FormData();
      if (title.trim()) form.set("title", title.trim());
      if (content.trim()) form.set("content", content.trim());
      if (file) {
        form.set("file", file);
        form.set("type", file.type.startsWith("image/") ? "photo" : file.type.startsWith("audio/") ? "audio" : file.type.startsWith("video/") ? "video" : "document");
      }
      const res = await fetch("/api/memorias", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo guardar.");
      }
      router.replace("/memorias");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-dvh bg-[#0a0a0a] px-5 py-10 text-[#f5f1e8]">
      <div className="mx-auto w-full max-w-lg">
        <Link href="/memorias" className="text-sm text-[#d8d2c4]/60 hover:text-[#e8d9a8]">
          ← Mis recuerdos
        </Link>
        <h1 className="mt-6 font-serif text-2xl md:text-3xl">Guardar un recuerdo</h1>

        <div className="mt-8 flex flex-col gap-5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título (opcional)"
            className="rounded-xl border border-[#e8d9a8]/20 bg-white/[0.03] px-4 py-3 outline-none placeholder:text-[#d8d2c4]/30 focus:border-[#e8d9a8]/50"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder="Cuéntame este recuerdo…"
            className="resize-none rounded-xl border border-[#e8d9a8]/20 bg-white/[0.03] px-4 py-3 outline-none placeholder:text-[#d8d2c4]/30 focus:border-[#e8d9a8]/50"
          />
          <label className="cursor-pointer rounded-xl border border-dashed border-[#e8d9a8]/25 bg-white/[0.02] px-4 py-3 text-sm text-[#d8d2c4]/70 hover:border-[#e8d9a8]/50">
            {file ? file.name : "Adjuntar foto, audio o video (opcional)"}
            <input
              type="file"
              accept="image/*,audio/*,video/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>

          {error && <p className="text-sm text-red-300/80">{error}</p>}

          <button
            onClick={save}
            disabled={saving}
            className="self-start rounded-full bg-[#e8d9a8] px-7 py-3 text-sm font-medium text-[#0a0a0a] transition disabled:opacity-40 hover:bg-[#f0e4bd]"
          >
            {saving ? "Guardando…" : "Guardar recuerdo"}
          </button>
        </div>
      </div>
    </main>
  );
}
