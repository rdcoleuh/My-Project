/* MineWorld 6.0 independently coded animal behavior matching broad Java Edition rules.
 * No proprietary game algorithms, geometry, textures or original source included. */
(()=>{
'use strict';
const FOOD={
 cow:['wheat'],sheep:['wheat'],
 pig:['carrot','potato','beetroot'],
 chicken:['wheatSeeds','beetrootSeeds','pumpkinSeeds'],
 horse:['goldenCarrot','goldenApple'],donkey:['goldenCarrot','goldenApple'],mule:[],
 camel:['block:44'],llama:['block:60'],
 skeleton_horse:[],zombie_horse:[]
};
const NATURAL=['cow','sheep','pig','chicken','horse','donkey','llama','camel'];
function habitat(kind,biomeName=''){
 const biome=String(biomeName).toLowerCase();
 if(kind==='camel')return /desert/.test(biome);
 if(kind==='llama')return /mountain|hill|windswept|savanna/.test(biome);
 if(kind==='horse'||kind==='donkey')return /plains|savanna|meadow|field/.test(biome);
 if(['cow','pig','sheep','chicken'].includes(kind))
  return !/desert|ocean|deep|frozen|ice|snowy/.test(biome);
 return false;
}
function pickNatural(biome,seed){
 const preferred=NATURAL.filter(k=>habitat(k,biome));
 if(!preferred.length&&/ocean|river|frozen|ice|snowy|deep|mushroom/.test(String(biome).toLowerCase()))return null;
 const pool=preferred.length?preferred:['cow','sheep','pig','chicken'];
 const weights={cow:3,sheep:3,pig:3,chicken:3,horse:1,donkey:1,llama:1,camel:1};
 const weighted=pool.flatMap(k=>Array(weights[k]).fill(k));
 const t=Math.abs(Math.floor(Number(seed)||0))%weighted.length;
 return weighted[t];
}
function edible(kind,key){return Array.isArray(FOOD[kind])&&FOOD[kind].includes(key)}
function canBreed(a,b){
 return !!a&&!!b&&a.id!==b.id&&a.kind===b.kind&&edible(a.kind,a.foodKey)&&
    !a.baby&&!b.baby&&!a.breedCooldown&&!b.breedCooldown&&a.loveTime>0&&b.loveTime>0;
}
function reactionAfterHit(m,x,z){
 const angle=Math.atan2(m.z-z,m.x-x);
 return {heading:angle,fleeTime:5,anger:0};
}
function following(kind,held,meters){
 return edible(kind,held)&&Number.isFinite(meters)&&meters>1.5&&meters<=6;
}
// Check all occupied vertical voxels, rather than only an animal's feet.
 // The callback receives integer world coordinates and returns true for
 // blocks that physically obstruct the mob; no world or save dependency.
 function canOccupy(x,y,z,height,blocked){
  if(![x,y,z,height].every(Number.isFinite)||height<=0||height>4||y<0||typeof blocked!=='function')return false;
  const X=Math.floor(x),Z=Math.floor(z);
  for(let Y=Math.floor(y);Y<=Math.floor(y+height-.001);Y++){
   if(blocked(X,Y,Z))return false;
  }
  return true;
 }
 function maximum(kind){
 const sizes={cow:1.4,pig:.9,sheep:1.3,chicken:.7,horse:1.6,donkey:1.6,mule:1.6,camel:2.375,llama:1.87,skeleton_horse:1.6,zombie_horse:1.6};
 return sizes[kind]||1;
}
window.MineWorldAnimalBehavior=Object.freeze({FOOD,NATURAL,habitat,pickNatural,edible,canBreed,reactionAfterHit,following,maximum,canOccupy});
})();