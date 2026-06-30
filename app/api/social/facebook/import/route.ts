import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { fetchFacebookPhotos, fetchFacebookPosts } from "@/lib/social/facebook";
import { getDecryptedAccessToken, markSocialSynced } from "@/lib/data/social";
import { rehostAndSaveImport } from "@/lib/social/import";
import { createMemory } from "@/lib/data/memories";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  try {
    const session = await requireUser();
    const accessToken = await getDecryptedAccessToken(session.sub, "facebook");
    if (!accessToken) {
      return NextResponse.json({ error: "Facebook no esta conectado" }, { status: 400 });
    }

    let photosImported = 0;
    let memoriesCreated = 0;

    const photos = await fetchFacebookPhotos(accessToken, 60);
    for (const photo of photos) {
      const best = (photo.images ?? []).sort((a, b) => b.width - a.width)[0];
      if (!best) continue;
      const saved = await rehostAndSaveImport({
        userId: session.sub,
        remoteUrl: best.source,
        externalId: `fb_photo_${photo.id}`,
        caption: photo.name ?? null,
        suggestedName: photo.name ?? `foto-${photo.id}`,
      });
      if (saved) photosImported += 1;
    }

    const posts = await fetchFacebookPosts(accessToken, 60);
    for (const post of posts) {
      const text = (post.message ?? "").trim();
      if (!text || text.length < 12) continue; // descarta posts vacios o solo-link
      const created = await createMemory({
        userId: session.sub,
        title: text.length > 60 ? `${text.slice(0, 57)}...` : text,
        content: text,
        kind: "texto",
        mediaUrl: post.full_picture ?? null,
        source: "social_import",
      });
      if (created) memoriesCreated += 1;
    }

    await markSocialSynced(session.sub, "facebook", photosImported + memoriesCreated);

    return NextResponse.json({ ok: true, photosImported, memoriesCreated });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("[facebook import]", e);
    return NextResponse.json({ error: "No se pudo importar de Facebook" }, { status: 500 });
  }
}
