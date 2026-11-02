/* Original deterministic deep-aquifer regression fixtures, no third-party assets. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({window:{}});
for(const name of ['overworld-ores.js','world-chunks.js'])
 vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),ctx,{filename:name});
const world=ctx.window.MineWorldBiomes;
const at=(data,x,y,z,H=384,minY=-64)=>data[(x*16+z)*H+y-minY];
const opts={cx:314,cz:311,H:384,minY:-64,SEA:63};
test('staged deep caves contain deterministic water pockets and low lava without flooding bedrock',()=>{
 world.setSeed(85721);
 const a=world.generateChunk(opts),b=world.generateChunk(opts);
 assert.deepEqual(Buffer.from(a),Buffer.from(b));
 let water=0,lava=0,air=0;
 for(let x=0;x<16;x++)for(let z=0;z<16;z++){
  assert.equal(at(a,x,-64,z),170,'the bedrock floor remains intact');
  for(let y=-60;y<=-24;y++){
   const block=at(a,x,y,z);
   if(block===7){water++;assert.ok(y>-54&&y<=-30,'water stays in its deep aquifer band');}
   if(block===66){lava++;assert.ok(y<=-54,'lava stays at or below Y=-54');}
   if(block===0)air++;
  }
 }
 assert.ok(water>500,'deep caves have meaningful water-filled passages');
 assert.ok(lava>100,'the bottom cave band exposes lava pockets');
 assert.ok(air>0,'not every deep passage is flooded');
});
test('adjacent deep chunks have a coherent aquifer and lava field across their shared border',()=>{
 world.setSeed(85721);
 const west=world.generateChunk({cx:313,cz:312,H:384,minY:-64,SEA:63});
 const east=world.generateChunk({cx:314,cz:312,H:384,minY:-64,SEA:63});
 let agreement=0,total=0;
 for(let z=0;z<16;z++)for(let y=-60;y<=-24;y++){
  const a=at(west,15,y,z),b=at(east,0,y,z);
  if((a===7)===(b===7)&&(a===66)===(b===66))agreement++;
  total++;
 }
 assert.ok(agreement/total>.95,'no discontinuous aquifer wall at the chunk seam');
});
test('saved player edits override generated water and lava without mutating the edit map',()=>{
 world.setSeed(85721);
 const original=world.generateChunk(opts),locations={};
 for(let x=0;x<16;x++)for(let z=0;z<16;z++)for(let y=-60;y<=-24;y++){
  const block=at(original,x,y,z);
  if(block===7&&!locations.water)locations.water={x,y,z};
  if(block===66&&!locations.lava)locations.lava={x,y,z};
 }
 assert.ok(locations.water&&locations.lava,'fixture must include both fluids');
 const globalIndex=({x,y,z})=>(((opts.cx*16+x)*10000+opts.cz*16+z)*384+y+64);
 const edits=new Map([[globalIndex(locations.water),0],[globalIndex(locations.lava),11]]);
 const changed=world.generateChunk({...opts,edits});
 assert.equal(at(changed,locations.water.x,locations.water.y,locations.water.z),0);
 assert.equal(at(changed,locations.lava.x,locations.lava.y,locations.lava.z),11);
 assert.equal(edits.size,2);
 assert.equal(at(original,locations.water.x,locations.water.y,locations.water.z),7);
});
test('legacy 48-layer cave and ore bytes are unchanged by opt-in deep aquifers',()=>{
 world.setSeed(85721);
 const legacy=world.generateChunk({cx:312,cz:312,H:48,minY:0,SEA:14});
 let hash=2166136261;
 for(const block of legacy)hash=Math.imul(hash^block,16777619)>>>0;
 assert.equal(hash,0x77e00a1e);
});

test('deep lava occupies coherent pockets rather than every bottom cave opening',()=>{
 world.setSeed(85721);
 const chunk=world.generateChunk(opts);
 let lava=0,dry=0;
 for(let x=0;x<16;x++)for(let z=0;z<16;z++)for(let y=-60;y<=-54;y++){
  const block=at(chunk,x,y,z);
  if(block===66)lava++;
  if(block===0)dry++;
 }
 assert.ok(lava>100,'bottom caves still contain meaningful lava hazards');
 assert.ok(dry>30,'some deep cave passages stay open for exploration');
 // The original generator filled every bottom-band opening with lava.
 // A pocket field must create both hazards and traversable gaps.
 assert.ok(lava>0&&dry>0);
});
test('deep lava pockets remain deterministic across neighboring chunk boundaries',()=>{
 world.setSeed(85721);
 const left=world.generateChunk({cx:313,cz:312,H:384,minY:-64,SEA:63});
 const right=world.generateChunk({cx:314,cz:312,H:384,minY:-64,SEA:63});
 let equal=0,total=0;
 for(let z=0;z<16;z++)for(let y=-60;y<=-54;y++){
  if((at(left,15,y,z)===66)===(at(right,0,y,z)===66))equal++;
  total++;
 }
 assert.ok(equal/total>.85,'no artificial lava seam at the chunk border');
 const again=world.generateChunk({cx:314,cz:312,H:384,minY:-64,SEA:63});
 assert.deepEqual(Buffer.from(right),Buffer.from(again));
});
