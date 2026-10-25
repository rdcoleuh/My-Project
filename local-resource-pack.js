/* MineWorld 5.7 — local-only optional original resource ZIP importer.
 * Accepts a Java Edition .jar or resource-pack .zip supplied by the player.
 * Reads PNG files IN MEMORY, without uploading, persisting or redistributing them.
 * The public gh-pages game remains unchanged. No Mojang images are in this file.
 */
(()=>{
'use strict';
const META=window.MineWorldResourcePackContext;
if(!META||!META.gl||!META.texture||!META.baseURL){
 console.warn('MineWorld local resource packs require an initialized WebGL atlas');
 return;
}
const atlasW=256,atlasH=512,tilePx=16;
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
 117:'redstone_block',118:'barrel_side',119:'chest_front',
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
 168:'crafting_table_front',169:'red_wool'
})){bind(Number(id),tex);}
bind(1,'grass_block_top','grass_block_side','dirt');
for(const [id,stem,leaf] of [
 [5,'oak_log','oak_log_top'],[15,'oak_log','oak_log_top'],
 [30,'spruce_log','spruce_log_top'],[32,'birch_log','birch_log_top'],
 [34,'acacia_log','acacia_log_top'],[36,'jungle_log','jungle_log_top'],
 [38,'mangrove_log','mangrove_log_top'],[40,'cherry_log','cherry_log_top'],
 [42,'pale_oak_log','pale_oak_log_top'],[78,'crimson_stem','crimson_stem_top'],
 [80,'warped_stem','warped_stem_top']
])bind(id,leaf,stem,leaf);
bind(28,'podzol_top','podzol_side','dirt');
bind(20,'furnace_top','furnace_front','furnace_top');
bind(24,'sandstone_top','sandstone','sandstone_bottom');
bind(44,'cactus_top','cactus_side','cactus_bottom');
bind(56,'copper_block','copper_block','copper_block');
bind(60,'hay_block_top','hay_block_side','hay_block_top');
bind(67,'basalt_top','basalt_side','basalt_top');
bind(75,'crimson_nylium','crimson_nylium_side','netherrack');
bind(76,'warped_nylium','warped_nylium_side','netherrack');
bind(85,'ancient_debris_top','ancient_debris_side','ancient_debris_top');
bind(86,'bone_block_top','bone_block_side','bone_block_top');
bind(118,'barrel_top','barrel_side','barrel_bottom');
bind(125,'end_portal_frame_top','end_portal_frame_side','end_stone');
bind(132,'purpur_pillar_top','purpur_pillar','purpur_pillar_top');
bind(136,'smithing_table_top','smithing_table_front','smithing_table_bottom');
bind(155,'composter_top','composter_side','composter_bottom');
bind(156,'blast_furnace_top','blast_furnace_front','blast_furnace_top');
bind(157,'smoker_top','smoker_front','smoker_bottom');
bind(158,'cartography_table_top','cartography_table_side1','cartography_table_side2');
bind(160,'barrel_top','barrel_side','barrel_bottom');
bind(161,'fletching_table_top','fletching_table_front','fletching_table_side');
bind(162,'cauldron_top','cauldron_side','cauldron_bottom');
bind(163,'lectern_top','lectern_front','oak_planks');
bind(164,'stonecutter_top','stonecutter_side','stonecutter_bottom');
bind(165,'loom_top','loom_front','loom_bottom');
bind(166,'smithing_table_top','smithing_table_front','smithing_table_bottom');
bind(168,'crafting_table_top','crafting_table_front','oak_planks');
bind(169,'red_wool','red_wool','oak_planks');

