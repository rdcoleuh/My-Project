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
test('live renderer uses section flags and marks placements',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.ok(html.includes('nonAirSections:window.MineWorldWorldDepth.scanNonAirSections'));
 assert.ok(html.includes('if(b!==0)chunk.nonAirSections[Math.floor((y-chunk.minY)/16)]=1'));
 assert.ok(html.includes('if(!nonAirSections[section])continue'));
 assert.ok(html.includes('y=minY+localY'));
 assert.ok(html.includes('ny-minY]:blockForMesh'));
});
