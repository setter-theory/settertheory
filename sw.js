const CACHE_NAME = 'setter-theory-v102-4-ipad-report-open';
const ASSETS=['./','index.html','app.js?v=102-4-ipad-report-open','manifest.json','sw.js','icons/aquila-192.png','icons/aquila-512.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const copy=r.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,copy)).catch(()=>{});return r;}).catch(()=>caches.match(e.request).then(r=>r||caches.match('index.html'))));
});
