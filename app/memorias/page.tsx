import Link from "next/link";

import { isClerkConfigured } from "@/lib/clerk";

export const dynamic = "force-dynamic";

interface MemoryRow {
  id: string;
  title: string | null;
  content: string | null;
  type: string;
  blobUrl: string | null;
  createdAt: Date;
}

export default async function MemoriasPage() {
  const memories = await loadMemories();

  return (
    <main className="min-h-dvh bg-[#0a0a0a] px-5 py-10 text-[#f5f1e8]">
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex items-center justify-between">
          <Link href="/home" className="text-sm text-[#d8d2c4]/60 hover:text-[#e8d9a8]">
            ← Mi bóveda
          </Link>
          <Link
            href="/memorias/nueva"
            className="rounded-full bg-[#e8d9a8] px-5 py-2 text-sm font-medium text-[#0a0a0a] hover:bg-[#f0e4bd]"
          >
            + Nuevo recuerdo
          </Link>
        </div>

        <h1 className="mt-8 font-serif text-3xl">Mis recuerdos</h1>

        {memories.length === 0 ? (
          <p className="mt-10 text-[#d8d2c4]/50">
            Aún no has guardado recuerdos. Empieza con uno —{" "}
            <Link href="/memorias/nueva" className="text-[#e8d9a8] underline-offset-4 hover:underline">
              guardar el primero
            </Link>
            .
          </p>
        ) : (
          <ol className="mt-10 space-y-4 border-l border-[#e8d9a8]/15 pl-6">
            {memories.map((m) => (
              <li key={m.id} className="relative">
                <span className="absolute -left-[27px] top-2 h-2 w-2 rounded-full bg-[#e8d9a8]/70" />
                <div className="rounded-2xl border border-[#e8d9a8]/12 bg-white/[0.02] p-5">
                  {m.title && <p className="font-serif text-lg text-[#f5f1e8]">{m.title}</p>}
                  {m.content && (
                    <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-[#d8d2c4]/85">
                      {m.content}
                    </p>
                  )}
                  {m.blobUrl && m.type === "photo" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.blobUrl}
                      alt={m.title ?? "Recuerdo"}
                      className="mt-3 max-h-72 rounded-xl object-cover"
                    />
                  )}
                  {m.blobUrl && m.type === "audio" && (
                    <audio controls src={m.blobUrl} className="mt-3 w-full" />
                  )}
                  <p className="mt-3 text-xs uppercase tracking-wide text-[#d8d2c4]/35">
                    {new Date(m.createdAt).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </main>
  );
}

async function loadMemories(): Promise<MemoryRow[]> {
  if (!isClerkConfigured()) return [];
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    if (!userId) return [];

    const { getTenantDb } = await import("@/lib/db/tenant");
    const { memories } = await import("@/lib/db/schema/tenant");
    const { desc, isNull } = await import("drizzle-orm");

    const db = await getTenantDb(userId);
    return await db
      .select({
        id: memories.id,
        title: memories.title,
        content: memories.contentText,
        type: memories.type,
        blobUrl: memories.blobUrl,
        createdAt: memories.createdAt,
      })
      .from(memories)
      .where(isNull(memories.deletedAt))
      .orderBy(desc(memories.createdAt))
      .limit(100);
  } catch {
    return [];
  }
}
