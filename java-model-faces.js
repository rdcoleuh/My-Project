/* MineWorld — local Java block-model texture references, no bundled bitmaps.
 * Reads only player-selected minecraft:block JSON; does not render arbitrary
 * geometry, blockstate rotations, or non-cube models.
 */
(()=>{
'use strict';
const clean=s=>typeof s==='string'&&s.length<=160&&/^[a-z0-9_/-]+$/.test(s)&&
 !s.split('/').some(p=>p==='.'||p==='..')?s:null;
const modelPath=ref=>{
 if(typeof ref!=='string')return null;
 const m=ref.match(/^(?:minecraft:)?block\/([a-z0-9_/-]+)$/);
 return m?clean(m[1]):null;
};
const texturePath=ref=>{
 if(typeof ref!=='string')return null;
 const m=ref.match(/^(?:minecraft:)?blocks?\/([a-z0-9_/-]+)$/);
 return m&&clean(m[1])?'block:'+m[1]:null;
};
const SPECIAL=Object.freeze({
 1:'grass_block',5:'oak_log',6:'oak_leaves',11:'oak_planks',
 21:'snow_block',52:'dark_oak_planks',59:'lantern',
 60:'hay_block',63:'pointed_dripstone',66:'lava',
 67:'basalt',75:'crimson_nylium',76:'warped_nylium',
 78:'crimson_stem',80:'warped_stem',86:'bone_block',
 87:'nether_portal',88:'magma_block',89:'soul_fire',
 93:'twisting_vines',94:'weeping_vines',109:'redstone_lamp',
 119:'chest',120:'chest',125:'end_portal_frame',
 132:'purpur_pillar',133:'shulker_box',137:'farmland',
 138:'farmland',155:'composter',156:'blast_furnace',
 157:'smoker',158:'cartography_table',159:'brewing_stand',
 160:'barrel',161:'fletching_table',162:'cauldron',
 163:'lectern',164:'stonecutter',165:'loom',
 166:'smithing_table',167:'grindstone',168:'crafting_table'
});
function nameFor(id,label){
 if(SPECIAL[id])return SPECIAL[id];
 if(typeof label!=='string')return null;
 return clean(label.toLowerCase().trim().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''));
}
// Read the blockstate's default unrotated cube model when a player supplies
// blockstates/*.json. Never infer geometry from rotated or modded variants.
const DEFAULT_STATE=Object.freeze({
 axis:'y',facing:'north',half:'bottom',type:'bottom',snowy:'false',
 waterlogged:'false',lit:'false',open:'false',powered:'false',
 age:'0',level:'0',stage:'0',moisture:'0',layers:'1',
 attachment:'floor',face:'floor',rotation:'0',hinge:'left',
 occupied:'false',enabled:'true',shape:'straight'
});
function stateModel(data){
 const variants=data?.variants;
 if(!variants||typeof variants!=='object'||Array.isArray(variants))return null;
 const choices=Object.entries(variants).filter(([key])=>
  key===''||key.split(',').every(part=>/^[a-z_]+=[a-z0-9_]+$/.test(part)));
 const score=key=>key===''?-1:key.split(',').reduce((sum,part)=>{
  const [name,value]=part.split('=');
  return sum+(DEFAULT_STATE[name]===value?0:DEFAULT_STATE[name]===undefined?2:5);
 },0);
 choices.sort((a,b)=>score(a[0])-score(b[0])||a[0].localeCompare(b[0]));
 for(const [,variant] of choices){
  const candidate=Array.isArray(variant)?variant[0]:variant;
  if(!candidate||typeof candidate!=='object'||Array.isArray(candidate))continue;
  if((candidate.x??0)!==0||(candidate.y??0)!==0)continue;
  const path=modelPath(candidate.model);
  if(path)return path;
 }
 return null;
}
async function resolve(zip,modelName){
 let start=clean(modelName);
 if(!start||!zip?.entries||typeof zip.get!=='function')return null;
 if(zip.entries.has('state:'+start)){
  try{
   const bytes=await zip.get('state:'+start);
   if(bytes&&bytes.length<=131072){
    const preferred=stateModel(JSON.parse(new TextDecoder().decode(bytes)));
    if(preferred&&zip.entries.has('model:'+preferred))start=preferred;
   }
  }catch(_){/* Malformed optional blockstates cannot break texture imports. */}
 }
 if(!zip.entries.has('model:'+start))return null;
 const visited=new Set();
 async function load(name,depth){
  if(!name||depth>12||visited.has(name)||!zip.entries.has('model:'+name))return null;
  visited.add(name);
  let data;
  try{
   const bytes=await zip.get('model:'+name);
   if(!bytes||bytes.length>131072)return null;
   data=JSON.parse(new TextDecoder().decode(bytes));
  }catch(_){return null;}
  if(!data||typeof data!=='object'||Array.isArray(data))return null;
  const parent=modelPath(data.parent);
  const inherited=parent?await load(parent,depth+1):null;
  const textures={...(inherited?.textures||{})};
  if(data.textures&&typeof data.textures==='object'&&!Array.isArray(data.textures))
   for(const [key,value] of Object.entries(data.textures))
    if(clean(key)&&typeof value==='string')textures[key]=value;
  let faces=inherited?.faces||null;
  let fullCube=inherited?.fullCube??true;
  if(Array.isArray(data.elements)){
   const elements=data.elements;
   // A single full-size cube is the only geometry this 3-face atlas can
   // represent faithfully. Other models retain their established fallback.
   fullCube=elements.length===1&&
    JSON.stringify(elements[0]?.from)==='[0,0,0]'&&
    JSON.stringify(elements[0]?.to)==='[16,16,16]'&&
    !elements[0]?.rotation;
   if(fullCube)faces=elements[0].faces||null;
  }
  return {textures,faces,fullCube};
 }
 const data=await load(start,0);
 if(!data||!data.fullCube)return null;
 const follow=ref=>{
  let value=ref;
  const seen=new Set();
  for(let i=0;i<16&&typeof value==='string'&&value.startsWith('#');i++){
   const key=value.slice(1);
   if(!clean(key)||seen.has(key))return null;
   seen.add(key);value=data.textures[key];
  }
  return texturePath(value);
 };
 const field=(dir,keys)=>{
  const exact=data.faces?.[dir]?.texture;
  if(typeof exact==='string')return follow(exact);
  for(const key of keys)if(typeof data.textures[key]==='string'){
   const value=follow('#'+key);if(value)return value;
  }
  return null;
 };
 const top=field('up',['top','up','end','all']);
 const bottom=field('down',['bottom','down','end','all']);
 // Never collapse a directional model's different front/back/side art
 // into one shared atlas tile. The existing directional slots handle those.
 const sides=['north','south','east','west'].map(dir=>field(dir,['side','all']));
 const present=sides.filter(Boolean);
 const side=present.length&&new Set(present).size===1?present[0]:null;
 const allowed=value=>value&&zip.entries.has(value)?value:null;
 const result={top:allowed(top),side:allowed(side),bottom:allowed(bottom)};
 return Object.values(result).some(Boolean)?result:null;
}
window.MineWorldJavaModelFaces=Object.freeze({nameFor,resolve,modelPath,texturePath,stateModel});
})();
