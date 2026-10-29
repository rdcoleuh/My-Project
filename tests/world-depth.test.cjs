const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),ctx={window:{}};vm.createContext(ctx);
for(const name of ['world-depth.js','overworld-ores.js','world-chunks.js'])
  vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),ctx,{filename:name});
const api=ctx.window.MineWorldWorldDepth;
test('legacy coordinate codec preserves every old save index and multiplayer offset',()=>{
 const c=api.create({width:10000,depth:10000,minY:0,maxY:47});
 for(const [x,y,z] of [[0,0,0],[5000,14,5000],[9999,47,9999]]){
  const old=(x*10000+z)*48+y;
  assert.equal(c.index(x,y,z),old);
  assert.deepEqual(JSON.parse(JSON.stringify(c.decode(old))),{x,y,z});
  assert.equal(c.networkIndex(x,y,z,'end'),old+2*10000*10000*48);
 }
 assert.equal(c.inside(5000,-1,5000),false);
});
test('deep codec spans Y -64 through 319 without colliding with dimension offsets',()=>{
 const c=api.create({width:10000,depth:10000,minY:-64,maxY:319});
 assert.equal(c.height,384);assert.equal(c.minY,-64);assert.equal(c.maxY,319);
 for(const y of [-64,-1,0,63,319]){
  const n=c.index(5000,y,5000);
  assert.equal(c.decode(n).y,y);
  assert.equal(c.decodeNetwork(c.networkIndex(5000,y,5000,'nether')).dimension,'nether');
  assert.equal(c.decodeNetwork(c.networkIndex(5000,y,5000,'end')).y,y);
 }
 assert.equal(c.inside(5000,-65,5000),false);
 assert.equal(c.inside(5000,320,5000),false);
 assert.equal(c.decode(-1),null);
 assert.equal(c.decode(c.volume),null);
 assert.equal(c.decodeNetwork(c.volume*3),null);
});
test('opt-in deep Overworld chunk has 384 layers and deepslate below Y 0',()=>{
 ctx.window.MineWorldBiomes.setSeed(85721);
 const cx=312,cz=312,H=384,minY=-64,SEA=63;
 const data=ctx.window.MineWorldBiomes.generateChunk({cx,cz,H,minY,SEA});
 assert.equal(data.length,16*16*384);
 const at=(dx,y,dz)=>data[(dx*16+dz)*H+(y-minY)];
 assert.equal(at(0,-64,0),58,'deep floor currently uses deepslate pending bedrock block');
 assert.equal(at(0,-1,0),58,'negative layers use deepslate');
 const surface=ctx.window.MineWorldBiomes.terrainAt(cx*16,cz*16,SEA,H,minY);
 assert.ok(surface>=40&&surface<140,'surface near standard sea level');
 assert.ok(at(0,surface,0)>0,'terrain surface generated');
});
test('legacy chunk generation stays byte-identical with explicit minY zero',()=>{
 ctx.window.MineWorldBiomes.setSeed(85721);
 const old=ctx.window.MineWorldBiomes.generateChunk({cx:312,cz:312,H:48,SEA:14});
 const same=ctx.window.MineWorldBiomes.generateChunk({cx:312,cz:312,H:48,SEA:14,minY:0});
 assert.deepEqual(Buffer.from(old),Buffer.from(same));
});
test('live game retains legacy world saves until a versioned migration exists',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.match(html,/const W=10000, D=10000, H=48, SEA=14/);
 assert.match(html,/const vertical=window.MineWorldWorldDepth.create/);
 assert.match(html,/world-depth\.js/);
 assert.match(fs.readFileSync(path.join(root,'sw.js'),'utf8'),/world-depth\.js/);
});
test('deep chunk replays negative-Y edits after caves and ore generation',()=>{
 const c=api.create({width:10000,depth:10000,minY:-64,maxY:319});
 const cx=312,cz=312,x=cx*16+2,z=cz*16+3,y=-32;
 const edits=new Map([[c.index(x,y,z),11],[c.index(x,y+1,z),0]]);
 const data=ctx.window.MineWorldBiomes.generateChunk({cx,cz,H:384,minY:-64,SEA:63,edits});
 const at=yy=>data[(2*16+3)*384+(yy+64)];
 assert.equal(at(y),11,'placed block survives chunk regeneration below Y=0');
 assert.equal(at(y+1),0,'mined block survives chunk regeneration below Y=0');
});
test('legacy chunk edits remain valid with unchanged coordinate encoding',()=>{
 const c=api.create({width:10000,depth:10000,minY:0,maxY:47});
 const cx=312,cz=312,x=cx*16+1,z=cz*16+1,y=6;
 const edits=new Map([[c.index(x,y,z),11]]);
 const data=ctx.window.MineWorldBiomes.generateChunk({cx,cz,H:48,SEA:14,minY:0,edits});
 assert.equal(data[(1*16+1)*48+y],11);
});

