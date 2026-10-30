/* Deep-world save profile preflight: no live world conversion. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'world-depth.js'),'utf8'),ctx);
const api=ctx.window.MineWorldWorldDepth;
test('untagged legacy saves stay loadable; deep and unknown profiles are refused',()=>{
 assert.equal(api.readSaveProfile({version:13}),api.LEGACY_PROFILE);
 assert.equal(api.canLoadLegacySave({version:13}),true);
 assert.equal(api.canLoadLegacySave({verticalProfile:api.LEGACY_PROFILE}),true);
 assert.equal(api.canLoadLegacySave({verticalProfile:api.DEEP_PROFILE}),false);
 for(const value of ['other-profile',null,48,{}])
  assert.equal(api.canLoadLegacySave({verticalProfile:value}),false);
 assert.equal(api.canLoadLegacySave(null),false);
});
test('live save writes legacy profile and load refuses deep stride before mutations',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.ok(html.includes('worldSize:W,verticalProfile:window.MineWorldWorldDepth.LEGACY_PROFILE'));
 const guard=html.indexOf('if(!window.MineWorldWorldDepth.canLoadLegacySave(s))');
 const restore=html.indexOf('seed=s.seed;seedLabel=');
 assert.ok(guard>0&&restore>guard,'profile guard must precede terrain regeneration');
 assert.ok(html.includes('Unsupported save version or world height; original save preserved'));
});
test('preview migrates all three dimension edit maps without mutating original save',()=>{
 const width=32,depth=32;
 const old=api.create({width,depth,minY:0,maxY:47});
 const deep=api.create({width,depth,minY:-64,maxY:319});
 const oldA=old.index(10,47,12),oldB=old.index(11,0,12);
 const save={version:13,worldSize:width,edits:[[oldA,7],[oldB,0]],
  netherEdits:[[oldB,23]],endEdits:[[oldA,42]]};
 const before=JSON.stringify(save);
 const plan=api.planLegacySaveMigration(save,{width,depth});
 assert.equal(plan.status,'preview-only');
 assert.equal(plan.targetProfile,api.DEEP_PROFILE);
 assert.deepEqual([...plan.edits[0]],[deep.index(10,47,12),7]);
 assert.deepEqual([...plan.edits[1]],[deep.index(11,0,12),0]);
 assert.deepEqual([...plan.netherEdits[0]],[oldB,23]);
 assert.deepEqual([...plan.endEdits[0]],[oldA,42]);
 assert.equal(JSON.stringify(save),before,'source save is unchanged');
 assert.equal(Object.isFrozen(plan),true);
});
test('migration rejects malformed, duplicate and incompatible saves atomically',()=>{
 const width=16,depth=16;
 const base={version:13,worldSize:width,edits:[[0,1]],netherEdits:[],endEdits:[]};
 for(const change of [
  {edits:[[0,1],[0,2]]},{edits:[[999999,1]]},{edits:[[0,256]]},
  {netherEdits:[[0,-1]]},{endEdits:[[0,1],[0,1]]},
  {version:4},{worldSize:10000},{verticalProfile:api.DEEP_PROFILE}
 ]){
  const save={...base,...change},before=JSON.stringify(save);
  assert.throws(()=>api.planLegacySaveMigration(save,{width,depth}),/save|edit|profile/i);
  assert.equal(JSON.stringify(save),before);
 }
});
