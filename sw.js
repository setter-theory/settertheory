const CACHE_NAME = "setter-theory-v54-pwa-input-fix";
const ASSETS = [
  "./", "index.html?v=54", "app.js?v=54", "manifest.json",
  "icons/aquila-192.png", "icons/aquila-512.png"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith((async () => {
    try {
      const response = await fetch(event.request, {cache: "no-store"});
      const cache = await caches.open(CACHE_NAME);
      cache.put(event.request, response.clone()).catch(() => {});
      return response;
    } catch (_) {
      return (await caches.match(event.request)) || (await caches.match("./"));
    }
  })());
});
