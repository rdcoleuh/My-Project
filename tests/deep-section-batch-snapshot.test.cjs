/* Deep-world multiplayer/save replay: batch entries must be detached from
 * mutable caller arrays before any voxel, mesh, or occupancy state changes. */
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','world-depth.js'),'utf8'),ctx);
const make=(data=new Uint8Array(16*16*384))=>
 ctx.window.MineWorldWorldDepth.createSectionStore({data,height:384,minY:-64});
test('late mutation of an already validated edit cannot cause partial replay',()=>{
 const store=make(),first=[1,-63,1,4],second=[2,-63,2,5];
 const entries={*[Symbol.iterator](){
   yield first;
   yield second;
   second[3]=999; // Previously made set() throw after first voxel was changed.
 }};
 assert.equal(store.applyEdits(entries),2);
 assert.equal(second[3],999);
 assert.equal(store.get(1,-63,1),4);
 assert.equal(store.get(2,-63,2),5);
 assert.equal(store.stats().blocks,2);
});
test('reused iterator entry arrays retain the value of each yielded edit',()=>{
 const store=make(),shared=[1,-64,1,3];
 const entries={*[Symbol.iterator](){
   yield shared;
   shared[0]=2;shared[1]=319;shared[3]=9;
   yield shared;
   shared[3]=200;
 }};
 assert.equal(store.applyEdits(entries),2);
 assert.equal(store.get(1,-64,1),3);
 assert.equal(store.get(2,319,1),9);
 assert.equal(store.get(2,-64,1),0);
 assert.equal(store.stats().blocks,2);
});
test('array accessors are evaluated only once during batch preflight',()=>{
 const store=make(),entry=[3,-64,4,0];let reads=0;
 Object.defineProperty(entry,3,{enumerable:true,configurable:true,
   get(){return ++reads===1?7:999;}});
 assert.equal(store.applyEdits([entry]),1);
 assert.equal(reads,1);
 assert.equal(store.get(3,-64,4),7);
});
test('a malformed later entry preserves earlier voxels and outstanding mesh claims',()=>{
 const data=new Uint8Array(16*16*384);data[0]=11;
 const store=make(data),claim=store.claimDirtySectionsNear(-64,0,1,100)[0];
 assert.ok(claim);
 const before=store.stats();
 assert.throws(()=>store.applyEdits([[1,-64,1,4],[2,320,2,5]]),
   /Invalid section edit batch/);
 assert.equal(store.get(1,-64,1),0);
 assert.equal(store.get(0,-64,0),11);
 assert.equal(store.canInstallClaim(claim),true);
 assert.deepEqual(store.stats(),before);
});
test('ordinary valid batches preserve sequential update counts and seam invalidation',()=>{
 const store=make();
 assert.equal(store.applyEdits([[0,-48,0,4],[0,-48,0,6],[0,-48,0,6]]),2);
 assert.equal(store.get(0,-48,0),6);
 assert.deepEqual([...store.dirtySections()],[0,1]);
});
