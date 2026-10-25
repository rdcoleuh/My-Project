/* Original MineWorld dropped-item visuals, inspired by Minecraft Wiki's
 * Item (entity) description.  Does not embed or copy any Minecraft assets.
 * Motion never mutates physics or world-save positions.
 */
(()=>{
'use strict';
function copies(count){
 const n=Math.max(1,Math.floor(Number(count)||1));
 return n===1?1:n<=16?2:n<=32?3:n<=48?4:5;
}
function phase(drop){
 if(!drop)return 0;
 const x=Number(drop.x)||0,z=Number(drop.z)||0;
 const n=Math.sin(x*12.9898+z*78.233)*43758.5453;
 return (n-Math.floor(n))*Math.PI*2;
}
function pose(drop,time){
 const t=Number.isFinite(time)?time:0;
 const p=phase(drop);
 return {
  angle:t+p,
  bob:.1625+.1*Math.sin(2*t+p),
  count:copies(drop?.count)
 };
}
function offset(index,drop){
 if(index===0)return {x:0,y:0,z:0};
 const p=phase(drop),n=index+1;
 // Deterministic stack offsets; no random jumping from frame to frame.
 const hx=Math.sin(p+n*12.18)*437.1,hz=Math.sin(p+n*37.71)*835.4;
 const fract=v=>v-Math.floor(v);
 return {x:(fract(hx)-.5)*.16,y:(fract(hx+hz)-.5)*.12,
  z:(fract(hz)-.5)*.16};
}
function mergeNearby(items,limitFor){
 if(!Array.isArray(items)||typeof limitFor!=='function')return 0;
 let removed=0;
 for(let i=0;i<items.length;i++){
  const a=items[i];
  if(!a||!Number.isInteger(a.count)||a.count<1)continue;
  const capacity=Math.max(1,Math.min(64,Number(limitFor(a.key))||64));
  for(let j=items.length-1;j>i;j--){
   const b=items[j];
   if(!b||a.key!==b.key||a.dimension!==b.dimension||
      !Number.isInteger(b.count)||b.count<1||
      Math.abs(a.x-b.x)>.6||Math.abs(a.y-b.y)>.5||
      Math.abs(a.z-b.z)>.6)continue;
   const count=Math.min(capacity-a.count,b.count);
   if(count<=0)continue;
   a.count+=count;b.count-=count;
   // Java preserves the oldest remaining lifetime when stacks merge.
   a.age=Math.min(a.age||0,b.age||0);
   a.delay=Math.max(a.delay||0,b.delay||0);
   if(b.count===0){items.splice(j,1);removed++;}
  }
 }
 return removed;
}
window.MineWorldDroppedVisuals=Object.freeze({copies,phase,pose,offset,mergeNearby});
})();