/* MineWorld — local Java model textures and bounded cuboids, no bundled bitmaps.
 * Reads only player-selected minecraft:block JSON. Multi-element or rotated
 * geometry stays on the proven original fallback; simple cuboids are imported.
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
function variantModel(candidate){
 const item=Array.isArray(candidate)?candidate[0]:candidate;
 if(!item||typeof item!=='object'||Array.isArray(item))return null;
 const y=item.y??0;
 // Only Y quarter-turns preserve the current full-cube renderer.
 if((item.x??0)!==0||(item.z??0)!==0||
   !Number.isInteger(y)||![0,90,180,270].includes(y))return null;
 const name=modelPath(item.model);
 return name?{name,y,uvlock:item.uvlock===true}:null;
}
// Match Java multipart predicates against known default states only.
// Ambiguous multipart geometry must keep the existing fallback art.
function matchesDefault(when,depth=0){
 if(when===undefined)return true;
 if(!when||typeof when!=='object'||Array.isArray(when)||depth>5)return false;
 return Object.entries(when).every(([key,value])=>{
  if(key==='OR'||key==='AND'){
   if(!Array.isArray(value)||!value.length||value.length>32)return false;
   return key==='OR'?value.some(v=>matchesDefault(v,depth+1)):
     value.every(v=>matchesDefault(v,depth+1));
  }
  if(!Object.hasOwn(DEFAULT_STATE,key)||typeof value!=='string')return false;
  return value.split('|').some(v=>v===DEFAULT_STATE[key]);
 });
}
function stateVariant(data){
 if(!data||typeof data!=='object'||Array.isArray(data))return null;
 const variants=data.variants;
 if(variants&&typeof variants==='object'&&!Array.isArray(variants)){
  const valid=[];
  for(const [key,value] of Object.entries(variants)){
   if(key===''){valid.push({key,parts:0,value});continue;}
   const pieces=key.split(',');
   if(!pieces.every(part=>/^[a-z_]+=[a-z0-9_]+$/.test(part)))continue;
   if(!pieces.every(part=>{
     const [name,expected]=part.split('=');
     return Object.hasOwn(DEFAULT_STATE,name)&&DEFAULT_STATE[name]===expected;
   }))continue;
   valid.push({key,parts:pieces.length,value});
  }
  // A specific *matching* state wins. Never select a different state just
  // because it happens to be the closest name alphabetically.
  valid.sort((a,b)=>b.parts-a.parts||a.key.localeCompare(b.key));
  for(const choice of valid){
   const picked=variantModel(choice.value);
   if(picked)return picked;
  }
 }
 if(!Array.isArray(data.multipart)||!data.multipart.length||data.multipart.length>128)return null;
 const matching=data.multipart.filter(part=>part&&typeof part==='object'&&
  !Array.isArray(part)&&matchesDefault(part.when));
 if(matching.length!==1)return null;
 return variantModel(matching[0].apply);
}
function stateModel(data){return stateVariant(data)?.name||null;}
async function resolve(zip,modelName){
 let start=clean(modelName),turns=0,uvlock=false;
 if(!start||!zip?.entries||typeof zip.get!=='function')return null;
 if(zip.entries.has('state:'+start)){
  try{
   const bytes=await zip.get('state:'+start);
   if(bytes&&bytes.length<=131072){
    const preferred=stateVariant(JSON.parse(new TextDecoder().decode(bytes)));
    if(preferred&&zip.entries.has('model:'+preferred.name)){
      start=preferred.name;turns=preferred.y/90;uvlock=preferred.uvlock;
    }
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
  let shape=inherited?.shape||null;
  if(Array.isArray(data.elements)){
   const elements=data.elements;
   const el=elements.length===1?elements[0]:null;
   const from=el?.from,to=el?.to;
   const bounds=Array.isArray(from)&&Array.isArray(to)&&from.length===3&&to.length===3&&
    from.every((n,i)=>Number.isFinite(n)&&n>=0&&n<to[i]&&to[i]<=16);
   // A single axis-aligned cuboid can use the existing cube mesh and hitbox.
   // Multi-part, cullface-dependent, angled, and rotated forms need a separate
   // model renderer and must continue using established fallback geometry.
   fullCube=!!bounds&&!el.rotation&&from.every(n=>n===0)&&to.every(n=>n===16);
   shape=null;faces=null;
   if(bounds&&!el.rotation){
    faces=el.faces&&typeof el.faces==='object'&&!Array.isArray(el.faces)?el.faces:null;
    if(!fullCube&&faces&&['up','down','north','south','east','west'].every(
      dir=>faces[dir]&&typeof faces[dir].texture==='string'&&
      Array.isArray(faces[dir].uv)&&faces[dir].uv.length===4&&
      faces[dir].uv.every(n=>Number.isFinite(n)&&n>=0&&n<=16)
    )){
     shape=Object.freeze({left:from[0]/16,bottom:from[1]/16,front:from[2]/16,
      right:to[0]/16,top:to[1]/16,back:to[2]/16});
    }
   }
  }
  return {textures,faces,fullCube,shape};
 }
 const data=await load(start,0);
 if(!data||(!data.fullCube&&!data.shape))return null;
 // A non-cubic shape rotated around Y would require rotated bounds/collision.
 // Leave those cases to the fallback until that rendering path exists.
 if(data.shape&&turns!==0)return null;
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
 const compass=['north','east','south','west'];
 const sourceFace=dir=>{
  const index=compass.indexOf(dir);
  return index<0?dir:compass[(index-turns+4)%4];
 };
 const field=(dir,keys)=>{
  const exact=data.faces?.[sourceFace(dir)]?.texture;
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
 const dirs=['north','south','east','west'];
 if(data.shape){
  // Do not replace geometry unless all six corresponding owned sprites exist.
  // Partial imports must never leave transparent sides or mismatched hitboxes.
  if(!allowed(top)||!allowed(bottom)||!sides.every(allowed))return null;
  result.shape=data.shape;
 }
 const cardinal=Object.fromEntries(dirs.map((dir,i)=>[dir,allowed(sides[i])]));
 if(new Set(Object.values(cardinal).filter(Boolean)).size>1)result.sides=cardinal;
 // Store player-provided full-cube per-face UVs/90-degree rotations. Rendering
 // samples the exact local PNG pixels; the bitmap is never rotated or blurred.
 const faceUV={};
 for(const dir of ['up','down',...dirs]){
  const face=data.faces?.[sourceFace(dir)];
  if(!face||typeof face!=='object')continue;
  const baseRotation=face.rotation??0,uv=face.uv;
  const modelTurn=!uvlock&&dir==='up'?turns*90:
     !uvlock&&dir==='down'?((4-turns)%4)*90:0;
  const rotation=(baseRotation+modelTurn)%360;
  if(!Number.isInteger(baseRotation)||![0,90,180,270].includes(baseRotation))continue;
  if(uv!==undefined&&(!Array.isArray(uv)||uv.length!==4||
   !uv.every(n=>Number.isFinite(n)&&n>=0&&n<=16)))continue;
  if(rotation||uv)faceUV[dir]={rotation,uv:uv?[...uv]:[0,0,16,16]};
 }
 if(Object.keys(faceUV).length)result.faceUV=faceUV;
 return result.sides||Object.values(result).some(Boolean)?result:null;
}
window.MineWorldJavaModelFaces=Object.freeze({nameFor,resolve,modelPath,texturePath,stateModel,stateVariant});
})();
