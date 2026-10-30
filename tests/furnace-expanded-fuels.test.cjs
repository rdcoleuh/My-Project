/* Independently authored fuel parity regression: real craftable MineWorld items. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','furnace-engine.js'),'utf8'),ctx);
const api=ctx.window.MineWorldFurnace;
const p={dimension:'overworld',x:420,y:-40,z:421};
const copy=x=>JSON.parse(JSON.stringify(x));

test('craftable logs, coal block, blaze rods, and boat variants have exact burn durations',()=>{
 const cases={
  'block:50':15,'block:116':800,blazeRod:120,
  boat:60,spruceBoat:60,cherryBoat:60,raft:60
 };
 for(const [fuel,seconds] of Object.entries(cases)){
  const f=api.create();
  assert.equal(f.insert(p,'input','rawIron',64),64,fuel);
  assert.equal(f.insert(p,'fuel',fuel,1),1,fuel);
  assert.equal(f.tick(10).completed,1,fuel);
  assert.equal(f.get(p).burn,seconds-10,fuel);
  assert.equal(f.get(p).burnTotal,seconds,fuel);
  assert.equal(f.get(p).fuel,null,'one fuel consumed exactly once: '+fuel);
 }
});

test('one blaze rod smelts twelve items, then no free smelting without more fuel',()=>{
 const f=api.create();
 assert.equal(f.insert(p,'input','rawIron',16),16);
 assert.equal(f.insert(p,'fuel','blazeRod',1),1);
 assert.equal(f.tick(60).completed,6);
 assert.equal(f.tick(60).completed,6);
 assert.equal(f.get(p).burn,0);
 assert.equal(f.get(p).output.qty,12);
 assert.equal(f.get(p).input.qty,4);
 assert.equal(f.tick(60).completed,0);
 assert.equal(f.get(p).output.qty,12);
});

test('coal-block fuel survives a save/restore without duplication or lost burn time',()=>{
 const f=api.create();
 assert.equal(f.insert(p,'input','rawIron',64),64);
 assert.equal(f.insert(p,'fuel','block:116',1),1);
 assert.equal(f.tick(60).completed,6);
 const g=api.create();g.restore(copy(f.snapshot()));
 assert.equal(g.get(p).fuel,null);
 assert.equal(g.get(p).burnTotal,800);
 assert.equal(g.get(p).burn,740);
 assert.equal(g.tick(60).completed,6);
 assert.equal(g.get(p).burn,680);
 assert.equal(g.get(p).output.qty,12);
 assert.equal(g.get(p).input.qty,52);
 assert.equal(g.take(p,'output',12).qty,12);
 assert.equal(g.tick(60).completed,6,'remaining fuel continues after output collection');
 assert.equal(g.get(p).burn,620);
});

test('unsupported inventory items cannot be consumed as furnace fuel',()=>{
 const f=api.create();
 for(const item of ['bucket','redstone','iron','netheriteScrap','constructor'])
  assert.equal(f.insert(p,'fuel',item,1),0,item);
 assert.equal(f.get(p),null);
});

test('desktop/mobile Chrome smoke uses the real blaze-rod fuel picker and verifies ignition',()=>{
 const smoke=fs.readFileSync(path.join(__dirname,'..','scripts/browser-smoke.cjs'),'utf8');
 assert.match(smoke,/bridge\.grantLoot\('blazeRod',1\)/);
 assert.match(smoke,/selectOption\('blazeRod'\)/);
 assert.match(smoke,/burnTotal===120/);
 assert.match(smoke,/mobile-furnace-blaze-fuel\.png/);
 assert.match(smoke,/desktop-furnace-blaze-fuel\.png/);
});
