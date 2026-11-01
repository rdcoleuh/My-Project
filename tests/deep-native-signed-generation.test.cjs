/* Native signed 384-layer terrain generation and edit replay.
 * Original MineWorld test fixture; no imported proprietary artwork. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx=vm.createContext({window:{}});
for(const name of ['world-depth.js','overworld-ores.js','world-chunks.js','section-neighborhood.js'])
 vm.runInContext(fs.readFileSync(path.join(__dirname,'..',name),'utf8'),ctx,{filename:name});
const biomes=ctx.window.MineWorldBiomes,depth=ctx.window.MineWorldWorldDepth;
const makeStream=ctx.window.MineWorldSectionNeighborhood.createDeepChunkStream;
const signed={minX:-32,minZ:-32,width:64,depth:64};
const codec=depth.create({...signed,minY:-64,maxY:319});
const index=(dx,y,dz)=>((dx*16+dz)*384+y+64);

test('built-in generator creates deterministic signed terrain and bedrock',()=>{
 biomes.setSeed(85721);
 const opts={cx:-2,cz:-2,H:384,minY:-64,SEA:63,...signed};
 const a=biomes.generateChunk(opts),b=biomes.generateChunk(opts);
 assert.deepEqual(Buffer.from(a),Buffer.from(b));
 assert.equal(a.length,16*16*384);
 for(let x=0;x<16;x++)for(let z=0;z<16;z++)
  assert.equal(a[index(x,-64,z)],170,'every signed column has a bedrock floor');
 assert.ok(a.some(block=>block===58),'deep stone exists below zero');
});

test('signed saved edits decode correctly at negative chunk and vertical boundaries',()=>{
 const edits=new Map([
  [codec.index(-31,-64,-31),11],
  [codec.index(-17,319,-17),7],
  [codec.index(-30,63,-30),0]
 ]);
 const data=biomes.generateChunk({cx:-2,cz:-2,H:384,minY:-64,SEA:63,...signed,edits});
 assert.equal(data[index(1,-64,1)],11);
 assert.equal(data[index(15,319,15)],7);
 assert.equal(data[index(2,63,2)],0);
 assert.equal(edits.size,3,'caller-owned saved edits remain intact');
});

test('native signed deep stream preserves edits through eviction and reload',()=>{
 const s=makeStream({...signed,maxLoaded:1});
 s.load(-2,-2);
 assert.equal(s.getWorld(-31,-64,-31),170);
 assert.equal(s.setWorld(-31,-64,-31,11),true);
 assert.equal(s.setWorld(-30,63,-30,7),true);
 s.load(-1,-1);
 assert.equal(s.getWorld(-31,-64,-31),null);
 s.load(-2,-2);
 assert.equal(s.getWorld(-31,-64,-31),11);
 assert.equal(s.getWorld(-30,63,-30),7);
 assert.equal(s.snapshotEdits().get(codec.index(-31,-64,-31)),11);
});

test('legacy generator output remains identical with explicit default bounds',()=>{
 const opts={cx:0,cz:0,H:48,minY:0,SEA:14};
 const a=biomes.generateChunk(opts);
 const b=biomes.generateChunk({...opts,minX:0,minZ:0,width:10000,depth:10000});
 assert.deepEqual(Buffer.from(a),Buffer.from(b));
});

test('invalid signed profiles and saved edit indices fail before generation',()=>{
 const opts={cx:-2,cz:-2,H:384,minY:-64,SEA:63,...signed};
 for(const bad of [{minX:-31},{width:63},{depth:0},{cx:-3},{cx:2},{minZ:Number.MAX_SAFE_INTEGER}])
  assert.throws(()=>biomes.generateChunk({...opts,...bad}),/Invalid chunk generation bounds/);
 assert.throws(()=>biomes.generateChunk({...opts,edits:new Map([[codec.volume,4]])}),/Invalid saved chunk edit/);
});
