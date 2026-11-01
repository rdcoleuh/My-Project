/* Bounded deep-world collision preflight; no live-world height switch. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx=vm.createContext({window:{}});
for(const file of ['world-depth.js','section-neighborhood.js'])
 vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx,{filename:file});
const depth=ctx.window.MineWorldWorldDepth;
const create=ctx.window.MineWorldSectionNeighborhood.createDeepChunkStream;
const codec=depth.create({width:10000,depth:10000,minY:-64,maxY:319,chunkSize:16});
function generate(cx,cz,edits){
 const store=depth.createSectionStore({data:new Uint8Array(16*16*384),minY:-64,height:384,chunkSize:16,sectionHeight:16});
 for(const [index,block] of edits){
  const p=codec.decode(index);
  store.set(p.x-cx*16,p.y,p.z-cz*16,block);
 }
 return store;
}
const solid=block=>block!==7;
const box=(minX,minY,minZ,maxX,maxY,maxZ)=>({minX,minY,minZ,maxX,maxY,maxZ});
test('a fresh or completely unloaded stream returns null instead of throwing',()=>{
 const s=create({generator:generate});
 assert.equal(s.getWorld(1,-64,1),null);
 assert.equal(s.getWorld(1,319,1),null);
 assert.equal(s.getWorld(-1,0,0),null);
 s.load(0,0);assert.equal(s.getWorld(1,0,1),0);
 assert.equal(s.unload(0,0),true);
 assert.equal(s.getWorld(1,0,1),null);
});
test('unloaded terrain blocks movement until its chunk is loaded',()=>{
 const s=create({generator:generate});
 const a=box(1,-64,1,1.8,-62.2,1.8);
 assert.equal(s.sampleCollision(a,solid).state,'unloaded');
 assert.equal(s.sampleCollision(a,solid).blocked,true);
 s.load(0,0);
 assert.equal(s.sampleCollision(a,solid).state,'clear');
});
test('deep collisions find bedrock-height solids and honor fluid rules',()=>{
 const s=create({generator:generate});s.load(0,0);
 s.setWorld(3,-64,3,170);s.setWorld(4,-64,3,7);
 const hit=s.sampleCollision(box(3.1,-64,3.1,3.9,-63.1,3.9),solid);
 assert.equal(hit.state,'solid');assert.equal(hit.hit.block,170);
 assert.equal(s.sampleCollision(box(4,-64,3,5,-63,4),solid).state,'clear');
 assert.equal(s.sampleCollision(box(4,-64,3,5,-63,4),()=>true).state,'solid');
});
test('exclusive AABB maxima avoid phantom collisions on block faces',()=>{
 const s=create({generator:generate});s.load(0,0);
 s.setWorld(2,319,2,5);
 assert.equal(s.sampleCollision(box(1,318,2,2,320,3),solid).state,'clear');
 assert.equal(s.sampleCollision(box(1.99,319,2,2.01,320,3),solid).state,'solid');
});
test('cross-chunk collision queries never interpret unloaded blocks as air',()=>{
 const s=create({generator:generate});s.load(0,0);
 assert.equal(s.sampleCollision(box(15.5,0,1,16.5,1,2),solid).state,'unloaded');
 s.load(1,0);
 assert.equal(s.sampleCollision(box(15.5,0,1,16.5,1,2),solid).state,'clear');
 s.setWorld(16,0,1,2);
 assert.equal(s.sampleCollision(box(15.5,0,1,16.5,1,2),solid).state,'solid');
});
test('invalid, oversized or untrusted collision boxes fail before sampling',()=>{
 const s=create({generator:generate});
 for(const b of [
  box(0,0,0,0,1,1),box(0,-65,0,1,-64,1),
  box(0,0,0,100,100,100),box(0,319,0,1,321,1),
  box(0,0,0,Infinity,1,1),box(-1,0,0,1,1,1)
 ])assert.throws(()=>s.sampleCollision(b,solid),/collision/);
 assert.throws(()=>s.sampleCollision(box(0,0,0,1,1,1),null),/predicate/);
 assert.equal(s.stats().loaded,0);
});
