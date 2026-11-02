/* Deep-profile mountain terrain is opt-in; original worlds must not move. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({window:{}});
for(const name of ['overworld-ores.js','world-chunks.js'])
 vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),ctx,{filename:name});
const biomes=ctx.window.MineWorldBiomes;
biomes.setSeed(85721);
const location=name=>{
 const index=biomes.BIOMES.findIndex(b=>b.name===name);
 assert.notEqual(index,-1,name);
 const point=biomes.atlasDestination(index);
 assert.equal(biomes.biomeAt(point.x,point.z).name,name);
 return point;
};
test('deep Frozen Peaks rise above 150 while legacy heights stay unchanged',()=>{
 const peak=location('Frozen Peaks'),ocean=location('Frozen Ocean');
 assert.equal(biomes.terrainAt(peak.x,peak.z,14,48,0),27);
 const elevated=biomes.terrainAt(peak.x,peak.z,63,384,-64);
 assert.ok(elevated>=150&&elevated<=319,'deep peak must be high but within world limits');
 assert.equal(biomes.terrainAt(ocean.x,ocean.z,63,384,-64),60,
  'ocean remains below the 63-block sea level');
 assert.equal(biomes.terrainAt(ocean.x,ocean.z,14,48,0),11);
});
test('deep biome transitions are continuous across 16-block chunk boundaries',()=>{
 for(let x=4352;x<4528;x+=16)for(let z=4352;z<4528;z+=16){
  const h=biomes.terrainAt(x,z,63,384,-64);
  const next=biomes.terrainAt(x+1,z,63,384,-64);
  assert.ok(Math.abs(h-next)<=8,'no abrupt terrain seam at '+x+','+z);
 }
});
test('generated deep mountain columns are solid through their new surface and keep bedrock',()=>{
 const {x,z}=location('Frozen Peaks'),cx=Math.floor(x/16),cz=Math.floor(z/16);
 const options={cx,cz,H:384,minY:-64,SEA:63};
 const a=biomes.generateChunk(options),b=biomes.generateChunk(options);
 assert.deepEqual(Buffer.from(a),Buffer.from(b),'seeded deep terrain must be deterministic');
 const at=y=>a[((x-cx*16)*16+(z-cz*16))*384+y+64];
 const top=biomes.terrainAt(x,z,63,384,-64);
 assert.ok(top>=150);
 assert.notEqual(at(top),0,'mountain surface is actually generated, not just reported');
 assert.equal(at(-64),170,'deep bedrock remains intact');
});
