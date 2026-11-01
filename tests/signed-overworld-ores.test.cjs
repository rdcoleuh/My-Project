/* Signed experimental ore chunks and protected player edits. No bundled assets. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const context=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','overworld-ores.js'),'utf8'),context);
const ores=context.window.MineWorldOres;
const biomeAt=()=>({name:'Plains'}),terrainAt=()=>319;
const deep={H:384,minY:-64,sea:63,minX:-32,minZ:-32,width:64,depth:64,cx:-1,cz:-1,biomeAt,terrainAt};
const fresh=height=>new Uint8Array(16*16*height).fill(3);
const index=(x,y,z)=>((x-deep.minX)*deep.depth+(z-deep.minZ))*deep.H+(y-deep.minY);
const local=(x,y,z)=>((x+16)*16+(z+16))*deep.H+(y-deep.minY);

test('signed negative X/Z deep-world chunks generate deterministic ore veins',()=>{
 ores.setSeed(85721);
 const first=fresh(384),second=fresh(384);
 ores.generate({...deep,data:first});
 ores.generate({...deep,data:second});
 assert.deepEqual(first,second);
 assert.ok(first.some(id=>[18,19,95,96,97,98,99,100,101,102,103,104,105,106,107,108].includes(id)),
  'negative-coordinate chunks must not be rejected as outside the world');
});
test('signed saved edits override ore generation at deep Y and bedrock floor',()=>{
 const data=fresh(384),protectedEdits=new Map([
  [index(-1,-64,-1),11],[index(-1,-63,-1),12],[index(-1,-20,-1),13],
  [index(-16,319,-16),14]
 ]);
 ores.generate({...deep,data,protectedEdits});
 for(const [x,y,z,id] of [[-1,-64,-1,11],[-1,-63,-1,12],[-1,-20,-1,13],[-16,319,-16,14]])
  assert.equal(data[local(x,y,z)],id,'preserve '+x+','+y+','+z);
});
test('chunks outside a signed world boundary cannot place ores',()=>{
 const data=fresh(384);
 ores.generate({...deep,cx:-3,cz:-3,data});
 assert.ok(data.every(id=>id===3));
});
test('legacy positive chunks preserve default coordinate encoding and ore output',()=>{
 ores.setSeed(85721);
 const opts={H:48,minY:0,sea:14,cx:1,cz:1,biomeAt,terrainAt:()=>42};
 const a=fresh(48),b=fresh(48);
 ores.generate({...opts,data:a});
 ores.generate({...opts,data:b,minX:0,minZ:0,width:10000,depth:10000});
 assert.deepEqual(a,b);
 const edited=fresh(48),x=16,z=16,y=0;
 ores.generate({...opts,data:edited,protectedEdits:new Map([[(x*10000+z)*48+y,11]])});
 assert.equal(edited[0],11,'even legacy floor edits must not vanish on regeneration');
});
test('reject malformed chunk geometry before writing player terrain',()=>{
 for(const patch of [{H:383},{width:0},{minX:Number.MAX_SAFE_INTEGER},
                     {cx:1.5},{data:new Uint8Array(10)}]){
  const data=fresh(384),before=Uint8Array.from(data);
  assert.throws(()=>ores.generate({...deep,data,...patch}),/Invalid ore chunk geometry/);
  assert.deepEqual(data,before);
 }
});
