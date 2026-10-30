/* Future save-version guard and preview-only deep-world player positions. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'world-depth.js'),'utf8'),ctx);
const api=ctx.window.MineWorldWorldDepth;
const width=32,depth=32;
const legacy=api.create({width,depth,minY:0,maxY:47});
const sample=()=>({version:13,worldSize:width,dimension:'nether',
 edits:[[legacy.index(2,0,3),11]],netherEdits:[],endEdits:[],
 player:{x:2.5,y:16.5,z:3.5,yaw:1.25,pitch:0},
 overworldPosition:{x:4.5,y:46.5,z:5.5},
 netherPosition:{x:2.5,y:16.5,z:3.5},
 endPosition:{x:6.5,y:20,z:7.5}});
test('future or malformed save versions cannot be decoded as legacy',()=>{
 for(const version of [14,999,-1,1.5,'13',null]){
  assert.equal(api.canLoadLegacySave({version}),false,String(version));
  assert.equal(api.canLoadLegacySave({version,verticalProfile:api.LEGACY_PROFILE}),false,String(version));
 }
 for(const version of [0,5,12,13])
  assert.equal(api.canLoadLegacySave({version}),true,String(version));
 assert.equal(api.canLoadLegacySave({}),true,'untagged historical saves without version remain supported');
 assert.equal(api.canLoadLegacySave({version:13,verticalProfile:api.DEEP_PROFILE}),false);
});
test('preview checks all saved player/dimension coordinates without shifting absolute Y',()=>{
 const save=sample(),before=JSON.stringify(save);
 const preview=api.planLegacySaveMigration(save,{width,depth});
 assert.equal(preview.status,'preview-only');
 assert.equal(preview.dimension,'nether');
 for(const [key,y] of [['player',16.5],['overworld',46.5],['nether',16.5],['end',20]])
  assert.equal(preview.positions[key].y,y,key);
 assert.equal(preview.positions.overworld.x,4.5);
 assert.equal(preview.positions.player.yaw,undefined,'orientation is not claimed as migrated');
 assert.equal(Object.isFrozen(preview.positions),true);
 assert.equal(Object.isFrozen(preview.positions.player),true);
 assert.equal(JSON.stringify(save),before,'preview never mutates player saves');
});
test('invalid dimension or coordinates abort preview before any save mutation',()=>{
 const base=sample();
 for(const change of [
  {dimension:'moon'},
  {player:{x:2,y:48,z:3}},
  {player:{x:2,y:-1,z:3}},
  {player:{x:Infinity,y:10,z:3}},
  {overworldPosition:{x:32,y:10,z:3}},
  {netherPosition:{x:1,y:10,z:-1}},
  {endPosition:{x:1,y:'10',z:3}},
  {version:14}
 ]){
  const save={...base,...change},before=JSON.stringify(save);
  assert.throws(()=>api.planLegacySaveMigration(save,{width,depth}),/position|dimension|profile|version/i);
  assert.equal(JSON.stringify(save),before);
 }
});
test('optional historical positions remain absent and source maps unchanged',()=>{
 const save={version:5,worldSize:width,edits:[[legacy.index(1,47,1),42]]};
 const before=JSON.stringify(save),preview=api.planLegacySaveMigration(save,{width,depth});
 assert.equal(preview.positions.player,null);
 assert.equal(preview.positions.nether,null);
 assert.equal(preview.dimension,'overworld');
 assert.equal(preview.edits[0][1],42);
 assert.equal(JSON.stringify(save),before);
});
test('live load guard precedes all world mutations and refuses unknown versions',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const guard=html.indexOf('if(!window.MineWorldWorldDepth.canLoadLegacySave(s))');
 const restore=html.indexOf('seed=s.seed;seedLabel=');
 assert.ok(guard>=0&&restore>guard);
 assert.match(html,/Unsupported save version or world height; original save preserved/);
});
