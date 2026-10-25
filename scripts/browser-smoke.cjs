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
function makeTestArchive(){
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(16,0);ihdr.writeUInt32BE(16,4);
 ihdr[8]=8;ihdr[9]=6; // 8-bit RGBA
 const rows=Buffer.alloc(16*(1+16*4));
 for(let y=0;y<16;y++)for(let x=0;x<16;x++){
  const pos=y*(1+16*4)+1+x*4;rows[pos]=110;rows[pos+1]=130;rows[pos+2]=140;rows[pos+3]=255;
 }
 const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),
  pngChunk('IHDR',ihdr),pngChunk('IDAT',deflateSync(rows)),pngChunk('IEND',Buffer.alloc(0))]);
 const name=Buffer.from('resource_pack/textures/blocks/stone.png');
 const head=Buffer.alloc(30+name.length),dir=Buffer.alloc(46+name.length);
 head.writeUInt32LE(0x04034b50,0);head.writeUInt16LE(20,4);
 head.writeUInt32LE(crc32(png),14);head.writeUInt32LE(png.length,18);
 head.writeUInt32LE(png.length,22);head.writeUInt16LE(name.length,26);name.copy(head,30);
 dir.writeUInt32LE(0x02014b50,0);dir.writeUInt16LE(20,4);dir.writeUInt16LE(20,6);
 dir.writeUInt32LE(crc32(png),16);dir.writeUInt32LE(png.length,20);dir.writeUInt32LE(png.length,24);
 dir.writeUInt16LE(name.length,28);name.copy(dir,46);
 const eocd=Buffer.alloc(22);eocd.writeUInt32LE(0x06054b50,0);
 eocd.writeUInt16LE(1,8);eocd.writeUInt16LE(1,10);
 eocd.writeUInt32LE(dir.length,12);eocd.writeUInt32LE(head.length+png.length,16);
 return Buffer.concat([head,png,dir,eocd]);
}
async function go(browser,name,mobile){
 const context=await browser.newContext(mobile?{
  viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true
 }:{viewport:{width:1280,height:800}});
 const page=await context.newPage(),errors=[];
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
  assert.ok(await page.evaluate(()=>window.MineWorldLocalTextures?.lastResult?.faces>=3),
    name+': synthetic stone was not imported');
  await page.reload({waitUntil:'domcontentloaded',timeout:60000});
  await page.locator('#mw-menu-root.active').waitFor({state:'visible',timeout:25000});
  await page.waitForFunction(()=>window.MineWorldLocalTextures?.lastResult?.faces>=3,null,{timeout:30000});
  await page.locator('#mw-options').click();
  assert.equal(await page.locator('#mw-options-screen').evaluate(el=>el.classList.contains('active')),true,name+': Options failed');
  assert.ok(await page.locator('#mw-options-screen .mw-local-experiment').count(),
    name+': importing controls missing from Options');
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
  await page.locator('#home-btn').click();
  await page.locator('#mw-menu-root.active').waitFor({state:'visible',timeout:15000});
  if(errors.length)throw Error(name+' browser console/runtime errors:\n'+errors.slice(0,8).join('\n'));
  process.stdout.write(name+': Bedrock ZIP import/persistent reload, five menu actions, gameplay, pause and return passed\n');
 }finally{await context.close();}
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