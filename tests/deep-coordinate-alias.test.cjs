/* Regression: absolute world coordinates must never alias another voxel. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx={window:{}};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','world-depth.js'),'utf8'),ctx);
const codec=ctx.window.MineWorldWorldDepth;
test('invalid legacy world coordinates cannot alias a valid saved edit',()=>{
 const c=codec.create({width:10000,depth:10000,minY:0,maxY:47});
 assert.equal(c.index(0,47,0),47);
 assert.equal(c.index(0,0,1),48);
 assert.equal(c.index(0,48,0),null,'Y above ceiling must not wrap to next Z column');
 assert.equal(c.index(0,-1,1),null,'Y below floor must not wrap to previous Z column');
 for(const [x,y,z] of [[-1,0,0],[10000,0,0],[0,0,-1],[0,0,10000],
   [0,1.5,0],[NaN,0,0],[Infinity,0,0]])
  assert.equal(c.index(x,y,z),null);
 assert.equal(c.chunkIndex(0,48,0),null);
 assert.equal(c.chunkIndex(0,-1,1),null);
 assert.equal(c.chunkIndex(-1,0,0),null);
});
test('deep world chunk indexing preserves negative Y without wrapping',()=>{
 const c=codec.create({width:10000,depth:10000,minY:-64,maxY:319});
 for(const [x,y,z] of [[0,-64,0],[15,-1,15],[16,63,16],[9999,319,9999]]){
  const offset=((x%16)*16+(z%16))*384+(y+64);
  assert.equal(c.chunkIndex(x,y,z),offset);
  assert.deepEqual(JSON.parse(JSON.stringify(c.decode(c.index(x,y,z)))),{x,y,z});
 }
 for(const y of [-65,320])assert.equal(c.chunkIndex(0,y,0),null);
 assert.equal(c.chunkIndex(1.5,63,0),null);
});
test('chunk stride validation prevents precision loss in tiny world codecs',()=>{
 assert.throws(()=>codec.create({width:1,depth:1,minY:0,maxY:0,chunkSize:100000000}),
   /Chunk stride exceeds safe index range/);
 assert.equal(codec.create({width:1,depth:1,minY:0,maxY:0,chunkSize:16}).chunkIndex(0,0,0),0);
});
test('valid legacy and deep coordinates retain unchanged serialized indices',()=>{
 const legacy=codec.create(),deep=codec.create({minY:-64,maxY:319});
 assert.equal(legacy.index(5000,14,5000),(5000*10000+5000)*48+14);
 assert.equal(deep.index(5000,63,5000),(5000*10000+5000)*384+127);
 assert.equal(legacy.networkIndex(5000,14,5000,'nether'),legacy.volume+legacy.index(5000,14,5000));
 assert.equal(deep.networkIndex(5000,-64,5000,'end'),deep.volume*2+deep.index(5000,-64,5000));
});
