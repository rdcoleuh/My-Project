/* Player-selected Java blockstate references; no proprietary bitmaps. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
const enc=o=>Uint8Array.from(Buffer.from(JSON.stringify(o)));
function resolver(){
 const window={};
 vm.runInNewContext(read('java-model-faces.js'),{window,TextDecoder,JSON,Object,Set});
 return window.MineWorldJavaModelFaces;
}
const cube={elements:[{from:[0,0,0],to:[16,16,16],
 faces:Object.fromEntries(['up','down','north','south','east','west']
  .map(face=>[face,{texture:'#all'}]))}]};
function zip(files){
 const entries=new Map(Object.entries(files));
 return {entries,async get(key){return entries.get(key)||null;}};
}
test('blockstate default axis=y picks the unrotated vertical log model',async()=>{
 const m=resolver();
 const pack=zip({
  'state:oak_log':enc({variants:{
   'axis=x':{model:'minecraft:block/oak_log_horizontal',x:90},
   'axis=y':{model:'minecraft:block/oak_log_vertical'},
   'axis=z':{model:'minecraft:block/oak_log_horizontal',x:90}}}),
  'model:oak_log_vertical':enc({parent:'minecraft:block/cube_all',
   textures:{all:'minecraft:block/custom/oak_end'}}),
  'model:cube_all':enc(cube),
  'block:custom/oak_end':Uint8Array.from([1])
 });
 const result=await m.resolve(pack,'oak_log');
 assert.equal(result.top,'block:custom/oak_end');
 assert.equal(result.side,'block:custom/oak_end');
 assert.equal(result.bottom,'block:custom/oak_end');
});

test('weighted Java variants skip unsupported and missing local models without changing UV rotation',async()=>{
 const m=resolver();
 const state={variants:{'':[
  {model:'othermod:block/foreign'},
  {model:'minecraft:block/not_in_pack',y:0},
  {model:'minecraft:block/owned',y:90},
  {model:'minecraft:block/later',y:180}
 ]}};
 const pack=zip({
  'state:stone':enc(state),
  'model:owned':enc({...cube,textures:{all:'minecraft:block/owned_tex'}}),
  'block:owned_tex':Uint8Array.from([1])
 });
 assert.equal(m.stateVariant(state).name,'not_in_pack',
   'standalone parser accepts the first syntactically valid candidate');
 const result=await m.resolve(pack,'stone');
 assert.equal(result.top,'block:owned_tex');
 assert.equal(result.bottom,'block:owned_tex');
 assert.equal(result.side,'block:owned_tex');
});
test('multipart Java weighted apply arrays use the first available vanilla model',async()=>{
 const m=resolver(),pack=zip({
  'state:stone':enc({multipart:[{when:{facing:'north'},apply:[
   {model:'minecraft:block/missing'},
   {model:'minecraft:block/owned',uvlock:true},
   {model:'minecraft:block/other'}]}]}),
  'model:owned':enc({...cube,textures:{all:'minecraft:block/owned_tex'}}),
  'block:owned_tex':Uint8Array.from([1])
 });
 assert.equal((await m.resolve(pack,'stone')).top,'block:owned_tex');
});
test('invalid weighted variants safely retain direct model fallback and reject foreign namespaces',async()=>{
 const m=resolver(),pack=zip({
  'state:stone':enc({variants:{'':[
   {model:'othermod:block/foreign'},
   {model:'minecraft:block/rotated',x:90},
   {model:'minecraft:block/absent'}]}}),
  'model:stone':enc({...cube,textures:{all:'minecraft:block/stone'}}),
  'block:stone':Uint8Array.from([1])
 });
 assert.equal((await m.resolve(pack,'stone')).top,'block:stone');
 assert.equal(m.stateVariant({variants:{'':[
  {model:'othermod:block/foreign'},{model:'minecraft:block/stone',x:90}]}}),null);
});

test('malformed, modded and missing blockstates preserve direct model fallback',async()=>{
 const m=resolver();
 const direct=enc({parent:'minecraft:block/cube_all',
  textures:{all:'minecraft:block/stone'}});
 const pack=zip({'model:stone':direct,'model:cube_all':enc(cube),
  'block:stone':Uint8Array.from([1]),
  'state:stone':enc({variants:{'':{model:'othermod:block/evil'}}})});
 assert.equal((await m.resolve(pack,'stone')).top,'block:stone');
 pack.entries.set('state:stone',Uint8Array.from([255]));
 assert.equal((await m.resolve(pack,'stone')).bottom,'block:stone');
 assert.equal(m.stateModel({variants:{'':{model:'minecraft:block/stone',y:90}}}),'stone');
 assert.equal(m.stateModel({variants:{'':{model:'minecraft:block/stone',x:90}}}),null);
});
function archive(files){
 const local=[],central=[];let offset=0;
 for(const [name,data] of files){
  const filename=Buffer.from(name),bytes=Buffer.from(data);
  const head=Buffer.alloc(30+filename.length);head.writeUInt32LE(0x04034b50,0);
  head.writeUInt16LE(20,4);head.writeUInt32LE(bytes.length,18);head.writeUInt32LE(bytes.length,22);
  head.writeUInt16LE(filename.length,26);filename.copy(head,30);
  const dir=Buffer.alloc(46+filename.length);dir.writeUInt32LE(0x02014b50,0);
  dir.writeUInt16LE(20,4);dir.writeUInt16LE(20,6);dir.writeUInt32LE(bytes.length,20);
  dir.writeUInt32LE(bytes.length,24);dir.writeUInt16LE(filename.length,28);
  dir.writeUInt32LE(offset,42);filename.copy(dir,46);
  local.push(head,bytes);central.push(dir);offset+=head.length+bytes.length;
 }
 const footer=Buffer.alloc(22);footer.writeUInt32LE(0x06054b50,0);
 footer.writeUInt16LE(files.length,8);footer.writeUInt16LE(files.length,10);
 footer.writeUInt32LE(central.reduce((n,c)=>n+c.length,0),12);footer.writeUInt32LE(offset,16);
 return Uint8Array.from(Buffer.concat([...local,...central,footer])).buffer;
}
test('ZIP importer reads only vanilla Java blockstate JSON, including root packs',async()=>{
 const body=read('local-resource-pack.js').match(/function readArchive\(buffer\)\{[\s\S]*?(?=\nfunction imageFromPng)/)?.[0];
 assert.ok(body);
 const readArchive=vm.runInNewContext(body+'\nreadArchive',
  {ArrayBuffer,DataView,Uint8Array,TextDecoder,Blob,DecompressionStream,Math,Error});
 const data=enc({variants:{'':{model:'minecraft:block/custom/stone'}}});
 const packed=readArchive(archive([
  ['assets/othermod/blockstates/stone.json',enc({variants:{'':{model:'othermod:block/evil'}}})],
  ['assets/minecraft/blockstates/stone.json',data],
  ['blockstates/dirt.json',data]
 ]));
 assert.equal(Buffer.from(await packed.get('state:stone')).toString(),Buffer.from(data).toString());
 assert.equal(Buffer.from(await packed.get('state:dirt')).toString(),Buffer.from(data).toString());
 assert.equal(packed.entries.has('state:evil'),false);
});

test('default state Y rotation maps imported Java north/south/east/west cube art correctly',async()=>{
 const m=resolver();
 const model={elements:[{from:[0,0,0],to:[16,16,16],faces:{
  up:{texture:'#top',rotation:90},down:{texture:'#top'},
  north:{texture:'#north'},south:{texture:'#south'},
  east:{texture:'#east'},west:{texture:'#west'}
 }}],textures:{
  top:'minecraft:block/top',north:'minecraft:block/north',
  south:'minecraft:block/south',east:'minecraft:block/east',west:'minecraft:block/west'
 }};
 const pack=zip(Object.fromEntries([
  ['state:furnace',enc({variants:{
   'facing=north':{model:'minecraft:block/cube_custom',y:90},
   'facing=south':{model:'minecraft:block/cube_custom',y:0}
  }})],['model:cube_custom',enc(model)],
  ...['top','north','south','east','west'].map(n=>['block:'+n,Uint8Array.from([1])])
 ]));
 const result=await m.resolve(pack,'furnace');
 // Positive 90° Y: source north points east, source west points north.
 assert.equal(result.sides.east,'block:north');
 assert.equal(result.sides.north,'block:west');
 assert.equal(result.sides.south,'block:east');
 assert.equal(result.sides.west,'block:south');
 assert.equal(result.faceUV.up.rotation,180);
 assert.equal(result.faceUV.down.rotation,270);
 assert.equal(m.stateVariant({variants:{'':{model:'minecraft:block/cube_custom',y:90}}}).y,90);
});
test('uvlock leaves top texture orientation fixed when a default blockstate rotates',async()=>{
 const m=resolver();
 const pack=zip({
  'state:stone':enc({variants:{'':{model:'minecraft:block/custom',y:270,uvlock:true}}}),
  'model:custom':enc({textures:{all:'minecraft:block/stone'},
   elements:[{from:[0,0,0],to:[16,16,16],faces:{
     up:{texture:'#all',rotation:90},north:{texture:'#all'},east:{texture:'#all'},
     south:{texture:'#all'},west:{texture:'#all'},down:{texture:'#all'}
   }}]}),
  'block:stone':Uint8Array.from([1])
 });
 const result=await m.resolve(pack,'stone');
 assert.equal(result.faceUV.up.rotation,90);
 assert.equal(result.faceUV.down,undefined);
});

test('texture-only Java cube models rotate top and bottom UVs for Y blockstates',async()=>{
 const m=resolver();
 for(const [y,top,bottom] of [[90,90,270],[180,180,180],[270,270,90]]){
  const pack=zip({
   'state:stone':enc({variants:{'':{model:'minecraft:block/owned',y}}}),
   // An imported pack need not bundle the vanilla parent model's face JSON.
   'model:owned':enc({parent:'minecraft:block/cube_all',textures:{
    top:'minecraft:block/custom/top',bottom:'minecraft:block/custom/bottom',
    side:'minecraft:block/custom/side'}}),
   'block:custom/top':Uint8Array.of(1),
   'block:custom/bottom':Uint8Array.of(1),
   'block:custom/side':Uint8Array.of(1)
  });
  const result=await m.resolve(pack,'stone');
  assert.equal(result.top,'block:custom/top');
  assert.equal(result.side,'block:custom/side');
  assert.equal(result.bottom,'block:custom/bottom');
  assert.equal(result.faceUV.up.rotation,top,'up Y='+y);
  assert.equal(result.faceUV.down.rotation,bottom,'down Y='+y);
  assert.deepEqual(Array.from(result.faceUV.up.uv),[0,0,16,16]);
  assert.equal(result.faceUV.north,undefined,'side UV must remain upright');
 }
});

test('UV lock preserves unrotated top and bottom in texture-only Java models',async()=>{
 const m=resolver(),pack=zip({
  'state:stone':enc({variants:{'':{model:'minecraft:block/owned',y:90,uvlock:true}}}),
  'model:owned':enc({textures:{all:'minecraft:block/owned'}}),
  'block:owned':Uint8Array.of(1)
 });
 const result=await m.resolve(pack,'stone');
 assert.equal(result.top,'block:owned');
 assert.equal(result.faceUV,undefined,'UV lock must not introduce synthetic rotations');
});

test('missing local top PNG never rotates the procedural fallback texture',async()=>{
 const m=resolver(),pack=zip({
  'state:stone':enc({variants:{'':{model:'minecraft:block/owned',y:90}}}),
  'model:owned':enc({textures:{top:'minecraft:block/absent',
   bottom:'minecraft:block/owned_bottom',side:'minecraft:block/owned_side'}}),
  'block:owned_bottom':Uint8Array.of(1),
  'block:owned_side':Uint8Array.of(1)
 });
 const result=await m.resolve(pack,'stone');
 assert.equal(result.top,null);
 assert.equal(result.faceUV.up,undefined);
 assert.equal(result.faceUV.down.rotation,270);
 assert.equal(result.faceUV.north,undefined);
});
