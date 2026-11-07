'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../furnace-engine.js'),'utf8');
const context={window:{}};
vm.runInNewContext(source,context,{filename:'furnace-engine.js'});
const engine=context.window.MineWorldFurnace;
const at={dimension:'overworld',x:12,y:10,z:13};
function machine(){const world=engine.create();assert.ok(world.ensure(at,'furnace'));return world;}
test('three-slot furnace smelts iron, consumes fuel and persists output',()=>{
 const world=machine();
 assert.equal(world.insert(at,'input','rawIron',2),2);
 assert.equal(world.insert(at,'fuel','coal',1),1);
 assert.equal(world.insert(at,'output','iron',1),0);
 const result=world.tick(20);
 assert.equal(result.completed,2);
 const saved=JSON.parse(JSON.stringify(world.snapshot()));
 const loaded=engine.create();loaded.restore(saved);
 const output=loaded.take(at,'output',64);
 assert.equal(output.key,'iron');assert.equal(output.qty,2);
 assert.equal(loaded.get(at).input,null);
 assert.equal(loaded.get(at).burn,60);
});
test('furnace save resumes partially cooked input without duplicating items',()=>{
 const world=machine();world.insert(at,'input','rawGold',2);world.insert(at,'fuel','coal',1);
 world.tick(4);
 const saved=JSON.parse(JSON.stringify(world.snapshot()));
 const loaded=engine.create();loaded.restore(saved);
 assert.equal(loaded.get(at).progress,4);
 assert.equal(loaded.tick(6).completed,1);
 assert.equal(loaded.get(at).output.key,'gold');
 assert.equal(loaded.get(at).output.qty,1);
 assert.equal(loaded.get(at).input.qty,1);
});
test('invalid elapsed times cannot consume fuel or create output',()=>{
 const world=machine();world.insert(at,'input','rawIron',1);world.insert(at,'fuel','coal',1);
 const initial=JSON.stringify(world.snapshot());
 for(const delta of [NaN,Infinity,-Infinity,-1,'20',null,0]){
  assert.equal(world.tick(delta).completed,0);
  assert.equal(JSON.stringify(world.snapshot()),initial);
 }
});
test('lava bucket returns an empty bucket and legacy stacked buckets remain withdrawable',()=>{
 const world=machine();world.insert(at,'input','rawIron',1);
 assert.equal(world.insert(at,'fuel','lavaBucket',2),1);
 world.tick(1);
 assert.equal(world.get(at).fuel.key,'bucket');
 assert.equal(world.take(at,'fuel',1).key,'bucket');
 const saved=world.snapshot();saved[0].fuel={key:'lavaBucket',qty:2};saved[0].burn=0;saved[0].burnTotal=0;
 const loaded=engine.create();loaded.restore(saved);
 loaded.tick(1);
 assert.equal(loaded.get(at).fuel.qty,2);
 assert.equal(loaded.take(at,'fuel',2).qty,2);
});
