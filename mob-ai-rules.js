/* MineWorld 6.18 — independent tick functions inspired by Java mob behavior.
 * Creepers warn before exploding. Spiders calm down in daylight unless hurt.
 * Pure functions allow testing without WebGL, saves, or the multiplayer relay.
 */
(()=>{
 'use strict';
 const FUSE_SECONDS=1.5;
 function creeperTick(fuse,dt,close){
   const step=Math.max(0,Math.min(.1,Number(dt)||0));
   const before=Math.max(0,Math.min(FUSE_SECONDS,Number(fuse)||0));
   const next=close?Math.min(FUSE_SECONDS,before+step):Math.max(0,before-step*2);
   return {fuse:next,explode:close&&next>=FUSE_SECONDS};
 }
 function spiderAggressive(kind,isNight,anger){
   return (kind==='spider'||kind==='cave_spider')&&(!!isNight||(Number(anger)||0)>0);
 }
 function explosionDamage(distance,radius=3,base=8){
   if(!(Number.isFinite(distance)&&distance>=0&&Number.isFinite(radius)&&radius>0))return 0;
   if(distance>=radius)return 0;
   return Math.max(1,Math.ceil(base*(1-distance/radius)));
 }
 // Short-lived pursuit keeps a monster searching the last *seen* location
 // when a player rounds a corner; it never grants invisible melee attacks.
 function pursuitPoint(last,visible,dt){
   if(visible&&[visible.x,visible.y,visible.z].every(Number.isFinite))
     return {x:visible.x,y:visible.y,z:visible.z,ttl:2};
   if(!last||![last.x,last.y,last.z,last.ttl].every(Number.isFinite))return null;
   // Pursuit memory is measured in elapsed seconds, not simulation frames.
   // A suspended/mobile tab may resume after several seconds; limiting the
   // decrement to 0.1 kept monsters tracking an already-lost player.
   const elapsed=Math.max(0,Math.min(last.ttl,Number(dt)||0));
   const ttl=last.ttl-elapsed;
   return ttl>0?{x:last.x,y:last.y,z:last.z,ttl}:null;
 }
 // Local collision-aware steering. Check straight ahead first, then bounded
 // sidesteps in a stable left/right order; never scan the entire world.
 // Caller supplies a hitbox + terrain probe so this stays pure and cheap.
 function steerHeading(heading,isOpen,side=1){
   if(!Number.isFinite(heading)||typeof isOpen!=='function')return null;
   const sign=side<0?-1:1;
   const turns=[0,sign*Math.PI/4,-sign*Math.PI/4,
     sign*Math.PI/2,-sign*Math.PI/2,sign*Math.PI*3/4,-sign*Math.PI*3/4,Math.PI];
   for(const turn of turns){
     const candidate=heading+turn;
     if(isOpen(candidate))return candidate;
   }
   return null;
 }
 // Supercover voxel traversal: visit every block touched by the eye ray,
 // including diagonal corner neighbors. Coarse samples could skip a thin wall
 // and let mobs detect or attack players through solid blocks.
 function rayClear(a,b,passable,maxDistance=25){
   if(!a||!b||typeof passable!=='function'||
      ![a.x,a.y,a.z,b.x,b.y,b.z,maxDistance].every(Number.isFinite)||
      maxDistance<=0)return false;
   const start=[a.x,a.y,a.z],finish=[b.x,b.y,b.z];
   const delta=finish.map((v,i)=>v-start[i]);
   const distance=Math.hypot(...delta);
   if(distance<.001||distance>maxDistance)return false;
   const cell=start.map(Math.floor),end=finish.map(Math.floor);
   const step=delta.map(Math.sign);
   const next=delta.map((v,i)=>v>0?(cell[i]+1-start[i])/v:
     v<0?(start[i]-cell[i])/-v:Infinity);
   const interval=delta.map(v=>v===0?Infinity:1/Math.abs(v));
   const faceAxes=[];
   for(let i=0;i<3;i++)if(delta[i]===0&&Number.isInteger(start[i]))faceAxes.push(i);
   function clearCandidate(candidate){
     // Ignore the target's own voxel, but not solid neighbors sharing a
     // stationary face/edge with the ray. Skipping the whole endpoint let
     // mobs see through walls beside the last segment of a face-hugging ray.
     const endpoint=candidate.every((v,i)=>v===end[i]);
     for(let mask=0;mask<(1<<faceAxes.length);mask++){
       if(endpoint&&mask===0)continue;
       const touched=candidate.slice();
       for(let bit=0;bit<faceAxes.length;bit++)
         if(mask&(1<<bit))touched[faceAxes[bit]]--;
       if(!passable(...touched))return false;
     }
     return true;
   }
   // The starting voxel holds the mob's eye, but a solid voxel sharing
   // its stationary face can already block the initial ray segment.
   // Do not probe the mob's own voxel (it may overlap a hitbox).
   if(faceAxes.length){
     for(let mask=1;mask<(1<<faceAxes.length);mask++){
       const touched=cell.slice();
       for(let bit=0;bit<faceAxes.length;bit++)
         if(mask&(1<<bit))touched[faceAxes[bit]]--;
       if(!passable(...touched))return false;
     }
   }
   // Each iteration crosses at least one voxel boundary; no unbounded loop.
   const limit=end.reduce((sum,v,i)=>sum+Math.abs(v-cell[i]),3);
   for(let visit=0;visit<limit;visit++){
     if(cell.every((v,i)=>v===end[i]))return true;
     const t=Math.min(...next);
     if(!Number.isFinite(t)||t>1+1e-10)return false;
     const crossed=[];
     for(let axis=0;axis<3;axis++)if(next[axis]<=t+1e-12)crossed.push(axis);
     // A ray exactly on a stationary voxel face or edge touches cells on
   // both sides. Sampling only floor(position) allowed face-hugging sight
   // through the neighboring solid block, especially on diagonal corridors.
   // Prevent corner-peeking: test every voxel touching a tied boundary.
     for(let mask=1;mask<(1<<crossed.length);mask++){
       const candidate=cell.slice();
       for(let bit=0;bit<crossed.length;bit++)
         if(mask&(1<<bit))candidate[crossed[bit]]+=step[crossed[bit]];
       if(!clearCandidate(candidate))return false;
     }
     for(const axis of crossed){cell[axis]+=step[axis];next[axis]+=interval[axis];}
   }
   return false;
 }
 // Pure visibility and target-selection helpers for callers to opt into.
 function withinSight(a,b,maxDistance=25){
  if(!a||!b||![a.x,a.y,a.z,b.x,b.y,b.z,maxDistance].every(Number.isFinite)||maxDistance<=0)return false;
  const dx=a.x-b.x,dy=a.y-b.y,dz=a.z-b.z;
  return dx*dx+dy*dy+dz*dz<=maxDistance*maxDistance;
 }
 function targetIntent(kind,distance,visible,anger=0,isNight=false){
  if(!Number.isFinite(distance)||distance<0||distance>25||!visible)return 'idle';
  if((kind==='spider'||kind==='cave_spider')&&!spiderAggressive(kind,isNight,anger))return 'idle';
  if(kind==='creeper')return distance<2.8?'fuse':'approach';
  if(['skeleton','stray','pillager'].includes(kind))return distance<5?'retreat':distance<=10?'ranged':'approach';
  return distance<=1.6?'melee':'approach';
 }
 window.MineWorldMobAIRules=Object.freeze({FUSE_SECONDS,creeperTick,spiderAggressive,explosionDamage,pursuitPoint,steerHeading,rayClear,withinSight,targetIntent});
})();