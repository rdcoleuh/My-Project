const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),ctx={window:{}};
vm.createContext(ctx);
for(const file of ['world-depth.js','overworld-ores.js','world-chunks.js'])
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const sectionize=ctx.window.MineWorldWorldDepth.sectionizeChunk;
test('deep vertical sections preserve every block including negative Y and partial top sections',()=>{
 const size=4,height=35,minY=-19,data=new Uint8Array(size*size*height);
 for(let col=0;col<size*size;col++)for(let y=0;y<height;y++)
   data[col*height+y]=(col*13+y*7)%171;
 const copy=Buffer.from(data);
 const storage=sectionize({data,minY,height,chunkSize:size,sectionHeight:16});
 assert.equal(storage.sections.length,3);
 assert.deepEqual(storage.sections.map(s=>s.minY),[-19,-3,13]);
 assert.equal(storage.sections[2].height,3);
 for(let x=0;x<size;x++)for(let z=0;z<size;z++)for(let y=minY;y<minY+height;y++)
   assert.equal(storage.read(x,y,z),data[(x*size+z)*height+y-minY]);
 assert.deepEqual(Buffer.from(data),copy,'section conversion does not mutate source');
});
test('uniform air and stone sections compact losslessly and materialize as independent copies',()=>{
 const data=new Uint8Array(2*2*32);
 data.fill(58,16,32);data.fill(58,48,64);data.fill(58,80,96);data.fill(58,112,128);
 const storage=sectionize({data,minY:-64,height:32,chunkSize:2});
 assert.equal(storage.sections[0].uniform,true);
 assert.equal(storage.sections[0].block,0);
 assert.equal(storage.sections[1].uniform,true);
 assert.equal(storage.sections[1].block,58);
 assert.equal(storage.sections[0].data,null);
 assert.equal(storage.read(1,-48,1),58);
 const material=storage.materialize(1);
 material[0]=9;
 assert.equal(storage.read(0,-48,0),58,'materialized data is not shared');
 assert.equal(storage.materialize(3),null);
});
test('section proximity uses absolute negative Y, clamps bounds and rejects invalid reads',()=>{
 const storage=sectionize({data:new Uint8Array(16*16*384),minY:-64,height:384});
 assert.deepEqual(storage.near(-64,1).map(s=>s.index),[0,1]);
 assert.deepEqual(storage.near(319,1).map(s=>s.index),[23,22]);
 assert.deepEqual(storage.near(0,2).map(s=>s.index),[4,3,5,2,6]);
 assert.equal(storage.read(0,-65,0),null);
 assert.equal(storage.read(16,0,0),null);
 assert.equal(storage.read(0,320,0),null);
 assert.throws(()=>storage.near(0,-1),/Invalid section view/);
 assert.throws(()=>sectionize({data:new Uint8Array(7),height:384}),/Invalid vertical chunk/);
});
test('opt-in 384-layer generator can be sectionized without losing terrain or saved edits',()=>{
 const cx=312,cz=312,H=384,minY=-64,SEA=63;
 ctx.window.MineWorldBiomes.setSeed(85721);
 const codec=ctx.window.MineWorldWorldDepth.create({minY,maxY:319});
 const x=cx*16+2,z=cz*16+3;
 const edits=new Map([[codec.index(x,-50,z),11],[codec.index(x,-49,z),0]]);
 const opts={cx,cz,H,minY,SEA,edits};
 const full=ctx.window.MineWorldBiomes.generateChunk(opts);
 const storage=ctx.window.MineWorldBiomes.generateSections(opts);
 assert.equal(storage.sections.length,24);
 assert.equal(storage.read(2,-50,3),11);
 assert.equal(storage.read(2,-49,3),0);
 for(let x=0;x<16;x++)for(let z=0;z<16;z++)for(let y=-64;y<=319;y++)
   assert.equal(storage.read(x,y,z),full[(x*16+z)*H+y+64]);
});
