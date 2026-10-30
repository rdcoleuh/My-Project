/* Namespaced future/custom item stacks are player property, even when no recipe exists. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ctx=vm.createContext({window:{}});
for(const file of ['furnace-engine.js','world-depth.js'])
 vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
const api=ctx.window.MineWorldFurnace;
const plan=ctx.window.MineWorldWorldDepth.planLegacySaveMigration;
const p={dimension:'overworld',x:2,y:14,z:3};
const base={version:13,worldSize:8,dimension:'overworld',edits:[],netherEdits:[],endEdits:[]};
const copy=x=>JSON.parse(JSON.stringify(x));

test('unknown namespaced stacks in all three furnace slots survive restore, snapshot and withdrawal',()=>{
 const original={...p,input:{key:'modded:ore/raw_cobalt',qty:4},
  fuel:{key:'modded:charcoal_brick',qty:3},
  output:{key:'other.mod:ingots/cobalt',qty:2}};
 const f=api.create();f.restore([original]);
 const m=f.get(p);
 assert.deepEqual(copy([m.input,m.fuel,m.output]),copy([original.input,original.fuel,original.output]));
 assert.equal(f.tick(60).completed,0,'unknown recipes must never smelt');
 assert.equal(m.burn,0,'unknown fuel must not ignite');
 const restored=api.create();restored.restore(copy(f.snapshot()));
 for(const which of ['input','fuel','output']){
  assert.deepEqual(copy(restored.take(p,which)),copy(original[which]));
  assert.equal(restored.get(p)[which],null);
 }
});

test('deep-world preflight preserves namespaced furnace inventory without rewriting source',()=>{
 const original={...p,input:{key:'modded:ore/raw_cobalt',qty:4},
  fuel:{key:'modded:charcoal_brick',qty:3},
  output:{key:'other.mod:ingots/cobalt',qty:2},
  progress:0,burn:0,burnTotal:0};
 const save={...base,furnaces:[original]},before=copy(save);
 const preview=plan(save,{width:8,depth:8});
 assert.equal(preview.status,'preview-only');
 assert.deepEqual(copy(preview.furnaces[0]),original);
 assert.equal(Object.isFrozen(preview.furnaces[0].input),true);
 assert.deepEqual(save,before,'preview must not mutate the original save');
});

test('malformed namespaced keys remain rejected in live restoration and preflight',()=>{
 const invalid=['block:0','mod:','mod:/ore','mod:../ore','mod:ore//piece',
  'bad!mod:ore','mod:ore?x','constructor','__proto__','mod:ore/'];
 for(const key of invalid){
  const f=api.create();f.restore([{...p,input:{key,qty:1}}]);
  assert.equal(f.get(p).input,null,'live rejected '+key);
  assert.throws(()=>plan({...base,furnaces:[{...p,input:{key,qty:1}}]},
   {width:8,depth:8}),/Invalid saved furnace/,'preflight rejected '+key);
 }
});

test('legacy recipes still smelt and custom namespaced deposits remain inert',()=>{
 const f=api.create();
 assert.equal(f.insert(p,'input','modded:ore/raw_cobalt',1),0);
 assert.equal(f.insert(p,'fuel','modded:charcoal_brick',1),0);
 assert.equal(f.insert(p,'input','rawIron',2),2);
 assert.equal(f.insert(p,'fuel','coal',1),1);
 assert.equal(f.tick(10).completed,1);
 assert.equal(f.get(p).output.key,'iron');
 assert.equal(f.get(p).input.qty,1);
});
