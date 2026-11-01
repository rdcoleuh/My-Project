/* Deep native generator preflight protects mobile frames and saved edits.
 * All textures and test data are independently generated. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const window={};const ctx=vm.createContext({window});
for(const file of ['world-depth.js','overworld-ores.js','world-chunks.js'])
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx,{filename:file});
const biomes=window.MineWorldBiomes,depth=window.MineWorldWorldDepth;
const opts={cx:-2,cz:-2,minX:-32,minZ:-32,width:64,depth:64,
  H:384,minY:-64,SEA:63};
const codec=depth.create({...opts,maxY:319});
const index=(x,y,z)=>((x+32)*64+(z+32))*384+(y+64);

test('unbounded sea levels are rejected before terrain loops can freeze mobile',()=>{
  for(const sea of [-1000000000,-65,320,1000000000])
    assert.throws(()=>biomes.generateChunk({...opts,SEA:sea}),/Invalid chunk generation bounds/);
  for(const sea of [Number.NaN,Number.POSITIVE_INFINITY,63.5])
    assert.throws(()=>biomes.generateChunk({...opts,SEA:sea}),/Invalid chunk generation bounds/);
});
test('valid deep and legacy sea profiles continue generating deterministically',()=>{
  biomes.setSeed(85721);
  const deep=biomes.generateChunk(opts);
  assert.equal(deep.length,16*16*384);
  assert.equal(deep[0],170);
  const legacy=biomes.generateChunk({cx:0,cz:0,H:48,minY:0,SEA:14});
  assert.equal(legacy.length,16*16*48);
});
test('invalid saved edits abort before any ore-generation side effects',()=>{
  const ores=window.MineWorldOres,original=ores.generate;
  let calls=0;
  ores.generate=(...args)=>{calls++;return original(...args);};
  try{
    for(const edits of [
      new Map([[codec.index(-31,-64,-31),7],[codec.volume,4]]),
      new Map([[codec.index(-31,-64,-31),7],[codec.index(-30,63,-30),256]]),
      new Map([[-1,2]]),
      new Map([[codec.index(-31,-64,-31),-1]])
    ]) {
      const before=[...edits];
      assert.throws(()=>biomes.generateChunk({...opts,edits}),/Invalid saved chunk edit/);
      assert.deepEqual([...edits],before,'caller-owned edit map must not change');
    }
    assert.equal(calls,0,'no expensive ore generation for rejected saves');
  }finally{ores.generate=original;}
});
test('valid air and bedrock edits replay after generation at signed coordinates',()=>{
  const edits=new Map([
    [codec.index(-31,-64,-31),0],
    [codec.index(-30,63,-30),7],
    [codec.index(-17,319,-17),11]
  ]);
  const chunk=biomes.generateChunk({...opts,edits});
  const at=(x,y,z)=>chunk[((x+32)*16+(z+32))*384+(y+64)];
  assert.equal(at(-31,-64,-31),0);
  assert.equal(at(-30,63,-30),7);
  assert.equal(at(-17,319,-17),11);
  assert.equal(edits.size,3);
});
