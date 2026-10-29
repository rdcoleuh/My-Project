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
