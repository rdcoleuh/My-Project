/* Dense experimental deep-section GPU batches; original synthetic voxels. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({window:{}});
for(const file of ['world-depth.js','section-face-mesh.js','section-neighborhood.js'])
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const api=ctx.window.MineWorldSectionFaces,depth=ctx.window.MineWorldWorldDepth;
const make=()=>({index:0,revision:4,minY:-64,maxY:-49,chunkSize:16,
 data:new Uint8Array(4096),west:null,east:null,north:null,south:null,above:null,below:null});
function checker(s){for(let x=0;x<16;x++)for(let z=0;z<16;z++)for(let y=0;y<16;y++)
 if((x+z+y)%2===0)s.data[(x*16+z)*16+y]=3;return s;}
test('dense checkerboard produces all faces in bounded GPU draw batches',()=>{
 const plan=api.plan(checker(make()));
 assert.equal(plan.faceCount,12288);
 assert.throws(()=>api.buildTriangles(plan),/face budget/);
 const result=api.buildTriangleBatches(plan,{maxFaces:2048,originX:-16,originZ:32});
 assert.equal(result.faceCount,12288);assert.equal(result.vertexCount,73728);
 assert.equal(result.triangleCount,24576);assert.equal(result.batches.length,6);
 assert.equal(result.stride,8);assert.equal(result.minY,-64);
 assert.equal(result.batches.reduce((n,b)=>n+b.faceCount,0),12288);
 for(const batch of result.batches){
  assert.ok(batch.faceCount<=2048);
  assert.equal(batch.vertices.length,batch.faceCount*48);
  for(let i=0;i<batch.vertices.length;i+=8){
   assert.ok(batch.vertices[i]>=-16&&batch.vertices[i]<=0);
   assert.ok(batch.vertices[i+1]>=-64&&batch.vertices[i+1]<=-48);
   assert.ok(batch.vertices[i+2]>=32&&batch.vertices[i+2]<=48);
  }
 }
});
test('batched and single geometry preserve face order, UVs and original source',()=>{
 const s=make();s.data[(1*16+2)*16+3]=17;s.data[(4*16+5)*16+6]=20;
 const plan=api.plan(s),before=Array.from(plan.faces);
 const options={originX:-32,originZ:16,maxFaces:4,
  uvForFace:(block,face,corner)=>[(block%8+corner)/12,(face+1)/8],
  shapeForBlock:block=>block===17?{left:.2,right:.8,bottom:0,top:.5,front:0,back:1}:null};
 const single=api.buildTriangles(plan,{...options,maxFaces:8192});
 const batched=api.buildTriangleBatches(plan,options);
 const combined=Array.from(batched.batches).flatMap(b=>Array.from(b.vertices));
 assert.deepEqual(combined,Array.from(single.vertices));
 assert.deepEqual(Array.from(plan.faces),before);
 assert.ok(batched.batches.every(b=>b.faceCount<=4));
});
test('invalid budgets and corrupted final faces reject before any UV callback',()=>{
 const s=checker(make()),plan=api.plan(s);
 for(const n of [0,-1,8193,1.5,NaN])
  assert.throws(()=>api.buildTriangleBatches(plan,{maxFaces:n}),/batch face budget/);
 let calls=0;
 const corrupt=Uint32Array.from(plan.faces);
 corrupt[corrupt.length-1]=(3<<15)|(6<<12);
 assert.throws(()=>api.buildTriangleBatches({...plan,faces:corrupt},
  {maxFaces:1024,uvForFace:()=>{calls++;return [0,0]}}),/packed section face/);
 assert.equal(calls,0);
 assert.throws(()=>api.buildTriangleBatches({...plan,faceCount:3}),/face plan/);
});
test('coordinator opt-in batching retains signed origins and stale mesh leases',()=>{
 const store=depth.createSectionStore({data:new Uint8Array(4096),
  minY:-64,height:16,chunkSize:16,sectionHeight:16});
 const world=ctx.window.MineWorldSectionNeighborhood.createSectionNeighborhood();
 world.register(-2,3,store);
 for(let x=0;x<16;x++)for(let z=0;z<16;z++)for(let y=0;y<16;y++)
  if((x+y+z)%2===0)world.set(-2,3,x,y-64,z,3);
 const job=store.claimDirtySectionsNear(-64,1,1,100)[0];
 const result=world.planMesh(-2,3,job,{geometry:{batched:true,maxFaces:2048}});
 assert.equal(result.geometry.faceCount,12288);
 assert.equal(result.geometry.batches.length,6);
 assert.equal(result.geometry.originX,-32);assert.equal(result.geometry.originZ,48);
 world.set(-2,3,0,-64,0,0);
 assert.equal(world.canInstall(-2,3,store,job,result.snapshot),false);
 assert.equal(world.planMesh(-2,3,job,{geometry:{batched:true}}),null);
});
test('empty sections create no GPU draw batches',()=>{
 const plan=api.plan(make()),result=api.buildTriangleBatches(plan);
 assert.equal(result.faceCount,0);assert.equal(result.batches.length,0);
 assert.equal(result.vertexCount,0);
});
