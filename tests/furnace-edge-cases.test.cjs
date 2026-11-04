/* Furnace edge cases: deep coordinates, container fuel, and output safety. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const context=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','furnace-engine.js'),'utf8'),context);
const api=context.window.MineWorldFurnace;
const clone=v=>JSON.parse(JSON.stringify(v));

test('signed deep-world coordinates survive save/reload without aliasing legacy positions',()=>{
 const f=api.create();
 const deep={dimension:'overworld',x:-3,y:-64,z:-9};
 const high={dimension:'overworld',x:-3,y:319,z:-9};
 const legacy={dimension:'overworld',x:3,y:0,z:9};
 for(const [p,item] of [[deep,'rawIron'],[high,'rawGold'],[legacy,'rawCopper']]){
  assert.ok(f.ensure(p));
  assert.equal(f.insert(p,'input',item,1),1);
 }
 const resumed=api.create();
 resumed.restore(clone(f.snapshot()));
 assert.equal(resumed.get(deep).input.key,'rawIron');
 assert.equal(resumed.get(high).input.key,'rawGold');
 assert.equal(resumed.get(legacy).input.key,'rawCopper');
 assert.equal(resumed.ensure({...deep,y:-65}),null);
 assert.equal(resumed.ensure({...high,y:320}),null);
});

test('lava bucket is nonstackable and returns its empty container',()=>{
 const p={dimension:'overworld',x:1,y:20,z:1},f=api.create();
 f.ensure(p);
 assert.equal(f.insert(p,'input','rawIron',1),1);
 assert.equal(f.insert(p,'fuel','lavaBucket',2),1);
 assert.equal(f.tick(10).completed,1);
 assert.equal(f.get(p).fuel.key,'bucket');
 assert.equal(f.get(p).fuel.qty,1);
 assert.equal(f.take(p,'fuel',1).key,'bucket');
 assert.equal(f.get(p).output.key,'iron');
});

test('incompatible output blocks smelting without overwriting saved items',()=>{
 const p={dimension:'overworld',x:2,y:22,z:2},f=api.create();
 f.restore([{...p,kind:'furnace',input:{key:'rawIron',qty:1},
  fuel:{key:'coal',qty:1},output:{key:'custom:artifact',qty:4},
  burn:0,burnTotal:0,progress:0}]);
 assert.equal(f.tick(20).completed,0);
 assert.equal(f.get(p).output.key,'custom:artifact');
 assert.equal(f.get(p).input.qty,1);
 assert.equal(f.get(p).fuel.qty,1);
 assert.equal(f.take(p,'output',4).qty,4);
 assert.equal(f.tick(10).completed,1);
 assert.equal(f.get(p).output.key,'iron');
});
