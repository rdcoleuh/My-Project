/* MineWorld original, asset-independent survival HUD model. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.MineWorldSurvivalHUD=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function normalize(value){return Number.isFinite(value)?Math.max(0,Math.min(20,Math.floor(value*2)/2)):0;}
function icons(value){const v=normalize(value);return Array.from({length:10},(_,i)=>{const remaining=v-i*2;return remaining>=2?'full':remaining>=1?'half':'empty';});}
function model(health,food){const h=normalize(health),f=normalize(food);return {health:h,food:f,hearts:icons(h),hunger:icons(f),healthLabel:'Health '+h+' of 20',foodLabel:'Food '+f+' of 20'};}

// Only accept local raster images, never remote resources or SVG content.
function isSafeLocalRasterURL(url){
 if(typeof url!=='string'||/[\\s\\\\"'()<>]/.test(url))return false;
 if(/^data:image\\/(?:png|webp|gif|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/i.test(url))return true;
 if(!url.startsWith('blob:'))return false;
 try { const parsed=new URL(url); return parsed.protocol==='blob:' && /^blob:(?:https?:\\/\\/[^/]+\\/|null\\/)[A-Za-z0-9._~-]+$/i.test(url); }
 catch(_error){return false;}
}
// Renders original CSS-drawn pixel icons; never embeds proprietary bitmap assets.
// The optional resolveTexture(kind, state) callback can return a player-imported
// data/blob URL. Callers own texture-pack parsing and lifetime of those URLs.
function render(container,health,food,resolveTexture){
 if(!container||!container.ownerDocument)throw new TypeError('HUD container required');
 const doc=container.ownerDocument, state=model(health,food);
 container.replaceChildren();
 container.classList.add('mw-survival-hud');
 for(const [kind,values,label] of [['heart',state.hearts,state.healthLabel],['hunger',state.hunger,state.foodLabel]]){
  const row=doc.createElement('div');row.className='mw-survival-row mw-survival-'+kind;
  row.setAttribute('role','img');row.setAttribute('aria-label',label);
  for(const value of values){
   const icon=doc.createElement('span');icon.className='mw-survival-icon mw-'+kind+' mw-'+value;
   icon.setAttribute('aria-hidden','true');
   let url=null;
   if(typeof resolveTexture==='function'){try{url=resolveTexture(kind,value);}catch(_error){/* procedural fallback */}}
   // Restrict imported art to local raster URLs; reject SVG data and CSS delimiters.
   if(isSafeLocalRasterURL(url)){
    icon.style.backgroundImage='url("'+url+'")';
    icon.classList.add('mw-imported-icon');
   }
   row.appendChild(icon);
  }
  container.appendChild(row);
 }
 return state;
}
return {normalize,icons,model,render,isSafeLocalRasterURL};
});
