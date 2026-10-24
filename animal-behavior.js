/* MineWorld 6.0 independently coded animal behavior matching broad Java Edition rules.
 * No proprietary game algorithms, geometry, textures or original source included. */
(()=>{
'use strict';
const FOOD={
 cow:['wheat'],sheep:['wheat'],
 pig:['carrot','potato','beetroot'],
 chicken:['wheatSeeds','beetrootSeeds','pumpkinSeeds'],
 horse:['goldenCarrot','goldenApple'],donkey:['goldenCarrot','goldenApple'],mule:[],
 camel:['cactus'],llama:['hayBale'],
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
function maximum(kind){
 const sizes={cow:1.4,pig:.9,sheep:1.3,chicken:.7,horse:1.6,donkey:1.6,mule:1.6,camel:2.375,llama:1.87,skeleton_horse:1.6,zombie_horse:1.6};
 return sizes[kind]||1;
}
window.MineWorldAnimalBehavior=Object.freeze({FOOD,NATURAL,habitat,pickNatural,edible,canBreed,reactionAfterHit,following,maximum});
})();