/* Opt-in 384-layer swept collision regression tests; live movement unchanged. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx=vm.createContext({window:{}});
for(const name of ['world-depth.js','section-neighborhood.js'])
 vm.runInContext(fs.readFileSync(path.join(__dirname,'..',name),'utf8'),ctx,{filename:name});
const depth=ctx.window.MineWorldWorldDepth;
const create=ctx.window.MineWorldSectionNeighborhood.createDeepChunkStream;
const make=()=>create({generator:()=>depth.createSectionStore({
 data:new Uint8Array(16*16*384),minY:-64,height:384,chunkSize:16,sectionHeight:16
})});
const box=(minX,minY,minZ,maxX,maxY,maxZ)=>({minX,minY,minZ,maxX,maxY,maxZ});
const solid=block=>block!==7;
test('swept collision catches a solid voxel crossed between clear endpoints',()=>{
 const s=make();s.load(0,0);s.setWorld(6,0,1,4);
 const result=s.sweepCollision(box(1.1,0,1.1,1.8,1.8,1.8),{x:8.5,y:0,z:0},solid);
 assert.equal(result.state,'solid');assert.equal(result.hit.x,6);
 assert.ok(result.fraction>0&&result.fraction<1);
 assert.ok(result.samples<=65);
});
test('unloaded neighboring chunk blocks fast motion without being treated as air',()=>{
 const s=make();s.load(0,0);
 const start=box(15.2,0,1,15.6,1,2),motion={x:1,y:0,z:0};
 const first=s.sweepCollision(start,motion,solid);
 assert.equal(first.state,'unloaded');assert.equal(first.hit.x,16);
 s.load(1,0);
 assert.equal(s.sweepCollision(start,motion,solid).state,'clear');
});
test('negative-Y falling sweep detects solid floors and supports ceiling boundary',()=>{
 const s=make();s.load(0,0);s.setWorld(3,-63,3,170);
 const falling=s.sweepCollision(box(3.1,-60,3.1,3.9,-59,3.9),
   {x:0,y:-3,z:0},solid);
 assert.equal(falling.state,'solid');assert.equal(falling.hit.y,-63);
 const high=s.sweepCollision(box(1,318,1,1.5,319,1.5),
   {x:0,y:1,z:0},solid);
 assert.equal(high.state,'clear');
});
test('diagonal sweeps detect occupied cells and pass through fluids',()=>{
 const s=make();s.load(0,0);s.setWorld(4,0,4,9);
 const b=box(1,0,1,1.6,1,1.6),d={x:5,y:0,z:5};
 assert.equal(s.sweepCollision(b,d,solid).hit.block,9);
 s.setWorld(4,0,4,7);
 assert.equal(s.sweepCollision(b,d,solid).state,'clear');
});
test('starting in a block is blocked immediately; stationary clear query is safe',()=>{
 const s=make();s.load(0,0);s.setWorld(2,0,2,6);
 const stuck=s.sweepCollision(box(2,0,2,2.5,1,2.5),
   {x:0,y:0,z:0},solid);
 assert.equal(stuck.fraction,0);assert.equal(stuck.samples,1);
 const clear=s.sweepCollision(box(1,5,1,1.5,6,1.5),
   {x:0,y:0,z:0},solid);
 assert.equal(clear.fraction,1);assert.equal(clear.samples,1);
});
test('invalid vectors, out-of-bounds destinations and excessive motion reject before sampling',()=>{
 const s=make();let calls=0;const predicate=()=>{calls++;return true;};
 const b=box(1,0,1,1.5,1,1.5);
 for(const d of [{x:17,y:0,z:0},{x:Infinity,y:0,z:0},
   {x:0,y:-65,z:0},{x:0,y:0,z:-2},{x:'1',y:0,z:0}])
   assert.throws(()=>s.sweepCollision(b,d,predicate),/sweep|motion/);
 assert.equal(calls,0);
});
test('legacy playable world remains 48 layers; sweep is opt-in only',()=>{
 const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
 assert.match(html,/const W=10000, D=10000, H=48, SEA=14/);
 assert.match(html,/section-neighborhood\.js/);
});
