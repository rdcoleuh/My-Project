/* Furnace burn and smelting must continue during crafting/backpack use.
 * The Escape pause menu still suspends world simulation.
 */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html');
const smoke=read('scripts/browser-smoke.cjs');
const ctx=vm.createContext({window:{}});
vm.runInContext(read('furnace-engine.js'),ctx);
const engine=ctx.window.MineWorldFurnace;
const p={dimension:'overworld',x:5000,y:14,z:5000};

test('crafting and backpack screens keep furnace ticking without unpausing movement',()=>{
 assert.match(html,/if\(gameMode==='survival'&&\(!paused\|\|furnaceUI\.isOpen\|\|!\$\('gear-panel'\)\.classList\.contains\('hidden'\)\)\)/);
 assert.match(html,/if\(paused\)return;/,'physics must remain paused in the backpack');
 assert.match(html,/\$\('gear-panel'\)\.classList\.remove\('hidden'\);paused=true/);
 assert.match(html,/const furnaceDt=clamp\(frameMs\/1000,0,60\)/);
 assert.match(html,/if\(r\.changed\)\{furnaceSaveClock\+=furnaceDt/);
});
test('real desktop and mobile browser tests verify cooking while backpack is visible',()=>{
 assert.match(smoke,/furnace stopped smelting while the backpack\/crafting screen was open/);
 assert.match(smoke,/mobile-furnace-cooking-in-backpack\.png/);
 assert.match(smoke,/desktop-furnace-cooking-in-backpack\.png/);
 assert.match(smoke,/MineWorldBridge\.openFurnaceAt\(x,y,z\)/);
});
test('a furnace resumes partially cooked input after switching interfaces',()=>{
 const f=engine.create();
 assert.equal(f.insert(p,'input','block:40',2),2);
 assert.equal(f.insert(p,'fuel','coal',1),1);
 assert.equal(f.tick(3).completed,0);
 const before=f.get(p);
 assert.equal(before.progress,3);
 assert.equal(f.tick(4).completed,0,'the same machine keeps cooking while another UI is open');
 assert.equal(f.get(p).progress,7);
 assert.equal(f.tick(3).completed,1);
 assert.equal(f.get(p).output.key,'charcoal');
 assert.equal(f.get(p).input.qty,1);
 const restored=engine.create();
 restored.restore(JSON.parse(JSON.stringify(f.snapshot())));
 assert.equal(restored.get(p).output.key,'charcoal');
 assert.equal(restored.get(p).burn,70);
});
