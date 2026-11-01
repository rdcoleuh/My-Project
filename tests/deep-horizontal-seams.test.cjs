const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ctx={window:{}};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','world-depth.js'),'utf8'),ctx);
const depth=ctx.window.MineWorldWorldDepth;
const make=(minY=-64,height=32,occupied=false)=>{
  const data=new Uint8Array(2*2*height);
  if(occupied)data[0]=3;
  return depth.createSectionStore({data,minY,height,chunkSize:2});
};
test('horizontal boundary edit invalidates a neighboring in-flight mesh',()=>{
  const west=make(),east=make(-64,32,true);
  const [old]=east.claimDirtySectionsNear(-64,4,4,100);
  assert.ok(old);
  assert.equal(east.canInstallClaim(old),true);
  assert.equal(west.setWithNeighbors(1,-64,0,7,{east}),true);
  assert.equal(east.canInstallClaim(old),false,'old neighbor mesh lease is stale');
  assert.deepEqual(Array.from(east.dirtySections()),[0]);
  const [next]=east.claimDirtySectionsNear(-64,4,4,101);
  assert.ok(next&&next.claimId!==old.claimId);
  assert.equal(east.ackDirtySection(next),true);
  assert.deepEqual(Array.from(east.dirtySections()),[]);
});
test('corner edit invalidates west and north neighbors plus vertical section seam',()=>{
  const center=make(),west=make(),north=make(),east=make();
  assert.equal(center.setWithNeighbors(0,-49,0,11,{west,north,east}),true);
  assert.deepEqual(Array.from(west.dirtySections()),[0]);
  assert.deepEqual(Array.from(north.dirtySections()),[0]);
  assert.deepEqual(Array.from(east.dirtySections()),[],'opposite side untouched');
  assert.deepEqual(Array.from(center.dirtySections()),[0,1]);
});
test('unchanged block does not invalidate neighboring chunks twice',()=>{
  const center=make(),west=make();
  assert.equal(center.setWithNeighbors(0,-63,1,5,{west}),true);
  west.takeDirtySections();center.takeDirtySections();
  const rev=west.stats().revision;
  assert.equal(center.setWithNeighbors(0,-63,1,5,{west}),false);
  assert.equal(west.stats().revision,rev);
  assert.deepEqual(Array.from(west.dirtySections()),[]);
});
test('invalid neighbor height and self-neighbor are rejected before mutating blocks',()=>{
  const center=make(),short=make(-64,16);
  assert.throws(()=>center.setWithNeighbors(1,-60,1,5,{east:short}),/Incompatible adjacent section store/);
  assert.equal(center.get(1,-60,1),0);
  assert.equal(center.stats().revision,0);
  assert.throws(()=>center.setWithNeighbors(0,-60,1,5,{west:center}),/Incompatible adjacent section store/);
  assert.equal(center.get(0,-60,1),0);
  assert.throws(()=>center.setWithNeighbors(0,-65,1,5,{}),/Invalid section block edit/);
  assert.throws(()=>center.setWithNeighbors(0,-60,1,256,{}),/Invalid section block edit/);
  assert.deepEqual(Array.from(center.dirtySections()),[]);
});
test('unloaded neighbors and interior edits do not require full chunk arrays',()=>{
  const center=make(),neighbor=make();
  assert.equal(center.setWithNeighbors(1,-33,1,5,{}),true);
  assert.deepEqual(Array.from(neighbor.dirtySections()),[]);
  assert.equal(center.get(1,-33,1),5);
  assert.equal(center.setWithNeighbors(0,-64,0,7,{}),true);
  assert.equal(center.get(0,-64,0),7);
  assert.equal(center.stats().revision,2);
});
test('neighbor-aware snapshots reject a horizontal seam edit before mesh install',()=>{
  const west=make(-64,32,true),east=make(-64,32,true);
  const [job]=west.claimDirtySectionsNear(-64,4,4,100);
  const snapshot=west.materializeClaimWithNeighbors(job,{east});
  assert.ok(snapshot);
  assert.equal(west.canInstallClaimWithNeighbors(job,snapshot,{east}),true);
  assert.equal(east.setWithNeighbors(0,-64,0,4,{west}),true);
  assert.equal(west.canInstallClaimWithNeighbors(job,snapshot,{east}),false);
});