test('opt-in edit reindexing preserves placed and mined blocks at every legacy boundary',()=>{
 const legacy=api.create({width:10000,depth:10000,minY:0,maxY:47});
 const deep=api.create({width:10000,depth:10000,minY:-64,maxY:319});
 const edits=new Map([[legacy.index(0,0,0),11],[legacy.index(5000,14,5000),0],
   [legacy.index(9999,47,9999),168]]);
 const converted=api.reindexEdits(edits,legacy,deep);
 assert.equal(converted.size,edits.size);
 assert.equal(converted.get(deep.index(0,0,0)),11);
 assert.equal(converted.get(deep.index(5000,14,5000)),0);
 assert.equal(converted.get(deep.index(9999,47,9999)),168);
 assert.deepEqual([...edits.keys()],[legacy.index(0,0,0),legacy.index(5000,14,5000),legacy.index(9999,47,9999)],
   'original saved edit map remains unchanged');
 assert.deepEqual(JSON.parse(JSON.stringify([...api.reindexEdits(converted,deep,legacy)])),[...edits]);
});
test('save conversion fails atomically for invalid indices, blocks or target bounds',()=>{
 const legacy=api.create({width:10000,depth:10000,minY:0,maxY:47});
 const deep=api.create({width:10000,depth:10000,minY:-64,maxY:319});
 const source=new Map([[legacy.index(5000,0,5000),11],[legacy.volume,12]]);
 assert.throws(()=>api.reindexEdits(source,legacy,deep),/outside target world/);
 assert.equal(source.size,2,'failed migration does not mutate source');
 assert.throws(()=>api.reindexEdits(new Map([[legacy.index(0,1,0),256]]),legacy,deep),/Invalid saved block/);
 assert.throws(()=>api.reindexEdits(new Map([[deep.index(0,-64,0),11]]),deep,legacy),/outside target world/);
 assert.throws(()=>api.reindexEdits(new Map(),legacy,api.create({width:9,depth:9})),/Incompatible/);
});
test('converted edits replay in the deep generator without rewriting source saves',()=>{
 const legacy=api.create({width:10000,depth:10000,minY:0,maxY:47});
 const deep=api.create({width:10000,depth:10000,minY:-64,maxY:319});
 const cx=312,cz=312,x=cx*16+1,z=cz*16+1;
 const original=new Map([[legacy.index(x,0,z),11],[legacy.index(x,15,z),0]]);
 const converted=api.reindexEdits(original,legacy,deep);
 const data=ctx.window.MineWorldBiomes.generateChunk({cx,cz,H:384,minY:-64,SEA:63,edits:converted});
 assert.equal(data[(1*16+1)*384+64],11);
 assert.equal(data[(1*16+1)*384+79],0);
 assert.equal(original.get(legacy.index(x,0,z)),11);
});


test('mixed-height dimension network codec preserves disjoint Overworld, Nether and End intervals',()=>{
 const mixed=api.createDimensionCodec();
 const legacy=api.createDimensionCodec({overworld:api.LEGACY});
 assert.equal(mixed.offsets.overworld,0);
 assert.equal(mixed.offsets.nether,10000*10000*384);
 assert.equal(mixed.offsets.end,10000*10000*(384+48));
 assert.equal(mixed.volume,10000*10000*(384+48+48));
 for(const [dimension,y] of [['overworld',-64],['overworld',319],['nether',0],['nether',47],['end',0],['end',47]]){
  const n=mixed.networkIndex(5000,y,5000,dimension);
  const point=mixed.decodeNetwork(n);
  assert.equal(point.dimension,dimension);
  assert.equal(point.y,y);assert.equal(point.x,5000);assert.equal(point.z,5000);
 }
 assert.equal(mixed.networkIndex(5000,-64,5000,'nether'),null);
 assert.equal(mixed.networkIndex(5000,319,5000,'end'),null);
 assert.equal(mixed.networkIndex(5000,0,5000,'unknown'),null);
 assert.equal(mixed.decodeNetwork(mixed.volume),null);
 assert.equal(mixed.decodeNetwork(-1),null);
 for(const dimension of ['overworld','nether','end']){
  const old=legacy.networkIndex(5000,14,5000,dimension);
  const expected=(['overworld','nether','end'].indexOf(dimension)*10000*10000*48)+
   ((5000*10000+5000)*48+14);
  assert.equal(old,expected,'all-legacy codec remains byte-compatible with original offsets');
 }
});
test('mixed-height migration preserves edits in every dimension and can round-trip',()=>{
 const legacy=api.createDimensionCodec({overworld:api.LEGACY});
 const mixed=api.createDimensionCodec();
 const original=new Map([
  [legacy.networkIndex(5000,0,5000,'overworld'),11],
  [legacy.networkIndex(5000,14,5000,'overworld'),0],
  [legacy.networkIndex(5000,47,5000,'nether'),20],
  [legacy.networkIndex(9999,0,9999,'end'),168]
 ]);
 const moved=api.reindexNetworkEdits(original,legacy,mixed);
 assert.equal(moved.size,4);
 assert.equal(moved.get(mixed.networkIndex(5000,0,5000,'overworld')),11);
 assert.equal(moved.get(mixed.networkIndex(5000,14,5000,'overworld')),0);
 assert.equal(moved.get(mixed.networkIndex(5000,47,5000,'nether')),20);
 assert.equal(moved.get(mixed.networkIndex(9999,0,9999,'end')),168);
 assert.deepEqual([...api.reindexNetworkEdits(moved,mixed,legacy)],[...original]);
 assert.equal(original.size,4,'original map remains untouched');
});
test('mixed-height migration rejects invalid coordinates, blocks and incompatible dimensions atomically',()=>{
 const legacy=api.createDimensionCodec({overworld:api.LEGACY});
 const mixed=api.createDimensionCodec();
 const valid=legacy.networkIndex(5000,0,5000,'overworld');
 const invalid=new Map([[valid,11],[legacy.volume,12]]);
 assert.throws(()=>api.reindexNetworkEdits(invalid,legacy,mixed),/invalid/);
 assert.equal(invalid.size,2);
 assert.throws(()=>api.reindexNetworkEdits(new Map([[valid,256]]),legacy,mixed),/Invalid saved block/);
 assert.throws(()=>api.reindexNetworkEdits(new Map([[mixed.networkIndex(5000,-64,5000,'overworld'),11]]),mixed,legacy),/outside target dimension/);
 const different=api.createDimensionCodec({width:9000,depth:9000});
 assert.throws(()=>api.reindexNetworkEdits(new Map(),legacy,different),/Incompatible/);
});
