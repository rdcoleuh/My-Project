/* Deep-world furnaces must support signed chunk coordinates without aliasing
 * old dense-array block indices or changing existing positive-coordinate saves. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','furnace-engine.js'),'utf8'),ctx);
const furnace=ctx.window.MineWorldFurnace;
const clone=value=>JSON.parse(JSON.stringify(value));
const at=(x,z,y=-64,dimension='overworld')=>({dimension,x,y,z});
test('negative X/Z furnaces smelt and survive save/reload at the new minimum Y',()=>{
 const p=at(-1,-16),f=furnace.create();
 assert.equal(f.insert(p,'input','rawIron',2),2);
 assert.equal(f.insert(p,'fuel','coal',1),1);
 assert.equal(f.tick(10).completed,1);
 const restored=furnace.create();restored.restore(clone(f.snapshot()));
 assert.equal(restored.get(p).output.key,'iron');
 assert.equal(restored.get(p).input.qty,1);
 assert.equal(restored.tick(10).completed,1);
 assert.equal(restored.take(p,'output').qty,2);
});
test('signed furnace keys do not alias zero or neighboring chunk coordinates',()=>{
 const f=furnace.create();
 const coords=[at(-1,-1),at(0,0),at(-16,-16),at(-17,-16),at(16,16)];
 for(let i=0;i<coords.length;i++){
  assert.ok(f.ensure(coords[i]));
  assert.equal(f.insert(coords[i],'input','rawIron',i+1),i+1);
 }
 assert.equal(f.snapshot().length,coords.length);
 for(let i=0;i<coords.length;i++)assert.equal(f.get(coords[i]).input.qty,i+1);
 assert.equal(f.get(at(-1,-1,0)),null,'different heights are independent');
 assert.equal(f.get(at(-1,-1,-64,'nether')),null,'dimensions are independent');
});
test('coordinate limits reject out-of-range and non-safe values',()=>{
 const f=furnace.create();
 for(const p of [at(-10000,0),at(0,-10000),at(10000,0),at(0,10000),
   at(-1.5,0),at(0,Number.MAX_SAFE_INTEGER+1),at(0,0,-65),at(0,0,320)]){
  assert.equal(f.ensure(p),null);
  assert.equal(f.insert(p,'fuel','coal',1),0);
 }
 assert.ok(f.ensure(at(-9999,-9999)));
 assert.ok(f.ensure(at(9999,9999,319)));
});
test('legacy blast-block conversion never aliases a negative coordinate into a valid array index',()=>{
 const f=furnace.create(),p=at(-1,4,10);
 assert.ok(f.ensure(p,'blast'));
 const edits=new Map([[7,158]]);
 const converted=f.migrateLegacyBlastBlocks({overworld:edits},()=>7);
 assert.equal(converted,0);
 assert.equal(edits.get(7),158);
 const positive=at(3,4,10);
 assert.ok(f.ensure(positive,'blast'));
 assert.equal(f.migrateLegacyBlastBlocks({overworld:edits},x=>x===3?7:999),1);
 assert.equal(edits.get(7),156);
});
test('legacy positive-coordinate furnaces remain compatible with signed saves',()=>{
 const p=at(5000,5001,14),f=furnace.create();
 assert.equal(f.insert(p,'input','rawGold',3),3);
 assert.equal(f.insert(p,'fuel','coal',1),1);
 const g=furnace.create();g.restore(clone(f.snapshot()));
 assert.equal(g.get(p).input.qty,3);
 assert.equal(g.tick(10).completed,1);
 assert.equal(g.get(p).output.key,'gold');
});
