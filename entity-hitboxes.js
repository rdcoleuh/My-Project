/* MineWorld entity collision/hitboxes — Java Edition dimensions, independent code.
 * Ground truth: https://minecraft.wiki/w/Hitbox (Java Edition columns).
 * Boxes are axis-aligned even when the mob visually rotates.
 * No original game assets or proprietary algorithms are included.
 */
(()=>{
'use strict';
// [width, height] in world blocks. Values are Java Edition measurements.
// Cases with custom multipart models or changing animations remain approximate.
const D={
 player:[.6,1.8],cow:[.9,1.4],sheep:[.9,1.3],pig:[.9,.9],
 chicken:[.4,.7],horse:[1.3965,1.6],donkey:[1.3965,1.5],
 mule:[1.3965,1.6],camel:[1.7,2.375],llama:[.9,1.87],
 skeleton_horse:[1.3965,1.6],zombie_horse:[1.3965,1.6],
 rabbit:[.4,.5],wolf:[.6,.85],cat:[.6,.7],ocelot:[.6,.7],
 fox:[.6,.7],goat:[.9,1.3],frog:[.5,.5],turtle:[1.2,.4],
 panda:[1.3,1.25],polar_bear:[1.4,1.4],mooshroom:[.9,1.4],
 bat:[.5,.9],parrot:[.5,.9],bee:[.7,.6],allay:[.35,.6],
 armadillo:[.7,.65],axolotl:[.75,.42],cod:[.5,.3],
 salmon:[.7,.4],tropical_fish:[.5,.4],tadpole:[.4,.3],
 squid:[.8,.8],glow_squid:[.8,.8],dolphin:[.9,.6],
 pufferfish:[.35,.35],nautilus:[.875,.95],zombie_nautilus:[.875,.95],
 sniffer:[1.9,1.75],snow_golem:[.7,1.9],iron_golem:[1.4,2.7],
 villager:[.6,1.95],wandering_trader:[.6,1.95],
 zombie:[.6,1.95],zombie_villager:[.6,1.95],husk:[.6,1.95],
 drowned:[.6,1.95],skeleton:[.6,1.99],stray:[.6,1.99],
 bogged:[.6,1.99],parched:[.6,1.99],creeper:[.6,1.7],
 enderman:[.6,2.9],endermite:[.4,.3],spider:[1.4,.9],
 cave_spider:[.7,.5],blaze:[.6,1.8],ghast:[4,4],
 ghastling:[.95,.95],happy_ghast:[4,4],phantom:[.5,.5],
 hoglin:[1.3965,1.4],zoglin:[1.3965,1.4],strider:[.9,1.7],
 piglin:[.6,1.95],piglin_brute:[.6,1.95],zombified_piglin:[.6,1.95],
 wither_skeleton:[.7,2.4],wither:[.9,3.5],ender_dragon:[16,8],
 shulker:[1,1],silverfish:[.4,.3],slime:[1.0404,1.04],
 magma_cube:[1.0404,1.04],witch:[.6,1.95],
 pillager:[.6,1.95],vindicator:[.6,1.95],evoker:[.6,1.95],
 vex:[.4,.8],guardian:[.85,.85],elder_guardian:[1.9975,1.9975],
 ravager:[1.95,2.2],warden:[.9,2.9],breeze:[.6,1.77],
 creaking:[.9,2.7],skeleton_horseman:[1.3965,1.6]
};
const DATA=Object.freeze(Object.fromEntries(Object.entries(D).map(([k,v])=>[k,Object.freeze(v)])));
const finite=n=>Number.isFinite(n);
function dimensions(kind,baby=false,state=''){
 let [width,height]=DATA[kind]||[.6,1.8];
 if(kind==='player'){
  if(state==='crouching')height=1.5;
  else if(state==='swimming'||state==='gliding')height=.6;
  else if(state==='sleeping'){width=.2;height=.2;}
 }else if(kind==='camel'&&state==='sitting'){width=1;height=.945;}
 else if(kind==='shulker'){height=state==='open'?2:state==='peeking'?1.2:1;}
 else if(kind==='warden'&&(state==='digging'||state==='emerging'))height=1;
 else if(kind==='goat'&&state==='jumping'){width=.63;height=.91;}
 else if(kind==='polar_bear'&&state==='attacking'){width=1;height=2;}
 else if(kind==='pufferfish'){
  const size=state==='full'?.7:state==='half'?.49:.35;
  width=size;height=size;
 }else if(kind==='slime'||kind==='magma_cube'){
  const size=state==='large'?2:state==='small'?.5:1;
  width=(kind==='slime'?1.0404:1.0404)*size;
  height=1.04*size;
 }
 if(baby&&kind!=='player'){width*=.5;height*=.5;}
 return {width,height};
}
function box(entity,kind=entity?.kind||'player'){
 if(!entity||![entity.x,entity.y,entity.z].every(finite))return null;
 const {width,height}=dimensions(kind,!!entity.baby,entity.hitboxState||entity.pose||'');
 const radius=width/2;
 return {minX:entity.x-radius,maxX:entity.x+radius,
  minY:entity.y,maxY:entity.y+height,
  minZ:entity.z-radius,maxZ:entity.z+radius};
}
function intersects(a,b){
 return !!a&&!!b&&a.minX<b.maxX&&a.maxX>b.minX&&
  a.minY<b.maxY&&a.maxY>b.minY&&a.minZ<b.maxZ&&a.maxZ>b.minZ;
}
// Distance along a normalized or non-normalized ray in world meters.
function rayDistance(origin,direction,bounds,maxDistance=Infinity){
 if(!Array.isArray(origin)||!Array.isArray(direction)||!bounds||
  !origin.every(finite)||!direction.every(finite)||!(maxDistance>=0))return null;
 const length=Math.hypot(...direction);
 if(length<1e-8)return null;
 let entry=0,exit=maxDistance;
 for(const [i,min,max] of [[0,bounds.minX,bounds.maxX],[1,bounds.minY,bounds.maxY],[2,bounds.minZ,bounds.maxZ]]){
  const velocity=direction[i]/length;
  if(!finite(min)||!finite(max)||min>=max)return null;
  if(Math.abs(velocity)<1e-10){
   if(origin[i]<min||origin[i]>max)return null;
  }else{
   let a=(min-origin[i])/velocity,b=(max-origin[i])/velocity;
   if(a>b)[a,b]=[b,a];
   entry=Math.max(entry,a);exit=Math.min(exit,b);
   if(entry>exit)return null;
  }
 }
 return entry<=maxDistance?entry:null;
}
function distanceToBox(point,bounds){
 if(!Array.isArray(point)||!point.every(finite)||!bounds)return Infinity;
 const axis=(v,lo,hi)=>v<lo?lo-v:v>hi?v-hi:0;
 return Math.hypot(
  axis(point[0],bounds.minX,bounds.maxX),
  axis(point[1],bounds.minY,bounds.maxY),
  axis(point[2],bounds.minZ,bounds.maxZ));
}
function wireframe(bounds){
 if(!bounds)return [];
 const corners=[
  [bounds.minX,bounds.minY,bounds.minZ],[bounds.maxX,bounds.minY,bounds.minZ],
  [bounds.maxX,bounds.maxY,bounds.minZ],[bounds.minX,bounds.maxY,bounds.minZ],
  [bounds.minX,bounds.minY,bounds.maxZ],[bounds.maxX,bounds.minY,bounds.maxZ],
  [bounds.maxX,bounds.maxY,bounds.maxZ],[bounds.minX,bounds.maxY,bounds.maxZ]
 ];
 const pairs=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
 return pairs.flatMap(([a,b])=>[corners[a],corners[b]]);
}
// World collision test, conservatively checks *all* occupied X/Z columns.
// blockShape(blockId) supplies one existing block collision cuboid.
function canOccupy(entity,blockAt,blockShape,collidable,worldBounds){
 const bounds=box(entity);
 if(!bounds||typeof blockAt!=='function'||typeof blockShape!=='function'||
  typeof collidable!=='function')return false;
 const epsilon=1e-7;
 if(worldBounds&&(bounds.minX<0||bounds.minZ<0||bounds.minY<0||
   bounds.maxX>worldBounds.width||bounds.maxZ>worldBounds.depth||bounds.maxY>worldBounds.height))return false;
 for(let x=Math.floor(bounds.minX);x<=Math.floor(bounds.maxX-epsilon);x++)
  for(let z=Math.floor(bounds.minZ);z<=Math.floor(bounds.maxZ-epsilon);z++)
   for(let y=Math.floor(bounds.minY);y<=Math.floor(bounds.maxY-epsilon);y++){
    const id=blockAt(x,y,z);
    if(!collidable(id))continue;
    const shape=blockShape(id);
    if(intersects(bounds,{
     minX:x+shape.left,maxX:x+shape.right,
     minY:y+shape.bottom,maxY:y+shape.top,
     minZ:z+shape.front,maxZ:z+shape.back
    }))return false;
   }
 return true;
}
window.MineWorldEntityHitboxes=Object.freeze({DATA,dimensions,box,intersects,rayDistance,distanceToBox,wireframe,canOccupy});
})();