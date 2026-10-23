const VERSION='mineworld-creative-survival-textures-20261023-v3';
const FILES=['./','./index.html','./texture-atlas.js','./multiplayer.js','./multiplayer.js','./manifest.webmanifest','./favicon.svg','./apple-touch-icon.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith('mineworld-')&&x!==VERSION).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const url=new URL(e.request.url);
 if(url.origin!==self.location.origin)return; // Never cache third-party signaling services.
 e.respondWith(fetch(e.request).then(r=>{
   if(r.ok){const copy=r.clone();caches.open(VERSION).then(c=>c.put(e.request,copy)).catch(()=>{});}return r;
 }).catch(()=>caches.match(e.request)));
});