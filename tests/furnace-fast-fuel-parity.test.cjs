/* Smoker/blast-furnace fuel must be consumed twice as fast as normal fuel.
 * Each station should smelt the same number of items per fuel unit. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../furnace-engine.js'),'utf8'),ctx);
const api=ctx.window.MineWorldFurnace,p={dimension:'overworld',x:5000,y:14,z:5000};
for(const [kind,input,burn] of [['furnace','rawIron',80],['smoker','chicken',40],['blast','rawIron',40]]){
 test(kind+' consumes one coal for eight smelts, not sixteen',()=>{
  const f=api.create();f.ensure(p,kind);
  assert.equal(f.insert(p,'input',input,9),9);
  assert.equal(f.insert(p,'fuel','coal',1),1);
  assert.equal(f.tick(1).changed,true);
  assert.equal(f.get(p).burnTotal,burn);
  f.tick(60);f.tick(60);
  assert.equal(f.get(p).output.qty,8);
  assert.equal(f.get(p).input.qty,1);
  assert.equal(f.get(p).burn,0);
  assert.equal(f.tick(60).completed,0,'the ninth item needs another fuel');
 });
}
test('four bamboo fuel items cook exactly one item in a smoker',()=>{
 const f=api.create();f.ensure(p,'smoker');
 f.insert(p,'input','chicken',2);f.insert(p,'fuel','bamboo',4);
 assert.equal(f.tick(5).completed,1);
 assert.equal(f.get(p).fuel,null);
 assert.equal(f.get(p).burn,0);
 assert.equal(f.get(p).input.qty,1);
 assert.equal(f.tick(5).completed,0);
});
test('fast-station fuel and progress survive a save/reload',()=>{
 const f=api.create();f.ensure(p,'blast');
 f.insert(p,'input','rawIron',2);f.insert(p,'fuel','coal',1);
 f.tick(2);
 const saved=JSON.parse(JSON.stringify(f.snapshot()));
 const g=api.create();g.restore(saved);
 assert.equal(g.get(p).kind,'blast');
 assert.equal(g.get(p).burnTotal,40);
 assert.equal(g.get(p).burn,38);
 assert.equal(g.get(p).progress,2);
 assert.equal(g.tick(3).completed,1);
 assert.equal(g.get(p).burn,35);
 assert.equal(saved[0].burn,38,'restoration must not mutate original saves');
});
test('older smoker saves retain already-burning fuel without deleting player progress',()=>{
 const f=api.create();
 f.restore([{...p,kind:'smoker',input:{key:'chicken',qty:2},
  fuel:null,output:null,burn:78,burnTotal:80,progress:2}]);
 assert.equal(f.get(p).burn,78);
 assert.equal(f.tick(3).completed,1);
 assert.equal(f.get(p).output.key,'cookedChicken');
 assert.equal(f.get(p).burn,75);
});
