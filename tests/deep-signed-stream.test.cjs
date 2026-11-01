/* Signed horizontal origins in the opt-in deep chunk stream.
 * Original MineWorld test fixture; no proprietary game assets. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx=vm.createContext({window:{}});
for(const file of ['world-depth.js','section-neighborhood.js'])
 vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx,{filename:file});
const depth=ctx.window.MineWorldWorldDepth;
const makeStream=ctx.window.MineWorldSectionNeighborhood.createDeepChunkStream;
const profile={minX:-32,minZ:-32,width:64,depth:64};
const codec=depth.create({...profile,minY:-64,maxY:319});
const generator=(cx,cz,edits)=>{
 const store=depth.createSectionStore({data:new Uint8Array(16*16*384),
  minY:-64,height:384,chunkSize:16,sectionHeight:16});
 for(const [index,block] of edits){
  const p=codec.decode(index);
  store.set(p.x-cx*16,p.y,p.z-cz*16,block);
 }
 return store;
};
const make=(options={})=>makeStream({...profile,generator,...options});
test('signed chunks preserve negative X/Z blocks and saved edits through eviction',()=>{
 const original=new Map([[codec.index(-31,-64,-31),7]]);
 const stream=make({maxLoaded:1,edits:original});
 stream.load(-2,-2);
 assert.equal(stream.getWorld(-31,-64,-31),7);
 stream.load(-1,-1); // (-1,-1) is a different chunk from (-31,-31).
 stream.setWorld(-1,-63,-1,21);
 stream.load(0,0);
 assert.equal(stream.getWorld(-1,-63,-1),null);
 stream.load(-1,-1);
 assert.equal(stream.getWorld(-1,-63,-1),21);
 assert.equal(stream.snapshotEdits().get(codec.index(-1,-63,-1)),21);
 assert.equal(original.size,1);
});
test('negative-to-positive chunk seam invalidates neighbor mesh',()=>{
 const stream=make({maxLoaded:2});
 const west=stream.load(-1,0),east=stream.load(0,0);
 west.takeDirtySections();east.takeDirtySections();
 stream.setWorld(-1,-64,1,8);
 assert.deepEqual([...east.dirtySections()],[0]);
 assert.equal(stream.getWorld(-1,-64,1),8);
 assert.equal(stream.getWorld(0,-64,1),0);
});
test('signed loadAround clips to negative world corner and honors residency limit',()=>{
 const stream=make({maxLoaded:9});
 assert.equal(stream.loadAround(-31,-31,1).length,4);
 assert.ok(stream.loadedChunks().includes('-2,-2'));
 assert.equal(stream.loadAround(-1,-1,1).length,9);
 assert.equal(stream.stats().loaded,9);
 const old=stream.loadedChunks();
 assert.throws(()=>stream.loadAround(-1,-1,2),/residency budget/);
 assert.deepEqual(stream.loadedChunks(),old);
});
test('signed collision and sweeps distinguish loaded air from missing chunks',()=>{
 const stream=make({maxLoaded:2});stream.load(-1,-1);
 const box={minX:-1.8,maxX:-1.2,minY:0,maxY:1,minZ:-1.8,maxZ:-1.2};
 const solid=()=>true;
 assert.equal(stream.sampleCollision(box,solid).state,'clear');
 const first=stream.sweepCollision(box,{x:2,y:0,z:0},solid);
 assert.equal(first.state,'unloaded');
 stream.load(0,-1);stream.setWorld(0,0,-2,11);
 const next=stream.sweepCollision(box,{x:2,y:0,z:0},solid);
 assert.equal(next.state,'solid');
 assert.equal(next.hit.x,0);
 assert.throws(()=>stream.sampleCollision({...box,minX:-33},solid),/bounds/);
});
test('signed profiles require aligned safe bounds and a custom generator',()=>{
 for(const options of [{...profile,minX:-31},{...profile,width:63},
  {...profile,depth:15},{...profile,minX:Number.MAX_SAFE_INTEGER},
  {...profile,minZ:1.5}]){
  assert.throws(()=>makeStream({...options,generator}),/horizontal profile/);
 }
 assert.throws(()=>makeStream(profile),/custom generator/);
 const stream=make();
 assert.throws(()=>stream.load(-3,-2),/outside/);
 assert.throws(()=>stream.load(2,0),/outside/);
 assert.throws(()=>stream.setWorld(-33,-64,-1,1),/Invalid deep-world/);
 assert.equal(stream.getWorld(-33,-64,-1),null);
});
test('legacy default stream keeps its positive 10,000-block world profile',()=>{
 const stream=makeStream({generator:()=>depth.createSectionStore({
  data:new Uint8Array(16*16*384),minY:-64,height:384,chunkSize:16
 })});
 assert.equal(stream.codec.minX,0);
 assert.equal(stream.codec.minZ,0);
 assert.equal(stream.codec.width,10000);
 assert.equal(stream.codec.depth,10000);
 stream.load(0,0);
 assert.equal(stream.getWorld(0,-64,0),0);
 assert.throws(()=>stream.load(-1,0),/outside/);
});
