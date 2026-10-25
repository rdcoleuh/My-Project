const VERSION='mineworld-6-29-java-uv-import-recovery-20261025-v84';
const FILES=['./','./index.html','./survival-hunger.js','./survival-world-rules.js','./survival-weather-visual.js','./block-models.js','./movement-modes.js','./texture-details.js','./texture-polish.js','./texture-workshop.js','./classic-materials.js','./texture-clarity.js','./readable-materials.js','./texture-fidelity.js','./utility-materials.js','./core-pixel-art.js','./texture-facets.js','./texture-classic-forms.js','./texture-precision.js','./texture-motion.js','./texture-smoothing.js','./resource-animation.js','./bedrock-flipbook.js','./block-face-uv.js','./local-pack-storage.js','./sound-engine.js','./local-resource-pack.js','./combat-rules.js','./avatar-animation.js','./classic-interactions.js','./block-placement.js','./advancements.js','./animal-behavior.js','./animal-models.js','./mob-expansion.js','./mob-pixel-art.js','./mob-ai-rules.js','./chat-rules.js','./perspective.js','./world-library.js','./skin-editor.js','./world-manager-ui.js','./advancements-ui.js','./block-guide.js','./pixel-materials.js','./texture-refinement.js','./chunk-planner.js','./stack-inventory.js','./java-slots.js','./java-inventory-ui.js','./java-inventory.css','./multiplayer.js','./world-chunks.js','./survival-catalog.js','./nether-world.js','./overworld-ores.js','./end-world.js','./structure-loot.js','./villages.js','./manifest.webmanifest','./favicon.svg','./apple-touch-icon.png'];
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
