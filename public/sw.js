// Service worker NBA Watch.
// - strony: najpierw sieć (oceny muszą być świeże), bez sieci ostatnia zapisana wersja albo /offline
// - statyczne zasoby Next, ikony, grafiki: z pamięci (mają hash w nazwie albo się nie zmieniają)
// - loga drużyn z CDN ESPN: z pamięci, odświeżane w tle
// - /api/*: zawsze sieć (wynik meczu nigdy nie jest trzymany offline)

const VERSION = "v1";
const STATIC = `static-${VERSION}`;
const PAGES = `strony-${VERSION}`;
const LOGOS = `loga-${VERSION}`;
const PRECACHE = ["/offline", "/ikony/ikona-192.png", "/grafiki/pusta-noc.webp"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => ![STATIC, PAGES, LOGOS].includes(k)).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

async function networkFirstPage(request) {
  const cache = await caches.open(PAGES);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    return (await cache.match(request)) || (await caches.match("/offline")) || Response.error();
  }
}

async function cacheFirst(request, cacheName) {
  const hit = await caches.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok || res.type === "opaque") {
    const cache = await caches.open(cacheName);
    cache.put(request, res.clone());
  }
  return res;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  const refresh = fetch(request)
    .then((res) => {
      if (res.ok || res.type === "opaque") cache.put(request, res.clone());
      return res;
    })
    .catch(() => hit);
  return hit || refresh;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (url.hostname === "a.espncdn.com") {
    event.respondWith(staleWhileRevalidate(request, LOGOS));
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/ikony/") ||
    url.pathname.startsWith("/grafiki/")
  ) {
    event.respondWith(cacheFirst(request, STATIC));
  }
});
