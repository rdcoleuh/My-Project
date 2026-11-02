/* Opt-in GPU triangle bridge for deep-world sections; no copyrighted textures. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({window:{}});
for(const file of ['world-depth.js','section-face-mesh.js','section-neighborhood.js','block-face-uv.js'])
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const api=ctx.window.MineWorldSectionFaces,depth=ctx.window.MineWorldWorldDepth;
const snap=()=>({index:0,revision:2,minY:-64,maxY:-49,chunkSize:16,
 data:new Uint8Array(16*16*16),west:null,east:null,north:null,south:null,above:null,below:null});
const idx=(x,z,y)=>(x*16+z)*16+y;
const xyz=(vertices,offset)=>[vertices[offset],vertices[offset+1],vertices[offset+2]];
test('one negative-Y voxel emits correctly wound, shaded WebGL triangles',()=>{
 const s=snap();s.data[idx(2,3,4)]=170;
 const plan=api.plan(s),g=api.buildTriangles(plan,{originX:-16,originZ:32});
 assert.equal(g.faceCount,6);assert.equal(g.vertexCount,36);
 assert.equal(g.triangleCount,12);assert.equal(g.stride,8);
 assert.equal(g.vertices.length,288);assert.equal(g.minY,-64);
 const normals=[[-1,0,0],[1,0,0],[0,-1,0],[0,1,0],[0,0,-1],[0,0,1]];
 for(let face=0;face<6;face++){
  const offset=face*6*8;
  const a=xyz(g.vertices,offset),b=xyz(g.vertices,offset+8),c=xyz(g.vertices,offset+16);
  const ab=b.map((n,i)=>n-a[i]),ac=c.map((n,i)=>n-a[i]);
  const cross=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
  assert.ok(cross.reduce((sum,n,i)=>sum+n*normals[face][i],0)>0,'outward face '+face);
  for(let j=0;j<6;j++){
   const p=xyz(g.vertices,offset+j*8);
   assert.ok(p[0]>=-14&&p[0]<=-13&&p[1]>=-60&&p[1]<=-59&&p[2]>=35&&p[2]<=36);
   assert.ok(g.vertices[offset+j*8+3]>0&&g.vertices[offset+j*8+3]<=1);
  }
 }
});
test('player atlas UVs retain source face orientation and per-block mapping',()=>{
 const s=snap();s.data[idx(1,2,0)]=9;
 const seen=[],plan=api.plan(s);
 const g=api.buildTriangles(plan,{uvForFace:(block,face,corner)=>{
  seen.push([block,face,corner]);return [corner/4,block/255];
 }});
 assert.equal(seen.length,24,'one UV sample per quad corner, not per triangle');
 assert.deepEqual(seen.slice(0,4).map(x=>x[2]),[2,3,0,1],'west face orientation');
 assert.equal(g.vertices[6],.5);assert.ok(Math.abs(g.vertices[7]-9/255)<1e-7);
 assert.equal(g.vertices[14],.75);
});
test('partial block geometry uses original cuboid bounds without modifying source',()=>{
 const s=snap();s.data[idx(1,1,1)]=20;
 const plan=api.plan(s);
 const g=api.buildTriangles(plan,{shapeForBlock:()=>({
  left:.25,right:.75,bottom:.125,top:.875,front:.1,back:.9
 })});
 for(let i=0;i<g.vertices.length;i+=8){
  const [x,y,z]=xyz(g.vertices,i);
  assert.ok(x>=1.25&&x<=1.75&&y>=-62.875&&y<=-62.125&&z>=1.1&&z<=1.9);
 }
 assert.equal(s.data[idx(1,1,1)],20);
});
test('oversized or corrupt section plans fail before GPU buffer allocation',()=>{
 const s=snap();s.data[idx(0,0,0)]=3;
 const plan=api.plan(s);let called=0;
 assert.throws(()=>api.buildTriangles(plan,{maxFaces:5,uvForFace:()=>{called++;return [0,0]}}),/face budget/);
 assert.equal(called,0);
 assert.throws(()=>api.buildTriangles({...plan,faces:Uint32Array.of((3<<15)|(6<<12)),faceCount:1}),/packed section face/);
 assert.throws(()=>api.buildTriangles(plan,{originX:Number.MAX_SAFE_INTEGER}),/world origin/);
 assert.throws(()=>api.buildTriangles(plan,{uvForFace:()=>[NaN,0]}),/atlas UV/);
 assert.throws(()=>api.buildTriangles(plan,{shapeForBlock:()=>({left:2})}),/block shape/);
});
test('signed chunk coordinator can opt into geometry without changing mesh claims',()=>{
 const make=()=>depth.createSectionStore({data:new Uint8Array(16*16*32),
  minY:-64,height:32,chunkSize:16,sectionHeight:16});
 const world=ctx.window.MineWorldSectionNeighborhood.createSectionNeighborhood(),store=make();
 world.register(-1,2,store);world.set(-1,2,1,-64,2,3);
 const job=store.claimDirtySectionsNear(-64,1,1,100)[0];
 const plain=world.planMesh(-1,2,job);
 assert.ok(plain);assert.equal(plain.geometry,undefined);
 const built=world.planMesh(-1,2,job,{geometry:{maxFaces:8}});
 assert.ok(built?.geometry);assert.equal(built.geometry.originX,-16);
 assert.equal(built.geometry.originZ,32);assert.equal(built.geometry.faceCount,6);
 world.set(-1,2,2,-64,2,3);
 assert.equal(world.canInstall(-1,2,store,job,built.snapshot),false);
 assert.equal(world.planMesh(-1,2,job,{geometry:true}),null);
});
