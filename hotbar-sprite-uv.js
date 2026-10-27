/* Original MineWorld adapter for player-imported Java hotbar sprites.
 * The standard nine-cell bar has a 182x22 canvas and 20x20 cell interiors.
 * Also supports seamless 180x20 nine-cell GUI sheets from imported packs.
 * Coordinates are computed on source pixel edges; no bitmap is distributed.
 */
(()=>{
'use strict';
function slotRect(width,height,index){
 if(!Number.isInteger(width)||!Number.isInteger(height)||
    !Number.isInteger(index)||index<0||index>8)return null;
 // Java's bordered 182x22 sheet and Bedrock-style seamless 180x20
 // sheets both contain nine 20-pixel cells. Require matching dimensions
 // so unrelated GUI art cannot be misinterpreted as a nine-slot bar.
 const bordered=width/182, seamless=width/180;
 const java=bordered>=0.5&&Math.abs(height-22*bordered)<0.01;
 const bedrock=seamless>=0.5&&Math.abs(height-20*seamless)<0.01;
 if(!java&&!bedrock)return null;
 const scale=java?bordered:seamless,edge=java?1:0;
 const x=Math.round((edge+20*index)*scale),y=Math.round(edge*scale);
 const right=Math.round((edge+20*(index+1))*scale);
 const bottom=Math.round((edge+20)*scale);
 if(x<0||y<0||right>width||bottom>height||right<=x||bottom<=y)return null;
 return Object.freeze({x,y,width:right-x,height:bottom-y});
}
// Legacy Java packs and client JARs store the bar and selection frame in
// textures/gui/widgets.png. Extract pixel-aligned rectangles from the user's
// own 256x256 atlas; MineWorld does not distribute Minecraft bitmap art.
function legacyRect(width,height,kind){
 if(!Number.isInteger(width)||!Number.isInteger(height)||
    width!==height||width<256||width>4096||width%256!==0)return null;
 const scale=width/256;
 if(kind==='background')return Object.freeze({x:0,y:0,width:182*scale,height:22*scale});
 if(kind==='selected')return Object.freeze({x:0,y:22*scale,width:24*scale,height:24*scale});
 if(/^slot[0-8]$/.test(kind)){
  const i=Number(kind.slice(-1));
  return Object.freeze({x:(1+20*i)*scale,y:scale,width:20*scale,height:20*scale});
 }
 return null;
}
// An explicitly supplied generic slot is authoritative for all unnumbered
// positions. A sliced bar is a fallback only when neither a numbered slot
// nor a generic slot exists in the player's pack.
function shouldDeriveSlot(entries,slot){
 if(!entries||typeof entries.has!=='function'||!/^slot[0-8]$/.test(slot))return false;
 return entries.has('hud:hotbar:background')&&
   !entries.has('hud:hotbar:'+slot)&&!entries.has('hud:hotbar:slot');
}
// Ignore incorrectly mapped GUI strips instead of squashing them into a
// single selection or slot. Allow small borders on legitimate square sprites.
function validSlotSprite(width,height){
 return Number.isInteger(width)&&Number.isInteger(height)&&
   width>=2&&height>=2&&width<=1024&&height<=1024&&
   Math.max(width,height)/Math.min(width,height)<=1.25;
}
window.MineWorldHotbarUV=Object.freeze({slotRect,legacyRect,shouldDeriveSlot,validSlotSprite});
})();
