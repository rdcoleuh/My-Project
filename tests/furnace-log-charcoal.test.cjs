/* Furnace parity: every MineWorld log variant produces charcoal. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(root,'furnace-engine.js'),'utf8'),ctx);
const api=ctx.window.MineWorldFurnace;
const p={dimension:'overworld',x:420,y:-38,z:421};
const logs=[5,15,30,32,34,36,38,40,42,50];

test('all ten MineWorld logs cook into charcoal with exactly one fuel item',()=>{
 for(const id of logs){
  const f=api.create(),key='block:'+id;
  assert.equal(f.insert(p,'input',key,1),1,key);
  assert.equal(f.insert(p,'fuel',key,1),1,key+' also remains a valid fuel');
  assert.equal(f.tick(10).completed,1,key);
  assert.equal(f.get(p).output.key,'charcoal',key);
  assert.equal(f.get(p).output.qty,1,key);
  assert.equal(f.get(p).burn,5,key+' has five seconds of fuel remaining');
  assert.equal(f.get(p).fuel,null,key+' fuel consumed once');
 }
});

test('planks remain usable fuel but cannot be cooked into charcoal',()=>{
 for(const id of [11,52]){
  const f=api.create(),key='block:'+id;
  assert.equal(f.insert(p,'input',key,1),0,key);
  assert.equal(f.insert(p,'fuel',key,1),1,key);
  assert.equal(f.get(p).fuel.qty,1);
 }
});

test('cherry log progress and charcoal output survive a save/restore at negative Y',()=>{
 const f=api.create();
 assert.equal(f.insert(p,'input','block:40',3),3);
 assert.equal(f.insert(p,'fuel','coal',1),1);
 assert.equal(f.tick(4).completed,0);
 const g=api.create();g.restore(JSON.parse(JSON.stringify(f.snapshot())));
 assert.equal(g.get(p).progress,4);
 assert.equal(g.tick(6).completed,1);
 assert.equal(g.get(p).output.key,'charcoal');
 assert.equal(g.get(p).input.qty,2);
 assert.equal(g.take(p,'output',1).qty,1);
 assert.equal(g.tick(10).completed,1);
 assert.equal(g.get(p).output.key,'charcoal');
});

test('charcoal cannot overwrite an incompatible occupied furnace output',()=>{
 const f=api.create();
 f.restore([{...p,input:{key:'block:40',qty:2},
   fuel:{key:'coal',qty:1},output:{key:'iron',qty:2}}]);
 assert.equal(f.tick(10).completed,0);
 assert.equal(f.get(p).input.qty,2);
 assert.equal(f.get(p).output.key,'iron');
 assert.equal(f.take(p,'output').qty,2);
 assert.equal(f.tick(10).completed,1);
 assert.equal(f.get(p).output.key,'charcoal');
});

test('desktop/mobile Chrome smoke exercises real cherry-log furnace UI with synthetic pack',()=>{
 const smoke=fs.readFileSync(path.join(root,'scripts/browser-smoke.cjs'),'utf8');
 assert.match(smoke,/grantLoot\('block:40',1\)/);
 assert.match(smoke,/selectOption\('block:40'\)/);
 assert.match(smoke,/output\?\.key==='charcoal'/);
 assert.match(smoke,/desktop-furnace-cherry-charcoal-synthetic\.png/);
 assert.match(smoke,/mobile-furnace-cherry-charcoal-synthetic\.png/);
});
