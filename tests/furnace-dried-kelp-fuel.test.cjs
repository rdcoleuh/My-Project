/* Craftable dried kelp fuel must smelt twenty items without creating free fuel. */
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({window:{}});
for(const file of ['furnace-engine.js','survival-catalog.js'])
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
const api=ctx.window.MineWorldFurnace,recipes=ctx.window.MineWorldCatalog.recipes;
const p={dimension:'overworld',x:5000,y:14,z:5000};
test('nine dried kelp craft one fuel item and can be unpacked without loss',()=>{
 const compact=recipes.find(r=>r.name==='Dried Kelp Fuel Block');
 const unpack=recipes.find(r=>r.name==='Unpack Dried Kelp Fuel Block');
 assert.ok(compact&&unpack);
 assert.equal(compact.station,'table');
 assert.equal(compact.cost.driedKelp,9);
 assert.equal(compact.give.driedKelpBlock,1);
 assert.equal(unpack.cost.driedKelpBlock,1);
 assert.equal(unpack.give.driedKelp,9);
 assert.equal(api.FUEL.driedKelpBlock,200);
});
test('one dried kelp fuel item smelts exactly twenty normal items',()=>{
 const f=api.create();
 assert.equal(f.insert(p,'input','rawIron',21),21);
 assert.equal(f.insert(p,'fuel','driedKelpBlock',1),1);
 let completed=0;
 for(let i=0;i<4;i++)completed+=f.tick(60).completed;
 assert.equal(completed,20);
 assert.equal(f.get(p).output.key,'iron');
 assert.equal(f.get(p).output.qty,20);
 assert.equal(f.get(p).input.qty,1);
 assert.equal(f.get(p).burn,0);
 assert.equal(f.get(p).fuel,null);
 assert.equal(f.tick(60).completed,0,'no free twenty-first smelt');
});
test('smoker halves both fuel duration and cooking time',()=>{
 const f=api.create();f.ensure(p,'smoker');
 assert.equal(f.insert(p,'input','chicken',21),21);
 assert.equal(f.insert(p,'fuel','driedKelpBlock',1),1);
 assert.equal(f.tick(60).completed,12);
 assert.equal(f.tick(60).completed,8);
 assert.equal(f.get(p).output.qty,20);
 assert.equal(f.get(p).input.qty,1);
 assert.equal(f.get(p).burn,0);
});
test('partially consumed fuel and progress persist across save and restore',()=>{
 const f=api.create();
 f.insert(p,'input','rawIron',2);f.insert(p,'fuel','driedKelpBlock',1);
 f.tick(7);
 const snapshot=JSON.parse(JSON.stringify(f.snapshot()));
 const restored=api.create();restored.restore(snapshot);
 assert.equal(restored.get(p).burn,193);
 assert.equal(restored.get(p).progress,7);
 assert.equal(restored.tick(3).completed,1);
 assert.equal(restored.get(p).output.qty,1);
 assert.equal(restored.get(p).burn,190);
});
