/* Regression tests for original deep-world face planning and chunk seams. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx={window:{}};
vm.createContext(ctx);
for(const file of ['world-depth.js','section-face-mesh.js','section-neighborhood.js'])
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
const mesh=ctx.window.MineWorldSectionFaces;
const depth=ctx.window.MineWorldWorldDepth;
const coordinator=ctx.window.MineWorldSectionNeighborhood;
const blank=()=>({index:0,revision:1,minY:-64,maxY:-49,chunkSize:16,data:new Uint8Array(4096),
 west:null,east:null,north:null,south:null,below:null,above:null});
const at=(x,z,y)=>(x*16+z)*16+y;
test('single deep-world block exposes six correctly packed faces at negative Y',()=>{
 const s=blank();s.data[at(2,3,4)]=170;
 const result=mesh.plan(s);
 assert.equal(result.occupied,1);assert.equal(result.faceCount,6);
 assert.deepEqual([...result.faces].map(p=>mesh.unpack(p,-64).face),[0,1,2,3,4,5]);
 assert.deepEqual({...mesh.unpack(result.faces[0],-64)},{x:2,z:3,localY:4,y:-60,face:0,block:170});
 assert.equal(s.data[at(2,3,4)],170,'source snapshot is not mutated');
});
test('adjacent solids hide internal faces; transparent neighbors can expose them',()=>{
 const s=blank();s.data[at(1,1,1)]=5;s.data[at(2,1,1)]=2;
 assert.equal(mesh.plan(s).faceCount,10);
 assert.equal(mesh.plan(s,{occludes:(neighbor)=>neighbor===5}).faceCount,11);
});
test('all six boundary planes suppress exactly the matching faces',()=>{
 const s=blank();s.data[at(0,0,0)]=1;
 assert.equal(mesh.plan(s).faceCount,6);
 s.west=new Uint8Array(256);s.west[0]=1;
 s.north=new Uint8Array(256);s.north[0]=1;
 s.below=new Uint8Array(256);s.below[0]=1;
 const result=mesh.plan(s);
 assert.equal(result.faceCount,3);
 assert.deepEqual([...result.faces].map(p=>mesh.unpack(p,-64).face),[1,3,5]);
 assert.deepEqual([...result.missingNeighbors],['east','south','above']);
});
test('reject malformed snapshots instead of reading beyond neighbor buffers',()=>{
 const s=blank();s.data=new Uint8Array(100);
 assert.throws(()=>mesh.plan(s),/dimensions/);
 s.data=new Uint8Array(4096);s.east=new Uint8Array(5);
 assert.throws(()=>mesh.plan(s),/neighbor plane/);
 assert.throws(()=>mesh.plan({...s,east:null},{occludes:true}),/predicate/);
});
test('cross-chunk planner builds only current claims and rejects stale neighbor edits',()=>{
 const make=()=>depth.createSectionStore({data:new Uint8Array(16*16*32),
  minY:-64,height:32,chunkSize:16,sectionHeight:16});
 const center=make(),neighbor=make(),world=coordinator.createSectionNeighborhood();
 world.register(0,0,center);world.register(1,0,neighbor);
 world.set(0,0,15,-64,3,5);
 const job=center.claimDirtySectionsNear(-64,1,1,100)[0];
 assert.ok(job);
 const result=world.planMesh(0,0,job);
 assert.ok(result);assert.equal(result.plan.faceCount,6);
 world.set(1,0,0,-64,3,5);
 assert.equal(world.canInstall(0,0,center,job,result.snapshot),false);
 assert.equal(world.planMesh(0,0,job),null,'stale claim cannot create a new plan');
});

test('default deep-section planner retains opaque faces behind glass and water',()=>{
 const s=blank();s.data[at(1,1,1)]=3;s.data[at(2,1,1)]=9;
 const plan=mesh.plan(s);
 assert.equal(plan.faceCount,11,'stone remains visible through glass; hidden glass backface is culled');
 assert.ok([...plan.faces].some(face=>{
  const f=mesh.unpack(face,-64);return f.x===1&&f.z===1&&f.localY===1&&f.face===1;
 }), 'stone east face must remain present behind glass');
 s.data[at(2,1,1)]=7;
 assert.equal(mesh.plan(s).faceCount,11,'water must not erase an opaque wall face');
 s.data[at(1,1,1)]=9;
 assert.equal(mesh.plan(s).faceCount,12,'different transparent materials retain their interface');
});
test('matching translucent blocks still cull internal faces for mobile mesh budgets',()=>{
 const s=blank();s.data[at(1,1,1)]=9;s.data[at(2,1,1)]=9;
 assert.equal(mesh.plan(s).faceCount,10,'joined glass blocks have no internal face');
 s.data[at(1,1,1)]=7;s.data[at(2,1,1)]=7;
 assert.equal(mesh.plan(s).faceCount,10,'joined water blocks have no internal face');
 s.data[at(1,1,1)]=6;s.data[at(2,1,1)]=6;
 assert.equal(mesh.plan(s).faceCount,10,'joined leaves do not double their interior geometry');
});
test('neighbor chunk glass does not hide boundary stone; solid neighbor does',()=>{
 const s=blank();s.data[at(0,0,0)]=3;
 s.west=new Uint8Array(256);s.west[0]=9;
 assert.equal(mesh.plan(s).faceCount,6,'imported glass in adjacent chunk must not erase stone face');
 s.west[0]=3;
 assert.equal(mesh.plan(s).faceCount,5,'solid neighbor still culls hidden stone face');
 assert.equal(mesh.plan(s,{occludes:()=>true}).faceCount,0,'explicit caller predicate retains priority');
});

test('partial block neighbors preserve stone faces across the experimental section mesh',()=>{
 const s=blank();s.data[at(1,1,1)]=3;
 for(const partial of [16,17,44,45,63,73,87,89,93,119,122,125,126,128,129,137,139,145,155,159,162,164,167,169]){
  s.data[at(2,1,1)]=partial;
  const plan=mesh.plan(s);
  assert.equal(plan.faceCount,11,'partial block '+partial+' must not hide stone');
  assert.ok([...plan.faces].some(p=>{
   const f=mesh.unpack(p,-64);
   return f.x===1&&f.z===1&&f.localY===1&&f.face===1;
  }), 'stone east face remains visible beside '+partial);
 }
 s.data[at(2,1,1)]=20;
 assert.equal(mesh.plan(s).faceCount,10,'full-cube furnace still occludes stone');
});
test('cross-chunk partial blocks cannot erase opaque boundary faces',()=>{
 const s=blank();s.data[at(0,2,4)]=3;
 s.west=new Uint8Array(256);
 for(const partial of [44,87,126,139,162,169]){
  s.west[2*16+4]=partial;
  assert.equal(mesh.plan(s).faceCount,6,'west boundary with partial '+partial);
 }
 s.west[2*16+4]=20;
 assert.equal(mesh.plan(s).faceCount,5,'full furnace across seam hides face');
});
test('matching partial blocks still cull interior faces to limit mobile geometry',()=>{
 const s=blank();s.data[at(1,1,1)]=139;s.data[at(2,1,1)]=139;
 assert.equal(mesh.plan(s).faceCount,10);
 s.data[at(1,1,1)]=162;s.data[at(2,1,1)]=162;
 assert.equal(mesh.plan(s).faceCount,10);
});
