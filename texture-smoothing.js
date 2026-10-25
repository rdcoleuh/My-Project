/* MineWorld 6.39 — never blend block texture pixels, including old "smooth" settings. */
(()=>{
 'use strict';
 const KEY='mineworld-texture-smoothing-v4';
 let gl=null,texture=null;
 function apply(g=gl,t=texture){
   if(!g||!t)return false;
   if(typeof g.isContextLost==='function'&&g.isContextLost())return false;
   g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,t);
   g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.NEAREST);
   g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.NEAREST);
   return true;
 }
 function attach(g,t,_canvas){gl=g;texture=t;return apply();}
 function set(_next){try{localStorage.setItem(KEY,'classic');}catch(_){}apply();return false;}
 function mountUI(){
   for(const [root,location] of [
     [document.querySelector('#pause .mw-render-panel'),'Pause menu'],
     [document.querySelector('#mw-options-screen .mw-settings .mw-render-panel'),'Options']]){
     if(!root||root.querySelector('[data-mw-texture-filter]'))continue;
     const label=document.createElement('div');
     label.className='mw-render-status';label.setAttribute('data-mw-texture-filter',location);
     label.style.cssText='margin:9px 0;padding:8px;border:1px solid #819f82;line-height:1.5;';
     label.textContent='Sharp block pixels: ON. No smoothing, even with imported textures.';
     root.appendChild(label);
   }
 }
 window.MineWorldTextureSmoothing=Object.freeze({
   attach,apply,set,mountUI,get enabled(){return false;},get storageKey(){return KEY;}
 });
})();