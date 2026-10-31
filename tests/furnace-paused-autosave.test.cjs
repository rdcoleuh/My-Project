/* A paused furnace overlay must not bypass the eight-second save clock. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const smoke=fs.readFileSync(path.join(root,'scripts/browser-smoke.cjs'),'utf8');
const start=html.indexOf('  function autosaveTick(elapsed){');
const end=html.indexOf('  function render(t){',start);
function clock(){
 assert.ok(start>=0&&end>start,'shared autosave helper is installed');
 const ctx=vm.createContext({});
 vm.runInContext('let saveTimer=0,dirtySave=true,saves=0;function save(){saves++;dirtySave=false;}\n'+html.slice(start,end),ctx);
 return {ctx,run:dt=>vm.runInContext('autosaveTick('+JSON.stringify(dt)+')',ctx),
  get:()=>vm.runInContext('({saveTimer,dirtySave,saves})',ctx),
  dirty:()=>vm.runInContext('dirtySave=true',ctx)};
}
test('autosave helper retains the eight-second interval',()=>{
 const c=clock();c.run(4);assert.equal(c.get().saves,0);
 c.run(4);assert.equal(c.get().saves,0);
 c.run(.01);assert.equal(c.get().saves,1);
 assert.equal(c.get().dirtySave,false);
});
test('unchanged worlds do not write; subsequent furnace edits are saved',()=>{
 const c=clock();c.run(8.1);assert.equal(c.get().saves,1);
 c.run(8.1);assert.equal(c.get().saves,1);
 c.dirty();c.run(8.1);assert.equal(c.get().saves,2);
});
test('paused furnace and backpack overlays tick autosave before early return',()=>{
 const render=html.slice(end,html.indexOf('  // Biome travel stays deterministic',end));
 const pause=render.indexOf('if(paused){');
 const active=render.lastIndexOf('autosaveTick(dt);');
 assert.ok(pause>=0&&active>pause,'paused and active branches use shared clock');
 const gate=render.slice(pause,render.indexOf('return;',pause));
 assert.match(gate,/gameMode==='survival'/);
 assert.match(gate,/furnaceUI\.isOpen/);
 assert.match(gate,/gear-panel/);
 assert.match(gate,/autosaveTick\(clamp\(frameMs\/1000,0,60\)\)/);
 assert.ok(!render.includes('saveTimer+=dt'),'avoid double-ticking the clock');
});
test('desktop/mobile browser smoke verifies actual persisted furnace output while open',()=>{
 assert.match(smoke,/mobile-furnace-autosaved-open\.png/);
 assert.match(smoke,/desktop-furnace-autosaved-open\.png/);
 assert.match(smoke,/saved\.furnaces\.some/);
 assert.match(smoke,/m\.output\?\.key==='iron'/);
});
