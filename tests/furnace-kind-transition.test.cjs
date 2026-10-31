/* Explicit station-type changes must preserve fuel energy without changing ordinary insert behavior. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','furnace-engine.js'),'utf8'),ctx);
const api=ctx.window.MineWorldFurnace;
const p={dimension:'overworld',x:517,y:-25,z:518};

test('reopening a smoker as a regular furnace corrects the saved kind',()=>{
 const f=api.create();
 f.ensure(p,'smoker');
 assert.equal(f.get(p).kind,'smoker');
 f.ensure(p,'furnace');
 assert.equal(f.get(p).kind,'furnace');
 assert.equal(f.insert(p,'input','rawIron',1),1,'regular furnace accepts ores');
 assert.equal(f.insert(p,'fuel','coal',1),1);
 assert.equal(f.tick(10).completed,1);
 assert.equal(f.get(p).output.key,'iron');
});

test('switching from a furnace to a smoker preserves remaining fuel capacity',()=>{
 const f=api.create();
 f.insert(p,'input','chicken',10);
 f.insert(p,'fuel','coal',1);
 assert.equal(f.tick(10).completed,1);
 assert.equal(f.get(p).burn,70);
 assert.equal(f.get(p).burnTotal,80);
 f.ensure(p,'smoker');
 assert.equal(f.get(p).burn,35);
 assert.equal(f.get(p).burnTotal,40);
 assert.equal(f.get(p).input.qty,9);
 assert.equal(f.get(p).output.qty,1);
 assert.equal(f.tick(35).completed,7);
 assert.equal(f.get(p).output.qty,8,'one coal still cooks eight total');
 assert.equal(f.tick(5).completed,0,'no ninth free item');
});

test('switching back from a blast furnace preserves unspent fuel energy',()=>{
 const f=api.create();
 f.ensure(p,'blast');
 f.insert(p,'input','rawIron',3);
 f.insert(p,'fuel','coal',1);
 assert.equal(f.tick(5).completed,1);
 assert.equal(f.get(p).burn,35);
 f.ensure(p,'furnace');
 assert.equal(f.get(p).burn,70);
 assert.equal(f.get(p).burnTotal,80);
 assert.equal(f.get(p).progress,0);
 assert.equal(f.tick(10).completed,1);
 assert.equal(f.get(p).output.qty,2);
 assert.equal(f.get(p).burn,60);
});

test('explicit kind changes reset partial progress but preserve inventory stacks',()=>{
 const f=api.create();
 f.insert(p,'input','chicken',3);
 f.insert(p,'fuel','coal',1);
 f.tick(4);
 assert.equal(f.get(p).progress,4);
 f.ensure(p,'smoker');
 assert.equal(f.get(p).progress,0);
 assert.equal(f.get(p).input.qty,3);
 assert.equal(f.get(p).burn,38);
 assert.equal(f.tick(4).completed,0,'partial progress from the old station cannot carry over');
 assert.equal(f.tick(1).completed,1);
});

test('ordinary insert never silently changes a specialized station type',()=>{
 const f=api.create();
 f.ensure(p,'smoker');
 assert.equal(f.insert(p,'input','chicken',2),2);
 assert.equal(f.insert(p,'fuel','coal',1),1);
 assert.equal(f.ensure(p).kind,'smoker');
 assert.equal(f.get(p).kind,'smoker');
 assert.equal(f.insert(p,'input','rawIron',1),0,'smoker cannot accept ore');
});

test('invalid explicit kind leaves an existing furnace unchanged',()=>{
 const f=api.create();
 f.insert(p,'input','rawIron',2);
 assert.equal(f.ensure(p,'kiln'),null);
 assert.equal(f.get(p).kind,'furnace');
 assert.equal(f.get(p).input.qty,2);
});

test('converted stations preserve the corrected kind and fuel after save/restore',()=>{
 const f=api.create();
 f.insert(p,'input','chicken',5);
 f.insert(p,'fuel','coal',1);
 f.tick(10);
 f.ensure(p,'smoker');
 const saved=JSON.parse(JSON.stringify(f.snapshot()));
 const g=api.create();g.restore(saved);
 assert.equal(g.get(p).kind,'smoker');
 assert.equal(g.get(p).burn,35);
 assert.equal(g.get(p).burnTotal,40);
 assert.equal(g.tick(5).completed,1);
 assert.equal(g.get(p).output.qty,2);
});
