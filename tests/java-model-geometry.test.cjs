/* MineWorld 6.44: synthetic Java resource packs only; no proprietary artwork. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const enc=x=>Uint8Array.from(Buffer.from(JSON.stringify(x)));
const dirs=['up','down','north','south','east','west'];
function api(){
 const window={};
 vm.runInNewContext(read('java-model-faces.js'),{window,TextDecoder});
 return window.MineWorldJavaModelFaces;
}
const zip=files=>{const entries=new Map(Object.entries(files));return {entries,get:async k=>entries.get(k)||null};};
const faces=Object.fromEntries(dirs.map(dir=>[dir,{texture:'#a',uv:[0,0,16,16]}]));
const model={textures:{a:'minecraft:block/stone'},elements:[{from:[0,0,0],to:[16,8,16],faces}]};
test('player-provided slab resolves half-height geometry and owned UV faces',async()=>{
 const r=await api().resolve(zip({'model:stone':enc(model),'block:stone':Uint8Array.of(1)}),'stone');
 assert.equal(r.shape.top,.5);assert.equal(r.shape.bottom,0);
 assert.equal(r.shape.right,1);assert.equal(r.faceUV.up.rotation,0);
 assert.deepEqual(Array.from(r.faceUV.up.uv),[0,0,16,16]);
 assert.equal(r.top,'block:stone');assert.equal(r.bottom,'block:stone');
});
test('geometry importer rejects missing faces, missing sprites, and rotations',async()=>{
 const missing=JSON.parse(JSON.stringify(model));delete missing.elements[0].faces.east;
 const bad=[missing,{...model,elements:[{...model.elements[0],rotation:{axis:'y',angle:22.5}}]},
  {...model,elements:[model.elements[0],model.elements[0]]},
  {...model,elements:[{...model.elements[0],to:[17,8,16]}]}];
 for(const entry of bad)assert.equal(await api().resolve(zip({'model:stone':enc(entry),'block:stone':Uint8Array.of(1)}),'stone'),null);
 assert.equal(await api().resolve(zip({'model:stone':enc(model)}),'stone'),null);
});
test('only matching default-property Java blockstate can select a model',()=>{
 const m=api();
 const chosen=m.stateVariant({variants:{
  'facing=south':{model:'minecraft:block/wrong'},
  'facing=north':{model:'minecraft:block/right'},
  '':{model:'minecraft:block/fallback'}
 }});
 assert.equal(chosen.name,'right');
 assert.equal(m.stateVariant({variants:{'facing=south':{model:'minecraft:block/wrong'}}}),null);
 assert.equal(m.stateVariant({variants:{'axis=x':{model:'minecraft:block/wrong'},'axis=y':{model:'minecraft:block/right'}}}).name,'right');
});
test('in-memory shape overrides revert without touching world saves',()=>{
 const window={};vm.runInNewContext(read('block-models.js'),{window});
 const m=window.MineWorldBlockModels;
 const before=m.shape(3);
 assert.equal(m.commitImported(new Map([[3,{left:0,bottom:0,front:0,right:1,top:.5,back:1}]])),1);
 assert.equal(m.isPartial(3),true);assert.equal(m.shape(3).top,.5);
 assert.equal(m.commitImported(new Map([[3,{left:-1,bottom:0,front:0,right:1,top:1,back:1}]])),0);
 assert.equal(m.shape(3).top,before.top);assert.equal(m.isPartial(3),false);
});
test('live importer and renderer refresh imported shapes safely',()=>{
 const html=read('index.html'),pack=read('local-resource-pack.js'),sw=read('sw.js');
 assert.match(pack,/MineWorldBlockModels\?\.commitImported\?\.\(modelShapes\)/);
 assert.match(pack,/MineWorldBlockModels\?\.commitImported\?\.\(new Map\(\)\)/);
 assert.match(pack,/modelGeometryBlocks:modelShapes\.size/);
 assert.match(html,/MineWorldBlockModels\.shape\(b\)/);
 assert.match(html,/MINEWORLD v6\.4[4-9]/);
 assert.match(sw,/mineworld-6-4[4-9]-/);
});
