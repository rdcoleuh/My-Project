/* MineWorld — player-supplied Java Edition resource ZIP/JAR importer.
 * Reads PNG files locally without uploading or redistributing them.
 * An explicit opt-in may store the chosen ZIP/JAR in private browser IndexedDB.
 * No Minecraft bitmaps or third-party assets are bundled in this repository.
 */
(()=>{
'use strict';
const META=window.MineWorldResourcePackContext;
if(!META||!META.gl||!META.texture||!META.baseURL){
 console.warn('MineWorld local resource packs require an initialized WebGL atlas');
 return;
}
const atlasW=256,atlasH=1024,tilePx=16;
const packStorage=window.MineWorldPackStorage;
const coverageCallbacks=[];
let manualImportStarted=false;
let restoreTask=Promise.resolve();
const defaultStatusListeners=[];
function notifyDefaultStatus(){for(const cb of defaultStatusListeners)try{cb();}catch(e){console.warn('Texture status panel:',e)}}
const mappings=new Map();
const bind=(id,top,side=top,bottom=side)=>mappings.set(id,[top,side,bottom]);
for(const [id,tex] of Object.entries({
 2:'dirt',3:'stone',4:'sand',6:'oak_leaves',7:'water_still',8:'bricks',9:'glass',
 10:'glowstone',11:'oak_planks',16:'rose_bush_top',17:'red_mushroom',
 18:'coal_ore',19:'iron_ore',20:'furnace_front',21:'snow',22:'ice',
 23:'packed_ice',24:'sandstone',25:'terracotta',26:'red_sand',27:'red_terracotta',
 28:'podzol_top',29:'coarse_dirt',31:'spruce_leaves',33:'birch_leaves',
 35:'acacia_leaves',37:'jungle_leaves',39:'mangrove_leaves',41:'cherry_leaves',
 43:'pale_oak_leaves',44:'cactus_side',45:'bamboo_stalk',46:'moss_block',
 47:'mud',48:'red_mushroom_block',49:'brown_mushroom_block',50:'netherrack',
 51:'obsidian',52:'dark_oak_planks',53:'stone_bricks',54:'chiseled_sandstone',
 55:'prismarine',56:'copper_block',57:'clay',58:'deepslate',59:'lantern',
 60:'hay_block_side',61:'cobblestone',62:'glow_lichen',63:'pointed_dripstone',
 64:'sculk',65:'netherrack',66:'lava_still',67:'basalt_side',68:'blackstone',
 69:'polished_blackstone',70:'soul_sand',71:'soul_soil',72:'nether_bricks',
 73:'nether_wart_stage2',74:'chiseled_nether_bricks',75:'crimson_nylium',
 76:'warped_nylium',77:'crimson_roots',78:'crimson_stem',
 79:'nether_wart_block',80:'warped_stem',81:'warped_wart_block',
 82:'warped_roots',83:'nether_quartz_ore',84:'nether_gold_ore',
 85:'ancient_debris_side',86:'bone_block_side',87:'nether_portal',
 88:'magma',89:'soul_fire_0',90:'shroomlight',91:'gilded_blackstone',
 92:'gravel',93:'twisting_vines',94:'weeping_vines',
 95:'copper_ore',96:'gold_ore',97:'redstone_ore',98:'lapis_ore',
 99:'diamond_ore',100:'emerald_ore',101:'deepslate_coal_ore',
 102:'deepslate_iron_ore',103:'deepslate_copper_ore',
 104:'deepslate_gold_ore',105:'deepslate_redstone_ore',
 106:'deepslate_lapis_ore',107:'deepslate_diamond_ore',
 108:'deepslate_emerald_ore',109:'redstone_lamp_on',
 110:'lapis_block',111:'emerald_block',112:'diamond_block',
 113:'copper_block',114:'gold_block',115:'iron_block',116:'coal_block',
 117:'redstone_block',118:'raw_mineral_crate_side',119:'chest_front',
 120:'chest_front',121:'end_stone',122:'chorus_plant',
 123:'chorus_flower',124:'end_crystal',125:'end_portal_frame_side',
 126:'end_portal',127:'end_gateway',128:'end_rod',129:'dragon_egg',
 130:'end_stone_bricks',131:'purpur_block',132:'purpur_pillar',
 133:'shulker_box',134:'dragon_head',135:'netherite_block',
 136:'smithing_table_front',137:'farmland',138:'farmland_moist',
 139:'wheat_stage0',140:'wheat_stage2',141:'wheat_stage4',
 142:'wheat_stage7',143:'carrots_stage0',144:'carrots_stage1',
 145:'carrots_stage2',146:'carrots_stage3',147:'potatoes_stage0',
 148:'potatoes_stage1',149:'potatoes_stage2',150:'potatoes_stage3',
 151:'beetroots_stage0',152:'beetroots_stage1',153:'beetroots_stage2',
 154:'beetroots_stage3',155:'composter_side',156:'blast_furnace_front',
 157:'smoker_front',158:'cartography_table_side1',
 159:'brewing_stand',160:'barrel_side',161:'fletching_table_front',
 162:'cauldron_side',163:'lectern_front',164:'stonecutter_side',
 165:'loom_front',166:'smithing_table_front',167:'grindstone_side',
 168:'crafting_table_front',169:'red_bed_top'
})){bind(Number(id),tex);}
bind(1,'grass_block_top','grass_block_side','dirt');
for(const [id,stem,leaf] of [
 [5,'oak_log','oak_log_top'],[15,'poplar_log','poplar_log_top'],
 [30,'spruce_log','spruce_log_top'],[32,'birch_log','birch_log_top'],
 [34,'acacia_log','acacia_log_top'],[36,'jungle_log','jungle_log_top'],
 [38,'mangrove_log','mangrove_log_top'],[40,'cherry_log','cherry_log_top'],
 [42,'pale_oak_log','pale_oak_log_top'],[78,'crimson_stem','crimson_stem_top'],
 [80,'warped_stem','warped_stem_top']
])bind(id,leaf,stem,leaf);
bind(28,'podzol_top','podzol_side','dirt');
bind(20,'furnace_top','furnace_front','furnace_top');
bind(24,'sandstone_top','sandstone','sandstone_bottom');
bind(54,'sandstone_top','chiseled_sandstone','sandstone_bottom');
bind(58,'deepslate_top','deepslate','deepslate_top');
bind(44,'cactus_top','cactus_side','cactus_bottom');
bind(56,'copper_block','copper_block','copper_block');
bind(60,'hay_block_top','hay_block_side','hay_block_top');
bind(67,'basalt_top','basalt_side','basalt_top');
bind(75,'crimson_nylium','crimson_nylium_side','netherrack');
bind(76,'warped_nylium','warped_nylium_side','netherrack');
bind(85,'ancient_debris_top','ancient_debris_side','ancient_debris_top');
bind(86,'bone_block_top','bone_block_side','bone_block_top');
bind(118,'raw_mineral_crate_top','raw_mineral_crate_side','raw_mineral_crate_bottom');
bind(125,'end_portal_frame_top','end_portal_frame_side','end_stone');
bind(132,'purpur_pillar_top','purpur_pillar','purpur_pillar_top');
bind(136,'smithing_table_top','smithing_table_front','smithing_table_bottom');
bind(137,'farmland','dirt','dirt');
bind(138,'farmland_moist','dirt','dirt');
bind(155,'composter_top','composter_side','composter_bottom');
bind(156,'blast_furnace_top','blast_furnace_front','blast_furnace_top');
bind(157,'smoker_top','smoker_front','smoker_bottom');
bind(158,'cartography_table_top','cartography_table_side1','dark_oak_planks');
bind(160,'barrel_top','barrel_side','barrel_bottom');
bind(161,'fletching_table_top','fletching_table_front','birch_planks');
bind(162,'cauldron_top','cauldron_side','cauldron_bottom');
bind(163,'lectern_top','lectern_front','oak_planks');
bind(164,'stonecutter_top','stonecutter_side','stonecutter_bottom');
bind(165,'loom_top','loom_front','loom_bottom');
bind(166,'smithing_table_top','smithing_table_front','smithing_table_bottom');
bind(167,'grindstone_round','grindstone_side','grindstone_pivot');
bind(168,'crafting_table_top','crafting_table_front','oak_planks');
bind(169,'red_bed_top','red_bed_side','red_bed_bottom');

function normalize(s){return String(s||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');}
const names=window.MineWorldBlockGuide?.names||[];
const aliases={
 // Bedrock texture packs (including .mcpack) often use legacy names.
 // Only map existing player-supplied PNGs; do not download or bundle any.
 cherry_log:['cherry_log_side'],cherry_log_top:['cherry_log_top'],
 mangrove_log:['mangrove_log_side'],mangrove_log_top:['mangrove_log_top'],
 pale_oak_log:['pale_oak_log_side'],
 grass_block_top:['grass_top'],grass_block_side:['grass_side'],grass_block_side_overlay:['grass_side_overlay'],
 red_bed_top:['bed_top'],red_bed_side:['bed_side'],red_bed_bottom:['bed_bottom'],
 oak_log:['log_oak','log'],oak_log_top:['log_oak_top','log_top'],oak_planks:['planks_oak','planks'],oak_leaves:['leaves_oak','leaves'],
 spruce_log:['log_spruce'],spruce_log_top:['log_spruce_top'],spruce_leaves:['leaves_spruce'],spruce_planks:['planks_spruce'],
 birch_log:['log_birch'],birch_log_top:['log_birch_top'],birch_leaves:['leaves_birch'],birch_planks:['planks_birch'],
 jungle_log:['log_jungle'],jungle_log_top:['log_jungle_top'],jungle_leaves:['leaves_jungle'],jungle_planks:['planks_jungle'],
 acacia_log:['log_acacia'],acacia_log_top:['log_acacia_top'],acacia_leaves:['leaves_acacia'],acacia_planks:['planks_acacia'],
 dark_oak_log:['log_big_oak'],dark_oak_log_top:['log_big_oak_top'],dark_oak_planks:['planks_big_oak'],dark_oak_leaves:['leaves_big_oak'],
 stone_bricks:['stonebrick'],bricks:['brick'],nether_bricks:['nether_brick'],sandstone:['sandstone_normal']
};
// Legacy Java Edition (pre-flattening) filenames. Match player-owned older
// client JARs without renaming their assets or bundling any original artwork.
// Modern names always win because resolveName() tries the canonical key first.
Object.assign(aliases,{
 furnace_front:['furnace_front_off'],
 blast_furnace_front:['blast_furnace_front_off'],
 smoker_front:['smoker_front_off'],
 water_still:['water_still_grey'],
 lava_still:['lava_still'],
 chiseled_nether_bricks:['chiseled_nether_brick'],
 crafting_table_top:['workbench_top'],
 crafting_table_front:['workbench_front'],
 crafting_table_side:['workbench_side'],
 packed_ice:['ice_packed'],
 terracotta:['hardened_clay'],
 red_terracotta:['hardened_clay_stained_red'],
 red_sand:['sand_red'],
 coarse_dirt:['dirt_coarse'],
 podzol_top:['dirt_podzol_top'],
 podzol_side:['dirt_podzol_side'],
 red_mushroom:['mushroom_red'],
 red_mushroom_block:['mushroom_block_skin_red'],
 brown_mushroom_block:['mushroom_block_skin_brown'],
 chiseled_sandstone:['sandstone_carved'],
 prismarine:['prismarine_rough'],
 nether_quartz_ore:['quartz_ore'],
 nether_wart_stage2:['nether_wart_stage_2'],
 end_stone_bricks:['end_bricks'],
 nether_portal:['portal'],
 red_wool:['wool_colored_red'],
 farmland:['farmland_dry'],
 farmland_moist:['farmland_wet'],
 wheat_stage0:['wheat_stage_0','crops_0'],
 wheat_stage2:['wheat_stage_2','crops_2'],
 wheat_stage4:['wheat_stage_4','crops_4'],
 wheat_stage7:['wheat_stage_7','crops_7'],
 carrots_stage0:['carrots_stage_0'],
 carrots_stage1:['carrots_stage_1'],
 carrots_stage2:['carrots_stage_2'],
 carrots_stage3:['carrots_stage_3'],
 potatoes_stage0:['potatoes_stage_0'],
 potatoes_stage1:['potatoes_stage_1'],
 potatoes_stage2:['potatoes_stage_2'],
 potatoes_stage3:['potatoes_stage_3'],
 beetroots_stage0:['beetroots_stage_0'],
 beetroots_stage1:['beetroots_stage_1'],
 beetroots_stage2:['beetroots_stage_2'],
 beetroots_stage3:['beetroots_stage_3']
});
// Bedrock Samples uses several different filenames from Java Edition.
// These are verified against Mojang/bedrock-samples' public resource_pack
// filename index. Java canonical names and existing legacy aliases win.
// Do not include, embed, fetch, or redistribute any actual texture bytes.
const bedrockSampleAliases={
 oak_leaves:['leaves_oak_opaque'],
 spruce_leaves:['leaves_spruce_opaque'],
 birch_leaves:['leaves_birch_opaque'],
 acacia_leaves:['leaves_acacia_opaque'],
 jungle_leaves:['leaves_jungle_opaque'],
 mangrove_leaves:['mangrove_leaves_opaque'],
 pale_oak_leaves:['pale_oak_leaves_opaque'],
 rose_bush_top:['double_plant_rose_top'],
 grass_block_side:['grass_side_carried'],
 bamboo_stalk:['bamboo_stem'],
 pointed_dripstone:['pointed_dripstone_down_tip'],
 crimson_nylium:['crimson_nylium_top'],
 warped_nylium:['warped_nylium_top'],
 crimson_stem:['crimson_log_side'],
 crimson_stem_top:['crimson_log_top'],
 twisting_vines:['twisting_vines_base'],
 end_portal_frame_side:['endframe_side'],
 end_portal_frame_top:['endframe_top'],
 shulker_box:['shulker_top_undyed'],
 fletching_table_front:['fletcher_table_side1'],
 fletching_table_top:['fletcher_table_top'],
 red_bed_top:['bed_head_top'],
 red_bed_side:['bed_head_side'],
 red_bed_bottom:['bed_head_end']
};
for(const [key,variants] of Object.entries(bedrockSampleAliases)){
 aliases[key]=[...new Set([...(aliases[key]||[]),...variants])];
}
function textureName(id,face){
 const def=mappings.get(id);
 return def?def[face]:(normalize(names[id])||null);
}
function readArchive(buffer){
 if(!(buffer instanceof ArrayBuffer))throw Error('Expected ZIP data');
 if(buffer.byteLength>240*1024*1024)throw Error('Choose a resource ZIP/JAR smaller than 240 MB. Large packs may need a desktop browser.');
 const v=new DataView(buffer),len=buffer.byteLength;
 const u16=p=>v.getUint16(p,true),u32=p=>v.getUint32(p,true);
 let eocd=-1;
 for(let p=len-22;p>=Math.max(0,len-65557);p--){
   if(u32(p)===0x06054b50){eocd=p;break;}
 }
 if(eocd<0)throw Error('Not a ZIP or Java JAR archive.');
 const number=u16(eocd+10),offset=u32(eocd+16);
 if(number===65535||offset===0xffffffff)throw Error('ZIP64 not supported for this experiment.');
 if(number>55000)throw Error('This ZIP has more than 55,000 entries. Select only a resource-pack or client JAR.');
 let p=offset;
 const found=new Map(),ranked=new Map(),decoder=new TextDecoder();
 // Prefer vanilla namespace and modern block/ over legacy blocks/ regardless
 // of archive entry order. Equal-priority duplicates keep the first entry.
 const keep=(key,entry,priority)=>{
   if((ranked.get(key)??-1)>=priority)return;
   found.set(key,entry);ranked.set(key,priority);
 };
 for(let i=0;i<number;i++){
   if(p+46>len||u32(p)!==0x02014b50)throw Error('Invalid ZIP central directory.');
   const method=u16(p+10),size=u32(p+20),expanded=u32(p+24),nlen=u16(p+28),extra=u16(p+30),comment=u16(p+32),local=u32(p+42);
   const end=p+46+nlen+extra+comment;
   if(end>len)throw Error('Truncated ZIP entry.');
   const path=decoder.decode(new Uint8Array(buffer,p+46,nlen)).replace(/\\/g,'/').toLowerCase();
   // Only import Minecraft's own namespace. Modded jars can contain
   // assets/othermod/textures/block/stone.png; matching its trailing
   // filename would silently replace the real vanilla stone texture.
   // Plain textures/ ZIP roots remain supported for hand-made packs.
   const namespace=path.match(/(?:^|\/)assets\/minecraft\/(.+)$/);
   // Mojang's official Bedrock Samples full ZIP contains a resource_pack/
   // directory, sometimes nested under a release folder. Parse its sprites
   // directly rather than forcing players to repackage copyrighted files.
   const bedrock=path.match(/(?:^|\/)resource_pack\/((?:textures|sounds|entity)\/.+)$/);
   const relative=namespace?namespace[1]:bedrock?bedrock[1]:
     (/^(?:textures|sounds|entity|models\/block|blockstates)\//.test(path)?path:null);
   // Bedrock also stores valid block PNGs in folders such as deepslate/.
   // Keep the PNG's basename as the lookup key, with top-level art taking
   // precedence over nested variants when both exist.
   const match=relative?.match(/^textures\/(?:block|blocks)\/(?:[a-z0-9_-]+\/)*([a-z0-9_]+)\.png$/);
   const blockPath=relative?.match(/^textures\/(?:block|blocks)\/([a-z0-9_/-]+)\.png$/);
   const blockMetaPath=relative?.match(/^textures\/(?:block|blocks)\/([a-z0-9_/-]+)\.png\.mcmeta$/);
   const modelPath=relative?.match(/^models\/block\/([a-z0-9_/-]+)\.json$/);
   const blockstatePath=relative?.match(/^blockstates\/([a-z0-9_/-]+)\.json$/);
   const item=relative?.match(/^textures\/(?:item|items)\/(?:[a-z0-9_-]+\/)*([a-z0-9_]+)\.png$/);
   const entity=relative?.match(/^textures\/entity\/([a-z0-9_-]+(?:\/[a-z0-9_-]+)*)\.png$/);
   const entityDefinition=relative?.match(/^entity\/([a-z0-9_-]+)\.entity\.json$/);
   const matchSound=relative?.match(/^sounds\/([a-z0-9_./-]+)\.ogg$/);
   const matchMeta=relative?.match(/^textures\/(?:block|blocks)\/(?:[a-z0-9_-]+\/)*([a-z0-9_]+)\.png\.mcmeta$/);
   const mapColor=relative?.match(/^textures\/colormap\/(grass|foliage)\.png$/);
   const bedrockFlipbook=relative==='textures/flipbook_textures.json';
   const priority=(namespace?8:0)+(bedrock?4:0)+
     (relative?.startsWith('textures/block/')?2:0)+
     (relative&&!/^textures\/(?:block|blocks|item|items)\/[^/]+\//.test(relative)?1:0);
   if(match&&size<4*1024*1024&&expanded<6*1024*1024&&(method===0||method===8)){
     const entry={method,size,expanded,local};
     keep(match[1],entry,priority);
     if(blockPath)keep('block:'+blockPath[1],entry,priority);
   }
   if(item&&size<4*1024*1024&&expanded<6*1024*1024&&(method===0||method===8))
     keep('item:'+item[1],{method,size,expanded,local},priority);
   if(entity&&size<4*1024*1024&&expanded<6*1024*1024&&(method===0||method===8))
     keep('entity:'+entity[1],{method,size,expanded,local},priority);
   if(entityDefinition&&size<131072&&expanded<131072&&(method===0||method===8))
     keep('entity-def:'+entityDefinition[1],{method,size,expanded,local},priority);
   if(matchMeta&&size<131072&&expanded<131072&&(method===0||method===8)){
     const entry={method,size,expanded,local};
     keep('meta:'+matchMeta[1],entry,priority);
     if(blockMetaPath)keep('meta:block:'+blockMetaPath[1],entry,priority);
   }
   if(modelPath&&size<131072&&expanded<131072&&(method===0||method===8))
     keep('model:'+modelPath[1],{method,size,expanded,local},priority);
   if(blockstatePath&&size<131072&&expanded<131072&&(method===0||method===8))
     keep('state:'+blockstatePath[1],{method,size,expanded,local},priority);
   if(bedrockFlipbook&&size<256*1024&&expanded<256*1024&&(method===0||method===8))
     keep('bedrock:flipbook',{method,size,expanded,local},priority);
   if(mapColor&&size<4*1024*1024&&expanded<4*1024*1024&&(method===0||method===8))
     keep('colormap:'+mapColor[1],{method,size,expanded,local},priority);
   if(matchSound&&size<4*1024*1024&&expanded<4*1024*1024&&(method===0||method===8))
     keep('sound:'+matchSound[1],{method,size,expanded,local},priority);
   p=end;
 }
 return {
   entries:found,
   async get(name){
     const e=found.get(name);if(!e)return null;
     if(e.local+30>len||u32(e.local)!==0x04034b50)throw Error('ZIP entry has invalid local header.');
     const pos=e.local+30+u16(e.local+26)+u16(e.local+28);
     if(pos+e.size>len)throw Error('Incomplete compressed image.');
     const compressed=new Uint8Array(buffer,pos,e.size);
     if(e.method===0)return compressed.slice();
     if(typeof DecompressionStream!=='function')throw Error('This browser needs DecompressionStream support (Safari 16.4+).');
     const stream=new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
     // Stream with a hard cap: ZIP length headers are untrusted and may underreport expansion.
     const reader=stream.getReader(),chunks=[];let count=0;
     const max=Math.min(6*1024*1024,Math.max(1,e.expanded+1024));
     try{
       while(true){
         const packet=await reader.read();if(packet.done)break;
         count+=packet.value.byteLength;
         if(count>max){await reader.cancel();throw Error('Compressed resource expands beyond the safe limit.');}
         chunks.push(packet.value);
       }
     }finally{reader.releaseLock();}
     const bytes=new Uint8Array(count);let at=0;
     for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length;}
     return bytes;
   }
 };
}
function imageFromPng(bytes){
 if(bytes.length<24||bytes[0]!==137||bytes[1]!==80||bytes[2]!==78||bytes[3]!==71)
   return Promise.reject(new Error('Unexpected non-PNG texture.'));
 return new Promise((resolve,reject)=>{
   const url=URL.createObjectURL(new Blob([bytes],{type:'image/png'}));
   const image=new Image();
   image.onload=()=>{URL.revokeObjectURL(url);resolve(image);};
   image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Cannot decode PNG texture.'));};
   image.src=url;
 });
}
function imageFromURL(src){
 return new Promise((resolve,reject)=>{
   const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Could not restore original textures.'));
   im.src=src;
 });
}
const DEFAULT_GRASS=[145,189,89],DEFAULT_FOLIAGE=[119,171,47];
const state={active:false,canvas:null,sourceName:'',lastResult:null,
  tint:{grass:DEFAULT_GRASS.slice(),foliage:DEFAULT_FOLIAGE.slice()},
 animations:[],importedFaces:new Set(),animationStart:0,lastAnimationAt:-Infinity,animationDisabled:false,originalImage:null,tilePixels:16,
 itemArchive:null,itemCache:new Map(),itemGeneration:0};
async function writeAtlas(canvas){
 const gl=META.gl;
 if(typeof gl.isContextLost==='function'&&gl.isContextLost())throw Error('The graphics context was lost.');
 gl.activeTexture(gl.TEXTURE0);
 gl.bindTexture(gl.TEXTURE_2D,META.texture);
 gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
 // Change UV centers only after the atlas upload was accepted by the GPU.
 const tileSize=canvas.width/16;
 if(tileSize===16||tileSize===32){
   window.MineWorldAtlas?.setTilePixels?.(tileSize);
   state.tilePixels=tileSize;
 }
 // Preserve Smooth/Classic preference after importing, restoring or reloading a pack.
 window.MineWorldTextureSmoothing?.apply(gl,META.texture);
 window.MineWorldAtlas.dataURL=canvas.toDataURL('image/png');
 state.canvas=canvas;
}
function baseCanvas(){
 const canvas=document.createElement('canvas');canvas.width=atlasW;canvas.height=atlasH;
 const ctx=canvas.getContext('2d',{alpha:true});
 if(!ctx)throw Error('Canvas 2D is not supported.');
 ctx.imageSmoothingEnabled=false;
 return [canvas,ctx];
}
// Vanilla Java grass/selected leaf sprites ship as greyscale masks. The
// game colors them at render time; apply a neutral plains tint to locally
// imported neutral sprites, but never recolor already-colored custom artwork.
function tintNeutralSprite(ctx,x,y,id,face,palette=state.tint,size=16){
 if(typeof ctx.getImageData!=='function'||typeof ctx.putImageData!=='function')return false;
 const foliage={6:palette.foliage,31:[97,153,97],33:[128,167,85],35:palette.foliage,37:palette.foliage,39:palette.foliage};
 const tint=id===1?palette.grass:id===7?[63,118,228]:foliage[id];
 if(!tint||(id===1&&face!==0))return false;
 const height=id===1&&face===1?Math.round(size*5/16):size;
 const data=ctx.getImageData(x,y,size,height);
 let grey=0,visible=0;
 for(let i=0;i<data.data.length;i+=4){
  const a=data.data[i+3];if(!a)continue;visible++;
  const r=data.data[i],g=data.data[i+1],b=data.data[i+2];
  if(Math.max(r,g,b)-Math.min(r,g,b)<=18)grey++;
 }
 if(visible<16||grey/visible<.65)return false;
 for(let i=0;i<data.data.length;i+=4){
  if(!data.data[i+3])continue;
  const r=data.data[i],g=data.data[i+1],b=data.data[i+2];
  if(Math.max(r,g,b)-Math.min(r,g,b)>18)continue;
  data.data[i]=Math.round(r*tint[0]/255);
  data.data[i+1]=Math.round(g*tint[1]/255);
  data.data[i+2]=Math.round(b*tint[2]/255);
 }
 ctx.putImageData(data,x,y);
 return true;
}
// Java grass uses TWO side layers: an untinted dirt/grass side texture
// plus a separately tinted transparent grass_block_side_overlay.png.
// Tinting the first five rows of the dirt base turns brown dirt green,
// so its base must be left untouched when an actual overlay is available.
function tintOverlayPixels(data,tint){
 if(!data||!tint)return false;
 let neutral=0,opaque=0;
 for(let i=0;i<data.length;i+=4){
   if(data[i+3]===0)continue;
   opaque++;
   if(Math.max(data[i],data[i+1],data[i+2])-Math.min(data[i],data[i+1],data[i+2])<=18)neutral++;
 }
 if(!opaque||neutral/opaque<.65)return false; // Respect deliberately precolored packs.
 for(let i=0;i<data.length;i+=4){
   if(data[i+3]===0)continue;
   if(Math.max(data[i],data[i+1],data[i+2])-Math.min(data[i],data[i+1],data[i+2])>18)continue;
   data[i]=Math.round(data[i]*tint[0]/255);
   data[i+1]=Math.round(data[i+1]*tint[1]/255);
   data[i+2]=Math.round(data[i+2]*tint[2]/255);
 }
 return true;
}
// Draw a frame from a vertical strip or row-major Java .mcmeta spritesheet.
// The decoded texture stays local and is reduced to one 16x16 atlas tile.
function drawPackFrame(ctx,image,geometry,index,alpha=1,dx=0,dy=0,size=16){
 if(!image)return;
 const sourceGeometry=geometry||(typeof window!=='undefined'?window.MineWorldResourceAnimation?.frameDimensions(image):null);
 const rect=(typeof window!=='undefined'&&window.MineWorldResourceAnimation?.frameRect(image,index,sourceGeometry))||
   {x:0,y:0,width:Math.min(image.width,image.height),height:Math.min(image.width,image.height)};
 if(alpha!==1)ctx.globalAlpha=alpha;
 ctx.drawImage(image,rect.x,rect.y,rect.width,rect.height,dx,dy,size,size);
 if(alpha!==1)ctx.globalAlpha=1;
}
function composeGrassSideOverlay(ctx,overlay,x,y,frameIndex=0,nextIndex=frameIndex,blend=0,geometry=null,palette=state.tint,size=16){
 if(!overlay||!ctx)return false;
 const layer=document.createElement('canvas');layer.width=size;layer.height=size;
 const layerCtx=layer.getContext('2d',{alpha:true});
 if(!layerCtx)return false;
 layerCtx.imageSmoothingEnabled=false;
 layerCtx.clearRect(0,0,size,size);
 drawPackFrame(layerCtx,overlay,geometry,frameIndex,1,0,0,size);
 if(blend>0&&nextIndex!==frameIndex)
  drawPackFrame(layerCtx,overlay,geometry,nextIndex,blend,0,0,size);
 if(typeof layerCtx.getImageData==='function'&&typeof layerCtx.putImageData==='function'){
  try{
   const png=layerCtx.getImageData(0,0,size,size);
   if(tintOverlayPixels(png.data,palette.grass))layerCtx.putImageData(png,0,0);
  }catch(_){/* Locked-down browsers still render the untinted original sprite. */}
 }
 // Canvas source-over preserves every transparent pixel and keeps the dirt base intact.
 ctx.drawImage(layer,x,y);
 return true;
}
// Read the actual color-map supplied by the player's Java Edition JAR/ZIP.
// A Java plains biome (temperature .8, downfall .4) picks this pixel.
function samplePlainsColormap(image){
 if(!image||image.width<256||image.height<256)return null;
 const canvas=document.createElement('canvas');canvas.width=1;canvas.height=1;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 if(!ctx||typeof ctx.getImageData!=='function')return null;
 ctx.imageSmoothingEnabled=false;
 const temp=.8,downfall=.4;
 const u=Math.max(0,Math.min(255,Math.floor((1-temp)*255)));
 const v=Math.max(0,Math.min(255,Math.floor((1-temp*downfall)*255)));
 try{
  ctx.drawImage(image,u,v,1,1,0,0,1,1);
  const rgb=ctx.getImageData(0,0,1,1).data;
  return rgb[3]?[rgb[0],rgb[1],rgb[2]]:null;
 }catch(_){return null;}
}
async function readPackTints(zip){
 const palette={grass:DEFAULT_GRASS.slice(),foliage:DEFAULT_FOLIAGE.slice()};
 let sources=0;
 for(const key of ['grass','foliage']){
  const file='colormap:'+key;
  if(!zip.entries.has(file))continue;
  try{
   const image=await imageFromPng(await zip.get(file));
   const tone=samplePlainsColormap(image);
   if(tone){palette[key]=tone;sources++;}
  }catch(e){console.warn('Ignoring invalid Java colormap '+key,e);}
 }
 return {palette,sources};
}
async function applyResources(zip,sourceName){
 if(zip.entries.size===0)throw Error('No compatible block PNGs or sounds were found in the selected files.');
 // Keep the active pack untouched until the replacement contains usable assets.
 const original=await imageFromURL(META.baseURL);
 const importedTints=await readPackTints(zip);
 const [canvas,ctx]=baseCanvas();ctx.drawImage(original,0,0);
 let faces=0,overlaid=0;
 const ids=new Set(),importedFaces=new Set(),cache=new Map(),decoded=new Map(),metaCache=new Map(),missing=new Set(),missingFaces=[],resolved=new Map(),animated=[];
 const timeline=window.MineWorldResourceAnimation;
 const modelResolver=window.MineWorldJavaModelFaces;
 const modelFaces=new Map(),modelTransforms=new Map(),modelShapes=new Map();let modelMappedFaces=0;
 const nativeTiles=[]; // Own pack sprites; never checked in or sent away.
 function markTransform(id,dir){
  const data=modelFaces.get(id)?.faceUV?.[dir];
  if(!data||(window.MineWorldBlockModels?.isPartial?.(id)&&!modelFaces.get(id)?.shape))return;
  if(!modelTransforms.has(id))modelTransforms.set(id,{});
  modelTransforms.get(id)[dir]=data;
 }
 if(modelResolver&&[...zip.entries.keys()].some(key=>key.startsWith('model:'))){
   for(let id=1;id<=169;id++){
     const model=modelResolver.nameFor(id,names[id]);
     if(!model)continue;
     const refs=await modelResolver.resolve(zip,model);
     if(refs){modelFaces.set(id,refs);if(refs.shape)modelShapes.set(id,refs.shape);}
   }
 }
 const bedrock=window.MineWorldBedrockFlipbooks;
 let bedrockEntries=new Map(),bedrockAnimatedFaces=0;
 if(bedrock&&zip.entries.has('bedrock:flipbook')){
   try{
     const bytes=await zip.get('bedrock:flipbook');
     if(bytes&&bytes.length<=256*1024)
       bedrockEntries=bedrock.parse(new TextDecoder().decode(bytes));
   }catch(e){console.warn('Ignoring invalid local Bedrock flipbook metadata:',e);}
 }
 const firstFrame=info=>info?.timeline?.frames?.[0]?.index??0;
 async function spriteTimeline(name,image){
  if(!timeline||!image)return null;
  const resolvedName=resolveName(name),key='meta:'+resolvedName;
  if(!resolvedName)return null;
  if(!zip.entries.has(key)){
    const entry=bedrock?.match?.(bedrockEntries,resolvedName);
    if(!entry)return null;
    const geometry=bedrock.geometry(image,entry);
    if(geometry.count<=1)return null;
    const bedrockTimeline=bedrock.timeline(entry,geometry.count);
    if(!bedrockTimeline)return null;
    bedrockAnimatedFaces++;
    return {timeline:bedrockTimeline,geometry};
  }
  if(!metaCache.has(key)){
   metaCache.set(key,(async()=>{
    try{
     const bytes=await zip.get(key);
     if(!bytes||bytes.length>131072)return null;
     return new TextDecoder().decode(bytes);
    }catch(e){console.warn('Skipping invalid sprite timeline '+key,e);return null;}
   })());
  }
  const text=await metaCache.get(key);
  if(!text)return null;
  const geometry=timeline.frameDimensions(image,text);
  if(geometry.count<=1)return null;
  return {timeline:timeline.parse(text,geometry.count),geometry};
 }
 function resolveName(name){
   if(!name)return null;
   if(!resolved.has(name))resolved.set(name,[name,...(aliases[name]||[])].find(key=>zip.entries.has(key))||null);
   return resolved.get(name);
 }
 async function sprite(name){
   if(!name)return null;
   // An archive can contain a broken modern PNG alongside a valid historical
   // sprite. Try modern first, then independently named legacy/Bedrock aliases.
   // Cache both requests and decoded candidates to avoid decoding shared
   // texture files repeatedly across the 507 block faces.
   if(!cache.has(name)){
     cache.set(name,(async()=>{
       for(const key of new Set([name,...(aliases[name]||[])])){
         if(!zip.entries.has(key))continue;
         if(!decoded.has(key)){
           decoded.set(key,(async()=>{
             try{return await imageFromPng(await zip.get(key));}
             catch(e){console.warn('Skipping unsupported texture '+key,e);return null;}
           })());
         }
         const image=await decoded.get(key);
         if(image){resolved.set(name,key);return image;}
       }
       resolved.set(name,null);
       return null;
     })());
   }
   return cache.get(name);
 }
 for(let id=1;id<=169;id++){
   for(let face=0;face<3;face++){
     const modelFace=modelFaces.get(id)?.[['top','side','bottom'][face]];
     const name=modelFace||textureName(id,face);

     const image=await sprite(name);
     if(image&&modelFace){
      modelMappedFaces++;
      if(face===0)markTransform(id,'up');
      else if(face===2)markTransform(id,'down');
      else if(!modelFaces.get(id)?.sides)
       for(const dir of ['north','south','east','west'])markTransform(id,dir);
     }
     const baseInfo=await spriteTimeline(name,image);
     const column=(id*3+face)%16,row=Math.floor((id*3+face)/16);
     const px=column*16,py=row*16;
     if(image){
       // For animated PNG strips, draw frame zero. Standard 16px files remain pixel-exact.
       ctx.clearRect(px,py,16,16); // Transparent Java sprites must not inherit procedural pixels.
       if(baseInfo)drawPackFrame(ctx,image,baseInfo.geometry,firstFrame(baseInfo),1,px,py);
       else drawPackFrame(ctx,image,null,0,1,px,py);
       tintNeutralSprite(ctx,px,py,id,face,importedTints.palette);
     }else if(name)missing.add(name);
     // Java's side overlay is not itself a block face: it is tinted and
     // blended on top of the untouched grass_block_side.png base.
     const grassSide=id===1&&face===1;
     const overlay=grassSide?await sprite('grass_block_side_overlay'):null;
     const overlayInfo=grassSide?await spriteTimeline('grass_block_side_overlay',overlay):null;
     if(overlay&&composeGrassSideOverlay(ctx,overlay,px,py,firstFrame(overlayInfo),firstFrame(overlayInfo),0,overlayInfo?.geometry,importedTints.palette))overlaid++;
     if(image||overlay){
       faces++;ids.add(id);importedFaces.add(id*3+face);
       nativeTiles.push({id,face,px,py,image,overlay,
         baseGeometry:baseInfo?.geometry,overlayGeometry:overlayInfo?.geometry,
         baseIndex:firstFrame(baseInfo),overlayIndex:firstFrame(overlayInfo)});
     }
     else missingFaces.push({id,face,name:name||'(unmapped)'});
     if(baseInfo||overlayInfo)
      animated.push({id,face,px,py,image,overlay,
       baseTimeline:baseInfo?.timeline,baseGeometry:baseInfo?.geometry,
       overlayTimeline:overlayInfo?.timeline,overlayGeometry:overlayInfo?.geometry,lastKey:''});
   }
 }
 // Extra local Java cube sides retain the model's own north/south/east/west artwork.
 const sideAllocator=window.MineWorldJavaDirectionalFaces;
 const sidePlan=sideAllocator?.plan(modelFaces);
 const mappedSides=new Map(),renderedSideTiles=new Set();let modelDirectionalFaces=0;
 for(const [id,dirs] of sidePlan?.tiles||[]){
  const row={};
  for(const [dir,entry] of Object.entries(dirs)){
   const image=await sprite(entry.name);
   if(!image)continue;
   const px=(entry.tile%16)*16,py=Math.floor(entry.tile/16)*16;
   if(!renderedSideTiles.has(entry.tile)){
    const info=await spriteTimeline(entry.name,image);
    ctx.clearRect(px,py,16,16);
    if(info)drawPackFrame(ctx,image,info.geometry,firstFrame(info),1,px,py);
    else drawPackFrame(ctx,image,null,0,1,px,py);
    nativeTiles.push({id,face:5,px,py,image,overlay:null,
      baseGeometry:info?.geometry,baseIndex:firstFrame(info)});
    if(info)animated.push({id,face:5,px,py,image,overlay:null,
      baseTimeline:info.timeline,baseGeometry:info.geometry,
      overlayTimeline:null,overlayGeometry:null,lastKey:''});
    renderedSideTiles.add(entry.tile);
   }
   row[dir]={tile:entry.tile};modelDirectionalFaces++;
   markTransform(id,dir);
  }
  if(Object.keys(row).length)mappedSides.set(id,row);
 }
 // Eleven reserved atlas tiles can display distinct Java workstation faces.
 // Existing block IDs and the original 507 atlas face slots stay unchanged.
 let directionalFaces=0;
 for(const [block,extra] of Object.entries(window.MineWorldAtlas?.alternateFaces||{})){
   for(const [variantIndex,variant] of [extra,extra.extra].entries()){
     if(!variant)continue;
     const image=await sprite(variant.name);
     if(!image)continue;
     const id=Number(block),px=(variant.tile%16)*16,py=Math.floor(variant.tile/16)*16;
     const info=await spriteTimeline(variant.name,image);
     ctx.clearRect(px,py,16,16);
     if(info)drawPackFrame(ctx,image,info.geometry,firstFrame(info),1,px,py);
     else drawPackFrame(ctx,image,null,0,1,px,py);
     directionalFaces++;ids.add(id);
     nativeTiles.push({id,face:variantIndex===0?3:4,px,py,image,overlay:null,
       baseGeometry:info?.geometry,baseIndex:firstFrame(info)});
     if(info)animated.push({id,face:variantIndex===0?3:4,px,py,image,overlay:null,
       baseTimeline:info.timeline,baseGeometry:info.geometry,
       overlayTimeline:null,overlayGeometry:null,lastKey:''});
   }
 }
 const sounds={
    break:['block/stone/break1','dig/stone1','dig/grass1'],
    place:['block/wood/place1','dig/wood1'],
    step:['block/grass/step1','step/grass1'],
    jump:['entity/player/levelup','random/orb'],
    hurt:['entity/player/hurt1','damage/hit1'],
    attack:['entity/player/attack/sweep1','random/successful_hit'],
    pickup:['entity/item/pickup1','random/pop'],
    click:['ui/button/click','random/click'],
    eat:['entity/generic/eat1','random/eat'],
    splash:['entity/generic/splash','liquid/splash'],
    open:['block/wooden_door/open','random/door_open'],
    portal:['block/portal/ambient1','portal/portal'],
    level:['entity/player/levelup','random/levelup']
 };
 let audio=0;
 const importedSoundTypes=[];
 for(const [type,candidates] of Object.entries(sounds)){
    const key=candidates.find(c=>zip.entries.has('sound:'+c));
    if(!key)continue;
    try{if(await window.MineWorldSound?.loadSound(type,await zip.get('sound:'+key))){audio++;importedSoundTypes.push(type)}}catch(e){console.warn('Unsupported optional sound '+type,e)}
 }
 const items=[...zip.entries.keys()].filter(k=>k.startsWith('item:')).length;
 // Local Bedrock entity skin files have no remote fetching or save-data dependency.
 // Match concrete species paths; generic MineWorld cuboids still aren't exact
 // Bedrock entity geometry/UV models.
 const mobArt=new Map(),itemArt=new Map();
 const knownKinds=window.MineWorldMobPixels?.kinds||[];
 const variants={
  cow:['cow/cow'],sheep:['sheep/sheep'],pig:['pig/pig'],chicken:['chicken'],
  horse:['horse/horse_white','horse/horse_brown'],donkey:['horse/donkey'],
  mule:['horse/mule'],camel:['camel/camel'],llama:['llama/llama_creamy'],
  mooshroom:['cow/mooshroom'],creeper:['creeper/creeper'],zombie:['zombie/zombie'],
  husk:['zombie/husk'],drowned:['zombie/drowned'],skeleton:['skeleton/skeleton'],
  stray:['skeleton/stray'],spider:['spider/spider'],cave_spider:['spider/cave_spider'],
  enderman:['enderman/enderman'],endermite:['endermite'],wolf:['wolf/wolf'],
  cat:['cat/tabby'],ocelot:['cat/ocelot'],bee:['bee/bee'],fox:['fox/fox'],
  goat:['goat/goat'],rabbit:['rabbit/brown'],iron_golem:['iron_golem/iron_golem'],
  snow_golem:['snow_golem'],villager:['villager/villager'],witch:['witch'],
  slime:['slime/slime'],magma_cube:['slime/magmacube'],wither:['wither/wither'],
  ghast:['ghast/ghast'],blaze:['blaze'],piglin:['piglin/piglin'],
  hoglin:['hoglin/hoglin'],zoglin:['hoglin/zoglin'],guardian:['guardian'],
  elder_guardian:['guardian_elder'],shulker:['shulker/shulker'],
  axolotl:['axolotl/axolotl_lucy'],turtle:['turtle/big_sea_turtle'],
  cod:['fish/cod'],salmon:['fish/salmon'],pufferfish:['fish/pufferfish'],
  tropical_fish:['fish/tropical_a'],squid:['squid'],glow_squid:['glow_squid'],
  bat:['bat'],frog:['frog/temperate_frog'],sniffer:['sniffer/sniffer'],
  warden:['warden/warden'],allay:['allay/allay'],ravager:['illager/ravager'],
  pillager:['illager/pillager'],vindicator:['illager/vindicator'],
  evoker:['illager/evoker'],parrot:['parrot/parrot_red_blue'],
  panda:['panda/panda'],polar_bear:['bear/polarbear']
 };
 const entityKeys=[...zip.entries.keys()].filter(k=>k.startsWith('entity:'));
 for(const kind of knownKinds){
  if(kind==='vehicle')continue;
  // Modern Bedrock versions change filenames (pig_v3, cow_v2). Read the
  // pack's own client entity texture definition rather than guessing.
  let defined=null;
  if(zip.entries.has('entity-def:'+kind)){
   try{
    const text=new TextDecoder().decode(await zip.get('entity-def:'+kind));
    const descriptor=JSON.parse(text)['minecraft:client_entity']?.description;
    const location=descriptor?.textures?.default;
    if(typeof location==='string'&&/^textures\/entity\/[a-z0-9_/-]+$/.test(location))
      defined='entity:'+location.slice('textures/entity/'.length);
   }catch(error){console.warn('Skipping invalid local Bedrock entity definition '+kind,error);}
  }
  const candidates=[defined,'entity:'+kind+'/'+kind,'entity:'+kind,
   'entity:'+kind.replace(/_/g,''),...(variants[kind]||[]).map(p=>'entity:'+p)];
  let key=candidates.find(k=>zip.entries.has(k));
  if(!key)key=entityKeys.find(k=>k.split('/').pop()===kind.replace(/_/g,''));
  if(!key)continue;
  try{
   const image=await imageFromPng(await zip.get(key));
   if(image.width<=2048&&image.height<=2048)mobArt.set(kind,image);
  }catch(error){console.warn('Skipping unsupported local mob PNG '+key,error);}
 }
 // World drops use a small GPU atlas; every other inventory item PNG is still
 // available through lazy, on-demand decoding.
 const preferredItems=['diamond','emerald','iron_ingot','gold_ingot','beef',
  'cooked_beef','leather','feather','bone','stick','string','coal','charcoal',
  'diamond_sword','iron_sword','wooden_pickaxe','stone_pickaxe','iron_pickaxe',
  'diamond_pickaxe','netherite_pickaxe','ender_pearl','carrot','potato',
  'wheat','wheat_seeds','apple','bread','bow','arrow','torch','potion'];
 const allItems=[...zip.entries.keys()].filter(k=>k.startsWith('item:'));
 const itemKeys=[...new Set([...preferredItems.map(k=>'item:'+k),...allItems.sort()])]
  .filter(k=>zip.entries.has(k)).slice(0,192);
 for(const key of itemKeys){
  try{
   const image=await imageFromPng(await zip.get(key));
   if(image.width<=1024&&image.height<=1024)itemArt.set(key,image);
  }catch(error){console.warn('Skipping unsupported local item PNG '+key,error);}
 }
 if(!faces&&!directionalFaces&&!audio&&!items&&!mobArt.size)
  throw Error('No compatible block, item or sound files found.');
 // A 32px atlas is 512x2048 RGBA (~4MiB); 16px packs keep their 1MiB atlas.
 // A wide static PNG can contain more horizontal texels than a 16px tile.
 // Measure the actual sampled frame, not the whole animation strip: a
 // 16x64 implicit vertical animation still has 16x16 source frames.
 const sourceSize=(image,geometry)=>{
   if(!image)return 0;
   const frame=geometry||window.MineWorldResourceAnimation?.frameDimensions(image);
   return Math.max(frame?.width||image.width,frame?.height||image.height);
 };
 const native32=nativeTiles.some(t=>Math.max(
   sourceSize(t.image,t.baseGeometry),sourceSize(t.overlay,t.overlayGeometry))>16);
 // The HD atlas is 512x2048 (4 MiB RGBA). WebGL 1 devices can expose
 // MAX_TEXTURE_SIZE=1024 or 1536: uploading 2048px would silently fail and
 // leave player-owned textures missing. Retain the sharp 16px atlas instead.
 // Standard WebGL always exposes this query; mocks without it assume 2048.
 let maxTextureSize=2048;
 if(typeof META.gl.getParameter==='function'&&META.gl.MAX_TEXTURE_SIZE!==undefined){
   try{
     const reported=META.gl.getParameter(META.gl.MAX_TEXTURE_SIZE);
     maxTextureSize=Number.isFinite(reported)&&reported>0?reported:1024;
   }catch(_){maxTextureSize=1024;}
 }
 let finalCanvas=canvas;
 if(native32&&maxTextureSize>=atlasH*2){
   const high=document.createElement('canvas');high.width=atlasW*2;high.height=atlasH*2;
   const hctx=high.getContext('2d',{alpha:true});
   if(hctx){
     hctx.imageSmoothingEnabled=false;
     hctx.drawImage(canvas,0,0,atlasW,atlasH,0,0,high.width,high.height);
     for(const t of nativeTiles){
       const px=t.px*2,py=t.py*2;
       hctx.clearRect(px,py,32,32);
       if(t.image){
         drawPackFrame(hctx,t.image,t.baseGeometry,t.baseIndex,1,px,py,32);
         if(t.face<=2)tintNeutralSprite(hctx,px,py,t.id,t.face,importedTints.palette,32);
       }else{
         hctx.drawImage(original,t.px,t.py,16,16,px,py,32,32);
       }
       if(t.overlay)composeGrassSideOverlay(hctx,t.overlay,px,py,
         t.overlayIndex,t.overlayIndex,0,t.overlayGeometry,importedTints.palette,32);
     }
     finalCanvas=high;
   }
 }
 if(faces||directionalFaces||modelDirectionalFaces||state.active)await writeAtlas(finalCanvas);
 sideAllocator?.commit(mappedSides);
 window.MineWorldBlockModels?.commitImported?.(modelShapes);
 window.MineWorldJavaFaceTransforms?.commit(modelTransforms);
 window.MineWorldBridge?.refreshWorldMeshes?.();
 // Do not erase a working pack when an invalid replacement is rejected.
 // Newly decoded sound types stay in place; old missing types are discarded.
 window.MineWorldSound?.clearSamples(importedSoundTypes);
 try{window.MineWorldMobPixels?.applyImported?.(new Map([...mobArt,...itemArt]));}
 catch(error){console.warn('Local mob sprites unavailable:',error);}
 state.tint=importedTints.palette;
 state.itemArchive=zip;state.itemCache.clear();state.itemGeneration++;
 state.animations=animated;
 state.importedFaces=importedFaces;
 state.originalImage=original;
 state.animationStart=typeof performance!=='undefined'&&performance.now?performance.now():0;
 state.lastAnimationAt=-Infinity;
 state.animationDisabled=false;
 state.active=faces+directionalFaces+modelDirectionalFaces>0;state.sourceName=sourceName||'selected local assets';
 state.lastResult={blocks:ids.size,faces,directionalFaces,modelDirectionalFaces,modelMappedFaces,atlasTilePixels:state.tilePixels,modelGeometryBlocks:modelShapes.size,modelUVFaces:window.MineWorldJavaFaceTransforms?.stats().faces||0,items,entities:mobArt.size,worldItemSprites:itemArt.size,overlaid,animatedFaces:animated.length,bedrockAnimatedFaces,bedrockDefinitions:bedrockEntries.size,colormaps:importedTints.sources,sounds:audio,available:zip.entries.size,
    missingFaces,
    coverage:Math.round(faces/(169*3)*1000)/10,totalFaces:169*3,
    unmapped:[...missing].filter(Boolean).slice(0,24)};
 window.MineWorldBridge?.refreshTextureUI?.();
 notifyDefaultStatus();
 return state.lastResult;
}
async function setDefaultPack(file){
 if(!file||typeof file.arrayBuffer!=='function')throw Error('Select the Bedrock ZIP from Files first.');
 if(!/\.(zip|mcpack|jar)$/i.test(file.name||''))throw Error('Choose a ZIP, .mcpack, or Java JAR.');
 manualImportStarted=true;
 // If startup is restoring an older pack, let it finish before the new choice.
 await restoreTask;
 const result=await loadFile(file);
 let saved=false;
 try{saved=!!(await packStorage?.save?.(file));}
 catch(error){console.warn('Pack storage unavailable:',error);}
 for(const show of coverageCallbacks)show(result);
 notifyDefaultStatus();
 return {result,saved};
}
async function loadFile(file){
 if(!file||typeof file.arrayBuffer!=='function')throw Error('Choose a local .zip, .jar or PNG file.');
 if(/\.(png|ogg)$/i.test(file.name||''))return loadFiles([file]);
 if(!/\.(zip|jar|mcpack)$/i.test(file.name||''))throw Error('Choose a Java ZIP/JAR, Bedrock .mcpack, or PNG images.');
 return applyResources(readArchive(await file.arrayBuffer()),file.name||'local ZIP');
}
async function loadFiles(fileList){
 // A filename or webkitRelativePath is used only as a local texture lookup key.
 const files=Array.from(fileList||[]);
 if(!files.length||files.length>1500)throw Error('Choose between 1 and 1,500 image/sound files.');
 const recognized=new Map(),ranked=new Map();let total=0;
 for(const file of files){
   if(!file||typeof file.arrayBuffer!=='function')continue;
   const name=String(file.webkitRelativePath||file.name||'').replace(/\\/g,'/').toLowerCase();
   // Folder imports must honor the same Minecraft namespace restriction as ZIPs.
   // Never let assets/some_mod/textures/block/stone.png override vanilla stone.
   if(/(?:^|\/)assets\/(?!minecraft\/)/.test(name))continue;
   const leaf=name.split('/').pop()||'';
   const png=leaf.match(/^([a-z0-9_]+)\.png$/),ogg=leaf.match(/^([a-z0-9_]+)\.ogg$/),meta=leaf.match(/^([a-z0-9_]+)\.png\.mcmeta$/);
   let key=png?.[1]||null;
   if(png&&/(?:^|\/)textures\/(?:item|items)\//.test(name))key='item:'+png[1];
   if(png){const path=name.match(/(?:^|\/)textures\/entity\/([a-z0-9_\/-]+)\.png$/);if(path)key='entity:'+path[1];}
   if(leaf.endsWith('.entity.json')){const match=name.match(/(?:^|\/)entity\/([a-z0-9_-]+)\.entity\.json$/);if(match)key='entity-def:'+match[1];}
   if(ogg){const path=name.match(/(?:^|\/)sounds\/([a-z0-9_./-]+)\.ogg$/);if(path)key='sound:'+path[1];}
   if(png&&name.includes('/colormap/')&&['grass','foliage'].includes(png[1]))key='colormap:'+png[1];
   if(meta)key='meta:'+meta[1];
   const modelFile=name.match(/(?:^|\/)models\/block\/([a-z0-9_/-]+)\.json$/);
   if(modelFile)key='model:'+modelFile[1];
   const blockstateFile=name.match(/(?:^|\/)blockstates\/([a-z0-9_/-]+)\.json$/);
   if(blockstateFile)key='state:'+blockstateFile[1];
   if(leaf==='flipbook_textures.json'&&(name===leaf||/(?:^|\/)textures\/flipbook_textures\.json$/.test(name)))key='bedrock:flipbook';
   if(!key)continue;
   if(Number.isFinite(file.size)&&file.size>6*1024*1024)continue;
   total+=Number.isFinite(file.size)?file.size:0;
   if(total>100*1024*1024)throw Error('Selected files exceed the 100 MB local limit.');
   const priority=(/(?:^|\/)assets\/minecraft\//.test(name)?4:0)+
      (/(?:^|\/)textures\/block\//.test(name)?2:0);
    if((ranked.get(key)??-1)<priority){recognized.set(key,file);ranked.set(key,priority);}
    const qualified=png?name.match(/(?:^|\/)textures\/(?:block|blocks)\/([a-z0-9_/-]+)\.png$/):
      meta?name.match(/(?:^|\/)textures\/(?:block|blocks)\/([a-z0-9_/-]+)\.png\.mcmeta$/):null;
    if(qualified){
      const pathKey=(meta?'meta:block:':'block:')+qualified[1];
      if((ranked.get(pathKey)??-1)<priority){recognized.set(pathKey,file);ranked.set(pathKey,priority);}
    }
 }
 const zip={entries:recognized,async get(key){
   const source=recognized.get(key);return source?new Uint8Array(await source.arrayBuffer()):null;
 }};
 return applyResources(zip,files.length+' locally selected files');
}
async function clear(){
 const img=await imageFromURL(META.baseURL);
 const [canvas,ctx]=baseCanvas();ctx.drawImage(img,0,0);
 await writeAtlas(canvas);
 window.MineWorldJavaDirectionalFaces?.commit(new Map());
 window.MineWorldBlockModels?.commitImported?.(new Map());
 window.MineWorldJavaFaceTransforms?.commit(new Map());
 window.MineWorldBridge?.refreshWorldMeshes?.();
 window.MineWorldSound?.clearSamples();window.MineWorldMobPixels?.applyImported?.(new Map());window.MineWorldBridge?.refreshTextureUI?.();
 state.active=false;state.sourceName='';state.lastResult=null;
 state.animations=[];state.importedFaces=new Set();state.originalImage=null;state.lastAnimationAt=-Infinity;
 state.itemArchive=null;state.itemCache.clear();state.itemGeneration++;
 state.tint={grass:DEFAULT_GRASS.slice(),foliage:DEFAULT_FOLIAGE.slice()};
 await packStorage?.clear?.();
 notifyDefaultStatus();
}
// Upload only changed 16×16 tiles. Animated Java PNGs remain on the user's
// device; a new resource pack or Reset drops every decoded frame immediately.
function updateAnimation(now,fps,touch){
 if(!state.active||state.animationDisabled||!state.animations.length||!Number.isFinite(now))return 0;
 const cadence=Number.isFinite(fps)&&fps>0&&fps<25?150:touch?100:45;
 if(now-state.lastAnimationAt<cadence)return 0;
 state.lastAnimationAt=now;
 const gl=META.gl,timeline=window.MineWorldResourceAnimation;
 if(!timeline||!state.canvas)return 0;
 if(typeof gl.isContextLost==='function'&&gl.isContextLost())return 0;
 const elapsed=Math.max(0,now-state.animationStart);
 const size=state.tilePixels,scale=size/16;
 const tile=document.createElement('canvas');tile.width=size;tile.height=size;
 const ctx=tile.getContext('2d',{alpha:true});
 const atlasCtx=state.canvas.getContext('2d',{alpha:true});
 if(!ctx||!atlasCtx)return 0;
 ctx.imageSmoothingEnabled=false;atlasCtx.imageSmoothingEnabled=false;
 let updated=0;
 try{
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D,META.texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
  for(const entry of state.animations){
   const base=entry.baseTimeline?timeline.sampleAt(entry.baseTimeline,elapsed):{index:0,nextIndex:0,blend:0};
   const over=entry.overlayTimeline?timeline.sampleAt(entry.overlayTimeline,elapsed):{index:0,nextIndex:0,blend:0};
   // Interpolated frames are quantized to avoid uploading unchanged blends.
   base.blend=Math.round(base.blend*16)/16;
   over.blend=Math.round(over.blend*16)/16;
   const key=[base.index,base.nextIndex,base.blend,over.index,over.nextIndex,over.blend].join(':');
   if(entry.lastKey===key)continue;
   ctx.clearRect(0,0,size,size);
   if(entry.image){
    drawPackFrame(ctx,entry.image,entry.baseGeometry,base.index,1,0,0,size);
    if(base.blend>0&&base.index!==base.nextIndex)
     drawPackFrame(ctx,entry.image,entry.baseGeometry,base.nextIndex,base.blend,0,0,size);
    if(entry.face<=2)tintNeutralSprite(ctx,0,0,entry.id,entry.face,state.tint,size);
   }else if(state.originalImage){
    ctx.drawImage(state.originalImage,entry.px,entry.py,16,16,0,0,size,size);
   }
   if(entry.overlay)
    composeGrassSideOverlay(ctx,entry.overlay,0,0,over.index,over.nextIndex,over.blend,entry.overlayGeometry,state.tint,size);
   const x=entry.px*scale,y=entry.py*scale;
   atlasCtx.clearRect(x,y,size,size);
   atlasCtx.drawImage(tile,x,y);
   gl.texSubImage2D(gl.TEXTURE_2D,0,x,y,gl.RGBA,gl.UNSIGNED_BYTE,tile);
   entry.lastKey=key;
   updated++;
  }
 }catch(e){
  state.animationDisabled=true;
  console.warn('Local Java texture animations disabled after GPU/canvas error:',e);
 }
 return updated;
}
// Decode the exact original inventory sprite only when the player opens an item slot.
const ITEM_ALIASES=Object.freeze({
 raw:'beef',cooked:'cooked_beef',iron:'iron_ingot',gold:'gold_ingot',
 copper:'copper_ingot',sticks:'stick',powder:'gunpowder',lapis:'lapis_lazuli',
 cookedFish:'cooked_cod',fish:'cod',steak:'cooked_beef',
 bookQuill:'writable_book',healingPotion:'potion',rawCopper:'raw_copper',
 rawGold:'raw_gold',rawIron:'raw_iron',netheriteUpgrade:'netherite_upgrade_smithing_template',
 netherWart:'nether_wart',stoneBricks:'stone_bricks',witherSkull:'wither_skeleton_skull',
 eyeOfEnder:'ender_eye',flintSteel:'flint_and_steel',leatherCap:'leather_helmet',
 leatherTunic:'leather_chestplate',leatherPants:'leather_leggings',
 leatherBoots:'leather_boots',books:'book'
});
function itemName(key){
 if(typeof key!=='string'||key.length>80||!/^[a-zA-Z0-9_]+$/.test(key))return null;
 return ITEM_ALIASES[key]||key.replace(/([a-z0-9])([A-Z])/g,'$1_$2').toLowerCase();
}
function itemIcon(key){
 const name=itemName(key),source=state.itemArchive;
 if(!name||!source)return Promise.resolve(null);
 const path='item:'+name;
 if(!source.entries.has(path))return Promise.resolve(null);
 if(state.itemCache.has(path))return state.itemCache.get(path);
 const generation=state.itemGeneration;
 const promise=(async()=>{
   const image=await imageFromPng(await source.get(path));
   if(generation!==state.itemGeneration)return null;
   // Keep original high-density Java item pixels instead of forcing all
   // player-imported 32px artwork through an irreversible 16px downsample.
   // 32px cap keeps browser data URLs and mobile memory usage bounded.
   const size=Math.min(32,Math.max(16,Math.floor(Math.max(image.width,image.height))));
   const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
   const ctx=canvas.getContext('2d',{alpha:true});
   if(!ctx)return null;
   ctx.imageSmoothingEnabled=false;
   ctx.clearRect(0,0,size,size);
   const scale=Math.min(size/image.width,size/image.height);
   const width=Math.max(1,Math.round(image.width*scale));
   const height=Math.max(1,Math.round(image.height*scale));
   // Non-square custom PNGs are centered instead of squeezed.
   ctx.drawImage(image,0,0,image.width,image.height,
     Math.floor((size-width)/2),Math.floor((size-height)/2),width,height);
   return generation===state.itemGeneration?canvas.toDataURL('image/png'):null;
 })().catch(error=>{console.warn('Skipping invalid local Java item '+name,error);return null;});
 state.itemCache.set(path,promise);
 return promise;
}
function drawFace(ctx,id,face){
 if(!state.active||!state.canvas)return false;
 const alt=window.MineWorldAtlas?.alternateFaces?.[id];
 const tile=face===4&&alt?.extra?alt.extra.tile:face===3&&alt?alt.tile:id*3+face;
 ctx.clearRect(0,0,16,16);
 const size=state.tilePixels;
 if('imageSmoothingEnabled' in ctx)ctx.imageSmoothingEnabled=false;
 ctx.drawImage(state.canvas,(tile%16)*size,Math.floor(tile/16)*size,size,size,0,0,16,16);
 return true;
}
const exposed={
 get active(){return state.active;},
 get source(){return state.sourceName;},
 get lastResult(){return state.lastResult;},
 get grassTint(){return [...state.tint.grass];},
 get foliageTint(){return [...state.tint.foliage];},
 loadFile,loadFiles,clear,setDefaultPack,drawFace,textureName,updateAnimation,itemIcon,itemName,
 mountDefaultUI,mountOptionsUI,
 get availableItemTextures(){return state.lastResult?.items||0;},
 hasImportedFace(id,face){return state.active&&Number.isInteger(id)&&Number.isInteger(face)&&face>=0&&face<3&&state.importedFaces.has(id*3+face);},
 get animatedFaces(){return state.animations.length;},
 inspectZip(buffer){return Array.from(readArchive(buffer).entries.keys());}
};
window.MineWorldLocalTextures=Object.freeze(exposed);
function mountDefaultUI(root){
 if(!root||root.querySelector('#mw-bedrock-default-button'))return;
 const actions=root.querySelector('.mw-main-actions');
 if(!actions)return;
 const button=document.createElement('button');
 button.type='button';button.id='mw-bedrock-default-button';button.className='mw-pixel-btn';
 button.textContent='Use original Bedrock textures';
 button.title='Choose Mojang Bedrock ZIP and use it as your default on this device';
 const status=document.createElement('div');
 status.id='mw-bedrock-default-status';status.setAttribute('role','status');
 status.style.cssText='color:#efffea;background:#102619dd;border:1px solid #b0d6a4;padding:5px 9px;font:11px/1.35 monospace;text-shadow:none;overflow-wrap:anywhere;';
 const file=document.createElement('input');file.id='mw-bedrock-default-file';
 file.type='file';file.accept='.zip,.mcpack,.jar,application/zip';
 file.style.display='none';
 file.setAttribute('aria-label','Select a Minecraft Bedrock texture ZIP as MineWorld default');
 const link=document.createElement('a');
 link.href='https://github.com/Mojang/bedrock-samples/releases/download/v1.26.50.4/bedrock-samples-v1.26.50.4-full.zip';
 link.target='_blank';link.rel='noopener noreferrer';
 link.textContent='Download Mojang’s Bedrock ZIP';
 link.style.cssText='font:11px monospace;color:#d5f6c3;text-decoration:underline;text-shadow:none;align-self:center;';
 const update=()=>{
  const result=state.lastResult;
  status.textContent=result?
   'Active: '+state.sourceName+' · '+result.faces+'/'+result.totalFaces+' block faces · '+(result.items||0)+' item PNGs · '+(result.entities||0)+' mob skins.':
   'Select Mojang’s ZIP once; save privately as your default.';
 };
 defaultStatusListeners.push(update);update();
 button.addEventListener('click',()=>file.click());
 file.addEventListener('change',async()=>{
  const selected=file.files?.[0];if(!selected)return;
  button.disabled=true;status.textContent='Applying ZIP locally. Large files may use significant phone memory…';
  try{
   const {result,saved}=await setDefaultPack(selected);
   status.textContent='Applied '+result.faces+'/'+result.totalFaces+' faces and '+(result.items||0)+
    ' item PNGs and '+(result.entities||0)+' mob skins. '+(saved?'Saved as default on this device.':'Storage unavailable: reselect on next visit.');
  }catch(e){status.textContent='Could not apply selected ZIP: '+e.message;}
  finally{button.disabled=false;file.value='';}
 });
 actions.append(button,status,link,file);
}
function mountOptionsUI(){
 addControls(document.querySelector('#mw-options-screen .mw-settings'),
  '🎨 Original Bedrock ZIP / Java resource pack');
}
function addControls(root,title){
 if(!root||Array.from(root.children||[]).some(el=>el.className==='mw-local-experiment'))return;
 const pane=document.createElement('section');
 pane.className='mw-local-experiment';
 pane.style.cssText='margin-top:12px;padding:12px;border:1px solid #9aba9e;background:#1c2d22;color:#f0ffe9;font:12px/1.5 system-ui;text-align:left;max-width:100%;';
 const heading=document.createElement('strong');heading.textContent=title||'Your exact local textures';
 const help=document.createElement('p');
 help.textContent='Choose your own Java Edition .jar/.zip or Bedrock .mcpack in your phone Files app. Block textures, item icons, world drop sprites and mob skin colors are read privately. Skins are fitted to MineWorld models; original Bedrock model UVs are not fully reproduced. The installed Minecraft app itself is not accessible from this browser.';
 help.style.margin='7px 0';
 const official=document.createElement('a');
 official.href='https://github.com/Mojang/bedrock-samples/releases/download/v1.26.50.4/bedrock-samples-v1.26.50.4-full.zip';
 official.target='_blank';official.rel='noopener noreferrer';
 official.textContent='Download Mojang official Bedrock vanilla textures ZIP (169 MB)';
 official.style.cssText='display:block;padding:8px 0;color:#bfffa3;text-decoration:underline;font-size:13px;';
 const file=document.createElement('input');
 file.type='file';file.accept='.zip,.jar,.mcpack,application/zip,application/java-archive';
 file.setAttribute('aria-label','Select local Java Edition resource pack or client jar');
 file.style.cssText='display:block;width:100%;max-width:100%;color:white;font-size:13px;margin:8px 0;';
 const loose=document.createElement('input');
 loose.type='file';loose.multiple=true;loose.accept='.png,image/png,.ogg,audio/ogg,.mcmeta,application/json';
 loose.setAttribute('aria-label','Select multiple individually extracted Java block texture PNG files');
 loose.style.cssText='display:block;width:100%;max-width:100%;color:white;font-size:13px;margin:8px 0;';
 const looseLabel=document.createElement('small');
 looseLabel.textContent='Or choose several block PNG files at once (example: grass_block_top.png and dirt.png). The filename is used as the mapping.';
 const folderLabel=document.createElement('small');
 folderLabel.textContent='On desktop, you can also select an extracted textures/block folder. All files stay on your device.';
 const folder=document.createElement('input');
 folder.type='file';folder.multiple=true;folder.webkitdirectory=true;
 folder.accept='.png,image/png,.ogg,audio/ogg,.mcmeta,application/json';
 folder.setAttribute('aria-label','Choose extracted Java block textures folder');
 folder.style.cssText='display:block;width:100%;max-width:100%;color:white;font-size:13px;margin:8px 0;';
 const rememberLabel=document.createElement('label');
 rememberLabel.style.cssText='display:flex;align-items:center;gap:8px;margin:8px 0;font-size:12px;';
 const remember=document.createElement('input');remember.type='checkbox';
 remember.disabled=!packStorage?.supported;
 const rememberText=document.createElement('span');
 rememberText.textContent=packStorage?.supported?
   'Remember this ZIP/JAR on this device (private browser storage)':
   'Remember pack unavailable in this browser';
 rememberLabel.append(remember,rememberText);
 const reset=document.createElement('button');reset.type='button';reset.textContent='Restore original art & sounds';reset.className='ui-button';
 reset.style.cssText='min-height:38px;margin:4px 0;';
 const status=document.createElement('p');status.setAttribute('role','status');
 status.style.cssText='margin:6px 0;color:#e8efc6;overflow-wrap:anywhere;';
 status.textContent='Original MineWorld artwork active. Select a ZIP/JAR or individual PNGs.';
 const preview=document.createElement('div');
 preview.style.cssText='display:flex;flex-wrap:wrap;gap:9px;margin:7px 0;align-items:flex-start;';
 preview.setAttribute('aria-label','Selected local texture comparison');
 const detail=document.createElement('small');
 detail.style.cssText='display:block;overflow-wrap:anywhere;color:#cce2c1;margin:4px 0 8px;';
 const audit=document.createElement('details');
 audit.style.cssText='margin:6px 0;color:#dbeed6;max-height:180px;overflow:auto;';
 const auditSummary=document.createElement('summary');
 const auditText=document.createElement('pre');
 auditText.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;font:11px/1.5 monospace;';
 audit.append(auditSummary,auditText);
 function showCoverage(result){
   if(!result)return;
   status.textContent='Matched '+result.faces+' of '+result.totalFaces+' block faces ('+
     result.coverage+'%) across '+result.blocks+' block types, '+(result.atlasTilePixels||16)+'px atlas faces, '+(result.directionalFaces||0)+' dedicated directional side faces, '+(result.items||0)+' item PNGs, '+(result.entities||0)+' mob skins, '+(result.worldItemSprites||0)+' 3D item sprites, '+result.animatedFaces+' animated faces ('+(result.bedrockAnimatedFaces||0)+' from Bedrock flipbooks) and '+result.sounds+
     ' sound events, '+(result.modelMappedFaces||0)+' model-resolved faces. '+(result.overlaid?'Grass uses the Java side overlay. ':'')+'Unmatched block faces keep independent MineWorld art.';
   detail.textContent=result.unmapped.length?
     'Example unmatched sprite names: '+result.unmapped.slice(0,9).join(', ')+'.':'All mapped face names were present.';
   auditSummary.textContent='Inspect all '+result.missingFaces.length+' unmatched block faces';
   const labels=['top','side','bottom'];
   auditText.textContent=result.missingFaces.map(({id,face,name})=>
     (names[id]||'Block '+id)+' (#'+id+') '+labels[face]+': '+name+'.png').join('\n')||'Every MineWorld atlas face was matched.';
   preview.replaceChildren();
   for(const [id,name] of [[1,'Grass'],[3,'Stone'],[5,'Log'],[6,'Leaves'],[11,'Planks'],
                           [19,'Iron'],[61,'Cobble'],[99,'Diamond'],[121,'End stone'],[168,'Craft']]){
     const tile=document.createElement('canvas');tile.width=16;tile.height=16;
     tile.style.cssText='width:40px;height:40px;image-rendering:pixelated;border:1px solid #95ad90;background:#284232;';
     const ctx=tile.getContext('2d',{alpha:true});if(!ctx)continue;
     ctx.imageSmoothingEnabled=false;
     if(!drawFace(ctx,id,0))continue;
     tile.setAttribute('aria-label',name+' texture preview');
     tile.title=name;
     preview.appendChild(tile);
   }
 }
 coverageCallbacks.push(showCoverage);
 if(state.lastResult)showCoverage(state.lastResult);
 file.addEventListener('change',async()=>{
   const selected=file.files?.[0];if(!selected)return;
   manualImportStarted=true;
   file.disabled=true;loose.disabled=true;folder.disabled=true;reset.disabled=true;status.textContent='Applying your selected local ZIP texture files…';
   try{
     const result=await loadFile(selected);
     const saved=remember.checked?await packStorage?.save?.(selected):false;
     if(!saved)await packStorage?.clear?.();
     showCoverage(result);
     if(saved)status.textContent+=' Your pack is saved only on this device and will reload next visit.';
     else if(remember.checked)status.textContent+=' This browser could not save the pack; import it again next visit.';
   }
   catch(e){status.textContent='Could not apply pack: '+e.message;}
   finally{file.disabled=false;loose.disabled=false;folder.disabled=false;reset.disabled=false;file.value='';}
 });
 loose.addEventListener('change',async()=>{
   const files=loose.files;
   if(!files?.length)return;
   manualImportStarted=true;
   loose.disabled=true;file.disabled=true;folder.disabled=true;reset.disabled=true;
   status.textContent='Matching selected PNG sprites directly by their filenames…';
   try{showCoverage(await loadFiles(files));await packStorage?.clear?.();}
   catch(e){status.textContent='Could not apply selected images: '+e.message;}
   finally{loose.disabled=false;file.disabled=false;folder.disabled=false;reset.disabled=false;loose.value='';}
 });
 folder.addEventListener('change',async()=>{
   if(!folder.files?.length)return;
   manualImportStarted=true;
   file.disabled=true;loose.disabled=true;folder.disabled=true;reset.disabled=true;
   status.textContent='Reading your own extracted PNG textures locally…';
   try{showCoverage(await loadFiles(folder.files));await packStorage?.clear?.();}
   catch(e){status.textContent='Folder import failed: '+e.message;}
   finally{file.disabled=false;loose.disabled=false;folder.disabled=false;reset.disabled=false;folder.value='';}
 });
 reset.addEventListener('click',async()=>{
   manualImportStarted=true;
   reset.disabled=true;
   try{await clear();status.textContent='Original MineWorld textures and sounds restored; imported files were not saved.';preview.replaceChildren();detail.textContent='';auditText.textContent='';auditSummary.textContent='';audit.open=false;}
   catch(e){status.textContent='Restore failed: '+e.message;}
   finally{reset.disabled=false;}
 });
 pane.append(heading,help,official,file,looseLabel,loose,folderLabel,folder,rememberLabel,reset,status,detail,audit,preview);root.appendChild(pane);
}
addControls(document.querySelector('#pause .mw-render-panel')?.parentNode,'🎨 Local resource pack ZIP: textures + sounds');
// The title-screen code runs before this external importer script.
// Mount the main-menu Bedrock selector and Options panel only after the
// importer API and the actual title-screen DOM both exist.
mountDefaultUI(document.querySelector('#mw-menu-root'));
mountOptionsUI();
addControls(document.querySelector('#welcome .seed-panel')?.parentNode,'🎨 Import local textures and sounds');
// Restore only packs the player explicitly opted to remember. Everything
// stays in this browser's IndexedDB; no network request is made.
if(packStorage?.supported)restoreTask=packStorage.load().then(async stored=>{
 if(!stored||manualImportStarted||state.active)return;
 try{
  const result=await loadFile(stored);
  if(!manualImportStarted)for(const show of coverageCallbacks)show(result);
 notifyDefaultStatus();
 }catch(error){
  console.warn('Could not restore saved local resource pack:',error);
  await packStorage.clear();
 }
}).catch(error=>console.warn('Local pack storage unavailable:',error));
})();