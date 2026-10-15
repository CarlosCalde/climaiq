/* ClimaIQ 4.5 - Caché offline de la aplicación. Rutas relativas para GitHub Pages. */
const CACHE='climaiq-v5.4-mobile-20261015';
const FILES=['./index.html','./manifest.webmanifest','./assets/icon-180.png','./assets/icon-192.png','./assets/icon-512.png','./assets/icon.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(key=>key.startsWith('climaiq-')&&key!==CACHE).map(key=>caches.delete(key)));await self.clients.claim();})());});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==location.origin)return;
 if(req.mode==='navigate'){event.respondWith((async()=>{try{const response=await fetch(req,{cache:'no-store'});if(response.ok){const cache=await caches.open(CACHE);await cache.put('./index.html',response.clone());}return response}catch{const cache=await caches.open(CACHE);return (await cache.match('./index.html'))||Response.error()}})());return}
 event.respondWith((async()=>{try{const r=await fetch(req);if(r.ok){const c=await caches.open(CACHE);await c.put(req,r.clone())}return r}catch{return (await caches.match(req))||Response.error()}})());
});