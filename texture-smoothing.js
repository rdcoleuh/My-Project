/* MineWorld 6.16 — optional softer block texture sampling.
 * Does not modify image assets, atlas coordinates, or world-save data.
 * LINEAR uses existing half-texel atlas insets to keep adjacent tiles isolated.
 */
(()=>{
 'use strict';
 // v3 starts with pixel-accurate NEAREST filtering, even on devices that
 // selected legacy Smooth mode. Explicit new choices are saved normally.
 const KEY='mineworld-texture-smoothing-v3';
 let enabled=false,gl=null,texture=null,canvas=null;
 try{const saved=localStorage.getItem(KEY);if(saved==='smooth')enabled=true;}catch(_){}
 const listeners=new Set();
 function apply(g=gl,t=texture){
   if(!g||!t)return false;
   if(typeof g.isContextLost==='function'&&g.isContextLost())return false;
   // Only change sampling of the world atlas. Mob, skin and item textures
   // are always nearest-filtered by their own renderers.
   g.activeTexture(g.TEXTURE0);
   g.bindTexture(g.TEXTURE_2D,t);
   const filter=enabled?g.LINEAR:g.NEAREST;
   g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,filter);
   g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,filter);
   if(canvas)canvas.style.imageRendering='pixelated';
   return true;
 }
 function set(next){
   enabled=!!next;
   try{localStorage.setItem(KEY,enabled?'smooth':'classic');}catch(_){}
   apply();
   for(const sync of listeners)sync();
   return enabled;
 }
 function attach(g,t,c){
   gl=g;texture=t;canvas=c;
   return apply();
 }
 function mountUI(){
   for(const [root,location] of [
     [document.querySelector('#pause .mw-render-panel'),'Pause menu'],
     [document.querySelector('#mw-options-screen .mw-settings .mw-render-panel'),'Options']
   ]){
     if(!root||root.querySelector('[data-mw-texture-filter]'))continue;
     const label=document.createElement('label');
     label.className='mw-render-auto';
     label.setAttribute('data-mw-texture-filter',location);
     label.style.cssText='display:flex;align-items:center;gap:9px;margin-top:12px;cursor:pointer;min-height:40px;';
     const checkbox=document.createElement('input');
     checkbox.type='checkbox';
     checkbox.setAttribute('aria-label','Smooth block texture edges');
     checkbox.checked=enabled;
     const words=document.createElement('span');
     const description=document.createElement('small');
     description.className='mw-render-status';
     description.style.cssText='display:block;margin:2px 0 7px;';
     const sync=()=>{
       checkbox.checked=enabled;
       words.textContent=enabled?'Smooth textures':'Classic sharp pixels';
       description.textContent=enabled?
         'Opt-in smooth block pixels. The game canvas remains pixelated; switch off for authentic sharp imported art.':
         'Crisp, unblended Minecraft-style pixels. Best for an exact view of imported Java artwork.';
     };
     checkbox.addEventListener('change',()=>set(checkbox.checked));
     label.append(checkbox,words);
     root.append(label,description);
     listeners.add(sync);
     sync();
   }
 }
 window.MineWorldTextureSmoothing=Object.freeze({
   attach,apply,set,mountUI,get enabled(){return enabled;},
   get storageKey(){return KEY;}
 });
})();