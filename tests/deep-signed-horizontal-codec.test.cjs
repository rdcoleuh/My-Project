/* Signed horizontal origins are opt-in: old indices and saves stay unchanged. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','world-depth.js'),'utf8'),ctx);
const api=ctx.window.MineWorldWorldDepth;
const plain=value=>JSON.parse(JSON.stringify(value));

test('signed deep-world codec round-trips all four horizontal and vertical boundaries',()=>{
 const c=api.create({width:32,depth:48,minX:-16,minZ:-24,minY:-64,maxY:319});
 assert.equal(c.height,384);
 assert.equal(c.index(-16,-64,-24),0);
 assert.equal(c.index(15,319,23),c.volume-1);
 for(const point of [[-16,-64,-24],[-1,0,-1],[0,63,0],[15,319,23]]){
  const [x,y,z]=point,n=c.index(x,y,z);
  assert.deepEqual(plain(c.decode(n)),{x,y,z});
  assert.equal(c.networkIndex(x,y,z,'overworld'),n);
  assert.deepEqual(plain(c.decodeNetwork(c.networkIndex(x,y,z,'end'))),
   {x,y,z,dimension:'end'});
 }
 for(const point of [[-17,-64,-24],[16,0,0],[-16,320,-24],[-16,-65,-24],[-16,0,24]])
  assert.equal(c.index(...point),null);
});

test('negative chunk coordinates use globally aligned modulo rather than origin-relative offsets',()=>{
 const c=api.create({width:48,depth:48,minX:-24,minZ:-24,minY:-64,maxY:319});
 const local=v=>((v%16)+16)%16;
 for(const [x,z] of [[-24,-24],[-17,-1],[-16,-16],[-1,-1],[0,0],[15,15],[23,23]]){
  assert.equal(c.chunkIndex(x,-64,z),(local(x)*16+local(z))*384);
  assert.equal(c.chunkIndex(x,319,z),(local(x)*16+local(z))*384+383);
 }
 assert.equal(c.chunkIndex(-25,0,0),null);
});

test('signed mixed-height network codec separates all three dimensions',()=>{
 const c=api.createDimensionCodec({width:32,depth:32,minX:-16,minZ:-16});
 assert.equal(c.minX,-16);assert.equal(c.minZ,-16);
 const points=[['overworld',-64],['overworld',319],['nether',0],['end',47]];
 const indices=points.map(([dimension,y])=>c.networkIndex(-1,y,-1,dimension));
 assert.equal(new Set(indices).size,indices.length);
 for(let i=0;i<indices.length;i++){
  const [dimension,y]=points[i];
  assert.deepEqual(plain(c.decodeNetwork(indices[i])),{x:-1,y,z:-1,dimension});
 }
 assert.equal(c.networkIndex(-17,0,-1,'nether'),null);
 assert.equal(c.networkIndex(-1,319,-1,'end'),null);
});

test('migration of overlapping signed coordinates is atomic and defaults stay byte-identical',()=>{
 const old=api.create({width:32,depth:32,minY:0,maxY:47});
 const shifted=api.create({width:32,depth:32,minX:-16,minZ:-16,minY:-64,maxY:319});
 const edits=new Map([[old.index(0,0,0),11],[old.index(15,47,15),0]]);
 const migrated=api.reindexEdits(edits,old,shifted);
 assert.equal(migrated.get(shifted.index(0,0,0)),11);
 assert.equal(migrated.get(shifted.index(15,47,15)),0);
 assert.deepEqual(plain([...api.reindexEdits(migrated,shifted,old)]),[...edits]);
 const invalid=new Map([...edits,[old.index(31,0,31),9]]);
 assert.throws(()=>api.reindexEdits(invalid,old,shifted),/outside target world/);
 assert.equal(invalid.size,3);
 const legacy=api.create();
 assert.equal(legacy.index(5000,14,5000),(5000*10000+5000)*48+14);
 assert.deepEqual(plain(legacy.decode(legacy.index(5000,14,5000))),{x:5000,y:14,z:5000});
 assert.throws(()=>api.create({minX:Number.MAX_SAFE_INTEGER,width:3}),/Invalid world dimensions/);
});
