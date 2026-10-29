const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(root,'world-depth.js'),'utf8'),ctx);
const scan=ctx.window.MineWorldWorldDepth.scanNonAirSections;
test('384-layer occupancy includes blocks at -64, 0 and 319, skips air',()=>{
 const height=384,minY=-64,data=new Uint8Array(16*16*height);
 const put=(x,y,z,b)=>{data[(x*16+z)*height+y-minY]=b;};
 put(2,-64,3,58);put(4,0,5,3);put(6,319,7,11);
 const flags=scan({data,height});
 assert.equal(flags.length,24);
 assert.deepEqual([...flags].map((b,i)=>b?i:null).filter(i=>i!==null),[0,4,23]);
 for(let y=-64;y<=319;y++)for(let x=0;x<16;x++)for(let z=0;z<16;z++)
  if(data[(x*16+z)*height+y-minY])
   assert.equal(flags[Math.floor((y-minY)/16)],1);
});
test('partial sections, all-air data and conservative deletion',()=>{
 const data=new Uint8Array(2*2*35);
 assert.deepEqual([...scan({data,height:35,chunkSize:2})],[0,0,0]);
 data[(1*2+1)*35+34]=9;
 const flags=scan({data,height:35,chunkSize:2});
 assert.deepEqual([...flags],[0,0,1]);
 data[(1*2+1)*35+34]=0;
 assert.equal(flags[2],1);
 assert.deepEqual([...scan({data,height:35,chunkSize:2})],[0,0,0]);
});
test('malformed occupancy input is rejected',()=>{
 for(const bad of [{height:48},{data:new Uint8Array(3),height:48},
   {data:new Uint8Array(16*16*48),height:0},
   {data:new Uint8Array(16*16*48),height:48,sectionHeight:0}])
   assert.throws(()=>scan(bad),/Invalid section occupancy/);
});
test('live renderer tracks exact section counts for local and remote edits',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.ok(html.includes('sectionBlockCounts=window.MineWorldWorldDepth.countNonAirSections'));
 assert.ok(html.includes('nonAirSections:Uint8Array.from(sectionBlockCounts'));
 assert.ok(html.includes('updateSectionOccupancy('));
 assert.ok(html.includes('chunk.sectionBlockCounts,chunk.nonAirSections,y-chunk.minY,previous,b'));
 assert.ok(html.includes('if(chunk){set(x,y,z,b);dirtyAround(x,z);}'));
 assert.ok(!html.includes('if(chunk){chunk.data[chunkIndex(x,y,z)]=b;dirtyAround(x,z);}'));
 assert.ok(html.includes('if(!nonAirSections[section])continue'));
 assert.ok(html.includes('y=minY+localY'));
 assert.ok(html.includes('ny-minY]:blockForMesh'));
});

test('exact occupancy clears on last mined block and restores on placement',()=>{
 const api=ctx.window.MineWorldWorldDepth;
 const height=384,minY=-64,data=new Uint8Array(16*16*height);
 const at=(x,y,z)=>(x*16+z)*height+(y-minY);
 data[at(0,-64,0)]=58;
 data[at(0,-64,1)]=58;
 data[at(1,319,0)]=3;
 const counts=api.countNonAirSections({data,height});
 const flags=Uint8Array.from(counts,n=>n?1:0);
 assert.equal(counts.length,24);
 assert.equal(counts[0],2);assert.equal(counts[23],1);
 api.updateSectionOccupancy(counts,flags,0,58,0);
 assert.equal(counts[0],1);assert.equal(flags[0],1);
 api.updateSectionOccupancy(counts,flags,0,58,0);
 assert.equal(counts[0],0);assert.equal(flags[0],0);
 api.updateSectionOccupancy(counts,flags,383,3,11);
 assert.equal(counts[23],1);assert.equal(flags[23],1);
 api.updateSectionOccupancy(counts,flags,383,11,0);
 assert.equal(counts[23],0);assert.equal(flags[23],0);
 api.updateSectionOccupancy(counts,flags,0,0,20);
 assert.equal(counts[0],1);assert.equal(flags[0],1);
});
test('partial sections and invalid count updates are handled safely',()=>{
 const api=ctx.window.MineWorldWorldDepth;
 const data=new Uint8Array(2*2*35);
 data[34]=9;
 const counts=api.countNonAirSections({data,height:35,chunkSize:2});
 const flags=api.scanNonAirSections({data,height:35,chunkSize:2});
 assert.deepEqual([...counts],[0,0,1]);
 api.updateSectionOccupancy(counts,flags,34,9,0);
 assert.deepEqual([...flags],[0,0,0]);
 assert.throws(()=>api.updateSectionOccupancy(counts,flags,34,9,0),/underflow/);
 assert.throws(()=>api.updateSectionOccupancy(counts,flags,-1,0,1),/Invalid/);
 assert.throws(()=>api.updateSectionOccupancy(counts,flags,35,0,1),/Invalid/);
 assert.throws(()=>api.updateSectionOccupancy(counts,flags,0,0,256),/Invalid/);
});
