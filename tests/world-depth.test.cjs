const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),ctx={window:{}};vm.createContext(ctx);
for(const name of ['world-depth.js','overworld-ores.js','world-chunks.js'])
  vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),ctx,{filename:name});
const api=ctx.window.MineWorldWorldDepth;
test('legacy coordinate codec preserves every old save index and multiplayer offset',()=>{
 const c=api.create({width:10000,depth:10000,minY:0,maxY:47});
 for(const [x,y,z] of [[0,0,0],[5000,14,5000],[9999,47,9999]]){
  const old=(x*10000+z)*48+y;
  assert.equal(c.index(x,y,z),old);
  assert.deepEqual(JSON.parse(JSON.stringify(c.decode(old))),{x,y,z});
  assert.equal(c.networkIndex(x,y,z,'end'),old+2*10000*10000*48);
 }
 assert.equal(c.inside(5000,-1,5000),false);
});
test('deep codec spans Y -64 through 319 without colliding with dimension offsets',()=>{
 const c=api.create({width:10000,depth:10000,minY:-64,maxY:319});
 assert.equal(c.height,384);assert.equal(c.minY,-64);assert.equal(c.maxY,319);
 for(const y of [-64,-1,0,63,319]){
  const n=c.index(5000,y,5000);
  assert.equal(c.decode(n).y,y);
  assert.equal(c.decodeNetwork(c.networkIndex(5000,y,5000,'nether')).dimension,'nether');
  assert.equal(c.decodeNetwork(c.networkIndex(5000,y,5000,'end')).y,y);
 }
 assert.equal(c.inside(5000,-65,5000),false);
 assert.equal(c.inside(5000,320,5000),false);
 assert.equal(c.decode(-1),null);
 assert.equal(c.decode(c.volume),null);
 assert.equal(c.decodeNetwork(c.volume*3),null);
});
test('opt-in deep Overworld chunk has 384 layers and deepslate below Y 0',()=>{
 ctx.window.MineWorldBiomes.setSeed(85721);
 const cx=312,cz=312,H=384,minY=-64,SEA=63;
 const data=ctx.window.MineWorldBiomes.generateChunk({cx,cz,H,minY,SEA});
 assert.equal(data.length,16*16*384);
 const at=(dx,y,dz)=>data[(dx*16+dz)*H+(y-minY)];
 assert.equal(at(0,-64,0),58,'deep floor currently uses deepslate pending bedrock block');
 assert.equal(at(0,-1,0),58,'negative layers use deepslate');
 const surface=ctx.window.MineWorldBiomes.terrainAt(cx*16,cz*16,SEA,H,minY);
 assert.ok(surface>=40&&surface<140,'surface near standard sea level');
 assert.ok(at(0,surface,0)>0,'terrain surface generated');
});
test('legacy chunk generation stays byte-identical with explicit minY zero',()=>{
 ctx.window.MineWorldBiomes.setSeed(85721);
 const old=ctx.window.MineWorldBiomes.generateChunk({cx:312,cz:312,H:48,SEA:14});
 const same=ctx.window.MineWorldBiomes.generateChunk({cx:312,cz:312,H:48,SEA:14,minY:0});
 assert.deepEqual(Buffer.from(old),Buffer.from(same));
});
test('live game retains legacy world saves until a versioned migration exists',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.match(html,/const W=10000, D=10000, H=48, SEA=14/);
 assert.match(html,/const vertical=window.MineWorldWorldDepth.create/);
 assert.match(html,/world-depth\.js/);
 assert.match(fs.readFileSync(path.join(root,'sw.js'),'utf8'),/world-depth\.js/);
});