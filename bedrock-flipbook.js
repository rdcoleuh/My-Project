/* MineWorld: Bedrock flipbook timelines from player-selected texture packs.
 * No vanilla metadata or texture content is embedded. 20 game ticks per second.
 * Animation JSON resides at textures/flipbook_textures.json.
 */
(()=>{
'use strict';
const MAX_JSON=256*1024,MAX_ENTRIES=512,MAX_FRAMES=4096,TICK_MS=50;
const int=(n,def,min,max)=>Number.isInteger(n)&&n>=min&&n<=max?n:def;
function parse(source){
 if(typeof source!=='string'||source.length>MAX_JSON)return new Map();
 let parsed;
 try{
  // Mojang's official Bedrock samples can begin with a standalone // comment.
  parsed=JSON.parse(source.replace(/^\s*\/\/[^\r\n]*$/gm,''));
 }catch(_){return new Map();}
 if(!Array.isArray(parsed))return new Map();
 const result=new Map();
 for(const row of parsed.slice(0,MAX_ENTRIES)){
  if(!row||typeof row!=='object')continue;
  const path=String(row.flipbook_texture||'');
  const match=path.match(/^textures\/(?:blocks?|items?)\/(?:[a-z0-9_-]+\/)*([a-z0-9_]+)$/);
  if(!match)continue;
  const key=match[1];
  // Ignore duplicates: a given MineWorld face references one physical PNG.
  if(result.has(key))continue;
  const frames=Array.isArray(row.frames)?
    row.frames.slice(0,MAX_FRAMES).filter(v=>Number.isInteger(v)&&v>=0&&v<MAX_FRAMES):
    Number.isInteger(row.frames)&&row.frames>0&&row.frames<=MAX_FRAMES?
      Array.from({length:row.frames},(_,i)=>i):null;
  result.set(key,Object.freeze({
    source:key,atlasTile:typeof row.atlas_tile==='string'?row.atlas_tile:key,
    ticks:int(row.ticks_per_frame,1,1,1200),frames,
    interpolate:row.blend_frames!==false,
    replicate:int(row.replicate,1,1,16),
    atlasIndex:int(row.atlas_index,0,0,1024),
    variant:int(row.atlas_tile_variant,0,0,1024)
  }));
 }
 return result;
}
function geometry(image,entry){
 // Vanilla flipbooks mostly use 16×N vertical strips. Bedrock replicate
 // enlarges displayed pixels, not source frame size or atlas dimensions.
 const iw=Math.floor(image?.width||16),ih=Math.floor(image?.height||16);
 // A Bedrock flipbook can be a horizontal or vertical strip of square
 // frames. Do not silently crop a non-divisible custom sprite: leave it
 // static so every source pixel remains available to the importer.
 const horizontal=iw>ih&&iw%ih===0;
 const vertical=ih>iw&&ih%iw===0;
 const size=Math.min(iw,ih);
 const fw=horizontal||vertical?size:iw;
 const fh=horizontal||vertical?size:ih;
 const columns=horizontal?Math.min(MAX_FRAMES,iw/fw):1;
 const rows=vertical?Math.min(MAX_FRAMES,ih/fh):1;
 return {size:fw,width:fw,height:fh,columns,rows,count:Math.min(MAX_FRAMES,columns*rows)};
}
function timeline(entry,count){
 if(!entry||count<=1)return null;
 let frames=entry.frames?.filter(i=>i<count);
 if(!frames?.length)frames=Array.from({length:Math.min(MAX_FRAMES,count)},(_,i)=>i);
 const steps=frames.map(i=>Object.freeze({index:i,time:entry.ticks}));
 return Object.freeze({
  frames:Object.freeze(steps),totalMs:steps.length*entry.ticks*TICK_MS,
  interpolate:entry.interpolate
 });
}
function match(map,name,aliases=[]){
 if(!(map instanceof Map))return null;
 for(const n of [name,...aliases]){
  if(map.has(n))return map.get(n);
 }
 return null;
}
window.MineWorldBedrockFlipbooks=Object.freeze({parse,geometry,timeline,match,TICK_MS});
})();