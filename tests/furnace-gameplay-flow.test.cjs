/* Furnace gameplay regression: fuel, three slots, progress, and save/reload. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','furnace-engine.js'),'utf8'),ctx);
const api=ctx.window.MineWorldFurnace;
const p={dimension:'overworld',x:12,y:12,z:14};
const copy=v=>JSON.parse(JSON.stringify(v));

test('three furnace slots, partial smelt, save/reload and output retrieval',()=>{
 const f=api.create();
 assert.equal(f.ensure(p,'furnace').kind,'furnace');
 assert.equal(f.insert(p,'input','rawIron',2),2);
 assert.equal(f.insert(p,'fuel','coal',1),1);
 assert.equal(f.tick(4).completed,0);
 assert.equal(f.get(p).progress,4);
 assert.equal(f.get(p).fuel,null);
 assert.equal(f.get(p).output,null);
 const resumed=api.create();
 resumed.restore(copy(f.snapshot()));
 assert.equal(resumed.tick(6).completed,1);
 assert.equal(resumed.get(p).input.qty,1);
 assert.equal(resumed.get(p).output.key,'iron');
 assert.equal(resumed.take(p,'output',1).qty,1);
 assert.equal(resumed.tick(10).completed,1);
 assert.equal(resumed.get(p).input,null);
 assert.equal(resumed.take(p,'output',64).qty,1);
 assert.equal(resumed.get(p).output,null);
});

test('output backpressure prevents ingredient loss and fuel ignition',()=>{
 const f=api.create();
 f.restore([{...p,kind:'furnace',input:{key:'rawIron',qty:2},
  fuel:{key:'coal',qty:1},output:{key:'iron',qty:64},burn:0,burnTotal:0,progress:0}]);
 assert.equal(f.tick(30).completed,0);
 assert.equal(f.get(p).input.qty,2);
 assert.equal(f.get(p).fuel.qty,1);
 assert.equal(f.take(p,'output',1).qty,1);
 assert.equal(f.tick(10).completed,1);
 assert.equal(f.get(p).output.qty,64);
 assert.equal(f.get(p).input.qty,1);
});

test('smoker rejects ore, blast furnace rejects food; each uses fuel at matching rate',()=>{
 const smoker=api.create();
 smoker.ensure(p,'smoker');
 assert.equal(smoker.insert(p,'input','rawIron',1),0);
 assert.equal(smoker.insert(p,'input','chicken',1),1);
 assert.equal(smoker.insert(p,'fuel','coal',1),1);
 assert.equal(smoker.tick(5).completed,1);
 assert.equal(smoker.get(p).output.key,'cookedChicken');
 const blast=api.create();
 blast.ensure(p,'blast');
 assert.equal(blast.insert(p,'input','chicken',1),0);
 assert.equal(blast.insert(p,'input','rawIron',1),1);
 assert.equal(blast.insert(p,'fuel','coal',1),1);
 assert.equal(blast.tick(5).completed,1);
 assert.equal(blast.get(p).output.key,'iron');
});

test('invalid elapsed time never advances or burns furnace inventory',()=>{
 const f=api.create();
 f.ensure(p);
 f.insert(p,'input','rawIron',1);
 f.insert(p,'fuel','coal',1);
 const before=copy(f.snapshot());
 for(const value of [Infinity,NaN,-1,0,'10',null]){
  assert.equal(f.tick(value).completed,0);
  assert.deepEqual(copy(f.snapshot()),before);
 }
});
