const CACHE_NAME = 'setter-theory-v113-report-radar-size';
const ASSETS=['./','./index.html','./app.js?v=108-radar-labels','./manifest.json','./icons/aquila-192.png','./icons/aquila-512.png'];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)));});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)));await self.clients.claim();})());});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch('./index.html',{cache:'no-store'}).then(async response=>{const cache=await caches.open(CACHE_NAME);await cache.put('./index.html',response.clone());return response;}).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(fetch(event.request,{cache:'no-store'}).then(async response=>{if(response&&response.ok&&new URL(event.request.url).origin===self.location.origin){const cache=await caches.open(CACHE_NAME);await cache.put(event.request,response.clone());}return response;}).catch(()=>caches.match(event.request)));
});
