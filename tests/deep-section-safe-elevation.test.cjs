/* Deep-world section indices must never round past safe absolute Y. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','world-depth.js'),'utf8'),ctx);
const depth=ctx.window.MineWorldWorldDepth;
test('rejects unsafe section upper bounds before constructing any sections',()=>{
 const data=new Uint8Array(4);
 for(const minY of [Number.MAX_SAFE_INTEGER-3,Number.MAX_SAFE_INTEGER-1]){
  const options={data,minY,height:4,chunkSize:1,sectionHeight:2};
  assert.throws(()=>depth.sectionizeChunk(options),/Invalid vertical chunk data/);
  assert.throws(()=>depth.createSectionStore(options),/Invalid vertical chunk data/);
 }
 assert.throws(()=>depth.sectionizeChunk({
  data:new Uint8Array(1),minY:Number.MAX_SAFE_INTEGER,height:1,chunkSize:1
 }),/Invalid vertical chunk data/);
});
test('last representable exclusive upper bound retains exact section reads',()=>{
 const minY=Number.MAX_SAFE_INTEGER-4,data=Uint8Array.from([3,4,5,6]);
 const options={data,minY,height:4,chunkSize:1,sectionHeight:2};
 const sections=depth.sectionizeChunk(options);
 assert.equal(sections.maxY,Number.MAX_SAFE_INTEGER-1);
 for(let i=0;i<4;i++)assert.equal(sections.read(0,minY+i,0),data[i]);
 assert.equal(sections.read(0,Number.MAX_SAFE_INTEGER,0),null);
 const store=depth.createSectionStore(options);
 assert.equal(store.get(0,minY+3,0),6);
 assert.equal(store.set(0,minY+3,0,7),true);
 assert.equal(store.get(0,minY+3,0),7);
});
test('normal deep Overworld and negative safe minima retain precise section mapping',()=>{
 for(const minY of [-64,Number.MIN_SAFE_INTEGER]){
  const data=Uint8Array.from([1,2,3,4]);
  const options={data,minY,height:4,chunkSize:1,sectionHeight:2};
  const sections=depth.sectionizeChunk(options);
  assert.equal(sections.minY,minY);
  assert.equal(sections.maxY,minY+3);
  for(let i=0;i<4;i++)assert.equal(sections.read(0,minY+i,0),i+1);
 }
});
