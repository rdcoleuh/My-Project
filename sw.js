const VERSION='mineworld-survival-hotbar-20261023-v13';
const FILES=['./','./index.html','./multiplayer.js','./world-chunks.js','./survival-catalog.js','./nether-world.js','./overworld-ores.js','./end-world.js','./structure-loot.js','./villages.js','./manifest.webmanifest','./favicon.svg','./apple-touch-icon.png'];
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
