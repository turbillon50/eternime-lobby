/* Eternime Service Worker v2 — network-first páginas+assets, SWR para bundles hash, purga de cachés viejos, auto-update de clientes. */
const VERSION = "eternime-v2";
const STATIC_CACHE = `${VERSION}-static`;
const PAGES_CACHE = `${VERSION}-pages`;
const OFFLINE_URL = "/offline.html";

const PRECACHE = [OFFLINE_URL, "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  // Activa de inmediato la versión nueva (no espera a que cierren pestañas).
  event.waitUntil(caches.open(STATIC_CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Borra TODOS los cachés que no son de la versión actual.
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

// Permite forzar skipWaiting desde el cliente.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

const isHashedBundle = (url) => /\/_next\/static\//.test(url.pathname);
const isAsset = (url) =>
  url.pathname.startsWith("/icons/") ||
  url.pathname.startsWith("/images/") ||
  /\.(?:png|jpg|jpeg|webp|svg|gif|ico|woff2?|ttf|css|js)$/.test(url.pathname);

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/videos/")) return;

  // Bundles hasheados (_next/static): stale-while-revalidate (instantáneo + se actualiza en background).
  if (isHashedBundle(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request).then((res) => { if (res.ok) cache.put(request, res.clone()); return res; }).catch(() => cached);
        return cached || network;
      }),
    );
    return;
  }

  // Otros assets (no hasheados): NETWORK-FIRST → la actualización se ve sin reinstalar.
  if (isAsset(url)) {
    event.respondWith(
      fetch(request)
        .then((res) => { if (res.ok) caches.open(STATIC_CACHE).then((c) => c.put(request, res.clone())); return res; })
        .catch(() => caches.match(request)),
    );
    return;
  }

  // Navegación/páginas: network-first con fallback offline.
  if (request.mode === "navigate" || (request.headers.get("accept") || "").includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((res) => { if (res.ok) caches.open(PAGES_CACHE).then((c) => c.put(request, res.clone())); return res; })
        .catch(async () => (await caches.match(request)) || caches.match(OFFLINE_URL)),
    );
  }
});
