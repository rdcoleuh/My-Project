/* Regression: async deep-world mesh snapshots must belong to the same
 * section store and the exact claim, not merely share a revision number. */
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','world-depth.js'),'utf8'),ctx);
const create=ctx.window.MineWorldWorldDepth.createSectionStore;
function store(block){
 const data=new Uint8Array(2*2*16);data[0]=block;
 return create({data,height:16,chunkSize:2,minY:-64});
}
function claim(s){return s.claimDirtySectionsNear(-64,0,1,100)[0];}
test('two different chunks with identical revisions cannot swap mesh snapshots',()=>{
 const a=store(3),b=store(11),ja=claim(a),jb=claim(b);
 assert.equal(ja.index,jb.index);assert.equal(ja.revision,jb.revision);
 const sa=a.materializeClaimWithNeighbors(ja);
 const sb=b.materializeClaimWithNeighbors(jb);
 assert.equal(sa.data[0],3);assert.equal(sb.data[0],11);
 assert.notEqual(sa.storeId,sb.storeId);
 assert.equal(a.canInstallClaimWithNeighbors(ja,sa),true);
 assert.equal(b.canInstallClaimWithNeighbors(jb,sb),true);
 assert.equal(a.canInstallClaimWithNeighbors(ja,sb),false,
   'a different chunk cannot install its voxels at the same revision');
 assert.equal(b.canInstallClaimWithNeighbors(jb,sa),false);
});
test('expired and retried claims reject the old snapshot without voxel edits',()=>{
 const s=store(7),first=claim(s),old=s.materializeClaimWithNeighbors(first);
 assert.equal(s.releaseDirtySection(first),true);
 const next=claim(s);
 assert.equal(first.revision,next.revision,'a retry does not mutate voxels');
 assert.notEqual(first.claimId,next.claimId);
 assert.equal(s.canInstallClaimWithNeighbors(next,old),false,
   'same-revision stale worker data is not a valid new lease');
 const fresh=s.materializeClaimWithNeighbors(next);
 assert.equal(fresh.claimId,next.claimId);
 assert.equal(s.canInstallClaimWithNeighbors(next,fresh),true);
 assert.equal(s.ackDirtySection(next),true);
});
test('snapshot identity is carried through vertical and horizontal seam snapshots',()=>{
 const s=store(9),job=claim(s);
 const plain=s.materializeClaim(job),vertical=s.materializeClaimWithSeams(job);
 const horizontal=s.materializeClaimWithNeighbors(job);
 for(const snapshot of [plain,vertical,horizontal]){
  assert.equal(snapshot.storeId,s.storeId);
  assert.equal(snapshot.claimId,job.claimId);
  assert.equal(snapshot.index,job.index);
 }
 assert.equal(s.canInstallClaimWithNeighbors(job,horizontal),true);
 assert.equal(s.canInstallClaimWithNeighbors(job,{...horizontal,storeId:s.storeId+1}),false);
 assert.equal(s.canInstallClaimWithNeighbors(job,{...horizontal,claimId:job.claimId+1}),false);
});
test('neighbor revision checks still reject changed boundary data after identity validation',()=>{
 const center=store(3),east=store(4),job=claim(center);
 const snap=center.materializeClaimWithNeighbors(job,{east});
 assert.equal(center.canInstallClaimWithNeighbors(job,snap,{east}),true);
 east.set(0,-64,0,12);
 assert.equal(center.canInstallClaimWithNeighbors(job,snap,{east}),false);
 const refreshed=center.materializeClaimWithNeighbors(job,{east});
 assert.equal(refreshed.east[0],12);
 assert.equal(center.canInstallClaimWithNeighbors(job,refreshed,{east}),true);
});
