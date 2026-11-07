'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ctx={window:{}};
vm.runInNewContext(fs.readFileSync(require.resolve('../furnace-engine.js'),'utf8'),ctx);
const api=ctx.window.MineWorldFurnace;
const p={dimension:'overworld',x:-4,y:-64,z:7};
function setup(kind='furnace'){
 const e=api.create();assert.ok(e.ensure(p,kind));return e;
}
test('deep negative-coordinate furnaces persist without aliasing',()=>{
 const e=setup();e.insert(p,'input','rawIron',1);e.insert(p,'fuel','coal',1);
 e.tick(3);
 const restored=api.create();restored.restore(JSON.parse(JSON.stringify(e.snapshot())));
 assert.equal(restored.get(p).progress,3);
 assert.equal(restored.tick(7).completed,1);
 assert.equal(restored.take(p,'output',1).key,'iron');
 assert.equal(restored.get({...p,x:4}),null);
});
test('station conversion preserves remaining fuel capacity, never duplicates progress',()=>{
 const e=setup();e.insert(p,'input','rawIron',2);e.insert(p,'fuel','coal',1);
 e.tick(4);
 assert.equal(e.get(p).burn,76);
 e.ensure(p,'blast');
 assert.equal(e.get(p).progress,0);
 assert.equal(e.get(p).burn,38);
 assert.equal(e.get(p).burnTotal,40);
 assert.equal(e.tick(5).completed,1);
 e.ensure(p,'furnace');
 assert.equal(e.get(p).progress,0);
 assert.equal(e.get(p).burn,66);
 assert.equal(e.get(p).output.qty,1);
});
test('invalid station positions cannot create phantom furnace records',()=>{
 const e=api.create();
 for(const y of [-65,320,NaN,Infinity]){
  assert.equal(e.ensure({...p,y}),null);
 }
 assert.equal(e.snapshot().length,0);
});
test('duplicate saved positions keep first inventory and output',()=>{
 const e=setup();e.insert(p,'input','rawGold',1);
 const first=e.snapshot()[0];
 const second={...first,input:{key:'rawIron',qty:64},output:{key:'iron',qty:64}};
 const loaded=api.create();loaded.restore([first,second]);
 assert.equal(loaded.get(p).input.key,'rawGold');
 assert.equal(loaded.get(p).output,null);
});
