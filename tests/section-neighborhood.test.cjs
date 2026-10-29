/* Deep-world chunk seam coordination; no bundled proprietary game assets. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({window:{}});
for(const file of ['world-depth.js','section-neighborhood.js'])
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const storeApi=ctx.window.MineWorldWorldDepth;
const make=(size=2)=>storeApi.createSectionStore({data:new Uint8Array(size*size*48),height:48,minY:-16,chunkSize:size});
const grid=()=>ctx.window.MineWorldSectionNeighborhood.createSectionNeighborhood();
const clear=store=>store.takeDirtySections();

test('boundary edits invalidate only the adjacent chunk section, including negative Y',()=>{
 const g=grid(),a=make(),east=make(),north=make();
 g.register(0,0,a);g.register(1,0,east);g.register(0,-1,north);
 for(const s of [a,east,north])clear(s);
 assert.equal(g.set(0,0,1,-1,1,12),true);
 assert.deepEqual(east.dirtySections(),[0]);
 assert.deepEqual(north.dirtySections(),[]);
 clear(a);clear(east);
 assert.equal(g.set(0,0,0,20,0,13),true);
 assert.deepEqual(north.dirtySections(),[2]);
 assert.equal(east.dirtySections().length,0);
 assert.equal(g.set(0,0,0,20,0,13),false);
 assert.deepEqual(north.dirtySections(),[2]);
});

test('chunk load, replacement and unload invalidate seam faces without voxel changes',()=>{
 const g=grid(),a=make(),b=make(),replacement=make();
 g.register(4,5,a);clear(a);
 g.register(5,5,b);
 assert.deepEqual(a.dirtySections(),[0,1,2]);
 clear(a);clear(b);
 assert.equal(g.register(5,5,b),false);
 assert.deepEqual(a.dirtySections(),[]);
 g.register(5,5,replacement);
 assert.deepEqual(a.dirtySections(),[0,1,2]);
 clear(a);
 assert.equal(g.unregister(5,5),true);
 assert.deepEqual(a.dirtySections(),[0,1,2]);
 assert.equal(g.unregister(5,5),false);
});

test('invalid or rolled-back batches never dirty neighbors; final boundary state wins',()=>{
 const g=grid(),a=make(),b=make();
 g.register(0,0,a);g.register(1,0,b);clear(a);clear(b);
 assert.throws(()=>g.applyEdits(0,0,[[1,-5,0,9],[1,0,0,256]]),/Invalid section edit batch/);
 assert.equal(a.get(1,-5,0),0);
 assert.deepEqual(b.dirtySections(),[]);
 assert.equal(g.applyEdits(0,0,[[1,-5,0,9],[1,-5,0,0]]),2);
 assert.deepEqual(b.dirtySections(),[]);
 assert.equal(g.applyEdits(0,0,[[1,-5,0,9],[1,1,0,10]]),2);
 assert.deepEqual(b.dirtySections(),[0,1]);
});

test('snapshot install rejects changed, missing and replaced neighboring chunks',()=>{
 const g=grid(),a=make(),b=make();
 g.register(0,0,a);g.register(1,0,b);
 const job=a.claimDirtySectionsNear(-16,4,1)[0];
 const snap=g.snapshot(0,0,job);
 assert.equal(snap.east.length,2*16);
 assert.equal(g.canInstall(0,0,a,job,snap),true);
 g.set(1,0,0,-15,0,9);
 assert.equal(g.canInstall(0,0,a,job,snap),false);
 assert.equal(a.canInstallClaim(job),false);
 a.releaseDirtySection(job);
 const next=a.claimDirtySectionsNear(-16,4,1)[0];
 const nextSnap=g.snapshot(0,0,next);
 assert.equal(nextSnap.east[1],9);
 assert.equal(g.canInstall(0,0,a,next,nextSnap),true);
 g.register(1,0,make());
 assert.equal(g.canInstall(0,0,a,next,nextSnap),false);
 g.unregister(0,0);
 assert.equal(g.canInstall(0,0,a,next,nextSnap),false);
});

test('registration rejects incompatible profiles without mutating the grid',()=>{
 const g=grid(),a=make();
 g.register(0,0,a);
 assert.throws(()=>g.register(1,0,storeApi.createSectionStore({data:new Uint8Array(4*4*48),height:48,minY:-16,chunkSize:4})),/Incompatible/);
 assert.equal(g.size(),1);
 assert.throws(()=>g.register(2,0,a),/already registered/);
 assert.equal(g.canInstall(1,0,null,{},{}),false);
 assert.throws(()=>g.register(NaN,0,make()),/Invalid chunk/);
 assert.equal(g.get(1,0),null);
 assert.throws(()=>g.set(1,0,0,0,0,1),/not registered/);
});
