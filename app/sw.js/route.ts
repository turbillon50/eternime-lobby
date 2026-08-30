export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const release = process.env.VERCEL_GIT_COMMIT_SHA
    || process.env.VERCEL_DEPLOYMENT_ID
    || "local-v5";
  const version = JSON.stringify(`eternime-${release}`);
  const source = `/* Eternime Service Worker — release ${release.slice(0, 12)} */
const VERSION = ${version};
const STATIC_CACHE = \`${"${VERSION}"}-static\`;
const PAGES_CACHE = \`${"${VERSION}"}-pages\`;
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

const isHashedBundle = (url) => /\\/_next\\/static\\//.test(url.pathname);
const isAsset = (url) => url.pathname.startsWith("/icons/")
  || url.pathname.startsWith("/images/")
  || /\\.(?:png|jpg|jpeg|webp|svg|gif|ico|woff2?|ttf|css|js)$/.test(url.pathname);

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/videos/")) return;

  if (isHashedBundle(url)) {
    event.respondWith(caches.open(STATIC_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const network = fetch(request).then((response) => {
        if (response.ok) cache.put(request, response.clone());
        return response;
      }).catch(() => cached);
      return cached || network;
    }));
    return;
  }

  if (isAsset(url)) {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) caches.open(STATIC_CACHE).then((cache) => cache.put(request, response.clone()));
      return response;
    }).catch(() => caches.match(request)));
    return;
  }

  if (request.mode === "navigate" || (request.headers.get("accept") || "").includes("text/html")) {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) caches.open(PAGES_CACHE).then((cache) => cache.put(request, response.clone()));
      return response;
    }).catch(async () => (await caches.match(request)) || caches.match(OFFLINE_URL)));
  }
});`;

  return new Response(source, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store, max-age=0, must-revalidate",
      "Service-Worker-Allowed": "/",
    },
  });
}
