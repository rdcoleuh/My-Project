/* MineWorld 5.5 original sandbox interactions; no borrowed game assets.
 * UI-independent operations designed for regression testing on iPhone and desktop. */
(()=>{
 'use strict';
 function pickPlan(mode,block,selected,slots,entries){
   if(!Number.isInteger(block)||block<1||block>169)return {type:'none',reason:'No pickable block'};
   if(!Number.isInteger(selected)||selected<0||selected>8)return {type:'none',reason:'Invalid slot'};
   const key='block:'+block;
   if(mode==='creative'){
     const existing=slots.indexOf(block);
     return existing>=0?{type:'select',slot:existing,key}:{type:'replace',slot:selected,key,block};
   }
   const assigned=slots.findIndex(ref=>entries.some(e=>e.id===ref&&e.key===key&&e.qty>0));
   if(assigned>=0)return {type:'select',slot:assigned,key};
   const found=entries.find(e=>e.key===key&&e.qty>0);
   return found?{type:'equip',slot:selected,id:found.id,key}:{type:'none',reason:'Collect this block in Survival first'};
 }
 function createDrop({key,count,x,y,z,yaw=0,dimension='overworld'}){
   if(!key||!Number.isFinite(count)||count<=0||![x,y,z].every(Number.isFinite))return null;
   return {
     key:String(key),count:Math.min(64,Math.floor(count)),
     x:x+Math.sin(yaw)*.85,y:y+1.1,z:z-Math.cos(yaw)*.85,
     vx:Math.sin(yaw)*2.6,vy:2.8,vz:-Math.cos(yaw)*2.6,
     age:0,delay:.85,dimension
   };
 }
 function advanceDrop(drop,dt,standOn){
   const safe=Math.max(0,Math.min(.05,Number(dt)||0));
   const out={...drop,age:(drop.age||0)+safe,delay:Math.max(0,(drop.delay||0)-safe)};
   if(safe<=0)return out;
   out.x+=(out.vx||0)*safe;out.z+=(out.vz||0)*safe;
   out.vx=(out.vx||0)*Math.max(0,1-safe*2.5);out.vz=(out.vz||0)*Math.max(0,1-safe*2.5);
   const nextY=out.y+(out.vy||0)*safe;
   out.vy=Math.max(-14,(out.vy||0)-22*safe);
   if(standOn?.(out.x,nextY-.09,out.z)&&out.vy<0){out.y=Math.max(out.y,nextY);out.vy=0;}
   else out.y=nextY;
   return out;
 }
 function shouldCollect(drop,player){
   return drop&&drop.delay<=0&&drop.dimension===player.dimension&&
     Math.hypot(drop.x-player.x,drop.z-player.z)<1.4&&
     Math.abs(drop.y-(player.y+.7))<1.65;
 }
 function facing(yaw){
   const a=((Number(yaw)||0)%(2*Math.PI)+2*Math.PI)%(2*Math.PI);
   const compass=['North','Northeast','East','Southeast','South','Southwest','West','Northwest'];
   return compass[Math.round(a/(Math.PI/4))%8];
 }
 function crackLines(target,progress){
   if(!target||progress<=0)return [];
   const stage=Math.min(10,Math.max(1,Math.floor(progress*10)+1));
   const lines=[];
   const add=(a,b)=>lines.push(a,b);
   const x=target.x,y=target.y,z=target.z,e=.007;
   // Newly drawn radial fault network, not Minecraft's break texture.
   // Only thin untextured lines, so no new texture uploads or mesh rebuilds.
   for(let i=0;i<stage;i++){
     const column=i%5,row=Math.floor(i/5);
     const px=x+.12+column*.18,py=y+.21+(row*.31)+((i*3)%4)*.08;
     add([px,py,z-e],[px+.11,py+.12,z-e]);
     add([px+.03,py+.10,z-e],[px+.12,py+.19,z-e]);
     add([px,py,z+1+e],[px+.11,py+.12,z+1+e]);
     add([x-e,py,z+.12+column*.18],[x-e,py+.11,z+.21+column*.18]);
     add([x+1+e,py,z+.12+column*.18],[x+1+e,py+.11,z+.21+column*.18]);
     if(i%2===0)add([px,y+1+e,z+.22+row*.32],[px+.13,y+1+e,z+.33+row*.32]);
   }
   return lines;
 }
 const sanitizeDrop=(d,validKey,width,height)=>{
   if(!d||typeof d!=='object'||!validKey(d.key)||!Number.isFinite(d.x)||!Number.isFinite(d.y)||!Number.isFinite(d.z))return null;
   if(d.x<1||d.x>width-1||d.z<1||d.z>width-1||d.y<.2||d.y>height)return null;
   if(!['overworld','nether','end'].includes(d.dimension))return null;
   const count=Math.floor(Number(d.count));
   if(!Number.isFinite(count)||count<1||count>64)return null;
   return {
     key:d.key,count,x:d.x,y:d.y,z:d.z,
     vx:Number.isFinite(d.vx)?Math.max(-6,Math.min(6,d.vx)):0,
     vy:Number.isFinite(d.vy)?Math.max(-14,Math.min(5,d.vy)):0,
     vz:Number.isFinite(d.vz)?Math.max(-6,Math.min(6,d.vz)):0,
     age:Math.max(0,Math.min(300,Number(d.age)||0)),
     delay:Math.max(0,Math.min(2,Number(d.delay)||0)),dimension:d.dimension
   };
 };
 window.MineWorldClassicInteractions=Object.freeze({pickPlan,createDrop,advanceDrop,shouldCollect,facing,crackLines,sanitizeDrop});
})();