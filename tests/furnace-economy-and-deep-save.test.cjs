/* Executable furnace economy and legacy-save regression checks. Original test code. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'..','furnace-engine.js'),'utf8');
const sandbox={window:{}};
vm.runInNewContext(source,sandbox,{filename:'furnace-engine.js',timeout:2000});
const {create}=sandbox.window.MineWorldFurnace;
const pos={dimension:'overworld',x:-8,y:-64,z:-9};
const plain=value=>JSON.parse(JSON.stringify(value));
test('coal yields eight smelts in both furnace and smoker, without free extra fuel',()=>{
 for(const [kind,ingredient,product] of [['furnace','rawIron','iron'],['smoker','chicken','cookedChicken']]){
  const engine=create();
  engine.ensure(pos,kind);
  assert.equal(engine.insert(pos,'input',ingredient,9),9);
  assert.equal(engine.insert(pos,'fuel','coal',1),1);
  assert.equal(engine.tick(60).completed,kind==='furnace'?6:8);
  assert.equal(engine.tick(60).completed,kind==='furnace'?2:0);
  assert.deepEqual(plain(engine.status(pos).output),{key:product,qty:8});
  assert.equal(engine.status(pos).input.qty,1);
  assert.equal(engine.status(pos).readyToSmelt,false);
 }
});
test('malformed elapsed time cannot ignite or mutate a saved furnace',()=>{
 const engine=create();
 engine.insert(pos,'input','rawIron',1);
 engine.insert(pos,'fuel','coal',1);
 const before=plain(engine.snapshot());
 for(const seconds of [NaN,Infinity,-1,0,'10',null]){
  assert.deepEqual(plain(engine.tick(seconds)),{changed:false,completed:0});
  assert.deepEqual(plain(engine.snapshot()),before);
 }
});
test('deep negative coordinates remain distinct from positive positions after restore',()=>{
 const engine=create();
 const positive={...pos,x:8,z:9};
 engine.insert(pos,'input','rawIron',1);
 engine.insert(positive,'input','rawGold',1);
 const restored=create();
 restored.restore(plain(engine.snapshot()));
 assert.equal(restored.status(pos).input.key,'rawIron');
 assert.equal(restored.status(positive).input.key,'rawGold');
});
