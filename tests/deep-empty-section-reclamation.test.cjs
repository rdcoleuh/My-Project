/* Deep-world mobile memory: reclaim fully mined vertical slices immediately. */
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const context=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','world-depth.js'),'utf8'),context);
const create=context.window.MineWorldWorldDepth.createSectionStore;
const fresh=()=>create({data:new Uint8Array(16*16*384),height:384,minY:-64});

test('last removed voxel releases a 4096-byte deep-world section without explicit compact',()=>{
 const store=fresh();
 assert.equal(store.stats().payloadBytes,24);
 store.set(2,-32,3,58);
 assert.equal(store.stats().payloadBytes,24-1+4096);
 assert.equal(store.stats().active,1);
 store.set(2,-32,3,0);
 assert.equal(store.stats().payloadBytes,24,'empty slice reverts to one-byte uniform encoding');
 assert.equal(store.stats().active,0);
 assert.equal(store.get(2,-32,3),0);
 assert.equal(store.near(-32,0)[0].uniform,true);
 assert.equal(store.rebuild().every(v=>v===0),true);
});

test('a partially mined section retains its remaining blocks and payload until fully empty',()=>{
 const store=fresh();
 store.applyEdits([[1,-1,2,11],[1,-2,2,3],[5,-3,5,58]]);
 assert.equal(store.stats().blocks,3);
 const bytes=store.stats().payloadBytes;
 store.set(1,-1,2,0);
 assert.equal(store.stats().payloadBytes,bytes,'do not discard nonempty slices');
 assert.equal(store.get(1,-2,2),3);
 store.set(1,-2,2,0);
 assert.equal(store.stats().payloadBytes,bytes);
 store.set(5,-3,5,0);
 assert.equal(store.stats().payloadBytes,24);
 assert.equal(store.stats().blocks,0);
 store.set(1,-1,2,11);
 assert.equal(store.get(1,-1,2),11,'copy-on-write remains available after reclamation');
 assert.equal(store.stats().payloadBytes,bytes);
});

test('last-block removal invalidates in-flight mesh and schedules GPU mesh removal',()=>{
 const store=fresh();
 store.set(0,-48,0,11);
 const claim=store.claimDirtySectionsNear(-48,0,1,100)[0];
 assert.ok(claim);
 assert.equal(store.materializeClaim(claim).data.some(Boolean),true);
 store.set(0,-48,0,0);
 assert.equal(store.canInstallClaim(claim),false,'obsolete GPU build cannot be installed');
 assert.equal(store.materializeClaim(claim),null);
 const pending=store.dirtySectionsNear(-48,0,1);
 assert.equal(pending.length,1);
 assert.equal(pending[0].action,'remove');
 assert.equal(pending[0].nonAir,0);
 const newClaim=store.claimDirtySectionsNear(-48,0,1,200)[0];
 assert.ok(newClaim);
 assert.equal(store.ackDirtySection(newClaim),true);
 assert.equal(store.dirtySectionsNear(-48,0,1).length,0);
});