function normalize(s){return String(s||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');}
const names=window.MineWorldBlockGuide?.names||[];
const aliases={
 grass_block_top:['grass_top'],grass_block_side:['grass_side'],
 oak_log:['log_oak','log'],oak_log_top:['log_oak_top','log_top'],oak_planks:['planks_oak','planks'],oak_leaves:['leaves_oak','leaves'],
 spruce_log:['log_spruce'],spruce_log_top:['log_spruce_top'],spruce_leaves:['leaves_spruce'],spruce_planks:['planks_spruce'],
 birch_log:['log_birch'],birch_log_top:['log_birch_top'],birch_leaves:['leaves_birch'],birch_planks:['planks_birch'],
 jungle_log:['log_jungle'],jungle_log_top:['log_jungle_top'],jungle_leaves:['leaves_jungle'],jungle_planks:['planks_jungle'],
 acacia_log:['log_acacia'],acacia_log_top:['log_acacia_top'],acacia_leaves:['leaves_acacia'],acacia_planks:['planks_acacia'],
 dark_oak_log:['log_big_oak'],dark_oak_log_top:['log_big_oak_top'],dark_oak_planks:['planks_big_oak'],dark_oak_leaves:['leaves_big_oak'],
 stone_bricks:['stonebrick'],bricks:['brick'],nether_bricks:['nether_brick'],sandstone:['sandstone_normal']
};
function textureName(id,face){
 const def=mappings.get(id);
 return def?def[face]:(normalize(names[id])||null);
}
function readArchive(buffer){
 if(!(buffer instanceof ArrayBuffer))throw Error('Expected ZIP data');
 if(buffer.byteLength>160*1024*1024)throw Error('Choose a ZIP/JAR smaller than 160 MB.');
 const v=new DataView(buffer),len=buffer.byteLength;
 const u16=p=>v.getUint16(p,true),u32=p=>v.getUint32(p,true);
 let eocd=-1;
 for(let p=len-22;p>=Math.max(0,len-65557);p--){
   if(u32(p)===0x06054b50){eocd=p;break;}
 }
 if(eocd<0)throw Error('Not a ZIP or Java JAR archive.');
 const number=u16(eocd+10),offset=u32(eocd+16);
 if(number===65535||offset===0xffffffff)throw Error('ZIP64 not supported for this experiment.');
 if(number>12000)throw Error('This pack has too many ZIP entries for the browser importer.');
 let p=offset;
 const found=new Map(),decoder=new TextDecoder();
 for(let i=0;i<number;i++){
   if(p+46>len||u32(p)!==0x02014b50)throw Error('Invalid ZIP central directory.');
   const method=u16(p+10),size=u32(p+20),expanded=u32(p+24),nlen=u16(p+28),extra=u16(p+30),comment=u16(p+32),local=u32(p+42);
   const end=p+46+nlen+extra+comment;
   if(end>len)throw Error('Truncated ZIP entry.');
   const path=decoder.decode(new Uint8Array(buffer,p+46,nlen)).replace(/\\/g,'/').toLowerCase();
   const match=path.match(/(?:^|\/)(?:assets\/minecraft\/)?textures\/(?:block|blocks)\/([a-z0-9_]+)\.png$/);
   const matchSound=path.match(/(?:^|\/)assets\/minecraft\/sounds\/([a-z0-9_./-]+)\.ogg$/);
   if(match&&size<4*1024*1024&&expanded<6*1024*1024&&(method===0||method===8)){
     found.set(match[1],{method,size,expanded,local});
   }
   if(matchSound&&size<4*1024*1024&&expanded<4*1024*1024&&(method===0||method===8))
     found.set('sound:'+matchSound[1],{method,size,expanded,local});
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
const state={active:false,canvas:null,sourceName:'',lastResult:null};
async function writeAtlas(canvas){
 const gl=META.gl;
 if(typeof gl.isContextLost==='function'&&gl.isContextLost())throw Error('The graphics context was lost.');
 gl.activeTexture(gl.TEXTURE0);
 gl.bindTexture(gl.TEXTURE_2D,META.texture);
 gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
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
async function applyResources(zip,sourceName){
 if(zip.entries.size===0)throw Error('No compatible block PNGs or sounds were found in the selected files.');
 window.MineWorldSound?.clearSamples();
 const original=await imageFromURL(META.baseURL);
 const [canvas,ctx]=baseCanvas();ctx.drawImage(original,0,0);
 let faces=0;
 const ids=new Set(),cache=new Map(),missing=new Set(),resolved=new Map();
 for(let id=1;id<=169;id++){
   for(let face=0;face<3;face++){
     const name=textureName(id,face);

     let candidate=resolved.get(name);
     if(candidate===undefined){
       candidate=[name,...(aliases[name]||[])].find(key=>zip.entries.has(key))||null;
       resolved.set(name,candidate);
     }
     if(!candidate){if(name)missing.add(name);continue;}
     if(!cache.has(candidate)){
       cache.set(candidate,(async()=>{
         try{return await imageFromPng(await zip.get(candidate));}
         catch(e){console.warn('Skipping unsupported texture '+candidate,e);return null;}
       })());
     }
     const image=await cache.get(candidate);
     if(!image)continue;
     const column=(id*3+face)%16,row=Math.floor((id*3+face)/16);
     // For animated PNG strips, draw frame zero. Standard 16px vanilla files remain pixel-exact.
     const frame=Math.min(image.width,image.height);
     ctx.drawImage(image,0,0,frame,frame,column*16,row*16,16,16);
     faces++;ids.add(id);
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
 for(const [type,candidates] of Object.entries(sounds)){
    const key=candidates.find(c=>zip.entries.has('sound:'+c));
    if(!key)continue;
    try{if(await window.MineWorldSound?.loadSound(type,await zip.get('sound:'+key)))audio++}catch(e){console.warn('Unsupported optional sound '+type,e)}
 }
 if(!faces&&!audio)throw Error('No compatible block PNGs or playable OGG sound files found.');
 if(faces)await writeAtlas(canvas);
 state.active=faces>0;state.sourceName=sourceName||'selected local assets';
 state.lastResult={blocks:ids.size,faces,sounds:audio,available:zip.entries.size,
    coverage:Math.round(faces/(169*3)*1000)/10,totalFaces:169*3,
    unmapped:[...missing].filter(Boolean).slice(0,24)};
 window.MineWorldBridge?.refreshTextureUI?.();
 return state.lastResult;
}
async function loadFile(file){
 if(!file||typeof file.arrayBuffer!=='function')throw Error('Choose a local .zip, .jar or PNG file.');
 if(/\.(png|ogg)$/i.test(file.name||''))return loadFiles([file]);
 if(!/\.(zip|jar)$/i.test(file.name||''))throw Error('Choose a Java resource-pack ZIP/JAR or PNG images.');
 return applyResources(readArchive(await file.arrayBuffer()),file.name||'local ZIP');
}
async function loadFiles(fileList){
 // A filename or webkitRelativePath is used only as a local texture lookup key.
 const files=Array.from(fileList||[]);
 if(!files.length||files.length>1500)throw Error('Choose between 1 and 1,500 image/sound files.');
 const recognized=new Map();let total=0;
 for(const file of files){
   if(!file||typeof file.arrayBuffer!=='function')continue;
   const name=String(file.webkitRelativePath||file.name||'').replace(/\\/g,'/').toLowerCase();
   const leaf=name.split('/').pop()||'';
   const png=leaf.match(/^([a-z0-9_]+)\.png$/),ogg=leaf.match(/^([a-z0-9_]+)\.ogg$/);
   let key=png?.[1]||null;
   if(ogg){const path=name.match(/(?:^|\/)sounds\/([a-z0-9_./-]+)\.ogg$/);if(path)key='sound:'+path[1];}
   if(!key)continue;
   if(Number.isFinite(file.size)&&file.size>6*1024*1024)continue;
   total+=Number.isFinite(file.size)?file.size:0;
   if(total>100*1024*1024)throw Error('Selected files exceed the 100 MB local limit.');
   recognized.set(key,file);
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
 window.MineWorldSound?.clearSamples();window.MineWorldBridge?.refreshTextureUI?.();
 state.active=false;state.sourceName='';state.lastResult=null;
}
function drawFace(ctx,id,face){
 if(!state.active||!state.canvas)return false;
 const tile=id*3+face;
 ctx.clearRect(0,0,16,16);
 ctx.drawImage(state.canvas,(tile%16)*16,Math.floor(tile/16)*16,16,16,0,0,16,16);
 return true;
}
const exposed={
 get active(){return state.active;},
 get source(){return state.sourceName;},
 get lastResult(){return state.lastResult;},
 loadFile,loadFiles,clear,drawFace,textureName,
 inspectZip(buffer){return Array.from(readArchive(buffer).entries.keys());}
};
window.MineWorldLocalTextures=Object.freeze(exposed);
function addControls(root,title){
 if(!root)return;
 const pane=document.createElement('section');
 pane.className='mw-local-experiment';
 pane.style.cssText='margin-top:12px;padding:12px;border:1px solid #9aba9e;background:#1c2d22;color:#f0ffe9;font:12px/1.5 system-ui;text-align:left;max-width:100%;';
 const heading=document.createElement('strong');heading.textContent=title||'Your exact local textures';
 const help=document.createElement('p');
 help.textContent='For original Minecraft-style pixels, choose your own Java Edition ZIP/JAR or individual block PNG textures. Matching pixels are used only inside this browser; nothing is uploaded, bundled or saved. Eaglercraft .epk files must first be converted to a compatible ZIP.';
 help.style.margin='7px 0';
 const file=document.createElement('input');
 file.type='file';file.accept='.zip,.jar,application/zip,application/java-archive';
 file.setAttribute('aria-label','Select local Java Edition resource pack or client jar');
 file.style.cssText='display:block;width:100%;max-width:100%;color:white;font-size:13px;margin:8px 0;';
 const loose=document.createElement('input');
 loose.type='file';loose.multiple=true;loose.accept='.png,image/png,.ogg,audio/ogg';
 loose.setAttribute('aria-label','Select multiple individually extracted Java block texture PNG files');
 loose.style.cssText='display:block;width:100%;max-width:100%;color:white;font-size:13px;margin:8px 0;';
 const looseLabel=document.createElement('small');
 looseLabel.textContent='Or choose several block PNG files at once (example: grass_block_top.png and dirt.png). The filename is used as the mapping.';
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
 function showCoverage(result){
   if(!result)return;
   status.textContent='Matched '+result.faces+' of '+result.totalFaces+' block faces ('+
     result.coverage+'%) across '+result.blocks+' block types and '+result.sounds+
     ' sound events. Unmatched block faces keep independent MineWorld art.';
   detail.textContent=result.unmapped.length?
     'Example unmatched sprite names: '+result.unmapped.slice(0,9).join(', ')+'.':'All mapped face names were present.';
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
 file.addEventListener('change',async()=>{
   const selected=file.files?.[0];if(!selected)return;
   file.disabled=true;loose.disabled=true;reset.disabled=true;status.textContent='Applying your selected local ZIP texture files…';
   try{showCoverage(await loadFile(selected));}
   catch(e){status.textContent='Could not apply pack: '+e.message;}
   finally{file.disabled=false;loose.disabled=false;reset.disabled=false;file.value='';}
 });
 loose.addEventListener('change',async()=>{
   const files=loose.files;
   if(!files?.length)return;
   loose.disabled=true;file.disabled=true;reset.disabled=true;
   status.textContent='Matching selected PNG sprites directly by their filenames…';
   try{showCoverage(await loadFiles(files));}
   catch(e){status.textContent='Could not apply selected images: '+e.message;}
   finally{loose.disabled=false;file.disabled=false;reset.disabled=false;loose.value='';}
 });
 reset.addEventListener('click',async()=>{
   reset.disabled=true;
   try{await clear();status.textContent='Original MineWorld textures and sounds restored; imported files were not saved.';preview.replaceChildren();detail.textContent='';}
   catch(e){status.textContent='Restore failed: '+e.message;}
   finally{reset.disabled=false;}
 });
 pane.append(heading,help,file,looseLabel,loose,reset,status,detail,preview);root.appendChild(pane);
}
addControls(document.querySelector('#pause .mw-render-panel')?.parentNode,'🎨 Local resource pack ZIP: textures + sounds');
addControls(document.querySelector('#mw-options-screen .mw-settings'),'🎨 Custom Java resource pack (your own texture pixels)');
addControls(document.querySelector('#welcome .seed-panel')?.parentNode,'🎨 Import local textures and sounds');
})();