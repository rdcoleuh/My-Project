/* MineWorld original furnace regression: restored fuel must never duplicate smelts. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','furnace-engine.js'),'utf8'),ctx);
const api=ctx.window.MineWorldFurnace;
const p={dimension:'overworld',x:-2,y:-64,z:7};
const roundtrip=f=>{const copy=api.create();copy.restore(JSON.parse(JSON.stringify(f.snapshot())));return copy;};

test('fractional cook and burn persist without duplicating coal across reloads',()=>{
 let f=api.create();
 f.ensure(p,'furnace');
 assert.equal(f.insert(p,'input','rawIron',9),9);
 assert.equal(f.insert(p,'fuel','coal',1),1);
 assert.equal(f.tick(3.25).completed,0);
 for(let i=0;i<8;i++){
  f=roundtrip(f);
  assert.equal(f.get(p).burn,76.75);
  assert.equal(f.get(p).progress,3.25);
 }
 assert.equal(f.tick(60).completed,6);
 f=roundtrip(f);
 assert.equal(f.tick(16.75).completed,2);
 assert.equal(f.get(p).output.qty,8);
 assert.equal(f.get(p).input.qty,1);
 assert.equal(f.get(p).burn,0);
 assert.equal(f.tick(60).completed,0,'no ninth free smelt');
});

test('full output blocks consumption through save and reload',()=>{
 let f=api.create();
 f.restore([{...p,kind:'furnace',input:{key:'rawIron',qty:2},
  fuel:{key:'coal',qty:1},output:{key:'iron',qty:64},
  burn:30,burnTotal:80,progress:5}]);
 assert.equal(f.status(p).outputBlocked,true);
 assert.equal(f.get(p).progress,0);
 f.tick(10);
 assert.equal(f.get(p).input.qty,2);
 assert.equal(f.get(p).fuel.qty,1);
 assert.equal(f.get(p).burn,20);
 f=roundtrip(f);
 assert.equal(f.take(p,'output',1).qty,1);
 assert.equal(f.tick(10).completed,1);
 assert.equal(f.get(p).output.qty,64);
 assert.equal(f.get(p).input.qty,1);
});

test('unregistered custom fuel survives reload but never ignites',()=>{
 let f=api.create();
 f.restore([{...p,kind:'furnace',input:{key:'rawIron',qty:1},
  fuel:{key:'modded:unknown_fuel',qty:3},burn:0,burnTotal:0,progress:0}]);
 f=roundtrip(f);
 assert.equal(f.status(p).idleReason,'invalid_fuel');
 assert.equal(f.tick(60).completed,0);
 assert.equal(f.take(p,'fuel',3).qty,3);
 assert.equal(f.get(p).output,null);
});
