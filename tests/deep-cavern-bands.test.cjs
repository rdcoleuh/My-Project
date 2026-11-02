/* Deep-profile cavern expansion: independently generated terrain, no imported art. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({window:{}});
for(const name of ['overworld-ores.js','world-chunks.js'])
 vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),ctx,{filename:name});
const world=ctx.window.MineWorldBiomes;
const at=(data,x,y,z,H=384,minY=-64)=>data[(x*16+z)*H+y-minY];
test('opt-in deep cavern band creates broad underground passages while protecting bedrock',()=>{
 world.setSeed(85721);
 const opts={cx:312,cz:312,H:384,minY:-64,SEA:63};
 const a=world.generateChunk(opts),b=world.generateChunk(opts);
 assert.deepEqual(Buffer.from(a),Buffer.from(b),'caverns are deterministic');
 let air=0;
 for(let x=0;x<16;x++)for(let z=0;z<16;z++){
  assert.equal(at(a,x,-64,z),170,'unbreakable floor survives cave generation');
  for(let y=-40;y<=-24;y++)if(at(a,x,y,z)===0)air++;
 }
 assert.ok(air>=500,'deep cave band exposes a substantial traversable chamber');
});
test('neighboring deep chunks keep a continuous cave field at the X seam',()=>{
 world.setSeed(85721);
 const opts={cz:312,H:384,minY:-64,SEA:63};
 const west=world.generateChunk({...opts,cx:312});
 const east=world.generateChunk({...opts,cx:313});
 let agreement=0,total=0;
 for(let z=0;z<16;z++)for(let y=-56;y<=-8;y++){
  if((at(west,15,y,z)===0)===(at(east,0,y,z)===0))agreement++;
  total++;
 }
 assert.ok(agreement/total>=.95,'continuous noise must not form a chunk-edge wall');
});
test('saved deep cave edits override air, ore and bedrock without mutating the save',()=>{
 world.setSeed(85721);
 const cx=312,cz=312,H=384,minY=-64,x=cx*16+1,z=cz*16+2;
 const index=(x,y,z)=>(x*10000+z)*H+y-minY;
 const edits=new Map([[index(x,-32,z),11],[index(x,-64,z),0]]);
 const data=world.generateChunk({cx,cz,H,minY,SEA:63,edits});
 assert.equal(at(data,1,-32,2),11);
 assert.equal(at(data,1,-64,2),0);
 assert.equal(edits.size,2);
});
test('legacy 48-layer cave layout remains byte-for-byte unchanged',()=>{
 world.setSeed(85721);
 const data=world.generateChunk({cx:312,cz:312,H:48,minY:0,SEA:14});
 let hash=2166136261;
 for(const block of data)hash=Math.imul(hash^block,16777619)>>>0;
 assert.equal(hash,0x77e00a1e,'legacy save terrain must not shift');
});
