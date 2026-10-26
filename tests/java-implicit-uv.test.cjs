/* Java Edition implicit UV mapping: synthetic JSON and no bundled artwork. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const enc=x=>Uint8Array.from(Buffer.from(JSON.stringify(x)));
const dirs=['up','down','north','south','east','west'];
function load(){
 const window={};
 vm.runInNewContext(read('java-model-faces.js'),{window,TextDecoder});
 return window.MineWorldJavaModelFaces;
}
function pack(model){
 const entries=new Map([['model:stone',enc(model)],['block:stone',Uint8Array.of(1)]]);
 return {entries,get:async key=>entries.get(key)||null};
}
function model(from,to){
 return {textures:{all:'minecraft:block/stone'},elements:[{from,to,
  faces:Object.fromEntries(dirs.map(dir=>[dir,{texture:'#all'}]))}]};
}
test('implicit Java slab UVs preserve bottom-half texels on every side',async()=>{
 const result=await load().resolve(pack(model([0,0,0],[16,8,16])),'stone');
 assert.equal(result.shape.top,.5);
 assert.deepEqual(Array.from(result.faceUV.up.uv),[0,0,16,16]);
 assert.deepEqual(Array.from(result.faceUV.down.uv),[0,0,16,16]);
 for(const dir of ['north','south','east','west'])
  assert.deepEqual(Array.from(result.faceUV[dir].uv),[0,8,16,16],dir);
 const window={};vm.runInNewContext(read('java-face-transforms.js'),{window});
 const uv=window.MineWorldJavaFaceTransforms;
 uv.commit(new Map([[3,result.faceUV]]));
 const sample=uv.sample(3,[0,0,-1],0,{uv:(...args)=>args},1,518,null);
 assert.equal(sample[3],1,'full horizontal span');
 assert.equal(sample[4],.5,'half-height vertical crop');
 assert.equal(sample[6],.5,'crop starts halfway down the sprite');
 assert.equal(sample[7],518,'directional atlas tile remains unchanged');
});
test('implicit UVs for inset cuboids respect Java per-face coordinate axes',async()=>{
 const result=await load().resolve(pack(model([1,2,3],[15,10,12])),'stone');
 const expected={
  up:[1,3,15,12],down:[1,4,15,13],
  north:[1,6,15,14],south:[1,6,15,14],
  west:[3,6,12,14],east:[4,6,13,14]
 };
 for(const dir of dirs)assert.deepEqual(Array.from(result.faceUV[dir].uv),expected[dir],dir);
 assert.equal(result.shape.left,1/16);
 assert.equal(result.shape.back,12/16);
});
test('explicit UVs and rotations override inference; malformed faces remain safe',async()=>{
 const source=model([0,0,0],[16,8,16]);
 source.elements[0].faces.north={texture:'#all',uv:[16,0,0,8],rotation:90};
 const result=await load().resolve(pack(source),'stone');
 assert.deepEqual(Array.from(result.faceUV.north.uv),[16,0,0,8]);
 assert.equal(result.faceUV.north.rotation,90);
 assert.deepEqual(Array.from(result.faceUV.south.uv),[0,8,16,16]);
 for(const bad of [[1,2,1,8],[0,0,17,16],[0,0,16,16,3]]){
  const changed=JSON.parse(JSON.stringify(source));
  changed.elements[0].faces.north.uv=bad;
  assert.equal(await load().resolve(pack(changed),'stone'),null,
   'invalid explicit UV cannot silently corrupt a partial imported model');
 }
 const missing=JSON.parse(JSON.stringify(source));
 delete missing.elements[0].faces.east;
 assert.equal(await load().resolve(pack(missing),'stone'),null);
 const rotated=JSON.parse(JSON.stringify(source));
 rotated.elements[0].rotation={axis:'y',angle:22.5};
 assert.equal(await load().resolve(pack(rotated),'stone'),null);
});
