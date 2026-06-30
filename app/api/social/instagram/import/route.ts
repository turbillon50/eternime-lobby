import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { fetchInstagramMedia } from "@/lib/social/instagram";
import { getDecryptedAccessToken, markSocialSynced } from "@/lib/data/social";
import { rehostAndSaveImport } from "@/lib/social/import";
import { createMemory } from "@/lib/data/memories";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  try {
    const session = await requireUser();
    const accessToken = await getDecryptedAccessToken(session.sub, "instagram");
    if (!accessToken) {
      return NextResponse.json({ error: "Instagram no esta conectado" }, { status: 400 });
    }

    let mediaImported = 0;
    let memoriesCreated = 0;

    const media = await fetchInstagramMedia(accessToken, 60);
    for (const item of media) {
      const remoteUrl = item.media_type === "VIDEO" ? (item.thumbnail_url ?? item.media_url) : item.media_url;
      if (!remoteUrl) continue;

      const saved = await rehostAndSaveImport({
        userId: session.sub,
        remoteUrl,
        externalId: `ig_media_${item.id}`,
        caption: item.caption ?? null,
        suggestedName: `instagram-${item.id}`,
      });
      if (saved) mediaImported += 1;

      const text = (item.caption ?? "").trim();
      if (text.length >= 12) {
        const created = await createMemory({
          userId: session.sub,
          title: text.length > 60 ? `${text.slice(0, 57)}...` : text,
          content: text,
          kind: "texto",
          mediaUrl: saved?.url ?? null,
          source: "social_import",
        });
        if (created) memoriesCreated += 1;
      }
    }

    await markSocialSynced(session.sub, "instagram", mediaImported + memoriesCreated);

    return NextResponse.json({ ok: true, mediaImported, memoriesCreated });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("[instagram import]", e);
    return NextResponse.json({ error: "No se pudo importar de Instagram" }, { status: 500 });
  }
}
