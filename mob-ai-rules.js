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
   const ttl=Math.max(0,last.ttl-Math.max(0,Math.min(.1,Number(dt)||0)));
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
 // Pure visibility and target-selection helpers for callers to opt into.
 function withinSight(a,b,maxDistance=25){
  if(!a||!b||![a.x,a.y,a.z,b.x,b.y,b.z,maxDistance].every(Number.isFinite)||maxDistance<=0)return false;
  const dx=a.x-b.x,dy=a.y-b.y,dz=a.z-b.z;
  return dx*dx+dy*dy+dz*dz<=maxDistance*maxDistance;
 }
 function targetIntent(kind,distance,visible,anger=0,isNight=false){
  if(!Number.isFinite(distance)||distance<0||distance>25||!visible)return 'idle';
  if((kind==='spider'||kind==='cave_spider')&&!spiderAggressive(kind,isNight,anger))return 'idle';
  if(kind==='creeper')return distance<=3?'fuse':'approach';
  if(kind==='skeleton')return distance<5?'retreat':distance<=16?'ranged':'approach';
  return distance<=1.6?'melee':'approach';
 }
 window.MineWorldMobAIRules=Object.freeze({FUSE_SECONDS,creeperTick,spiderAggressive,explosionDamage,pursuitPoint,steerHeading,withinSight,targetIntent});
})();