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
function generatedPng(height,channel,width=16,perColumn=false){
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width,0);ihdr.writeUInt32BE(height,4);
 ihdr[8]=8;ihdr[9]=6;
 const rows=Buffer.alloc(height*(1+width*4));
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const pos=y*(1+width*4)+1+x*4;
  rows[pos]=perColumn?(110+x)%255:110;rows[pos+1]=(channel+y*8)%255;rows[pos+2]=140;rows[pos+3]=255;
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
 if(mode==='sheet-generic')files=[
  ['resource_pack/textures/ui/hotbar.png',generatedPng(20,120,180,true)],
  ['resource_pack/textures/ui/hotbar_slot.png',generatedPng(20,180,20)]
 ];
 if(mode==='malformed-selected')files=[
  ['resource_pack/textures/ui/selected_hotbar_slot.png',generatedPng(22,180,182,true)]
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