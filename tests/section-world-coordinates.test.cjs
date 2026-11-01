/* Absolute-world-to-section bridge: independent MineWorld staging tests. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ctx=vm.createContext({window:{}});
for(const file of ['world-depth.js','section-neighborhood.js'])
 vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx,{filename:file});
const make=(size=16,height=32)=>ctx.window.MineWorldWorldDepth.createSectionStore({
 data:new Uint8Array(size*size*height),minY:-64,height,chunkSize:size,sectionHeight:16
});
const grid=()=>ctx.window.MineWorldSectionNeighborhood.createSectionNeighborhood();
const dirty=s=>Array.from(s.dirtySections());

test('absolute negative X maps to west chunk, not the origin chunk',()=>{
 const g=grid(),west=make(),center=make();
 g.register(-1,0,west);g.register(0,0,center);
 west.takeDirtySections();center.takeDirtySections();
 assert.deepEqual({...g.worldToChunk(-1,-64,3)},{cx:-1,cz:0,x:15,y:-64,z:3});
 assert.equal(g.setWorld(-1,-64,3,5),true);
 assert.equal(g.getWorld(-1,-64,3),5);
 assert.equal(g.getWorld(0,-64,3),0);
 assert.deepEqual(dirty(center),[0],'west chunk east edge dirties center mesh');
});

test('negative Z maps to north chunk and invalidates the shared south seam',()=>{
 const g=grid(),north=make(),center=make();
 g.register(0,-1,north);g.register(0,0,center);
 north.takeDirtySections();center.takeDirtySections();
 assert.deepEqual({...g.worldToChunk(2,-49,-1)},{cx:0,cz:-1,x:2,y:-49,z:15});
 assert.equal(g.setWorld(2,-49,-1,7),true);
 assert.equal(g.getWorld(2,-49,-1),7);
 assert.deepEqual(dirty(center),[0,1],'vertical and horizontal seam slices are dirty');
});

test('positive world coordinates map to correct chunk and local offset',()=>{
 const g=grid(),a=make(),b=make();
 g.register(1,2,a);g.register(2,2,b);
 a.takeDirtySections();b.takeDirtySections();
 assert.deepEqual({...g.worldToChunk(31,-60,33)},{cx:1,cz:2,x:15,y:-60,z:1});
 assert.equal(g.setWorld(31,-60,33,10),true);
 assert.deepEqual(dirty(b),[0]);
 assert.equal(g.getWorld(31,-60,33),10);
 assert.equal(g.getWorld(32,-60,33),0);
});

test('world API supports deep Overworld bottom and top without aliasing',()=>{
 const g=grid(),s=make(16,384);g.register(0,0,s);
 assert.equal(g.setWorld(3,-64,4,12),true);
 assert.equal(g.setWorld(3,319,4,14),true);
 assert.equal(g.getWorld(3,-64,4),12);
 assert.equal(g.getWorld(3,319,4),14);
 assert.equal(g.getWorld(3,320,4),null);
 assert.throws(()=>g.setWorld(3,320,4,1),/Invalid section block edit/);
 assert.equal(g.getWorld(3,-64,4),12);
});

test('missing chunk remains unloaded and is never auto-created by writes',()=>{
 const g=grid();assert.throws(()=>g.worldToChunk(0,0,0),/No section profile/);
 g.register(0,0,make());
 assert.equal(g.getWorld(16,-64,0),null);
 assert.throws(()=>g.setWorld(16,-64,0,1),/not registered/);
 assert.equal(g.size(),1);
 assert.throws(()=>g.getWorld(Number.MAX_SAFE_INTEGER+1,-64,0),/Invalid absolute/);
 assert.throws(()=>g.setWorld(0,-64,0,256),/Invalid section block edit/);
 assert.equal(g.getWorld(0,-64,0),0);
 g.unregister(0,0);
 assert.throws(()=>g.worldToChunk(0,-64,0),/No section profile/);
});

test('maximal safe chunk coordinates have no overflowing neighbor lookups',()=>{
 const g=grid(),a=make(),max=Number.MAX_SAFE_INTEGER;
 assert.equal(g.register(max,max,a),true);
 a.takeDirtySections();
 assert.equal(g.neighborsOf(max,max).east,null);
 assert.equal(g.neighborsOf(max,max).south,null);
 assert.equal(g.set(max,max,15,-64,15,9),true);
 assert.equal(a.get(15,-64,15),9);
 assert.equal(g.applyEdits(max,max,[[15,-63,15,8]]),1);
 assert.equal(a.get(15,-63,15),8);
 assert.equal(g.unregister(max,max),true);
 assert.equal(g.size(),0);
});

test('minimum safe chunk coordinates do not wrap west/north neighbors',()=>{
 const g=grid(),a=make(),min=Number.MIN_SAFE_INTEGER;
 assert.equal(g.register(min,min,a),true);
 assert.equal(g.neighborsOf(min,min).west,null);
 assert.equal(g.neighborsOf(min,min).north,null);
 assert.equal(g.set(min,min,0,-64,0,9),true);
 assert.equal(g.get(min,min).get(0,-64,0),9);
 assert.equal(g.unregister(min,min),true);
});
