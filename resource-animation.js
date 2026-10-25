/* MineWorld 6.8 — independently implemented local Java texture frame scheduler.
 * Reads metadata from player-provided assets; no source textures are bundled.
 */
(()=>{
'use strict';
const TICK_MS=50;
const finite=n=>Number.isInteger(n)&&n>=0;
function parse(text,frameCount){
 const count=Math.max(1,Math.min(4096,frameCount|0));
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
  frames:Object.freeze(frames.map(f=>Object.freeze(f))),totalMs:totalTicks*TICK_MS,
  interpolate:animation?.interpolate===true
 });
}
function indexAt(def,elapsed){
 if(!def?.frames?.length)return 0;
 let step=((Math.floor(Math.max(0,Number(elapsed)||0)/TICK_MS)%Math.max(1,def.totalMs/TICK_MS))+Math.max(1,def.totalMs/TICK_MS))%Math.max(1,def.totalMs/TICK_MS);
 for(const f of def.frames){if(step<f.time)return f.index;step-=f.time}
 return def.frames[0].index;
}
function frameDimensions(image){
 if(!image||!Number.isFinite(image.width)||!Number.isFinite(image.height)||image.width<=0||image.height<=0)return {size:16,count:1};
 // Standard Java Edition animated block sprites are vertically stacked squares.
 const size=Math.min(image.width,image.height);
 return {size,count:Math.max(1,Math.min(4096,Math.floor(image.height/size)))};
}
window.MineWorldResourceAnimation=Object.freeze({parse,indexAt,frameDimensions,TICK_MS});
})();