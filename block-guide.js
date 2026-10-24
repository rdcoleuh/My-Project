/* MineWorld 5.3 Block Guide — independent interactive in-game reference.
 * Original hand-authored pixels only; dynamically reads installed block IDs/shapes.
 * Does not write saves, invent items, or alter game logic. */
(()=>{
'use strict';
const NAMES=["Air","Grass","Dirt","Stone","Sand","Wood","Leaves","Water","Brick","Glass","Glowstone","Planks","Red Poplar Leaves","Amber Poplar Leaves","Golden Poplar Leaves","Poplar Log","Red Shrub","Mushroom","Coal Ore","Iron Ore","Furnace","Snow","Ice","Packed Ice","Sandstone","Terracotta","Red Sand","Red Terracotta","Podzol","Coarse Dirt","Spruce Log","Spruce Leaves","Birch Log","Birch Leaves","Acacia Log","Acacia Leaves","Jungle Log","Jungle Leaves","Mangrove Log","Mangrove Leaves","Cherry Log","Cherry Leaves","Pale Oak Log","Pale Oak Leaves","Cactus","Bamboo","Moss","Mud","Red Mushroom Cap","Brown Mushroom Cap","Netherrack","Obsidian","Dark Planks","Stone Bricks","Chiseled Sandstone","Prismarine","Copper","Clay","Deepslate","Lantern","Hay Bale","Cobblestone","Glow Lichen","Dripstone","Sculk","Nether Rock","Lava","Basalt","Blackstone","Polished Blackstone","Soul Sand","Soul Soil","Nether Bricks","Nether Wart","Chiseled Nether Bricks","Crimson Nylium","Warped Nylium","Crimson Roots","Crimson Stem","Nether Wart Block","Warped Stem","Warped Wart Block","Warped Roots","Quartz Ore","Nether Gold Ore","Ancient Debris","Bone Block","Portal","Magma Block","Soul Fire","Shroomlight","Gilded Blackstone","Gravel","Twisting Vines","Weeping Vines","Copper Ore","Gold Ore","Redstone Ore","Lapis Ore","Diamond Ore","Emerald Ore","Deepslate Coal Ore","Deepslate Iron Ore","Deepslate Copper Ore","Deepslate Gold Ore","Deepslate Redstone Ore","Deepslate Lapis Ore","Deepslate Diamond Ore","Deepslate Emerald Ore","Redstone Lamp","Lapis Block","Emerald Block","Diamond Block","Copper Block","Gold Block","Iron Block","Coal Block","Redstone Block","Raw Mineral Crate","Treasure Chest","Opened Chest","End Stone","Chorus Plant","Chorus Flower","End Crystal","End Portal Frame","End Portal","End Gateway","End Rod","Dragon Egg","End Stone Bricks","Purpur Block","Purpur Pillar","Shulker Shell Block","Dragon Head","Netherite Block","Smithing Table","Farmland","Hydrated Farmland","Wheat Sprouts","Wheat Growing","Wheat Tall","Ripe Wheat","Carrot Sprouts","Carrot Growing","Carrot Tall","Ripe Carrots","Potato Sprouts","Potato Growing","Potato Tall","Ripe Potatoes","Beetroot Sprouts","Beetroot Growing","Beetroot Tall","Ripe Beetroot","Composter","Blast Furnace","Smoker","Cartography Table","Brewing Stand","Barrel","Fletching Table","Cauldron","Lectern","Stonecutter","Loom","Toolsmith Smithing Table","Grindstone","Crafting Table","Red Bed"];
const TOTAL=NAMES.length-1, PAGE=24;
const dom=document;
const style=dom.createElement('style');
style.textContent=`
#mw-guide-overlay{position:absolute;inset:0;z-index:4000;display:none;align-items:center;justify-content:center;background:#0a1117e9;color:#f6f5eb;font:14px/1.5 system-ui,sans-serif;padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));box-sizing:border-box}
#mw-guide-overlay.mw-guide-visible{display:flex}
#mw-guide-overlay *,#mw-guide-overlay *:before,#mw-guide-overlay *:after{box-sizing:border-box}
#mw-guide-panel{width:min(820px,100%);height:min(720px,100%);display:flex;flex-direction:column;background:#202923;border:2px solid #91a58b;box-shadow:0 9px 36px #0009;overflow:hidden;border-radius:7px}
#mw-guide-head{display:flex;align-items:center;justify-content:space-between;background:#344537;padding:12px 15px;gap:10px}
#mw-guide-head strong{font-size:18px;letter-spacing:.3px}
#mw-guide-close{font-size:15px;background:#6e3434;color:#fff;border:1px solid #f5b0b0;border-radius:4px;padding:7px 11px;cursor:pointer}
#mw-guide-help{padding:9px 14px;color:#d7e3d5;font-size:12px}
#mw-guide-tools{display:flex;gap:7px;padding:0 14px 10px;flex-wrap:wrap}
#mw-guide-tools input,#mw-guide-tools select{color:#fff;background:#27342b;border:1px solid #9aaa9b;border-radius:4px;padding:10px;font-size:16px;min-width:0}
#mw-guide-query{flex:1 1 190px}
#mw-guide-group{flex:0 1 160px}
#mw-guide-results{overflow-y:auto;flex:1;min-height:0;padding:0 14px 14px;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
#mw-guide-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(188px,1fr));gap:9px}
.mw-guide-card{background:#303a31;border:1px solid #596b5d;min-height:116px;padding:9px;border-radius:4px}
.mw-guide-row{display:flex;align-items:flex-start;gap:10px}
.mw-guide-tiles{display:flex;gap:4px;flex-shrink:0}
.mw-guide-tiles canvas{width:43px;height:43px;image-rendering:pixelated;border:1px solid #899d87;background:#505e4d}
.mw-guide-card b{display:block;font-size:13px;overflow-wrap:anywhere}
.mw-guide-card small{display:block;color:#c6d4c2;font-size:11px}
.mw-guide-card .mw-dims{margin-top:8px;font:12px/1.4 monospace;color:#d8eed7}
#mw-guide-more{background:#4d7548;color:#fff;border:1px solid #a9ce9e;border-radius:4px;padding:10px 14px;margin:10px auto;display:block;cursor:pointer}
#mw-guide-count{font-size:12px;color:#a7c2a7;margin-bottom:8px}
.mw-guide-trigger{padding:9px 12px!important;cursor:pointer;min-height:38px}
@media(max-width:500px){#mw-guide-panel{height:100%}#mw-guide-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.mw-guide-card{padding:6px}.mw-guide-tiles canvas{width:30px;height:30px}.mw-guide-row{gap:5px}.mw-guide-card b{font-size:12px}#mw-guide-head strong{font-size:16px}}
`;
dom.head.appendChild(style);
const overlay=dom.createElement('div');overlay.id='mw-guide-overlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Block encyclopedia');
overlay.innerHTML=`
<div id="mw-guide-panel">
 <div id="mw-guide-head"><strong>▣ MineWorld Block Guide</strong><button id="mw-guide-close" type="button">✕ Close</button></div>
 <div id="mw-guide-help">Search all 169 MineWorld blocks. Original 16×16-pixel top and side textures, plus rendered block dimensions (16 pixels = 1 block).</div>
 <div id="mw-guide-tools"><input id="mw-guide-query" type="search" placeholder="Search blocks, materials…" aria-label="Search blocks" autocomplete="off">
 <select id="mw-guide-group" aria-label="Block category"><option value="all">All blocks</option><option value="ground">Terrain & plants</option><option value="building">Building & decor</option><option value="ore">Ores & minerals</option><option value="nether">Nether blocks</option><option value="end">End blocks</option><option value="farm">Farming & crafting</option></select></div>
 <div id="mw-guide-results"><div id="mw-guide-count"></div><div id="mw-guide-grid"></div><button id="mw-guide-more" type="button">Show more blocks</button></div>
</div>
`;
(dom.getElementById('game-wrap')||dom.body).appendChild(overlay);
const $=id=>dom.getElementById(id),list=$('mw-guide-grid'),more=$('mw-guide-more');
let matches=[],offset=0;
const classify=id=>{
 if((id>=18&&id<=19)||(id>=83&&id<=85)||(id>=95&&id<=118))return 'ore';
 if(id>=65&&id<=94)return 'nether';
 if(id>=121&&id<=136)return 'end';
 if(id>=137&&id<=169)return 'farm';
 if(id<=7||(id>=12&&id<=17)||(id>=21&&id<=23)||(id>=28&&id<=49)||(id>=57&&id<=58))return 'ground';
 return 'building';
};
const dims=id=>{
 // Growth-stage crop sprites use a smaller render box than the base collision model.
 const crop=window.MineWorldVillages?.cropAt(id);
 if(crop){
  const height=Math.round((.22+crop.stage*.22)*16*100)/100;
  return '11.52 × '+height+' × 11.52';
 }
 const box=window.MineWorldBlockModels?.shape(id)||{left:0,right:1,bottom:0,top:1,front:0,back:1};
 return [box.right-box.left,box.top-box.bottom,box.back-box.front].map(n=>{
  const x=Math.round(n*16*100)/100;return Number.isInteger(x)?String(x):x.toFixed(2);
 }).join(' × ');
};
const draw=(canvas,id,face)=>{
 const ctx=canvas.getContext('2d');if(!ctx)return;
 if(window.MineWorldLocalTextures?.drawFace(ctx,id,face))return;
 const img=ctx.createImageData(16,16),paint=window.MineWorldPixelMaterials?.paint;
 if(!paint)return;
 for(let y=0;y<16;y++)for(let x=0;x<16;x++){
  const c=paint(id,face,x,y),off=(y*16+x)*4;
  for(let i=0;i<4;i++)img.data[off+i]=c[i];
 }
 ctx.putImageData(img,0,0);
};
function card(id){
 const node=dom.createElement('article');node.className='mw-guide-card';
 const row=dom.createElement('div');row.className='mw-guide-row';
 const preview=dom.createElement('div');preview.className='mw-guide-tiles';
 for(const face of [0,1]){
   const tile=dom.createElement('canvas');tile.width=16;tile.height=16;
   tile.setAttribute('aria-label',face===0?'Top face':'Side face');tile.title=face===0?'Top texture':'Side texture';
   draw(tile,id,face);preview.appendChild(tile);
 }
 const details=dom.createElement('div');
 const name=dom.createElement('b');name.textContent=NAMES[id];
 const number=dom.createElement('small');number.textContent='MineWorld ID '+id;
 details.append(name,number);row.append(preview,details);
 const size=dom.createElement('div');size.className='mw-dims';size.textContent=dims(id)+' px';
 node.append(row,size);return node;
}
function next(){
 const last=Math.min(matches.length,offset+PAGE);
 const fragment=dom.createDocumentFragment();
 for(;offset<last;offset++)fragment.appendChild(card(matches[offset]));
 list.appendChild(fragment);more.hidden=offset>=matches.length;
}
function refresh(){
 const q=$('mw-guide-query').value.trim().toLowerCase(),g=$('mw-guide-group').value;
 matches=[];for(let id=1;id<=TOTAL;id++){
  if(g!=='all'&&classify(id)!==g)continue;
  if(q&&!NAMES[id].toLowerCase().includes(q)&&String(id)!==q)continue;
  matches.push(id);
 }
 offset=0;list.replaceChildren();$('mw-guide-count').textContent=matches.length+' matching MineWorld blocks';
 next();$('mw-guide-results').scrollTop=0;
}
function close(){overlay.classList.remove('mw-guide-visible');}
function open(){refresh();overlay.classList.add('mw-guide-visible');$('mw-guide-query').focus();}
window.MineWorldBlockGuide=Object.freeze({open,close,count:TOTAL,names:NAMES.slice()});
$('mw-guide-query').addEventListener('input',refresh);
$('mw-guide-group').addEventListener('change',refresh);
$('mw-guide-more').addEventListener('click',next);
$('mw-guide-close').addEventListener('click',close);
overlay.addEventListener('pointerdown',e=>{if(e.target===overlay)close();});
dom.addEventListener('keydown',e=>{if(!overlay.classList.contains('mw-guide-visible'))return;
 if(e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();}
},true);
function installButton(parent,after,label){
 if(!parent)return;
 const button=dom.createElement('button');button.type='button';button.className='ui-button mw-guide-trigger';
 button.textContent=label;button.addEventListener('click',open);
 if(after)after.insertAdjacentElement('afterend',button);else parent.appendChild(button);
}
const pause=dom.querySelector('#pause .mw-render-panel');
installButton(pause?.parentNode,pause,'▣ Block Guide: 169 textures & sizes');
const options=dom.querySelector('#mw-options-screen .mw-settings');
installButton(options,null,'▣ Explore Block Textures & Dimensions');
})();