const CACHE_NAME = 'setter-theory-v103-report-cache-recovery';
const APP_JS = './app.js?v=103-report-cache-recovery';
const ASSETS = [
  './',
  './index.html',
  APP_JS,
  './manifest.json',
  './icons/aquila-192.png',
  './icons/aquila-512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // HTML navigation must be refreshed first so an installed iPad PWA cannot
  // keep mixing an old index.html with a new app.js (or the reverse).
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch('./index.html', { cache: 'no-store' });
        const cache = await caches.open(CACHE_NAME);
        await cache.put('./index.html', fresh.clone());
        return fresh;
      } catch (_) {
        return (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    try {
      const fresh = await fetch(event.request, { cache: 'no-store' });
      if (fresh && fresh.ok && url.origin === self.location.origin) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, fresh.clone());
      }
      return fresh;
    } catch (_) {
      return (await caches.match(event.request)) || Response.error();
    }
  })());
});
