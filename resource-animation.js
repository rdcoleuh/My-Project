/* MineWorld 6.8 — independent 20-tick-per-second Java-style sprite timeline.
 * Interprets .png.mcmeta from player-supplied resource packs. No art bundled.
 */
(()=>{
'use strict';
const TICK_MS=50;
const finite=n=>Number.isInteger(n)&&n>=0;
function parse(text,frameCount){
 const count=Math.max(1,Math.min(4096,Math.floor(Number(frameCount)||1)));
 let animation=null;
 try{
  const source=typeof text==='string'&&text.length<=131072?JSON.parse(text):null;
  animation=source&&typeof source.animation==='object'&&!Array.isArray(source.animation)?source.animation:null;
 }catch(_){}
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
function frameDimensions(image){
 if(!image||!Number.isFinite(image.width)||!Number.isFinite(image.height)||image.width<=0||image.height<=0)
  return {size:16,count:1};
 const size=Math.min(image.width,image.height);
 return {size,count:Math.max(1,Math.min(4096,Math.floor(image.height/size)))};
}
window.MineWorldResourceAnimation=Object.freeze({parse,indexAt,sampleAt,frameDimensions,TICK_MS});
})();