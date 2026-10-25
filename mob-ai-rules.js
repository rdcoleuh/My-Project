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
 window.MineWorldMobAIRules=Object.freeze({FUSE_SECONDS,creeperTick,spiderAggressive,explosionDamage});
})();