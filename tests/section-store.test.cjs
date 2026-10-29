/* Writable deep-world section store: original code, no bundled game assets. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({window:{}});
for(const file of ['world-depth.js','overworld-ores.js','world-chunks.js'])
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const api=ctx.window.MineWorldWorldDepth;
const at=(x,y,z,height=384,minY=-64,size=16)=>(x*size+z)*height+y-minY;

test('copy-on-write sections round-trip negative Y and compress uniform slices',()=>{
 const data=new Uint8Array(16*16*384);
 for(let x=0;x<16;x++)for(let z=0;z<16;z++)
  for(let y=-64;y<=-49;y++)data[at(x,y,z)]=58;
 data[at(2,-1,3)]=19;data[at(5,319,6)]=20;
 const original=Buffer.from(data);
 const store=api.createSectionStore({data,height:384,minY:-64});
 assert.equal(store.stats().sections,24);
 assert.equal(store.stats().uniform,22);
 assert.ok(store.stats().payloadBytes<9000);
 assert.equal(store.get(2,-1,3),19);
 assert.equal(store.get(5,319,6),20);
 assert.equal(store.get(0,-64,0),58);
 assert.deepEqual(Buffer.from(store.rebuild()),original);
 assert.equal(store.get(0,-65,0),null);
 assert.equal(store.get(16,0,0),null);
});

test('uniform section edits are isolated, counted, reversible and compactable',()=>{
 const data=new Uint8Array(16*16*384);
 const store=api.createSectionStore({data,height:384,minY:-64});
 assert.equal(store.stats().payloadBytes,24);
 assert.equal(store.set(1,-64,2,58),true);
 assert.equal(store.set(1,-64,2,58),false);
 assert.equal(store.get(1,-64,2),58);
 assert.equal(store.stats().blocks,1);
 assert.equal(store.stats().active,1);
 assert.equal(store.compact(0),false);
 assert.equal(store.set(1,-64,2,0),true);
 assert.equal(store.stats().blocks,0);
 assert.equal(store.stats().active,0);
 assert.equal(store.compact(0),true);
 assert.equal(store.stats().payloadBytes,24);
 assert.equal(data[at(1,-64,2)],0,'source voxel array remains untouched');
 assert.equal(store.set(3,319,4,11),true);
 assert.equal(store.get(3,319,4),11);
 assert.equal(store.near(319,0)[0].index,23);
 assert.equal(store.near(-64,0)[0].index,0);
});

test('partial sections, invalid edits and detached materializations',()=>{
 const data=new Uint8Array(2*2*35);
 const store=api.createSectionStore({data,height:35,chunkSize:2,minY:-10});
 assert.equal(store.stats().sections,3);
 assert.equal(store.set(1,24,1,9),true);
 assert.equal(store.get(1,24,1),9);
 const section=store.materialize(2);assert.equal(section.length,2*2*3);
 section.fill(0);assert.equal(store.get(1,24,1),9);
 assert.equal(store.rebuild()[(1*2+1)*35+34],9);
 for(const args of [[2,0,0,1],[0,-11,0,1],[0,0,0,-1],[0,0,0,256],[0,0,0,1.5]])
  assert.throws(()=>store.set(...args),/Invalid section block edit/);
 assert.throws(()=>store.compact(3),/Invalid section index/);
 assert.throws(()=>store.near(NaN),/Invalid section view/);
 assert.equal(store.stats().blocks,1);
});

test('deep-world generator exposes a writable store without changing legacy chunks',()=>{
 ctx.window.MineWorldBiomes.setSeed(85721);
 const options={cx:312,cz:312,H:384,minY:-64,SEA:63};
 const store=ctx.window.MineWorldBiomes.generateSectionStore(options);
 assert.equal(store.minY,-64);assert.equal(store.maxY,319);
 assert.equal(store.get(0,-64,0),58);
 assert.equal(store.set(1,-32,2,11),true);
 assert.equal(store.get(1,-32,2),11);
 assert.equal(store.rebuild()[at(1,-32,2)],11);
 const old=ctx.window.MineWorldBiomes.generateChunk({cx:312,cz:312,H:48,SEA:14});
 assert.equal(old.length,16*16*48);
 assert.equal(ctx.window.MineWorldBiomes.generateSectionStore({cx:312,cz:312}).height,48);
});

test('budgeted deep-section mesh jobs prioritize the player and retain distant work',()=>{
 const data=new Uint8Array(2*2*64);
 for(let section=0;section<4;section++)data[section*16]=section+1;
 const store=api.createSectionStore({data,height:64,minY:-64,chunkSize:2});
 assert.deepEqual(Array.from(store.dirtySectionsNear(-32,3,2),job=>job.index),[2,1]);
 assert.deepEqual(Array.from(store.dirtySections()),[0,1,2,3],'preview does not drain jobs');
 const jobs=store.takeDirtySectionsNear(-32,3,2);
 assert.deepEqual(Array.from(jobs,job=>job.action),['rebuild','rebuild']);
 assert.deepEqual(Array.from(store.dirtySections()),[0,3],'unprocessed jobs survive frame budget');
 assert.deepEqual(Array.from(store.takeDirtySectionsNear(-64,0,1),job=>job.index),[0]);
 assert.deepEqual(Array.from(store.takeDirtySectionsNear(-16,0,1),job=>job.index),[3]);
 assert.deepEqual(Array.from(store.dirtySections()),[]);
 assert.throws(()=>store.takeDirtySectionsNear(NaN),/Invalid section mesh budget/);
 assert.throws(()=>store.dirtySectionsNear(0,-1),/Invalid section mesh budget/);
 assert.throws(()=>store.dirtySectionsNear(0,2,0),/Invalid section mesh budget/);
});

test('budgeted jobs remove emptied meshes and retain seam invalidations',()=>{
 const data=new Uint8Array(2*2*32);data[0]=3;
 const store=api.createSectionStore({data,height:32,minY:-64,chunkSize:2});
 store.takeDirtySections();
 store.set(0,-64,0,0);
 assert.deepEqual(Array.from(store.dirtySectionsNear(-64,0),job=>job.action),['remove']);
 assert.deepEqual(Array.from(store.takeDirtySectionsNear(-64,0),job=>job.index),[0]);
 store.set(1,-49,1,11);
 assert.deepEqual(Array.from(store.takeDirtySectionsNear(-64,0),job=>job.index),[0]);
 assert.deepEqual(Array.from(store.dirtySections()),[1],'neighbor seam remains pending');
 assert.deepEqual(Array.from(store.takeDirtySectionsNear(-48,0),job=>job.action),['remove']);
 assert.deepEqual(Array.from(store.dirtySections()),[]);
 assert.equal(store.get(1,-49,1),11);
});

test('mesh leases keep pending sections until successful acknowledgement',()=>{
 const data=new Uint8Array(2*2*48);data[0]=3;data[16]=58;data[32]=19;
 const store=api.createSectionStore({data,height:48,minY:-64,chunkSize:2});
 const claimed=store.claimDirtySectionsNear(-48,2,2);
 assert.deepEqual(Array.from(claimed,job=>job.index),[1,0]);
 assert.equal(store.stats().inFlight,2);
 assert.deepEqual(Array.from(store.dirtySections()),[0,1,2]);
 assert.deepEqual(Array.from(store.claimDirtySectionsNear(-48,2,3),job=>job.index),[2]);
 assert.equal(store.ackDirtySection(claimed[0]),true);
 assert.equal(store.ackDirtySection(claimed[0]),false,'a lease cannot be acknowledged twice');
 assert.equal(store.releaseDirtySection(claimed[1]),true);
 assert.equal(store.stats().inFlight,1);
 assert.deepEqual(Array.from(store.dirtySections()),[0,2]);
 const retried=store.claimDirtySectionsNear(-64,0,1)[0];
 assert.equal(retried.index,0);
 assert.notEqual(retried.claimId,claimed[1].claimId);
 assert.equal(store.ackDirtySection(claimed[1]),false,'stale lease cannot clear a retry');
 assert.equal(store.ackDirtySection(retried),true);
 assert.deepEqual(Array.from(store.takeDirtySections()),[],'claimed jobs cannot be drained');
});
test('edits during a claimed rebuild preserve dirty state, including seam neighbors',()=>{
 const data=new Uint8Array(2*2*32);data[0]=3;data[16]=3;
 const store=api.createSectionStore({data,height:32,minY:-64,chunkSize:2});
 const first=store.claimDirtySectionsNear(-64,0,1)[0];
 const neighbor=store.claimDirtySectionsNear(-48,0,1)[0];
 store.set(1,-49,1,11); // last voxel of section zero invalidates section one
 assert.equal(store.ackDirtySection(first),false,'old mesh must not clear a newer edit');
 assert.equal(store.ackDirtySection(neighbor),false,'seam invalidation rejects stale neighbor mesh');
 assert.deepEqual(Array.from(store.dirtySections()),[0,1]);
 const rebuilt=store.claimDirtySectionsNear(-64,1,2);
 assert.equal(rebuilt.length,2);
 for(const job of rebuilt)assert.equal(store.ackDirtySection(job),true);
 assert.deepEqual(Array.from(store.dirtySections()),[]);
 assert.equal(store.get(1,-49,1),11);
});
test('failed or abandoned mesh claims retry without losing work',()=>{
 const data=new Uint8Array(2*2*16);data[0]=3;
 const store=api.createSectionStore({data,height:16,chunkSize:2});
 const first=store.claimDirtySectionsNear(0,0,1)[0];
 assert.equal(store.takeDirtySectionsNear(0,0,1).length,0);
 assert.equal(store.releaseDirtySection(first),true);
 assert.equal(store.releaseDirtySection(first),false);
 const retry=store.claimDirtySectionsNear(0,0,1)[0];
 assert.equal(store.ackDirtySection({...retry,claimId:retry.claimId+1}),false);
 assert.equal(store.ackDirtySection(retry),true);
 assert.equal(store.stats().dirty,0);
 assert.equal(store.stats().inFlight,0);
 assert.throws(()=>store.claimDirtySectionsNear(0,0,0),/Invalid section mesh budget/);
 assert.throws(()=>store.claimDirtySectionsNear(NaN),/Invalid section mesh budget/);
});
