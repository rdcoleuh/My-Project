/* Verify regenerated 384-layer chunks faithfully replay placed and mined blocks.
 * Original MineWorld tests; no imported or copyrighted artwork. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx=vm.createContext({window:{}});
for(const file of ['world-depth.js','section-neighborhood.js'])
 vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx,{filename:file});
const depth=ctx.window.MineWorldWorldDepth;
const stream=ctx.window.MineWorldSectionNeighborhood.createDeepChunkStream;
const codec=depth.create({width:10000,depth:10000,minY:-64,maxY:319,chunkSize:16});
function store(cx,cz,edits,apply=true){
 const s=depth.createSectionStore({data:new Uint8Array(16*16*384),minY:-64,height:384,chunkSize:16,sectionHeight:16});
 if(apply)for(const [index,block] of edits){
  const p=codec.decode(index);s.set(p.x-cx*16,p.y,p.z-cz*16,block);
 }
 return s;
}
test('reject generator that silently ignores an imported placed-block edit',()=>{
 const index=codec.index(3,-32,4),original=new Map([[index,21]]);
 const s=stream({maxLoaded:1,edits:original,generator:(cx,cz,edits)=>store(cx,cz,edits,false)});
 assert.throws(()=>s.load(0,0),/did not replay saved edits/);
 assert.equal(s.stats().loaded,0);
 assert.equal(s.grid.size(),0);
 assert.equal(original.get(index),21);
});
test('reject incomplete replay without evicting loaded chunks or changing LRU',()=>{
 const s=stream({maxLoaded:1,generator:(cx,cz,edits)=>store(cx,cz,edits,cx===0)});
 const first=s.load(0,0);
 s.load(0,0);
 const old=s.loadedChunks();
 // A previously saved edit in the new chunk must be applied by its generator.
 // Construct a fresh stream with imported edits for chunk 1 and preload chunk 0.
 const index=codec.index(17,100,1);
 const other=stream({maxLoaded:1,edits:new Map([[index,7]]),generator:(cx,cz,edits)=>store(cx,cz,edits,cx===0)});
 const kept=other.load(0,0),order=other.loadedChunks();
 assert.throws(()=>other.load(1,0),/did not replay saved edits/);
 assert.deepEqual(other.loadedChunks(),order);
 assert.equal(other.grid.get(0,0),kept);
 assert.equal(other.snapshotEdits().get(index),7);
 assert.equal(s.grid.get(0,0),first);
 assert.deepEqual(s.loadedChunks(),old);
});
test('placed blocks and explicit mined-air edits replay across eviction',()=>{
 const index=codec.index(5,-64,5),air=codec.index(6,319,6);
 const s=stream({maxLoaded:1,edits:new Map([[index,25],[air,0]]),generator:(cx,cz,edits)=>{
  const chunk=store(cx,cz,edits);
  // Without replay, this cell is stone; a saved air edit must override it.
  return chunk;
 }});
 s.load(0,0);
 assert.equal(s.getWorld(5,-64,5),25);
 assert.equal(s.getWorld(6,319,6),0);
 s.load(1,0);s.load(0,0);
 assert.equal(s.getWorld(5,-64,5),25);
 assert.equal(s.getWorld(6,319,6),0);
});
test('a generator missing required memory stats is rejected before registration',()=>{
 const s=stream({maxLoaded:1,generator:(cx,cz,edits)=>{
  const item=store(cx,cz,edits);
  return {...item,stats:undefined};
 }});
 assert.throws(()=>s.load(0,0),/Invalid generated/);
 assert.equal(s.stats().loaded,0);
});
