/* MineWorld 6.12 — independent Java-style 20 TPS animated resource sprites.
 * Supports vertical strips and .png.mcmeta width/height sprite sheets.
 * All pixels come from player-supplied packs; none are bundled.
 */
(()=>{
'use strict';
const TICK_MS=50;
const finite=n=>Number.isInteger(n)&&n>=0;
function metadata(source){
 if(source&&typeof source==='object')return source.animation&&typeof source.animation==='object'?source.animation:null;
 if(typeof source!=='string'||source.length>131072)return null;
 try{
  const parsed=JSON.parse(source);
  return parsed&&parsed.animation&&typeof parsed.animation==='object'&&!Array.isArray(parsed.animation)?parsed.animation:null;
 }catch(_){return null;}
}
function parse(text,frameCount){
 const count=Math.max(1,Math.min(4096,Math.floor(Number(frameCount)||1)));
 const animation=metadata(text);
 const speed=animation&&finite(animation.frametime)?Math.max(1,Math.min(1200,animation.frametime)):1;
 const frames=[];
 const input=Array.isArray(animation?.frames)?animation.frames:null;
 if(input){
  for(const f of input.slice(0,4096)){
   const index=typeof f==='number'?f:f?.index;
   const time=typeof f==='object'&&finite(f?.time)?f.time:speed;
   if(finite(index)&&index<count)frames.push({index,time:Math.max(1,Math.min(1200,time))});
  }
 }
 if(!frames.length)for(let i=0;i<count;i++)frames.push({index:i,time:speed});
 const totalTicks=frames.reduce((n,x)=>n+x.time,0);
 return Object.freeze({
  frames:Object.freeze(frames.map(f=>Object.freeze(f))),
  totalMs:totalTicks*TICK_MS,interpolate:animation?.interpolate===true
 });
}
function sampleAt(def,elapsed){
 if(!def?.frames?.length)return {index:0,nextIndex:0,blend:0};
 const total=Math.max(TICK_MS,Number(def.totalMs)||TICK_MS);
 let cursor=((Math.max(0,Number(elapsed)||0)%total)+total)%total;
 for(let i=0;i<def.frames.length;i++){
  const f=def.frames[i],duration=f.time*TICK_MS;
  if(cursor<duration){
   return {
    index:f.index,nextIndex:def.frames[(i+1)%def.frames.length].index,
    blend:def.interpolate?Math.max(0,Math.min(1,cursor/duration)):0
   };
  }
  cursor-=duration;
 }
 return {index:def.frames[0].index,nextIndex:def.frames[0].index,blend:0};
}
function indexAt(def,elapsed){return sampleAt(def,elapsed).index;}
function frameDimensions(image,mcmeta){
 if(!image||!Number.isFinite(image.width)||!Number.isFinite(image.height)||image.width<=0||image.height<=0)
  return {size:16,width:16,height:16,columns:1,rows:1,count:1};
 const iw=Math.floor(image.width),ih=Math.floor(image.height);
 const animation=metadata(mcmeta);
 const fallback=Math.min(iw,ih);
 const valid=(n,max)=>Number.isInteger(n)&&n>0&&n<=max&&n<=4096;
 const fw=valid(animation?.width,iw)?animation.width:fallback;
 const fh=valid(animation?.height,ih)?animation.height:
          valid(animation?.width,iw)?animation.width:fallback;
 const columns=Math.max(1,Math.floor(iw/fw)),rows=Math.max(1,Math.floor(ih/fh));
 return {size:fw,width:fw,height:fh,columns,rows,count:Math.min(4096,columns*rows)};
}
function frameRect(image,index,geometry){
 const g=geometry||frameDimensions(image);
 const n=Number.isInteger(index)?Math.max(0,Math.min(g.count-1,index)):0;
 return {x:(n%g.columns)*g.width,y:Math.floor(n/g.columns)*g.height,
         width:g.width,height:g.height};
}
window.MineWorldResourceAnimation=Object.freeze({
 parse,indexAt,sampleAt,frameDimensions,frameRect,TICK_MS
});
})();