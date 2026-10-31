/* Validate staged deep-world chunk allocation and save-edit integrity. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const context=vm.createContext({window:{}});
for(const file of ['world-depth.js','overworld-ores.js','world-chunks.js'])
 vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context,{filename:file});
const generator=context.window.MineWorldBiomes;
const codec=(minY,maxY)=>context.window.MineWorldWorldDepth.create({minY,maxY});
test('rejects oversized and malformed chunk profiles before allocating',()=>{
 for(const options of [
  {cx:312,cz:312,H:1e9,SEA:63,minY:-64},
  {cx:312,cz:312,H:385,SEA:63,minY:-64},
  {cx:312,cz:312,H:384,SEA:63,minY:-65},
  {cx:312,cz:312,H:384,SEA:63,minY:0},
  {cx:625,cz:312,H:48,SEA:14,minY:0},
  {cx:-1,cz:312,H:48,SEA:14,minY:0},
  {cx:312.5,cz:312,H:48,SEA:14,minY:0},
  {cx:312,cz:312,H:NaN,SEA:14,minY:0}
 ])assert.throws(()=>generator.generateChunk(options),/Invalid chunk generation bounds/);
});
test('rejects malformed saved edits instead of wrapping block IDs in Uint8Array',()=>{
 const p=codec(0,47),index=p.index(312*16+1,12,312*16+2);
 for(const [badIndex,badBlock] of [
  [index,256],[index,-1],[index,511],[index,1.5],[index,NaN],
  [-1,11],[p.volume,11],[index+.5,11]
 ]){
  const edits=new Map([[badIndex,badBlock]]);
  assert.throws(()=>generator.generateChunk({cx:312,cz:312,H:48,SEA:14,edits}),
   /Invalid saved chunk edit/);
  assert.equal(edits.size,1,'failed generation must not alter saved edits');
 }
});
test('valid placed and mined edits retain exact values in legacy and deep profiles',()=>{
 for(const [H,minY,SEA] of [[48,0,14],[384,-64,63]]){
  const p=codec(minY,minY+H-1),x=312*16+1,z=312*16+2;
  const y=minY+7,edits=new Map([[p.index(x,y,z),169],[p.index(x,y+1,z),0]]);
  const data=generator.generateChunk({cx:312,cz:312,H,SEA,minY,edits});
  const at=level=>data[(1*16+2)*H+level-minY];
  assert.equal(at(y),169);
  assert.equal(at(y+1),0);
  assert.equal(edits.get(p.index(x,y,z)),169);
 }
});
test('invalid edits containers cannot silently bypass save replay',()=>{
 assert.throws(()=>generator.generateChunk({cx:312,cz:312,edits:[]}),
  /Expected a Map of saved chunk edits/);
 assert.match(fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8'),
  /mineworld-6-131-deep-chunk-guards/);
});
