/* Atomic deep-world view streaming: no partial eviction on generation errors.
 * Independently implemented MineWorld code; no proprietary artwork. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx=vm.createContext({window:{}});
for(const name of ['world-depth.js','section-neighborhood.js'])
 vm.runInContext(fs.readFileSync(path.join(__dirname,'..',name),'utf8'),ctx,{filename:name});
const api=ctx.window.MineWorldSectionNeighborhood;
const createStore=()=>ctx.window.MineWorldWorldDepth.createSectionStore({
 data:new Uint8Array(16*16*384),minY:-64,height:384,chunkSize:16,sectionHeight:16
});
const make=(options={})=>api.createDeepChunkStream({generator:()=>createStore(),...options});

test('late generation failure leaves loaded chunks, LRU order, edits and seam claims unchanged',()=>{
 const s=make({maxLoaded:9,generator:(cx,cz)=>{
   if(cx===2)throw Error('simulated generation failure');
   return createStore();
 }});
 s.load(0,0);s.load(0,1);
 s.setWorld(0,-63,0,9);
 const before=s.loadedChunks(),resident=s.grid.get(0,0),saved=s.snapshotEdits();
 resident.takeDirtySections();
 const beforeDirty=[...resident.dirtySections()];
 assert.throws(()=>s.loadAround(16,8,1),/simulated generation failure/);
 assert.deepEqual(s.loadedChunks(),before);
 assert.equal(s.grid.get(0,0),resident);
 assert.deepEqual([...resident.dirtySections()],beforeDirty);
 assert.deepEqual([...s.snapshotEdits()],[...saved]);
 assert.equal(s.getWorld(0,-63,0),9);
});

test('invalid generated store during batch does not replace existing residents',()=>{
 const s=make({maxLoaded:9,generator:(cx,cz)=>cx===2?{}:createStore()});
 const old=s.load(0,0),before=s.loadedChunks();
 assert.throws(()=>s.loadAround(16,8,1),/Invalid generated/);
 assert.deepEqual(s.loadedChunks(),before);
 assert.equal(s.grid.get(0,0),old);
});

test('generator reusing a store for two staged chunks is rejected before registration',()=>{
 const shared=createStore(),s=make({maxLoaded:9,generator:()=>shared});
 assert.throws(()=>s.loadAround(16,8,1),/Invalid generated/);
 assert.equal(s.stats().loaded,0);
 assert.equal(s.grid.size(),0);
});

test('a successful view shift retains every overlapping store without re-generation',()=>{
 const generated=new Map();
 const s=make({maxLoaded:9,generator:(cx,cz)=>{
   const k=cx+','+cz;generated.set(k,(generated.get(k)||0)+1);
   return createStore();
 }});
 s.loadAround(40,40,1); // 3x3 around chunk 2,2
 const overlapping=s.grid.get(2,2),east=s.grid.get(3,2);
 s.setWorld(40,-63,40,18);
 s.loadAround(56,40,1); // 3x3 around chunk 3,2
 assert.equal(s.stats().loaded,9);
 assert.equal(s.grid.get(2,2),overlapping);
 assert.equal(s.grid.get(3,2),east);
 assert.equal(s.getWorld(40,-63,40),18);
 assert.equal(generated.get('2,2'),1);
 assert.equal(generated.get('3,2'),1);
 assert.equal(s.grid.get(1,2),null);
});

test('all missing chunks are validated before a full view replaces old residents',()=>{
 const s=make({maxLoaded:9});
 s.loadAround(40,40,1);
 const old=s.loadedChunks();
 const newView=s.loadAround(200,200,1);
 assert.equal(newView.length,9);
 assert.equal(s.stats().loaded,9);
 assert.equal(s.loadedChunks().some(k=>old.includes(k)),false);
 assert.equal(s.grid.size(),9);
});

test('single-chunk load retains LRU eviction and duplicate-store protection',()=>{
 const s=make({maxLoaded:1}),first=s.load(0,0);
 assert.equal(s.load(0,0),first);
 s.load(1,0);
 assert.equal(s.grid.get(0,0),null);
 assert.equal(s.stats().loaded,1);
 const shared=createStore(),invalid=make({maxLoaded:2,generator:()=>shared});
 invalid.load(0,0);
 assert.throws(()=>invalid.load(1,0),/Invalid generated/);
 assert.deepEqual([...invalid.loadedChunks()],['0,0']);
});
