/* Non-stackable lava-bucket fuel must preserve the empty container and saves. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','furnace-engine.js'),'utf8'),ctx);
const furnace=ctx.window.MineWorldFurnace;
const p={dimension:'overworld',x:-12,y:-24,z:3};

test('one lava bucket fuels a furnace for 1000 seconds and leaves an empty bucket',()=>{
 const f=furnace.create();
 assert.equal(f.insert(p,'input','rawIron',64),64);
 assert.equal(f.insert(p,'fuel','lavaBucket',1),1);
 assert.equal(f.tick(60).completed,6);
 assert.equal(f.get(p).burn,940);
 assert.equal(f.get(p).burnTotal,1000);
 assert.equal(f.get(p).output.qty,6);
 assert.equal(f.get(p).fuel.key,'bucket');
 assert.equal(f.get(p).fuel.qty,1);
 assert.equal(f.insert(p,'fuel','coal',1),0,'empty bucket must be removed first');
 assert.equal(f.take(p,'fuel',1).key,'bucket');
 assert.equal(f.insert(p,'fuel','coal',1),1);
});

test('lava buckets are non-stackable in the fuel slot',()=>{
 const f=furnace.create();
 assert.equal(f.insert(p,'fuel','lavaBucket',64),1);
 assert.equal(f.insert(p,'fuel','lavaBucket',1),0);
 assert.equal(f.get(p).fuel.qty,1);
});

test('legacy stacked lava-bucket fuel is preserved and cannot silently lose containers',()=>{
 const f=furnace.create();
 f.restore([{...p,input:{key:'rawIron',qty:2},fuel:{key:'lavaBucket',qty:2}}]);
 assert.equal(f.insert(p,'fuel','lavaBucket',1),0,'overfull slot cannot yield a negative transfer');
 assert.equal(f.get(p).fuel.qty,2);
 assert.equal(f.tick(10).completed,0);
 assert.equal(f.get(p).burn,0);
 assert.equal(f.get(p).fuel.qty,2);
 assert.equal(f.take(p,'fuel',1).qty,1);
 assert.equal(f.tick(10).completed,1);
 assert.equal(f.get(p).fuel.key,'bucket');
});

test('smokers and blast furnaces consume lava fuel at double burn rate',()=>{
 for(const [kind,input] of [['smoker','chicken'],['blast','rawIron']]){
  const f=furnace.create();
  f.ensure(p,kind);
  assert.equal(f.insert(p,'input',input,1),1);
  assert.equal(f.insert(p,'fuel','lavaBucket',1),1);
  assert.equal(f.tick(5).completed,1);
  assert.equal(f.get(p).burnTotal,500);
  assert.equal(f.get(p).burn,495);
  assert.equal(f.get(p).fuel.key,'bucket');
 }
});

test('burning lava fuel and the returned bucket survive save/reload',()=>{
 const f=furnace.create();
 f.insert(p,'input','rawIron',3);f.insert(p,'fuel','lavaBucket',1);
 assert.equal(f.tick(10).completed,1);
 const saved=JSON.parse(JSON.stringify(f.snapshot()));
 const restored=furnace.create();restored.restore(saved);
 assert.equal(restored.get(p).burn,990);
 assert.equal(restored.get(p).fuel.key,'bucket');
 assert.equal(restored.tick(20).completed,2);
 assert.equal(restored.get(p).output.qty,3);
 assert.equal(restored.take(p,'fuel',1).key,'bucket');
});

test('fuel appears in the existing furnace picker and service worker is versioned',()=>{
 const ui=fs.readFileSync(path.join(__dirname,'..','furnace-ui.js'),'utf8');
 const sw=fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8');
 assert.ok(ui.includes('window.MineWorldFurnace.FUEL'));
 assert.ok(sw.includes('mineworld-6-154-lava-bucket-furnace'));
});
