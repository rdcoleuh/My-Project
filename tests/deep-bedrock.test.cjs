/* Deep Overworld foundation and legacy compatibility regression tests. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({window:{}});
for(const name of ['world-depth.js','overworld-ores.js','world-chunks.js'])
 vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),ctx,{filename:name});
const chunks=ctx.window.MineWorldBiomes;
const at=(data,x,y,z,H=384,minY=-64)=>data[(x*16+z)*H+y-minY];
test('384-layer world has deterministic bedrock floor and varied transition',()=>{
 chunks.setSeed(85721);
 const a=chunks.generateChunk({cx:312,cz:312,H:384,minY:-64,SEA:63});
 const b=chunks.generateChunk({cx:312,cz:312,H:384,minY:-64,SEA:63});
 assert.deepEqual(Buffer.from(a),Buffer.from(b));
 let bedrock=0,other=0;
 for(let x=0;x<16;x++)for(let z=0;z<16;z++){
  assert.equal(at(a,x,-64,z),170);
  for(let y=-63;y<=-60;y++)if(at(a,x,y,z)===170)bedrock++;else other++;
  assert.notEqual(at(a,x,-59,z),170);
 }
 assert.ok(bedrock>0&&other>0,'transition is uneven');
});
test('player-authored deep edits replay after bedrock generation',()=>{
 chunks.setSeed(85721);
 const c=ctx.window.MineWorldWorldDepth.create({width:10000,depth:10000,minY:-64,maxY:319});
 const x=312*16+1,z=312*16+2;
 const edits=new Map([[c.index(x,-64,z),11],[c.index(x,-63,z),0]]);
 const data=chunks.generateChunk({cx:312,cz:312,H:384,minY:-64,SEA:63,edits});
 assert.equal(at(data,1,-64,2),11);
 assert.equal(at(data,1,-63,2),0);
});
test('legacy chunks are unchanged and do not generate bedrock',()=>{
 chunks.setSeed(85721);
 const data=chunks.generateChunk({cx:312,cz:312,H:48,SEA:14});
 assert.equal(data.includes(170),false);
});
test('original bedrock art is opaque and survival cannot mine it',()=>{
 const art=vm.createContext({window:{MineWorldPixelMaterials:{paint:()=>[0,0,0,255]}}});
 vm.runInContext(fs.readFileSync(path.join(root,'core-pixel-art.js'),'utf8'),art);
 const colors=new Set(),paint=art.window.MineWorldCorePixelArt.paint;
 for(let y=0;y<16;y++)for(let x=0;x<16;x++){
  const pixel=paint(170,1,x,y);
  assert.equal(pixel.length,4);assert.equal(pixel[3],255);
  colors.add(pixel.slice(0,3).join(','));
 }
 assert.ok(colors.size>5);
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.match(html,/'Red Bed','Bedrock'/);
 assert.match(html,/target\.b===170&&gameMode!=='creative'/);
 assert.match(html,/aim\.b===170/);
});
