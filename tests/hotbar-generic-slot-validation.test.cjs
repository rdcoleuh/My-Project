/* Generic player-imported hotbar slot sprites must be validated just like
 * numbered slots. These tests use independently generated data only. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const context=vm.createContext({window:{}});
vm.runInContext(read('hotbar-sprite-uv.js'),context);
const uv=context.window.MineWorldHotbarUV;
test('generic slots accept square pixel art but reject GUI strips and blanks',()=>{
 for(const dims of [[20,20],[24,24],[32,32],[64,64]])
  assert.equal(uv.validSlotSprite(...dims),true);
 for(const dims of [[182,22],[180,20],[22,182],[20,40],[0,0]])
  assert.equal(uv.validSlotSprite(...dims),false);
 assert.equal(uv.hasVisibleAlpha(new Uint8ClampedArray([30,60,90,0])),false);
 assert.equal(uv.hasVisibleAlpha(new Uint8ClampedArray([30,60,90,255])),true);
});
test('standalone generic slot importer validates shape and visible alpha',()=>{
 const src=read('local-resource-pack.js');
 assert.ok(src.includes("if(kind==='hotbar'&&fill==='slot'&&"));
 assert.ok(src.includes('!window.MineWorldHotbarUV?.validSlotSprite(image.width,image.height)'));
 assert.ok(src.includes('!visibleCandidate(image)))return null;'));
 // Numbered slots must retain independent validation and sheet fallback.
 assert.ok(src.includes("[key,'hud:hotbar:slot','hud:hotbar:background',legacyKey]"));
 assert.ok(src.includes('window.MineWorldHotbarUV?.slotRect(attempt.width,attempt.height,Number(fill.slice(-1)))'));
});
test('desktop/mobile browser smoke checks malformed and transparent generic slot fallback',()=>{
 const smoke=read('scripts/browser-smoke.cjs');
 for(const fixture of ['malformed-generic-slot','transparent-generic-slot']){
  assert.ok(smoke.includes("mode==='"+fixture+"'"));
  assert.ok(smoke.includes("for(const fixture of ['malformed-generic-slot','transparent-generic-slot'])"));
 }
 assert.ok(smoke.includes("generic!==null||cells.some(src=>!src)"));
 assert.match(read('sw.js'), /const VERSION='mineworld-6-\d+-[^']+'/);
 assert.ok(read('sw.js').includes("'./hotbar-sprite-uv.js'"));
});
