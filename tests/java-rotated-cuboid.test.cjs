/* Synthetic Java model metadata only; no original Minecraft textures. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
const enc=o=>Uint8Array.from(Buffer.from(JSON.stringify(o)));
function api(){const window={};vm.runInNewContext(read('java-model-faces.js'),{window,TextDecoder});return window.MineWorldJavaModelFaces;}
const dirs=['up','down','north','south','east','west'];
const model={textures:{top:'minecraft:block/top',north:'minecraft:block/north',
 south:'minecraft:block/south',east:'minecraft:block/east',west:'minecraft:block/west'},
 elements:[{from:[1,2,3],to:[7,10,12],faces:{
 up:{texture:'#top',rotation:90},down:{texture:'#top'},
 north:{texture:'#north',uv:[1,2,9,10]},south:{texture:'#south'},
 east:{texture:'#east'},west:{texture:'#west'}
 }}]};
function pack(y,opts={}){
 const files={
  'state:stone':enc({variants:{'':{model:'minecraft:block/custom',y,uvlock:!!opts.uvlock}}}),
  'model:custom':enc(model),
  ...Object.fromEntries(['top','north','south','east','west'].filter(x=>x!==opts.missing)
   .map(x=>['block:'+x,Uint8Array.of(1)]))
 };
 const entries=new Map(Object.entries(files));
 return {entries,get:async key=>entries.get(key)||null};
}
const expected={
 0:[1,7,3,12],90:[4,13,1,7],180:[9,15,4,13],270:[3,12,9,15]
};
test('rotated off-center Java cuboids preserve correct world bounds at all four Y angles',async()=>{
 for(const y of [0,90,180,270]){
  const result=await api().resolve(pack(y),'stone');
  assert.ok(result?.shape,'rotated single cuboid should import at '+y);
  const b=result.shape;
  const actual=[b.left,b.right,b.front,b.back].map(x=>Math.round(x*16));
  assert.deepEqual(actual,expected[y],String(y));
  assert.equal(b.bottom,2/16);
  assert.equal(b.top,10/16);
 }
});
test('quarter-turn geometry, directional sprites and explicit UVs rotate together',async()=>{
 const result=await api().resolve(pack(90),'stone');
 assert.equal(result.sides.east,'block:north');
 assert.equal(result.sides.north,'block:west');
 assert.equal(result.sides.west,'block:south');
 assert.equal(result.sides.south,'block:east');
 assert.deepEqual(Array.from(result.faceUV.east.uv),[1,2,9,10]);
 assert.equal(result.faceUV.up.rotation,180);
 const locked=await api().resolve(pack(90,{uvlock:true}),'stone');
 assert.equal(locked.faceUV.up.rotation,90,'UV lock keeps the top texture aligned');
 assert.deepEqual({...locked.shape},{...result.shape},'UV lock cannot change collision');
});
test('missing imported sprite never commits partial rotated geometry',async()=>{
 assert.equal(await api().resolve(pack(270,{missing:'west'}),'stone'),null);
 const source=read('java-model-faces.js'),sw=read('sw.js');
 assert.match(source,/rotatedShapeY\(data\.shape,turns\)/);
 assert.match(sw,/rotated-cuboid-bounds/);
 assert.doesNotMatch(source,/localStorage|indexedDB/);
});
