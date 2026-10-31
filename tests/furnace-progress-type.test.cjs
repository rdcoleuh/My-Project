/* Malformed save values must never grant free furnace cook time. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','furnace-engine.js'),'utf8'),ctx);
const api=ctx.window.MineWorldFurnace;
const p={dimension:'overworld',x:190,y:14,z:190};

test('coercible nonnumeric progress cannot award almost-finished smelts on load',()=>{
 for(const progress of ['9',true,[9],null,false,'4.5']){
  const f=api.create();
  f.restore([{...p,input:{key:'rawIron',qty:1},fuel:{key:'coal',qty:1},progress}]);
  assert.equal(f.get(p).progress,0,String(progress));
  assert.equal(f.tick(1).completed,0,'one second must not finish a corrupted cook');
  assert.equal(f.get(p).progress,1);
 }
});

test('nonfinite, negative, and completed cook values are sanitized',()=>{
 for(const progress of [NaN,Infinity,-Infinity,-1,10,1e100]){
  const f=api.create();
  f.restore([{...p,input:{key:'rawIron',qty:1},fuel:{key:'coal',qty:1},progress}]);
  assert.equal(f.get(p).progress,0,String(progress));
 }
});

test('legitimate numeric partial cooking survives saves for all three stations',()=>{
 for(const [kind,input,progress,remaining] of [
  ['furnace','rawIron',9.25,.75],
  ['smoker','raw',4.25,.75],
  ['blast','rawGold',4.25,.75]
 ]){
  const f=api.create();
  f.restore([{...p,kind,input:{key:input,qty:2},fuel:{key:'coal',qty:1},progress}]);
  assert.equal(f.get(p).progress,progress);
  const restored=api.create();
  restored.restore(JSON.parse(JSON.stringify(f.snapshot())));
  assert.equal(restored.get(p).progress,progress);
  assert.equal(restored.tick(remaining).completed,1);
  assert.equal(restored.get(p).input.qty,1);
 }
});

test('malformed progress cannot contaminate a later legitimate save',()=>{
 const f=api.create();
 f.restore([{...p,input:{key:'rawIron',qty:2},fuel:{key:'coal',qty:1},progress:'9'}]);
 const g=api.create();g.restore(JSON.parse(JSON.stringify(f.snapshot())));
 assert.equal(g.get(p).progress,0);
 assert.equal(g.tick(9).completed,0);
 assert.equal(g.tick(1).completed,1);
 assert.equal(g.get(p).output.qty,1);
});
