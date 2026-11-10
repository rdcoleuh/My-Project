/* Deep-world furnace persistence and fuel accounting regression. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','furnace-engine.js'),'utf8'),ctx);
const engine=ctx.window.MineWorldFurnace;
const at=(x,y,z)=>({dimension:'overworld',x,y,z});
test('deep and upper-world furnaces preserve independent fractional progress across restore',()=>{
 const f=engine.create(),deep=at(-12,-64,-8),upper=at(12,319,8),legacy=at(12,14,8);
 for(const p of [deep,upper,legacy]){
  assert.ok(f.ensure(p,'furnace'));
  assert.equal(f.insert(p,'input','rawIron',2),2);
  assert.equal(f.insert(p,'fuel','coal',1),1);
 }
 assert.equal(f.tick(2.5).completed,0);
 const snapshot=JSON.parse(JSON.stringify(f.snapshot()));
 const restored=engine.create();
 restored.restore(snapshot);
 for(const p of [deep,upper,legacy]){
  assert.equal(restored.get(p).progress,2.5);
  assert.equal(restored.get(p).burn,77.5);
  assert.equal(restored.get(p).input.qty,2);
 }
 assert.equal(restored.tick(7.5).completed,3);
 for(const p of [deep,upper,legacy]){
  assert.equal(restored.get(p).output.qty,1);
  assert.equal(restored.get(p).input.qty,1);
 }
 assert.equal(restored.get(at(-12,319,-8)),null,'positions must not alias across heights');
});
test('invalid world heights cannot create or restore furnaces',()=>{
 const f=engine.create();
 for(const y of [-65,320,Infinity,NaN,1.5]){
  const p=at(1,y,1);
  assert.equal(f.ensure(p),null);
  f.restore([{...p,kind:'furnace',input:{key:'rawIron',qty:1}}]);
  assert.equal(f.snapshot().length,0);
 }
});
