/* Browser-level smoke checks for real MineWorld main-menu behavior.
 * Runs on GitHub Actions with installed Chrome + temporary Playwright package.
 * Starts a loopback server only; never changes user world saves.
 */
'use strict';
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {deflateSync}=require('node:zlib');
const root=path.resolve(__dirname,'..');
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png',
 '.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.ico':'image/x-icon'};
const server=http.createServer((req,res)=>{
 let p;
 try{
  const u=new URL(req.url,'http://localhost');
  p=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':decodeURIComponent(u.pathname)));
  if(!p.startsWith(root+path.sep)&&p!==root)throw Error('Blocked path');
  const file=fs.readFileSync(p);
  res.writeHead(200,{'Content-Type':MIME[path.extname(p)]||'application/octet-stream','Cache-Control':'no-store'});
  res.end(file);
 }catch(e){res.writeHead(404);res.end('Not found');}
});
// Build an original synthetic 16x16 PNG and a ZIP matching Mojang's folder
// structure. Browser smoke tests never include or download Minecraft bitmaps.
function crc32(bytes){
 let n=0xffffffff;
 for(const b of bytes){n^=b;for(let i=0;i<8;i++)n=(n>>>1)^(n&1?0xedb88320:0);}
 return (n^0xffffffff)>>>0;
}
function pngChunk(name,data){
 const typ=Buffer.from(name),size=Buffer.alloc(4),crc=Buffer.alloc(4);
 size.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([typ,data])));
 return Buffer.concat([size,typ,data,crc]);
}
function generatedPng(height,channel,width=16,perColumn=false,alpha=255){
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width,0);ihdr.writeUInt32BE(height,4);
 ihdr[8]=8;ihdr[9]=6;
 const rows=Buffer.alloc(height*(1+width*4));
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const pos=y*(1+width*4)+1+x*4;
  rows[pos]=perColumn?(110+x)%255:110;rows[pos+1]=(channel+y*8)%255;rows[pos+2]=140;rows[pos+3]=alpha;
 }
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),
  pngChunk('IHDR',ihdr),pngChunk('IDAT',deflateSync(rows)),pngChunk('IEND',Buffer.alloc(0))]);
}
function makeTestArchive(mode='full'){
 let files=[
   ['resource_pack/textures/blocks/stone.png',generatedPng(16,80)],
   ['resource_pack/textures/entity/cow/cow.png',generatedPng(128,180,256)],
   ['resource_pack/textures/items/diamond.png',generatedPng(32,225,32)],
   ['resource_pack/textures/items/beef_cooked.png',generatedPng(16,155)],
   ['resource_pack/textures/ui/heart.png',generatedPng(9,205,9)],
   ['resource_pack/textures/ui/heart_half.png',generatedPng(9,190,9)],
   ['resource_pack/textures/ui/heart_background.png',generatedPng(9,40,9)],
   ['resource_pack/textures/ui/hunger_full.png',generatedPng(9,170,9)],
   ['resource_pack/textures/ui/hunger_half.png',generatedPng(9,140,9)],
   ['resource_pack/textures/ui/hunger_background.png',generatedPng(9,55,9)],
   ['resource_pack/textures/ui/selected_hotbar_slot.png',generatedPng(24,215,24)],
   ...Array.from({length:9},(_,i)=>[
     'resource_pack/textures/ui/hotbar_'+i+'.png',generatedPng(22,80+i*9,20)]),
   ['resource_pack/textures/blocks/water_still_grey.png',generatedPng(64,35)],
   ['assets/minecraft/models/block/furnace.json',Buffer.from(JSON.stringify({
     textures:{top:'minecraft:block/furnace_top',front:'minecraft:block/furnace_front',
       back:'minecraft:block/furnace_back',east:'minecraft:block/furnace_side',
       west:'minecraft:block/furnace_west'},
     elements:[{from:[0,0,0],to:[16,16,16],faces:{
       up:{texture:'#top'},down:{texture:'#top'},
       north:{texture:'#front',rotation:90,uv:[2,1,14,15]},south:{texture:'#back'},
       east:{texture:'#east'},west:{texture:'#west'}}}]
   }))],
   ...['furnace_top','furnace_front','furnace_back','furnace_side','furnace_west'].map(
     (name,i)=>['assets/minecraft/textures/block/'+name+'.png',generatedPng(16,35+i*22)]),
   ['resource_pack/textures/flipbook_textures.json',Buffer.from(JSON.stringify([
    {flipbook_texture:'textures/blocks/water_still_grey',atlas_tile:'still_water_grey',
     frames:[3,1,0,2],ticks_per_frame:1,blend_frames:false}
   ]))]
 ];
 if(['sheet-180','sheet-182','sheet-invalid'].includes(mode)){
  const bordered=mode==='sheet-182',invalid=mode==='sheet-invalid';
  files=[['resource_pack/textures/ui/hotbar.png',
    generatedPng(invalid?20:bordered?22:20,120,invalid?20:bordered?182:180,true)]];
 }
 if(mode==='legacy-widgets'||mode==='legacy-widgets-hd')files=[
  ['assets/minecraft/textures/gui/widgets.png',
    generatedPng(mode==='legacy-widgets-hd'?512:256,160,mode==='legacy-widgets-hd'?512:256,true)]
 ];
 if(mode==='legacy-icons'||mode==='legacy-icons-hd')files=[
  ['assets/minecraft/textures/gui/icons.png',
    generatedPng(mode==='legacy-icons-hd'?512:256,170,mode==='legacy-icons-hd'?512:256,true)]
 ];
 if(mode==='malformed-stat-sprites')files=[
  ...['heart','heart_background','hunger_full','hunger_background']
    .map((name,i)=>['resource_pack/textures/ui/'+name+'.png',generatedPng(22,30+i*25,182)]),
  ['assets/minecraft/textures/gui/icons.png',generatedPng(256,170,256,true)]
 ];
 if(mode==='malformed-stat-no-legacy')files=[
  ['resource_pack/textures/ui/heart.png',generatedPng(22,180,182)]
 ];
 // Independently generated transparent PNG placeholders must not suppress
 // the original survival icons or the selected hotbar frame.
 if(mode==='transparent-hud')files=[
  ['resource_pack/textures/ui/heart.png',generatedPng(9,200,9,false,0)],
  ['resource_pack/textures/ui/heart_background.png',generatedPng(9,40,9)],
  ['resource_pack/textures/ui/hunger_full.png',generatedPng(9,170,9,false,0)],
  ['resource_pack/textures/ui/hunger_background.png',generatedPng(9,40,9)],
  ['resource_pack/textures/ui/hotbar.png',generatedPng(20,110,180,false,0)],
  ['resource_pack/textures/ui/selected_hotbar_slot.png',generatedPng(24,180,24,false,0)]
 ];
 // A transparent authored half, numbered slot or selection must not hide
 // other visible textures in the same independently generated test pack.
 if(mode==='transparent-priority')files=[
  ['resource_pack/textures/ui/heart_half.png',generatedPng(9,200,9,false,0)],
  ['resource_pack/textures/ui/heart.png',generatedPng(9,205,9)],
  ['resource_pack/textures/ui/heart_background.png',generatedPng(9,40,9)],
  ['resource_pack/textures/ui/hunger_half.png',generatedPng(9,140,9,false,0)],
  ['resource_pack/textures/ui/hunger_full.png',generatedPng(9,170,9)],
  ['resource_pack/textures/ui/hunger_background.png',generatedPng(9,55,9)],
  ['resource_pack/textures/ui/hotbar_3.png',generatedPng(20,120,20,false,0)],
  ['resource_pack/textures/ui/hotbar_slot.png',generatedPng(20,130,20)],
  ['resource_pack/textures/ui/selected_hotbar_slot.png',generatedPng(24,200,24,false,0)],
  ['assets/minecraft/textures/gui/widgets.png',generatedPng(256,160,256,true)]
 ];
 if(mode==='sheet-generic')files=[
  ['resource_pack/textures/ui/hotbar.png',generatedPng(20,120,180,true)],
  ['resource_pack/textures/ui/hotbar_slot.png',generatedPng(20,180,20)]
 ];
 if(mode==='malformed-selected')files=[
  ['resource_pack/textures/ui/selected_hotbar_slot.png',generatedPng(22,180,182,true)]
 ];
 // Independently generated half-sprite fixture with no empty/half artwork.
 // The renderer must retain its original empty outline beneath transparent
 // imported half icons. No Minecraft bitmaps are bundled.
 if(mode==='half-no-empty')files=[
  ['resource_pack/textures/ui/heart.png',generatedPng(9,205,9)],
  ['resource_pack/textures/ui/hunger_full.png',generatedPng(9,170,9)]
 ];
 // Full + empty but no half: verify imported empty art stays visible
 // beneath the synthesized transparent half, without proprietary pixels.
 if(mode==='half-with-empty')files=[
  ['resource_pack/textures/ui/heart.png',generatedPng(9,205,9)],
  ['resource_pack/textures/ui/heart_background.png',generatedPng(9,40,9)],
  ['resource_pack/textures/ui/hunger_full.png',generatedPng(9,170,9)],
  ['resource_pack/textures/ui/hunger_background.png',generatedPng(9,55,9)]
 ];
 // Independently generated item placeholders: a blank Java item must not
 // suppress a visible Bedrock alias or MineWorld's original fallback icon.
 if(mode==='transparent-item')files=[
  ['assets/minecraft/textures/item/beef.png',generatedPng(16,110,16,false,0)],
  ['resource_pack/textures/items/beef_raw.png',generatedPng(16,155)],
  ['assets/minecraft/textures/item/cooked_beef.png',generatedPng(16,110,16,false,0)]
 ];
 if(mode==='selected-only')files=files.filter(([name])=>name.endsWith('/selected_hotbar_slot.png'));
 if(mode==='partial-slots')files=files.filter(([name])=>name.endsWith('/hotbar_0.png'));
 const local=[],central=[];let offset=0;
 for(const [filename,data] of files){
   const name=Buffer.from(filename),head=Buffer.alloc(30+name.length),dir=Buffer.alloc(46+name.length);
   head.writeUInt32LE(0x04034b50,0);head.writeUInt16LE(20,4);
   head.writeUInt32LE(crc32(data),14);head.writeUInt32LE(data.length,18);
   head.writeUInt32LE(data.length,22);head.writeUInt16LE(name.length,26);name.copy(head,30);
   dir.writeUInt32LE(0x02014b50,0);dir.writeUInt16LE(20,4);dir.writeUInt16LE(20,6);
   dir.writeUInt32LE(crc32(data),16);dir.writeUInt32LE(data.length,20);dir.writeUInt32LE(data.length,24);
   dir.writeUInt16LE(name.length,28);dir.writeUInt32LE(offset,42);name.copy(dir,46);
   local.push(head,data);central.push(dir);offset+=head.length+data.length;
 }
 const eocd=Buffer.alloc(22);eocd.writeUInt32LE(0x06054b50,0);
 eocd.writeUInt16LE(files.length,8);eocd.writeUInt16LE(files.length,10);
 eocd.writeUInt32LE(central.reduce((t,part)=>t+part.length,0),12);
 eocd.writeUInt32LE(offset,16);
 return Buffer.concat([...local,...central,eocd]);
}
async function go(browser,name,mobile){
 // Browser-recorded footage is trimmed into short HUD/interaction demos by CI.
 // Synthetic fixtures only: never bundle the user's proprietary pack art.
 const videoDir=path.join(root,'artifacts','recordings');
 fs.mkdirSync(videoDir,{recursive:true});
 const context=await browser.newContext(mobile?{
  viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true,
  recordVideo:{dir:videoDir,size:{width:390,height:844}}
 }:{viewport:{width:1280,height:800},
  recordVideo:{dir:videoDir,size:{width:960,height:600}}});
 const page=await context.newPage(),errors=[],video=page.video();
 page.on('pageerror',e=>errors.push(e.stack||e.message));
 page.on('console',msg=>{if(msg.type()==='error')errors.push('console: '+msg.text());});
 try{
  const addr=server.address();
  await page.goto('http://127.0.0.1:'+addr.port+'/',{waitUntil:'domcontentloaded',timeout:60000});
  await page.locator('#mw-menu-root.active').waitFor({state:'visible',timeout:25000});
  const initial=await page.evaluate(()=>({
    initialized:!!window.MineWorldRenderSettings,
    menu:document.querySelector('#mw-menu-root')?.classList.contains('active'),
    blockers:document.querySelector('#welcome')?.classList.contains('hidden'),
    mobPanel:!!document.querySelector('#mw-mob-catalog')
  }));
  assert.equal(initial.initialized,true,name+': game render settings not initialized');
  assert.equal(initial.menu,true);
  assert.equal(initial.blockers,false);
  assert.equal(initial.mobPanel,true,name+': mob catalog panel not present');
  // Exercise the same supercover visibility helper in real desktop/mobile
  // Chrome. The synthetic wall fixture is original test data, not gameplay.
  const sight=await page.evaluate(()=>{
    const ai=window.MineWorldMobAIRules;
    const a={x:1.5,y:1.5,z:1.5},b={x:3.5,y:1.5,z:1.5};
    const wall=(x,y,z)=>!(x===2&&y===1&&z===1);
    return {blocked:ai.rayClear(a,b,wall),
      open:ai.rayClear(a,b,()=>true),
      corner:ai.rayClear({x:.5,y:.5,z:.5},{x:2.5,y:2.5,z:.5},
        (x,y,z)=>!(x===1&&y===0&&z===0)),
      face:ai.rayClear({x:1,y:1.5,z:.5},{x:1,y:1.5,z:3.5},
        (x,y,z)=>!(x===0&&y===1&&z===2)),
      edge:ai.rayClear({x:1,y:1,z:.5},{x:1,y:1,z:3.5},
        (x,y,z)=>!(x===0&&y===0&&z===2)),
      firstFace:ai.rayClear({x:1,y:1.5,z:.5},{x:1,y:1.5,z:1.5},
        (x,y,z)=>!(x===0&&y===1&&z===0)),
      lastFace:ai.rayClear({x:1,y:1.5,z:.5},{x:1,y:1.5,z:1.5},
        (x,y,z)=>!(x===0&&y===1&&z===1)),
      lastEdge:ai.rayClear({x:1,y:1,z:.5},{x:1,y:1,z:1.5},
        (x,y,z)=>!(x===0&&y===0&&z===1))};
  });
  assert.deepEqual(sight,{blocked:false,open:true,corner:false,face:false,edge:false,firstFace:false,lastFace:false,lastEdge:false},
    name+': mobs must not see through thin walls or diagonal corners or along voxel faces');
  // Browser-level combat checks use independent coordinate fixtures. These
  // are not recordings of an actual survival fight or a defeated boss.
  const reach=await page.evaluate(()=>{
    const ai=window.MineWorldMobAIRules,m={x:0,y:2,z:0};
    return {meleeNear:ai.attackInReach(m,{x:1,y:3,z:0},'melee'),
      meleeAbove:ai.attackInReach(m,{x:1,y:6,z:0},'melee'),
      rangedNear:ai.attackInReach(m,{x:6,y:2,z:0},'ranged'),
      rangedAbove:ai.attackInReach(m,{x:6,y:15,z:0},'ranged'),
      ghastSpacing:ai.targetIntent('ghast',7,true),
      blastOpen:ai.blastExposure({x:1.1,y:0,z:1.5},{x:3.9,y:0,z:1.5},()=>true),
      blastBlocked:ai.blastExposure({x:1.1,y:0,z:1.5},{x:3.9,y:0,z:1.5},
        (x,y,z)=>!(x===2&&(y===0||y===1)&&z===1)),
      blastCovered:ai.blastExposure({x:1.1,y:0,z:1.5},{x:3.9,y:0,z:1.5},
        (x,y,z)=>!(x===2&&y===0&&z===1)),
      blastGlass:ai.blastExposure({x:1.1,y:0,z:1.5},{x:3.9,y:0,z:1.5},
        (x,y,z)=>ai.blastBlockPassable(x===2&&(y===0||y===1)&&z===1?9:0)),
      blastPartialGlass:ai.blastExposure({x:1.1,y:0,z:1.5},{x:3.9,y:0,z:1.5},
        (x,y,z)=>ai.blastBlockPassable(x===2&&y===0&&z===1?9:0))};
  });
  assert.deepEqual(reach,{meleeNear:true,meleeAbove:false,rangedNear:true,
    rangedAbove:false,ghastSpacing:'ranged',blastOpen:1,blastBlocked:0,blastCovered:1/3,blastGlass:0,blastPartialGlass:1/3},
    name+': mob combat reach and flying ranged spacing regressed');
  // From the actual title screen: choose a local ZIP, apply exact pixels,
  // save it as default, then reload the same browser and auto-restore it.
  assert.equal(await page.locator('#mw-bedrock-default-button').count(),1,
    name+': Bedrock default setup missing from main menu');
  await page.locator('#mw-bedrock-default-file').setInputFiles({
   name:'synthetic-bedrock.zip',mimeType:'application/zip',buffer:makeTestArchive()
  });
  await page.waitForFunction(()=>
    document.querySelector('#mw-bedrock-default-status')?.textContent.includes('Saved as default'),
    null,{timeout:30000});
  assert.ok(await page.evaluate(()=>window.MineWorldLocalTextures?.lastResult?.entities>=1&&
    window.MineWorldMobPixels?.hasImported('cow')&&
    window.MineWorldMobPixels?.hasMapped('cow','head','front')&&
    window.MineWorldMobPixels?.hasMapped('cow','leg','back')&&
    window.MineWorldMobPixels?.hasImported('item:diamond')),
    name+': Bedrock mob and item PNGs did not reach GPU atlas');
  assert.ok(await page.evaluate(()=>{
    const art=window.MineWorldMobPixels;
    const a=art?.uv('cow',0,'head','front'),b=art?.uv('cow',3,'head','front');
    return art?.size===32&&Math.abs(b[0]-a[0]-31/512)<1e-7;
  }),name+': imported HD mob UVs were downsampled or misaligned');
  assert.ok(await page.evaluate(()=>{
    const pack=window.MineWorldResourcePackContext;
    const gl=pack?.gl;
    if(!gl||!pack.texture||window.MineWorldTextureSmoothing?.enabled!==false)return false;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D,pack.texture);
    return gl.getTexParameter(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER)===gl.NEAREST&&
      gl.getTexParameter(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER)===gl.NEAREST&&
      gl.getContextAttributes()?.antialias===false;
  }),name+': imported atlas is blurred or antialiasing has been reenabled');
  assert.ok(await page.evaluate(()=>{
    const icon=document.createElement('canvas');
    if(!window.MineWorldBlockItemIcons?.paint(icon,3))return false;
    const pixels=icon.getContext('2d').getImageData(0,0,32,32).data;
    let visible=0;
    for(let i=3;i<pixels.length;i+=4)if(pixels[i])visible++;
    return visible>100&&window.MineWorldDroppedVisuals?.copies(64)===5;
  }),name+': crisp 3-face imported block icons or multi-copy ground drops unavailable');
  assert.ok(await page.evaluate(()=>window.MineWorldLocalTextures?.lastResult?.faces>=3),
    name+': synthetic stone was not imported');
  assert.ok(await page.evaluate(async()=>{
    const pack=window.MineWorldLocalTextures,r=pack?.lastResult;
    return r?.hudIcons===6&&r?.hotbarSlots===9&&r?.hotbarSelection===true&&
      (await pack.hudIcon('heart','half'))?.startsWith('data:image/png')&&
      (await pack.hudIcon('food','full'))?.startsWith('data:image/png')&&
      (await pack.itemIcon('cooked'))?.startsWith('data:image/png');
  }),name+': Bedrock HUD or renamed hotbar food item sprites were not decoded');
  assert.ok(await page.evaluate(()=>window.MineWorldLocalTextures?.lastResult?.bedrockAnimatedFaces>=3),
    name+': Bedrock water animation did not load from flipbook_textures.json');
  assert.ok(await page.evaluate(()=>{
    const api=window.MineWorldJavaDirectionalFaces;
    return window.MineWorldLocalTextures?.lastResult?.modelDirectionalFaces>=4&&
      api?.tile(20,[0,0,-1])!==api?.tile(20,[0,0,1])&&
      api?.tile(20,[1,0,0])!==api?.tile(20,[-1,0,0]);
  }),name+': Java furnace cardinal texture mapping is incorrect');
  assert.ok(await page.evaluate(()=>{
    const tr=window.MineWorldJavaFaceTransforms;
    const descriptor=tr?.descriptor(20,[0,0,-1]);
    return descriptor?.rotation===90&&descriptor.uv.join(',')==='2,1,14,15'&&
      window.MineWorldLocalTextures?.lastResult?.modelUVFaces>=1;
  }),name+': Java model face UV crop or 90-degree rotation was ignored');
  assert.ok(await page.evaluate(()=>
    window.MineWorldLocalTextures.updateAnimation(performance.now()+1000,60,false)>=3),
    name+': imported water animation did not update GPU atlas');
  await page.reload({waitUntil:'domcontentloaded',timeout:60000});
  await page.locator('#mw-menu-root.active').waitFor({state:'visible',timeout:25000});
  await page.waitForFunction(()=>window.MineWorldLocalTextures?.lastResult?.faces>=3,null,{timeout:30000});
  assert.ok(await page.evaluate(()=>window.MineWorldLocalTextures?.lastResult?.bedrockAnimatedFaces>=3),
    name+': stored Bedrock animation was lost after reload');
  assert.ok(await page.evaluate(()=>window.MineWorldLocalTextures?.lastResult?.hudIcons===6&&
    window.MineWorldLocalTextures?.lastResult?.hotbarSlots===9),
    name+': remembered Bedrock HUD sprites were lost after reload');
  assert.ok(await page.evaluate(()=>window.MineWorldLocalTextures?.lastResult?.modelDirectionalFaces>=4),
    name+': Java directional model textures did not persist after reload');
  assert.ok(await page.evaluate(()=>window.MineWorldJavaFaceTransforms?.descriptor(20,[0,0,-1])?.rotation===90),
    name+': Java face rotation was lost after saved pack reload');
  assert.ok(await page.evaluate(()=>window.MineWorldMobPixels?.hasImported('cow')&&
     window.MineWorldMobPixels?.hasMapped('cow','head','front')&&
     window.MineWorldMobPixels?.hasImported('item:diamond')),
    name+': remembered mob/item skins did not restore after reload');
  assert.equal(await page.evaluate(()=>window.MineWorldMobPixels?.size),32,
    name+': HD mob atlas did not survive saved pack reload');
  await page.locator('#mw-options').click();
  assert.equal(await page.locator('#mw-options-screen').evaluate(el=>el.classList.contains('active')),true,name+': Options failed');
  assert.ok(await page.locator('#mw-options-screen .mw-local-experiment').count(),
    name+': importing controls missing from Options');
  assert.ok(await page.evaluate(()=>window.MineWorldVisualPolish?.get().cleanScaling===true),
    name+': clean display scaling was not enabled');
  assert.equal(await page.locator('#mw-options-screen [data-mw-polish="cleanScaling"]').count(),1,
    name+': clean scaling option is missing');
  await page.locator('#mw-options-screen [data-mw-polish="cleanScaling"] input').uncheck();
  assert.equal(await page.locator('#world').evaluate(c=>getComputedStyle(c).imageRendering),'pixelated',
    name+': retro scaling did not apply');
  await page.locator('#mw-options-screen [data-mw-polish="cleanScaling"] input').check();
  assert.equal(await page.locator('#world').evaluate(c=>getComputedStyle(c).imageRendering),'pixelated',
    name+': high-resolution mode has blurry CSS scaling');
  assert.ok(await page.evaluate(()=>{
    const gl=window.MineWorldResourcePackContext?.gl,atlas=window.MineWorldResourcePackContext?.texture;
    if(!gl||!atlas||window.MineWorldTextureSmoothing?.enabled)return false;
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,atlas);
    return gl.getTexParameter(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER)===gl.NEAREST&&
      gl.getTexParameter(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER)===gl.NEAREST;
  }),name+': atlas texture filter is not sharp');
  await page.locator('#mw-motion').click();
  await page.locator('#mw-back-options').click();
  assert.equal(await page.locator('#mw-menu-root').evaluate(el=>el.classList.contains('active')),true,name+': Options back failed');
  await page.locator('#mw-multi').click();
  assert.equal(await page.locator('#lobby').evaluate(el=>!el.classList.contains('hidden')),true,name+': Multiplayer failed');
  await page.locator('#close-lobby').click();
  await page.locator('#mw-return').click();
  assert.equal(await page.locator('#atlas-modal').evaluate(el=>!el.classList.contains('hidden')),true,name+': World Atlas failed');
  await page.locator('#close-atlas').click();
  await page.locator('#mw-single').click();
  assert.equal(await page.locator('#mw-world-screen').evaluate(el=>el.classList.contains('active')),true,name+': Singleplayer failed');
  await page.locator('#mw-back-worlds').click();
  await page.locator('#mw-creative').click();
  assert.equal(await page.locator('#mw-world-screen').evaluate(el=>el.classList.contains('active')),true,name+': Creative World failed');
  const play=page.locator('#start-btn');
  assert.equal(await play.isEnabled(),true,name+': Creative Play disabled, WebGL may not be available');
  await play.click({timeout:20000});
  await page.waitForFunction(()=>document.querySelector('#welcome')?.classList.contains('hidden'),null,{timeout:25000});
  await page.waitForTimeout(600);
  await page.waitForFunction(()=>document.querySelectorAll('#hotbar .hot-item.mw-pack-slot').length===9,
    null,{timeout:10000});
  assert.equal(await page.locator('#hotbar .hot-item.active.mw-pack-selected').count(),1,
    name+': selected Bedrock hotbar overlay is not applied');
  assert.ok(await page.locator('#hotbar').evaluate(el=>
    getComputedStyle(el.querySelector('.mw-pack-slot')).backgroundImage.startsWith('url(')),
    name+': hotbar slots are not displaying imported PNG backgrounds');
  // Visual events are transient and never written into game saves.
  assert.equal(await page.evaluate(()=>typeof window.MineWorldImpactEffects?.geometry),'function',
    name+': the impact effect engine did not load');
  const effectCheck=await page.evaluate(()=>{
    const fx=window.MineWorldImpactEffects;
    fx.dust(5,5,5,3,10,'overworld');
    fx.hit(998,5,5,5,{critical:true,dimension:'overworld'});
    const geom=fx.geometry({x:6,y:5,z:10},window.MineWorldAtlas.uv,'overworld');
    return {draw:geom.textured.length>0&&geom.plain.length>0,
      flash:fx.flash(998)>0,bounded:fx.stats().particles<=240};
  });
  assert.ok(effectCheck.draw&&effectCheck.flash&&effectCheck.bounded,
    name+': block chips or damage particles failed to generate');
  await page.evaluate(()=>window.MineWorldImpactEffects.reset());
  assert.ok(await page.locator('#world').evaluate(canvas=>
     canvas.width>=Math.floor(canvas.clientWidth)&&
     canvas.height>=Math.floor(canvas.clientHeight)&&
     getComputedStyle(canvas).imageRendering==='pixelated'),
    name+': framebuffer density or nearest-neighbor CSS scaling is incorrect');
  // Verify actual displacement, not merely that the Play screen opens.
  const before=await page.evaluate(()=>window.MineWorldBridge.getPlayer());
  if(!mobile){
    await page.keyboard.down('w');await page.waitForTimeout(850);await page.keyboard.up('w');
  }else{
    const area=await page.locator('#joystick').boundingBox();
    assert.ok(area,name+': touch joystick not visible');
    const x=area.x+area.width/2,y=area.y+area.height/2;
    await page.mouse.move(x,y);await page.mouse.down();
    await page.mouse.move(x,y-area.height*.36,{steps:4});
    await page.waitForTimeout(850);await page.mouse.up();
  }
  const after=await page.evaluate(()=>window.MineWorldBridge.getPlayer());
  assert.ok(Math.hypot(after.x-before.x,after.z-before.z)>.14,
    name+': movement was blocked by collision or controls ('+
      JSON.stringify({before,after})+')');
  if(!mobile){
    // Chrome redirects all pointer events to the canvas while pointer-locked.
    // ESC should open Pause; if Chrome consumes it to unlock, use the button.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    const alreadyPaused=await page.locator('#pause').evaluate(el=>!el.classList.contains('hidden'));
    if(!alreadyPaused){
      await page.evaluate(()=>document.exitPointerLock?.());
      await page.waitForFunction(()=>!document.pointerLockElement,null,{timeout:5000});
      await page.locator('#menu-toggle').click({timeout:15000});
    }
  }else await page.locator('#menu-toggle').click({timeout:15000});
  assert.equal(await page.locator('#pause').evaluate(el=>!el.classList.contains('hidden')),true,name+': Pause menu failed');
  assert.equal(await page.locator('#pause [data-mw-polish="focusHud"]').count(),1,
    name+': focus HUD option missing from pause menu');
  await page.locator('#pause [data-mw-polish="focusHud"] input').check();
  assert.ok(await page.evaluate(()=>document.documentElement.classList.contains('mw-quiet-hud')),
    name+': focus HUD option did not apply');
  await page.locator('#pause [data-mw-polish="focusHud"] input').uncheck();
  await page.locator('#home-btn').click();
  await page.locator('#mw-menu-root.active').waitFor({state:'visible',timeout:15000});
  // Start a separate Survival world (Creative uses #start-btn).
  await page.locator('#mw-single').click();
  await page.locator('#survival-start').click({timeout:20000});
  await page.waitForFunction(()=>document.querySelector('#welcome')?.classList.contains('hidden'),
    null,{timeout:25000});
  await page.waitForFunction(()=>{
    const hud=document.querySelector('#survival-hud');
    return hud&&!hud.classList.contains('hidden')&&
      document.querySelectorAll('#health-text img.mw-pack-stat-art').length===10&&
      document.querySelectorAll('#hunger-text img.mw-pack-stat-art').length===10;
  },null,{timeout:15000});
  const survival=await page.evaluate(()=>{
    const hud=document.querySelector('#survival-hud'),box=hud.getBoundingClientRect();
    const heart=document.querySelector('#health-text'),food=document.querySelector('#hunger-text');
    const imgs=[...hud.querySelectorAll('img.mw-pack-stat-art')];
    return {hearts:heart.querySelectorAll('.mw-stat-icon').length,
      hunger:food.querySelectorAll('.mw-stat-icon').length,
      labels:heart.getAttribute('aria-label')?.startsWith('Health: ')&&
        food.getAttribute('aria-label')?.startsWith('Hunger: '),
      sharp:imgs.every(img=>getComputedStyle(img).imageRendering==='pixelated'),
      foodReversed:getComputedStyle(food).flexDirection==='row-reverse',
      foodFirstRight:food.firstElementChild?.getBoundingClientRect().left>
        food.lastElementChild?.getBoundingClientRect().left,
      fits:box.left>=-2&&box.right<=innerWidth+2};
  });
  assert.ok(survival.hearts===10&&survival.hunger===10&&survival.labels&&survival.sharp&&
    survival.foodReversed&&survival.foodFirstRight,
    name+': Survival heart/hunger sprites or accessible labels are incorrect');
  if(mobile)assert.equal(survival.fits,true,
    name+': Survival hearts/hunger overflow the mobile viewport');
  // Capture the actual running survival HUD with the synthetic imported
  // texture fixture. These screenshots are not user-owned Minecraft artwork.
  const screenshotDir=path.join(root,'artifacts','screenshots');
  fs.mkdirSync(screenshotDir,{recursive:true});
  await page.screenshot({path:path.join(screenshotDir,
    mobile?'mobile-survival-synthetic-pack.png':'desktop-survival-synthetic-pack.png'),
    animations:'disabled'});
  // The actual desktop/touch layout must not crop stack counts behind icons.
  const countBadge=await page.evaluate(()=>{
    const slot=document.querySelector('#hotbar .hot-item');
    if(!slot)return false;
    const badge=document.createElement('small');
    badge.className='hot-stack-number';badge.textContent='64';
    slot.appendChild(badge);
    const outer=slot.getBoundingClientRect(),rect=badge.getBoundingClientRect();
    const style=getComputedStyle(badge);
    const good=badge.parentElement===slot&&style.display!=='none'&&
      rect.width>0&&rect.height>0&&rect.left>=outer.left-1&&
      rect.right<=outer.right+1&&rect.top>outer.top+outer.height/2&&
      // Account for the 3px inner inset plus the button's border/padding.
      outer.bottom-rect.bottom>=0&&outer.bottom-rect.bottom<=8;
    const diagnostics={good,outer:{x:outer.x,y:outer.y,width:outer.width,height:outer.height,
      bottom:outer.bottom,right:outer.right},rect:{x:rect.x,y:rect.y,width:rect.width,
      height:rect.height,bottom:rect.bottom,right:rect.right},display:style.display,
      position:style.position,bottom:style.bottom,right:style.right};
    badge.remove();return diagnostics;
  });
  assert.equal(countBadge.good,true,name+': 64-stack badge is hidden or clipped by hotbar art '+JSON.stringify(countBadge));
  // A resource pack may provide only a selection border or one slot PNG.
  // Unprovided slot backgrounds must remain usable in desktop and touch HUDs.
  // The classic fallback tile is intentionally painted on ::before, while
  // the larger touch button itself stays transparent for pixel-perfect art.
  await page.evaluate(async bytes=>{
    const file=new File([new Uint8Array(bytes)],'selection-only.zip',{type:'application/zip'});
    await window.MineWorldLocalTextures.loadFile(file);
  },Array.from(makeTestArchive('selected-only')));
  await page.waitForFunction(()=>document.querySelector('#hotbar .hot-item.active.mw-pack-selected'),
    null,{timeout:15000});
  assert.ok(await page.evaluate(()=>{
    const bar=document.querySelector('#hotbar'),items=[...bar.querySelectorAll('.hot-item')];
    return bar.classList.contains('mw-pack-hotbar')&&!bar.classList.contains('mw-pack-bar-image')&&
      items.length===9&&items.every(item=>getComputedStyle(item,'::before').backgroundColor!=='rgba(0, 0, 0, 0)')&&
      getComputedStyle(bar).backgroundColor!=='rgba(0, 0, 0, 0)'&&
      getComputedStyle(items.find(item=>item.classList.contains('active')),'::after').backgroundImage.startsWith('url(');
  }),name+': selection-only pack erased the fallback hotbar slots');
  await page.evaluate(async bytes=>{
    const file=new File([new Uint8Array(bytes)],'partial-slots.zip',{type:'application/zip'});
    await window.MineWorldLocalTextures.loadFile(file);
  },Array.from(makeTestArchive('partial-slots')));
  await page.waitForFunction(()=>document.querySelectorAll('#hotbar .hot-item.mw-pack-slot').length===1,
    null,{timeout:15000});
  assert.ok(await page.evaluate(()=>{
    const bar=document.querySelector('#hotbar'),items=[...bar.querySelectorAll('.hot-item')];
    return bar.classList.contains('mw-pack-hotbar')&&!bar.classList.contains('mw-pack-bar-image')&&
      items[0].classList.contains('mw-pack-slot')&&
      items.slice(1).every(item=>!item.classList.contains('mw-pack-slot')&&
        getComputedStyle(item,'::before').backgroundColor!=='rgba(0, 0, 0, 0)');
  }),name+': partial slot pack hid the remaining fallback tiles');
  // Both bordered Java and seamless Bedrock nine-cell sheets must decode
  // into nine crisp local slot sprites without bundling any copyrighted art.
  for(const mode of ['sheet-180','sheet-182','legacy-widgets','legacy-widgets-hd']){
    await page.evaluate(async bytes=>{
      const file=new File([new Uint8Array(bytes)],'sheet-fixture.zip',{type:'application/zip'});
      await window.MineWorldLocalTextures.loadFile(file);
    },Array.from(makeTestArchive(mode)));
    await page.waitForFunction(()=>document.querySelectorAll('#hotbar .hot-item.mw-pack-slot').length===9,
      null,{timeout:15000});
    assert.ok(await page.evaluate(async mode=>{
      const bar=document.querySelector('#hotbar'),items=[...bar.querySelectorAll('.hot-item')];
      const pack=window.MineWorldLocalTextures;
      const first=await pack.hudIcon('hotbar','slot0'),last=await pack.hudIcon('hotbar','slot8');
      const img=new Image();img.src=first;await img.decode();
      return bar.classList.contains('mw-pack-hotbar-slots')&&items.length===9&&
        items.every(item=>getComputedStyle(item).backgroundImage.startsWith('url('))&&
        img.naturalWidth===(mode==='legacy-widgets-hd'?40:20)&&
        img.naturalHeight===(mode==='legacy-widgets-hd'?40:20)&&first!==last&&
        (!mode.startsWith('legacy-')||bar.querySelectorAll('.mw-pack-selected').length===1);
    },mode),name+': '+mode+' imported sheet did not produce nine distinct square slot textures');
  }
  // Older Java ZIP/JAR packs store both health and hunger in gui/icons.png.
  // Exercise the actual imported atlas in desktop and mobile Chrome.
  for(const mode of ['legacy-icons','legacy-icons-hd']){
    await page.evaluate(async bytes=>{
      const file=new File([new Uint8Array(bytes)],'legacy-icons-fixture.zip',{type:'application/zip'});
      await window.MineWorldLocalTextures.loadFile(file);
    },Array.from(makeTestArchive(mode)));
    await page.waitForFunction(()=>
      document.querySelectorAll('#health-text .mw-pack-stat-art').length===10&&
      document.querySelectorAll('#hunger-text .mw-pack-stat-art').length===10,
      null,{timeout:15000});
    assert.ok(await page.evaluate(async mode=>{
      const pack=window.MineWorldLocalTextures;
      const icons=await Promise.all([
        pack.hudIcon('heart','empty'),pack.hudIcon('heart','full'),
        pack.hudIcon('heart','half'),pack.hudIcon('food','empty'),
        pack.hudIcon('food','full'),pack.hudIcon('food','half')]);
      if(icons.some(icon=>!icon?.startsWith('data:image/png')))return false;
      const images=await Promise.all(icons.map(async src=>{
        const img=new Image();img.src=src;await img.decode();return img;
      }));
      const size=mode==='legacy-icons-hd'?18:9;
      return images.every(img=>img.naturalWidth===size&&img.naturalHeight===size)&&
        new Set(icons).size===6&&
        document.querySelector('#health-text')?.getAttribute('aria-label')?.includes('of 20')&&
        document.querySelector('#hunger-text')?.getAttribute('aria-label')?.includes('of 20');
    },mode),name+': '+mode+' legacy Java heart/hunger atlas was not decoded or displayed');
  }
  // Invalid modern HUD strips must fall back to imported legacy icons instead
  // of becoming horizontally stretched hearts or hiding the procedural HUD.
  await page.evaluate(async bytes=>{
    await window.MineWorldLocalTextures.loadFile(new File(
      [new Uint8Array(bytes)],'malformed-stats.zip',{type:'application/zip'}));
  },Array.from(makeTestArchive('malformed-stat-sprites')));
  assert.ok(await page.evaluate(async()=>{
    const pack=window.MineWorldLocalTextures;
    const icons=await Promise.all(['full','half','empty'].flatMap(fill=>[
      pack.hudIcon('heart',fill),pack.hudIcon('food',fill)]));
    if(icons.some(src=>!src))return false;
    return (await Promise.all(icons.map(async src=>{
      const img=new Image();img.src=src;await img.decode();
      return img.naturalWidth===9&&img.naturalHeight===9;
    }))).every(Boolean);
  }),name+': malformed modern HUD strips suppressed valid legacy atlas artwork');
  await page.evaluate(async bytes=>{
    await window.MineWorldLocalTextures.loadFile(new File(
      [new Uint8Array(bytes)],'malformed-stat-no-legacy.zip',{type:'application/zip'}));
  },Array.from(makeTestArchive('malformed-stat-no-legacy')));
  assert.equal(await page.evaluate(()=>window.MineWorldLocalTextures.hudIcon('heart','full')),null,
    name+': malformed HUD strip should use procedural fallback without a legacy atlas');
  await page.evaluate(async bytes=>{
    await window.MineWorldLocalTextures.loadFile(new File(
      [new Uint8Array(bytes)],'transparent-hud-synthetic.zip',{type:'application/zip'}));
  },Array.from(makeTestArchive('transparent-hud')));
  assert.ok(await page.evaluate(async()=>{
    const pack=window.MineWorldLocalTextures;
    const names=[['heart','full'],['heart','half'],['food','full'],['food','half'],
      ['hotbar','background'],['hotbar','selected']];
    return (await Promise.all(names.map(([kind,fill])=>pack.hudIcon(kind,fill)))).every(src=>src===null)&&
      document.querySelectorAll('#health-text .mw-stat-fallback').length===10&&
      document.querySelectorAll('#hunger-text .mw-stat-fallback').length===10;
  }),name+': transparent synthetic HUD placeholders suppressed procedural fallback');
  await page.screenshot({path:path.join(screenshotDir,
    mobile?'mobile-transparent-hud-synthetic.png':'desktop-transparent-hud-synthetic.png'),
    animations:'disabled'});
  // A separately supplied generic slot takes precedence over a sheet-derived
  // slot; explicit player artwork must not be silently replaced by the sheet.
  await page.evaluate(async bytes=>{
    const file=new File([new Uint8Array(bytes)],'generic-slot-fixture.zip',{type:'application/zip'});
    await window.MineWorldLocalTextures.loadFile(file);
  },Array.from(makeTestArchive('sheet-generic')));
  await page.waitForFunction(()=>document.querySelectorAll('#hotbar .hot-item.mw-pack-slot').length===9,
    null,{timeout:15000});
  assert.ok(await page.evaluate(async()=>{
    const bar=document.querySelector('#hotbar'),pack=window.MineWorldLocalTextures;
    const [generic,derived]=await Promise.all([
      pack.hudIcon('hotbar','slot'),pack.hudIcon('hotbar','slot0')]);
    return !!generic&&derived===generic&&bar.classList.contains('mw-pack-hotbar-slots')&&
      !bar.classList.contains('mw-pack-bar-image')&&
      [...bar.querySelectorAll('.hot-item')].every(item=>
        item.classList.contains('mw-pack-slot')&&
        getComputedStyle(item).backgroundImage.startsWith('url('));
  }),name+': generic imported slot was overridden by a sliced background');
  // An unrelated wide GUI strip mislabeled as a selection sprite must not
  // flatten across the selected button or hide the fallback outline.
  await page.evaluate(async bytes=>{
    const file=new File([new Uint8Array(bytes)],'malformed-selection-fixture.zip',{type:'application/zip'});
    await window.MineWorldLocalTextures.loadFile(file);
  },Array.from(makeTestArchive('malformed-selected')));
  assert.ok(await page.evaluate(async()=>{
    const pack=window.MineWorldLocalTextures;
    const selected=await pack.hudIcon('hotbar','selected');
    return !selected;
  }),name+': malformed imported selection was not rejected');
  // A deliberately partial synthetic HUD adapter exposes only a valid bar
  // background. Verify the selected cell remains visible even without the
  // optional selection PNG or individually decoded slot sprites. This is
  // original test artwork, not a player's imported resource pack.
  const originalPack=await page.evaluate(()=>{
    const original=window.MineWorldLocalTextures;
    window.__mineworldSmokePackOriginal=original;
    const canvas=document.createElement('canvas');canvas.width=180;canvas.height=20;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#555';ctx.fillRect(0,0,180,20);
    ctx.strokeStyle='#aaa';
    for(let i=0;i<9;i++)ctx.strokeRect(i*20+.5,.5,19,19);
    const background=canvas.toDataURL('image/png');
    window.MineWorldLocalTextures={
      generation:987654,hasPack:true,
      hudIcon:async(kind,fill)=>kind==='hotbar'&&fill==='background'?background:null
    };
    window.dispatchEvent(new Event('mineworld-pack-hud-changed'));
    return !!original;
  });
  assert.ok(originalPack,name+': cannot restore resource pack after HUD fallback test');
  try{
    await page.waitForFunction(()=>document.querySelector('#hotbar')?.classList.contains('mw-pack-bar-image'),
      null,{timeout:15000});
    assert.ok(await page.evaluate(()=>{
      const bar=document.querySelector('#hotbar');
      const selected=bar.querySelector('.hot-item.active');
      const frame=selected&&getComputedStyle(selected,'::after');
      return !!selected&&selected.getAttribute('aria-pressed')==='true'&&
        !selected.classList.contains('mw-pack-selected')&&
        !selected.classList.contains('mw-pack-slot')&&
        frame.content!=='none'&&frame.borderTopWidth==='2px'&&
        parseFloat(frame.width)>0&&parseFloat(frame.height)>0&&
        Math.abs(parseFloat(frame.width)-parseFloat(frame.height))<=1;
    }),name+': a background-only HUD pack lost the selected-slot outline');
    await page.screenshot({path:path.join(screenshotDir,
      mobile?'mobile-background-only-selection-synthetic.png':'desktop-background-only-selection-synthetic.png'),
      animations:'disabled'});
  }finally{
    await page.evaluate(()=>{
      window.MineWorldLocalTextures=window.__mineworldSmokePackOriginal;
      delete window.__mineworldSmokePackOriginal;
      window.dispatchEvent(new Event('mineworld-pack-hud-changed'));
    });
  }
  // A square GUI sprite named hotbar.png must not erase procedural slot tiles.
  await page.evaluate(async bytes=>{
    const file=new File([new Uint8Array(bytes)],'invalid-sheet.zip',{type:'application/zip'});
    await window.MineWorldLocalTextures.loadFile(file);
  },Array.from(makeTestArchive('sheet-invalid')));
  await page.waitForFunction(()=>!document.querySelector('#hotbar').classList.contains('mw-pack-hotbar-slots'),
    null,{timeout:15000});
  assert.ok(await page.evaluate(async()=>{
    const bar=document.querySelector('#hotbar'),pack=window.MineWorldLocalTextures;
    const art=await pack.hudIcon('hotbar','background');
    return !art&&!bar.classList.contains('mw-pack-bar-image')&&
      [...bar.querySelectorAll('.hot-item')].every(item=>
        getComputedStyle(item,'::before').backgroundColor!=='rgba(0, 0, 0, 0)');
  }),name+': invalid hotbar image replaced fallback slot tiles');
  // Short end-of-run gameplay segment: restore an original synthetic pack,
  // verify a half-heart from actual damage, select a slot, and open/close
  // the crafting inventory through the same buttons players use.
  await page.evaluate(async bytes=>{
    const file=new File([new Uint8Array(bytes)],'hud-demo-original-fixture.zip',{type:'application/zip'});
    await window.MineWorldLocalTextures.loadFile(file);
  },Array.from(makeTestArchive()));
  await page.waitForFunction(()=>
    document.querySelectorAll('#health-text img.mw-pack-stat-art').length===10&&
    document.querySelectorAll('#hotbar .hot-item.mw-pack-slot').length===9,
    null,{timeout:15000});
  // Suspend mob attacks while checking damage, then resume the real game.
  // Otherwise a long mobile texture-import test can heal or kill the player
  // before the asynchronous Playwright assertion samples the HUD.
  await page.evaluate(()=>document.querySelector('#menu-toggle').click());
  await page.waitForFunction(()=>!document.querySelector('#pause').classList.contains('hidden'),
    null,{timeout:8000});
  const damageHud=await page.evaluate(()=>{
    const mode=window.MineWorldBridge.getMode();
    window.MineWorldBridge.applyDamage(20,'HUD test respawn');
    window.MineWorldBridge.applyDamage(1,'HUD verification');
    const health=document.querySelector('#health-text');
    return {mode,label:health.getAttribute('aria-label'),
      half:health.querySelectorAll('.mw-stat-icon.half').length};
  });
  assert.equal(damageHud.mode,'survival',name+': expected survival damage test '+JSON.stringify(damageHud));
  assert.equal(damageHud.half,1,name+': actual damage did not display a half heart '+JSON.stringify(damageHud));
  assert.match(damageHud.label,/Health: 19 of 20/,
    name+': damage did not update the accessible half-heart HUD');
  // In real desktop and touch Chrome, transparent explicit sprites must
  // yield to other visible player-imported artwork in the same ZIP.
  await page.evaluate(async bytes=>{
    const file=new File([new Uint8Array(bytes)],'transparent-priority-original-fixture.zip',
      {type:'application/zip'});
    await window.MineWorldLocalTextures.loadFile(file);
  },Array.from(makeTestArchive('transparent-priority')));
  await page.waitForFunction(()=>document.querySelectorAll('#hotbar .hot-item.mw-pack-slot').length===9,
    null,{timeout:15000});
  await page.waitForFunction(()=>!!document.querySelector(
    '#health-text .mw-stat-icon.half img.mw-pack-stat-art'),null,{timeout:15000});
  const priority=await page.evaluate(async()=>{
    const pack=window.MineWorldLocalTextures;
    const [heart,food,slot,slotGeneric,selected]=await Promise.all([
      pack.hudIcon('heart','half'),pack.hudIcon('food','half'),
      pack.hudIcon('hotbar','slot3'),pack.hudIcon('hotbar','slot'),
      pack.hudIcon('hotbar','selected')]);
    if(!heart||!food||!slot||!slotGeneric||!selected||slot!==slotGeneric)return false;
    const visible=async src=>{
      const image=new Image();image.src=src;await image.decode();
      const canvas=document.createElement('canvas');
      canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      ctx.drawImage(image,0,0);
      const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
      return window.MineWorldHotbarUV.hasVisibleAlpha(data);
    };
    return (await Promise.all([heart,food,slot,selected].map(visible))).every(Boolean)&&
      document.querySelector('#health-text .mw-stat-icon.half img.mw-pack-stat-art')!==null;
  });
  assert.equal(priority,true,name+': transparent explicit sprites hid visible imported fallback art');
  await page.screenshot({path:path.join(screenshotDir,
    mobile?'mobile-transparent-priority-synthetic.png':'desktop-transparent-priority-synthetic.png'),
    animations:'disabled'});
  // A full-only imported sprite synthesizes a transparent half PNG. Verify
  // that the actual running browser preserves MineWorld's empty outline
  // behind the imported artwork (desktop and touch-sized Chrome).
  await page.evaluate(async bytes=>{
    const file=new File([new Uint8Array(bytes)],'half-no-empty-original-fixture.zip',{type:'application/zip'});
    await window.MineWorldLocalTextures.loadFile(file);
  },Array.from(makeTestArchive('half-no-empty')));
  await page.waitForFunction(()=>{
    const half=document.querySelector('#health-text .mw-stat-icon.half');
    return !!half?.querySelector('canvas.mw-stat-fallback')&&
      !!half?.querySelector('img.mw-pack-stat-art.mw-pack-stat-layer');
  },null,{timeout:15000});
  const halfLayer=await page.evaluate(()=>{
    const icon=document.querySelector('#health-text .mw-stat-icon.half');
    const fallback=icon.querySelector('canvas.mw-stat-fallback');
    const image=icon.querySelector('img.mw-pack-stat-layer');
    const pixel=fallback.getContext('2d').getImageData(7,3,1,1).data;
    const leftPixel=fallback.getContext('2d').getImageData(3,3,1,1).data;
    const empty=window.MineWorldHudArt.pixels('heart','empty');
    const left=(3*11+3)*4,right=(3*11+7)*4;
    const emptyOutline=[...leftPixel].every((n,i)=>n===empty[left+i])&&
      [...pixel].every((n,i)=>n===empty[right+i]);
    const css=getComputedStyle(image);
    return {count:icon.children.length,outlineAlpha:pixel[3],emptyOutline,
      positioned:css.position==='absolute',sharp:css.imageRendering==='pixelated',
      label:document.querySelector('#health-text').getAttribute('aria-label')};
  });
  assert.ok(halfLayer.count===2&&halfLayer.outlineAlpha===255&&halfLayer.emptyOutline&&
    halfLayer.positioned&&halfLayer.sharp&&halfLayer.label==='Health: 19 of 20',
    name+': transparent imported half heart erased its original empty outline: '+
      JSON.stringify(halfLayer));
  await page.screenshot({path:path.join(screenshotDir,
    mobile?'mobile-half-heart-no-empty-synthetic.png':'desktop-half-heart-no-empty-synthetic.png'),
    animations:'disabled'});
  // This synthetic Bedrock pack has full and empty heart/food sprites,
  // but deliberately omits half sprites. Test the real rendered half-heart.
  await page.evaluate(async bytes=>{
    const file=new File([new Uint8Array(bytes)],'half-with-empty-original-fixture.zip',
      {type:'application/zip'});
    await window.MineWorldLocalTextures.loadFile(file);
  },Array.from(makeTestArchive('half-with-empty')));
  await page.waitForFunction(()=>{
    const half=document.querySelector('#health-text .mw-stat-icon.half');
    return !!half?.querySelector('img.mw-pack-stat-underlay')&&
      !!half.querySelector('img.mw-pack-stat-layer');
  },null,{timeout:15000});
  const importedHalf=await page.evaluate(async()=>{
    const icon=document.querySelector('#health-text .mw-stat-icon.half');
    const pack=window.MineWorldLocalTextures;
    const empty=await pack.hudIcon('heart','empty');
    const full=await pack.hudIcon('heart','full');
    const underlay=icon.querySelector('img.mw-pack-stat-underlay');
    const layer=icon.querySelector('img.mw-pack-stat-layer');
    await Promise.all([underlay.decode(),layer.decode()]);
    return {matched:underlay.src===empty,full:!!full,
      count:icon.children.length,underlayWidth:underlay.naturalWidth,
      sharp:getComputedStyle(underlay).imageRendering==='pixelated'&&
        getComputedStyle(layer).imageRendering==='pixelated',
      half:icon.classList.contains('half'),
      label:document.querySelector('#health-text').getAttribute('aria-label')};
  });
  assert.ok(importedHalf.matched&&importedHalf.full&&importedHalf.count===2&&
    importedHalf.underlayWidth===9&&importedHalf.sharp&&importedHalf.half&&
    importedHalf.label==='Health: 19 of 20',
    name+': imported empty frame was lost under a synthesized half-heart: '+
      JSON.stringify(importedHalf));
  await page.screenshot({path:path.join(screenshotDir,
    mobile?'mobile-half-heart-imported-empty-synthetic.png':
      'desktop-half-heart-imported-empty-synthetic.png'),
    animations:'disabled'});
  // Inspect real decoded pixels in desktop/mobile Chrome with a synthetic
  // Java+Bedrock item pack. This is not the player's proprietary pack.
  await page.evaluate(async bytes=>{
    const file=new File([new Uint8Array(bytes)],'transparent-item-original-fixture.zip',{type:'application/zip'});
    await window.MineWorldLocalTextures.loadFile(file);
  },Array.from(makeTestArchive('transparent-item')));
  const itemRecovery=await page.evaluate(async()=>{
    const pack=window.MineWorldLocalTextures;
    const [visible,blank]=await Promise.all([pack.itemIcon('raw'),pack.itemIcon('cooked')]);
    if(!visible||blank!==null)return {recovered:!!visible,blank};
    const image=new Image();image.src=visible;await image.decode();
    const canvas=document.createElement('canvas');
    canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(image,0,0);
    return {recovered:window.MineWorldHotbarUV.hasVisibleAlpha(
      ctx.getImageData(0,0,canvas.width,canvas.height).data),blank};
  });
  assert.deepEqual(itemRecovery,{recovered:true,blank:null},
    name+': transparent Java item did not recover Bedrock alias or preserve fallback');
  await page.screenshot({path:path.join(screenshotDir,
    mobile?'mobile-transparent-item-synthetic.png':'desktop-transparent-item-synthetic.png'),
    animations:'disabled'});
  await page.evaluate(()=>document.querySelector('#resume-btn').click());
  await page.waitForTimeout(650);
  // Desktop pointer lock redirects mouse clicks to the canvas: players use
  // number keys there. Touch players tap the hotbar directly.
  if(mobile)await page.locator('#hotbar .hot-item').nth(2).click({force:true});
  else await page.keyboard.press('3');
  await page.waitForFunction(()=>document.querySelector('#hotbar .hot-item:nth-child(3)')?.classList.contains('active'),
    null,{timeout:8000});
  await page.waitForTimeout(650);
  if(mobile)await page.locator('#quick-inventory').click({force:true});
  else await page.keyboard.press('e');
  await page.waitForFunction(()=>!document.querySelector('#gear-panel')?.classList.contains('hidden'),
    null,{timeout:8000});
  assert.equal(await page.locator('#craft-grid .craft-cell').count(),4,
    name+': inventory-only crafting grid should have four cells');
  await page.waitForTimeout(850);
  await page.locator('#close-gear').click({force:true});
  await page.waitForTimeout(550);
  // Regression: a workbench added by another player must immediately enable
  // the 3x3 grid, even if the earlier backpack visit cached "no workbench".
  // The edit is synthetic and confined to this disposable test world.
  const bench=await page.evaluate(()=>{
    const bridge=window.MineWorldBridge,p=bridge.getPlayer();
    const W=bridge.getSnapshot().worldSize;
    const x=Math.floor(p.x)+2,z=Math.floor(p.z),y=Math.max(1,Math.min(47,Math.floor(p.y)));
    const id=(x*W+z)*48+y;
    return {id,placed:bridge.remoteEdit(id,168)};
  });
  assert.equal(bench.placed,true,name+': failed to place remote crafting-table fixture');
  if(mobile)await page.locator('#quick-inventory').click({force:true});
  else await page.keyboard.press('e');
  await page.waitForFunction(()=>!document.querySelector('#gear-panel')?.classList.contains('hidden'),
    null,{timeout:8000});
  assert.equal(await page.locator('#craft-grid .craft-cell').count(),9,
    name+': remote workbench placement did not immediately open a 3x3 grid');
  assert.match(await page.locator('#craft-heading').textContent(),/3 × 3/,
    name+': workbench heading disagrees with the actual grid');
  await page.waitForTimeout(950);
  await page.locator('#close-gear').click({force:true});
  await page.waitForTimeout(350);
  assert.equal(await page.evaluate(id=>window.MineWorldBridge.remoteEdit(id,0),bench.id),
    true,name+': failed to remove remote crafting-table fixture');
  if(mobile)await page.locator('#quick-inventory').click({force:true});
  else await page.keyboard.press('e');
  await page.waitForFunction(()=>!document.querySelector('#gear-panel')?.classList.contains('hidden'),
    null,{timeout:8000});
  assert.equal(await page.locator('#craft-grid .craft-cell').count(),4,
    name+': removed remote workbench left a stale 3x3 crafting grid');
  await page.waitForTimeout(950);
  await page.locator('#close-gear').click({force:true});
  await page.waitForTimeout(450);
  // Visible real browser furnace interaction in an isolated Survival world.
  // Only synthetic resources are used; no user's texture pack is available.
  const furnaceFixture=await page.evaluate(()=>{
    const bridge=window.MineWorldBridge,p=bridge.getPlayer(),W=bridge.getSnapshot().worldSize;
    const x=Math.floor(p.x)+2,z=Math.floor(p.z),y=Math.max(1,Math.min(47,Math.floor(p.y)));
    const id=(x*W+z)*48+y;
    const granted=bridge.grantLoot('rawIron',2)&&bridge.grantLoot('blazeRod',1);
    const placed=bridge.remoteEdit(id,20);
    return {id,x,y,z,granted,placed,opened:bridge.openFurnaceAt(x,y,z)};
  });
  assert.equal(furnaceFixture.granted,true,name+': furnace fixture resources unavailable');
  assert.equal(furnaceFixture.placed,true,name+': furnace block fixture placement failed');
  assert.equal(furnaceFixture.opened,true,name+': furnace block interaction failed');
  for(const slot of ['input','fuel','output']){
    assert.equal(await page.locator('#mw-furnace-slot-'+slot).count(),1,
      name+': missing visible '+slot+' furnace slot');
  }
  assert.equal(await page.locator('#mw-furnace-flame').count(),1,name+': missing fuel meter');
  assert.equal(await page.locator('#mw-furnace-cook').count(),1,name+': missing smelting meter');
  await page.locator('#mw-furnace-input').selectOption('rawIron');
  await page.locator('#mw-furnace-put-input-stack').click({force:true});
  const loaded=await page.evaluate(({x,y,z})=>
    window.MineWorldBridge.getFurnaceState(x,y,z),furnaceFixture);
  assert.equal(loaded?.input?.qty,2,name+': add-stack did not transfer both owned raw iron');
  assert.match(await page.locator('#mw-furnace-slot-input').getAttribute('aria-label'),/2 ×/,
    name+': furnace input slot did not announce stack count');
  // Exercise the actual touch-sized Take 1 button on desktop and mobile.
  // Returning one ingredient must leave the other item in its slot.
  await page.locator('#mw-furnace-return-input-one').click({force:true});
  const partial=await page.evaluate(({x,y,z})=>
    window.MineWorldBridge.getFurnaceState(x,y,z),furnaceFixture);
  assert.equal(partial?.input?.qty,1,name+': Take 1 removed the entire input stack');
  await page.locator('#mw-furnace-put-input').click({force:true});
  const refilled=await page.evaluate(({x,y,z})=>
    window.MineWorldBridge.getFurnaceState(x,y,z),furnaceFixture);
  assert.equal(refilled?.input?.qty,2,name+': returned ingredient could not be reinserted');
  await page.screenshot({path:path.join(screenshotDir,
    mobile?'mobile-furnace-take-one.png':'desktop-furnace-take-one.png'),
    animations:'disabled'});
  await page.locator('#mw-furnace-fuel').selectOption('blazeRod');
  await page.locator('#mw-furnace-put-fuel').click({force:true});
  await page.waitForFunction(({x,y,z})=>
    window.MineWorldBridge.getFurnaceState(x,y,z)?.burnTotal===120,
    furnaceFixture,{timeout:8000});
  // Engine ticks every frame, but accessible slot labels repaint at 250ms.
  // Wait for the actual UI update rather than racing the first ignition frame.
  await page.waitForFunction(()=>
    document.querySelector('#mw-furnace-slot-fuel')?.getAttribute('aria-label')==='Fuel slot: Empty',
    null,{timeout:8000});
  assert.equal(await page.locator('#mw-furnace-slot-fuel').getAttribute('aria-label'),
    'Fuel slot: Empty',name+': blaze rod was not consumed when furnace ignited');
  await page.screenshot({path:path.join(screenshotDir,
    mobile?'mobile-furnace-blaze-fuel.png':'desktop-furnace-blaze-fuel.png'),
    animations:'disabled'});
  await page.screenshot({path:path.join(screenshotDir,
    mobile?'mobile-furnace-three-slots.png':'desktop-furnace-three-slots.png'),
    animations:'disabled'});
  await page.waitForFunction(({x,y,z})=>
    window.MineWorldBridge.getFurnaceState(x,y,z)?.output?.key==='iron',
    furnaceFixture,{timeout:30000});
  const smelted=await page.evaluate(({x,y,z})=>
    window.MineWorldBridge.getFurnaceState(x,y,z),furnaceFixture);
  assert.equal(smelted?.output?.key,'iron',name+': furnace failed to smelt iron in browser');
  assert.ok(smelted?.output?.qty>=1,name+': furnace output count incorrect');
  // Wait for two real ten-second smelts; one-at-a-time output collection
  // must preserve the remaining ingot on both desktop and touch Chrome.
  await page.waitForFunction(({x,y,z})=>
    window.MineWorldBridge.getFurnaceState(x,y,z)?.output?.qty===2,
    furnaceFixture,{timeout:30000});
  assert.equal(await page.locator('#mw-furnace-output-one').isDisabled(),false,
    name+': single-output control must be enabled when ingots are ready');
  await page.locator('#mw-furnace-output-one').click({force:true});
  const oneLeft=await page.evaluate(({x,y,z})=>
    window.MineWorldBridge.getFurnaceState(x,y,z),furnaceFixture);
  assert.equal(oneLeft?.output?.qty,1,name+': Collect 1 removed both ingots');
  assert.match(await page.locator('#mw-furnace-slot-output').getAttribute('aria-label'),
    /Output slot: 1 ×/,name+': partial output quantity not announced');
  await page.screenshot({path:path.join(screenshotDir,
    mobile?'mobile-furnace-output-one.png':'desktop-furnace-output-one.png'),
    animations:'disabled'});
  await page.locator('#mw-furnace-output').click({force:true});
  const drained=await page.evaluate(({x,y,z})=>
    window.MineWorldBridge.getFurnaceState(x,y,z),furnaceFixture);
  assert.equal(drained?.output,null,name+': Collect output did not empty remaining ingot');
  assert.equal(await page.locator('#mw-furnace-output-one').isDisabled(),true,
    name+': Collect 1 must disable when output is empty');
  // Smelt a non-oak log using the same real furnace UI in both browsers.
  // The imported pack is a synthetic test fixture, not a player's owned art.
  assert.equal(await page.evaluate(()=>window.MineWorldBridge.grantLoot('block:40',1)),
    true,name+': cherry log could not be granted for charcoal regression');
  await page.waitForFunction(()=>
    [...document.querySelector('#mw-furnace-input').options].some(o=>o.value==='block:40'),
    null,{timeout:8000});
  await page.locator('#mw-furnace-input').selectOption('block:40');
  await page.locator('#mw-furnace-put-input').click({force:true});
  const logLoaded=await page.evaluate(({x,y,z})=>
    window.MineWorldBridge.getFurnaceState(x,y,z),furnaceFixture);
  assert.equal(logLoaded?.input?.key,'block:40',name+': cherry log did not enter furnace');
  // Reproduce the old bug: closing the furnace and opening the backpack
  // used to freeze smelting until the inventory was closed.
  await page.locator('#mw-furnace-close').click({force:true});
  if(mobile)await page.locator('#quick-inventory').click({force:true});
  else await page.keyboard.press('e');
  await page.waitForFunction(()=>
    !document.querySelector('#gear-panel')?.classList.contains('hidden'),
    null,{timeout:8000});
  const beforeCrafting=await page.evaluate(({x,y,z})=>
    window.MineWorldBridge.getFurnaceState(x,y,z),furnaceFixture);
  await page.waitForTimeout(1400);
  const afterCrafting=await page.evaluate(({x,y,z})=>
    window.MineWorldBridge.getFurnaceState(x,y,z),furnaceFixture);
  assert.ok(afterCrafting?.progress>beforeCrafting?.progress+.4||
    afterCrafting?.output?.key==='charcoal',
    name+': furnace stopped smelting while the backpack/crafting screen was open');
  await page.screenshot({path:path.join(screenshotDir,
    mobile?'mobile-furnace-cooking-in-backpack.png':'desktop-furnace-cooking-in-backpack.png'),
    animations:'disabled'});
  await page.locator('#close-gear').click({force:true});
  assert.equal(await page.evaluate(({x,y,z})=>
    window.MineWorldBridge.openFurnaceAt(x,y,z),furnaceFixture),true,
    name+': furnace did not reopen after backpack crafting');
  await page.waitForFunction(({x,y,z})=>
    window.MineWorldBridge.getFurnaceState(x,y,z)?.output?.key==='charcoal',
    furnaceFixture,{timeout:30000});
  const charcoalState=await page.evaluate(({x,y,z})=>
    window.MineWorldBridge.getFurnaceState(x,y,z),furnaceFixture);
  assert.equal(charcoalState?.output?.qty,1,name+': log did not produce one charcoal');
  // The engine completes before the 250 ms accessible UI repaint. Wait for
  // the button to become enabled; force-clicking a disabled button is a no-op.
  await page.waitForFunction(()=>
    document.querySelector('#mw-furnace-output-one')?.disabled===false,
    null,{timeout:8000});
  await page.screenshot({path:path.join(screenshotDir,
    mobile?'mobile-furnace-cherry-charcoal-synthetic.png':'desktop-furnace-cherry-charcoal-synthetic.png'),
    animations:'disabled'});
  await page.locator('#mw-furnace-output-one').click({force:true});
  assert.equal(await page.evaluate(({x,y,z})=>
    window.MineWorldBridge.getFurnaceState(x,y,z)?.output,
    furnaceFixture),null,name+': charcoal could not be collected');
  await page.locator('#mw-furnace-close').click({force:true});
  // A second real furnace proves harvested bamboo blocks fuel a full smelt.
  // The imported artwork is an independently generated test fixture.
  const bambooFixture=await page.evaluate(({x,y,z})=>{
    const bridge=window.MineWorldBridge,W=bridge.getSnapshot().worldSize,bx=x+1;
    const id=(bx*W+z)*48+y;
    const granted=bridge.grantLoot('rawIron',1)&&bridge.grantLoot('block:45',4);
    const placed=bridge.remoteEdit(id,20);
    return {id,x:bx,y,z,granted,placed,opened:bridge.openFurnaceAt(bx,y,z)};
  },furnaceFixture);
  assert.equal(bambooFixture.granted,true,name+': harvested bamboo fuel fixture was unavailable');
  assert.equal(bambooFixture.placed,true,name+': bamboo furnace placement failed');
  assert.equal(bambooFixture.opened,true,name+': bamboo furnace did not open');
  await page.locator('#mw-furnace-input').selectOption('rawIron');
  await page.locator('#mw-furnace-put-input').click({force:true});
  await page.waitForFunction(()=>
    [...document.querySelector('#mw-furnace-fuel').options].some(o=>o.value==='block:45'),
    null,{timeout:8000});
  await page.locator('#mw-furnace-fuel').selectOption('block:45');
  await page.locator('#mw-furnace-put-fuel-stack').click({force:true});
  await page.waitForFunction(({x,y,z})=>
    window.MineWorldBridge.getFurnaceState(x,y,z)?.output?.key==='iron',
    bambooFixture,{timeout:30000});
  const bambooCook=await page.evaluate(({x,y,z})=>
    window.MineWorldBridge.getFurnaceState(x,y,z),bambooFixture);
  assert.equal(bambooCook?.input,null,name+': bamboo smelt left an unconsumed ingredient');
  assert.equal(bambooCook?.fuel,null,name+': bamboo smelt did not consume four fuel blocks');
  assert.equal(bambooCook?.output?.qty,1,name+': four bamboo did not produce exactly one iron');
  await page.waitForFunction(()=>
    document.querySelector('#mw-furnace-output-one')?.disabled===false,
    null,{timeout:8000});
  await page.screenshot({path:path.join(screenshotDir,
    mobile?'mobile-furnace-bamboo-smelt-synthetic.png':'desktop-furnace-bamboo-smelt-synthetic.png'),
    animations:'disabled'});
  await page.locator('#mw-furnace-output-one').click({force:true});
  assert.equal(await page.evaluate(({x,y,z})=>
    window.MineWorldBridge.getFurnaceState(x,y,z)?.output,bambooFixture),null,
    name+': bamboo-smelted iron could not be collected');
  await page.locator('#mw-furnace-close').click({force:true});
  assert.equal(await page.evaluate(id=>window.MineWorldBridge.remoteEdit(id,0),bambooFixture.id),
    true,name+': bamboo furnace cleanup failed');
  assert.equal(await page.evaluate(id=>window.MineWorldBridge.remoteEdit(id,0),furnaceFixture.id),
    true,name+': furnace fixture cleanup failed');
  await page.waitForTimeout(300);
  if(errors.length)throw Error(name+' browser console/runtime errors:\n'+errors.slice(0,8).join('\n'));
  process.stdout.write(name+': Bedrock ZIP import/persistent reload, real movement, menu actions, gameplay, pause and return passed\n');
 }finally{
   await context.close();
   if(video)await video.saveAs(path.join(videoDir,mobile?'mobile-smoke.webm':'desktop-smoke.webm'));
 }
}
(async()=>{
 await new Promise((ok,no)=>server.listen(0,'127.0.0.1',e=>e?no(e):ok()));
 let browser;
 try{
   browser=await chromium.launch({channel:'chrome',headless:true,
     args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--enable-unsafe-swiftshader',
       '--use-gl=angle','--use-angle=swiftshader']});
   await go(browser,'Desktop Chrome',false);
   await go(browser,'Mobile touch Chrome',true);
 }finally{
   if(browser)await browser.close();
   await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error(e);process.exitCode=1;});