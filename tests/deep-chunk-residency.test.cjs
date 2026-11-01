/* Deep-world chunk residency integration: generated 384-layer sections,
 * bounded mobile memory, seam invalidation and edit replay across eviction. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx=vm.createContext({window:{}});
for(const name of ['world-depth.js','overworld-ores.js','world-chunks.js','section-neighborhood.js'])
 vm.runInContext(fs.readFileSync(path.join(__dirname,'..',name),'utf8'),ctx,{filename:name});
const api=ctx.window.MineWorldSectionNeighborhood;
const codec=ctx.window.MineWorldWorldDepth.create({width:10000,depth:10000,minY:-64,maxY:319});
const make=(opts={})=>api.createDeepChunkStream(opts);
const mock=(cx,cz,edits)=>{
 const data=new Uint8Array(16*16*384);
 const store=ctx.window.MineWorldWorldDepth.createSectionStore({
   data,minY:-64,height:384,chunkSize:16,sectionHeight:16
 });
 for(const [index,block] of edits){
   const p=codec.decode(index);
   store.set(p.x-cx*16,p.y,p.z-cz*16,block);
 }
 return store;
};
test('deep stream generates real 384-layer chunks with bedrock and sea-level profile',()=>{
 ctx.window.MineWorldBiomes.setSeed(85721);
 const s=make({maxLoaded:2}),store=s.load(312,312);
 assert.equal(store.minY,-64);assert.equal(store.maxY,319);
 assert.equal(s.getWorld(4992,-64,4992),170);
 assert.equal(s.getWorld(4992,320,4992),null);
 assert.equal(s.stats().loaded,1);
 assert.equal(s.stats().maxLoaded,2);
 assert.ok(s.stats().payloadBytes>0);
});
test('saved block and mined air survive eviction and regeneration without mutating source',()=>{
 const original=new Map([[codec.index(1,-63,1),19]]);
 const s=make({maxLoaded:1,edits:original,generator:mock});
 s.load(0,0);
 assert.equal(s.getWorld(1,-63,1),19);
 assert.equal(s.setWorld(1,-63,1,0),true);
 assert.equal(s.setWorld(2,319,2,7),true);
 s.load(1,0);
 assert.equal(s.getWorld(1,-63,1),null,'unloaded is not air');
 s.load(0,0);
 assert.equal(s.getWorld(1,-63,1),0);
 assert.equal(s.getWorld(2,319,2),7);
 assert.equal(original.get(codec.index(1,-63,1)),19);
 assert.equal(s.snapshotEdits().get(codec.index(1,-63,1)),0);
 const snapshot=s.snapshotEdits();snapshot.clear();
 assert.equal(s.stats().edits,2,'external snapshot cannot erase stored edits');
});
test('boundary edits invalidate adjacent claimed section meshes',()=>{
 const s=make({maxLoaded:2,generator:mock}),left=s.load(0,0),right=s.load(1,0);
 left.takeDirtySections();right.takeDirtySections();
 s.setWorld(15,-64,2,4);
 assert.deepEqual([...right.dirtySections()],[0]);
 const [claim]=right.claimDirtySectionsNear(-64,1,1,100);
 assert.ok(claim);
 s.setWorld(15,-64,2,5);
 assert.equal(right.canInstallClaim(claim),false);
 assert.equal(s.getWorld(15,-64,2),5);
});
test('edit batch rejects malformed and unloaded positions atomically',()=>{
 const s=make({maxLoaded:2,generator:mock});s.load(0,0);
 assert.throws(()=>s.applyWorldEdits([[1,-64,1,4],[17,-64,1,5]]),/unloaded/);
 assert.throws(()=>s.applyWorldEdits([[1,-64,1,4],[2,320,2,5]]),/Invalid deep-world/);
 assert.throws(()=>s.setWorld(10000,-64,1,5),/Invalid deep-world/);
 assert.equal(s.getWorld(1,-64,1),0);
 assert.equal(s.stats().edits,0);
 assert.equal(s.applyWorldEdits([[1,-64,1,4],[1,-64,1,0]]),0,
   'duplicate final air edit is a no-op');
 assert.equal(s.stats().edits,0);
 assert.equal(s.applyWorldEdits([[1,-64,1,4],[1,-64,1,6]]),1);
 assert.equal(s.getWorld(1,-64,1),6);
});
test('corrupt saved indices and block IDs reject before generating chunks',()=>{
 for(const bad of [
   new Map([[codec.volume,1]]),new Map([[-1,1]]),
   new Map([[codec.index(1,0,1),256]]),
   new Map([[codec.index(1,0,1),-1]])
 ])assert.throws(()=>make({edits:bad,generator:mock}),/Invalid saved deep-world edit/);
 assert.throws(()=>make({maxLoaded:0}),/residency budget/);
 assert.throws(()=>make({maxLoaded:65}),/residency budget/);
});
test('LRU evicts least recently used, while generator failures preserve residents',()=>{
 const s=make({maxLoaded:2,generator:(cx,cz,edits)=>{
   if(cx===3)throw new Error('generator failure');
   return mock(cx,cz,edits);
 }});
 s.load(0,0);s.load(1,0);s.load(0,0);
 s.load(2,0);
 assert.deepEqual([...s.loadedChunks()],['0,0','2,0']);
 assert.throws(()=>s.load(3,0),/generator failure/);
 assert.deepEqual([...s.loadedChunks()],['0,0','2,0']);
 assert.equal(s.getWorld(16,-64,0),null);
});
test('loadAround respects mobile residency budget before changing loaded chunks',()=>{
 const s=make({maxLoaded:9,generator:mock});
 const positions=s.loadAround(8,8,1);
 assert.equal(positions.length,4,'world corner clips to four chunks');
 assert.equal(s.stats().loaded,4);
 const full=s.loadAround(5000,5000,1);
 assert.equal(full.length,9);
 assert.equal(s.stats().loaded,9);
 assert.equal(s.loadedChunks().includes('312,312'),true);
 const before=[...s.loadedChunks()];
 assert.throws(()=>s.loadAround(5000,5000,2),/exceeds residency budget/);
 assert.deepEqual([...s.loadedChunks()],before);
});
test('opt-in bridge does not change the playable legacy world height or save profile',()=>{
 const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
 assert.match(html,/const W=10000, D=10000, H=48, SEA=14/);
 assert.match(html,/section-neighborhood\.js/);
 const sw=fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8');
 assert.match(sw,/section-neighborhood\.js/);
});
