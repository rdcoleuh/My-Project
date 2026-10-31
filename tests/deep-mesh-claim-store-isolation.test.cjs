/* Async mesh jobs belong to their source chunk even when numeric IDs match. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','world-depth.js'),'utf8'),ctx);
const create=ctx.window.MineWorldWorldDepth.createSectionStore;
function store(block){
 const data=new Uint8Array(2*2*16);data[0]=block;
 return create({data,height:16,chunkSize:2,minY:-64});
}
const claim=s=>s.claimDirtySectionsNear(-64,0,1,100)[0];
test('foreign chunk claim cannot read or install this chunk mesh',()=>{
 const a=store(3),b=store(11),own=claim(a),foreign=claim(b);
 assert.equal(own.index,foreign.index);
 assert.equal(own.claimId,foreign.claimId);
 assert.equal(own.revision,foreign.revision);
 assert.notEqual(own.storeId,foreign.storeId);
 assert.equal(a.canInstallClaim(own),true);
 assert.equal(a.canInstallClaim(foreign),false);
 assert.equal(a.materializeClaim(foreign),null);
 assert.equal(a.materializeClaimWithSeams(foreign),null);
 assert.equal(a.materializeClaimWithNeighbors(foreign),null);
 const snapshot=a.materializeClaimWithNeighbors(own);
 assert.equal(a.canInstallClaimWithNeighbors(foreign,snapshot),false);
 assert.equal(a.canInstallClaimWithNeighbors(own,snapshot),true);
});
test('foreign acknowledge and release cannot silently discard pending mesh work',()=>{
 const a=store(3),b=store(11),own=claim(a),foreign=claim(b);
 assert.equal(a.ackDirtySection(foreign),false);
 assert.equal(a.releaseDirtySection(foreign),false);
 assert.equal(a.stats().dirty,1);
 assert.equal(a.stats().inFlight,1);
 assert.equal(a.canInstallClaim(own),true);
 assert.equal(a.ackDirtySection(own),true);
 assert.equal(a.stats().dirty,0);
 assert.equal(a.stats().inFlight,0);
 assert.equal(b.canInstallClaim(foreign),true,'other chunk lease is untouched');
});
test('forged or stale store identities cannot clear a retried section',()=>{
 const a=store(3),b=store(11),first=claim(a);
 const forged={...first,storeId:b.storeId};
 assert.equal(a.canInstallClaim(forged),false);
 assert.equal(a.ackDirtySection(forged),false);
 assert.equal(a.releaseDirtySection(forged),false);
 assert.equal(a.releaseDirtySection(first),true);
 const retry=claim(a);
 assert.notEqual(retry.claimId,first.claimId);
 assert.equal(retry.storeId,a.storeId);
 assert.equal(a.ackDirtySection(first),false);
 assert.equal(a.ackDirtySection(retry),true);
 assert.equal(a.stats().dirty,0);
});
