/* Java multipart default-state import; all fixtures use synthetic, local-only art. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const enc=value=>Uint8Array.from(Buffer.from(JSON.stringify(value)));
function resolver(){
 const window={};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','java-model-faces.js'),'utf8'),
  {window,TextDecoder,JSON,Object,Set});
 return window.MineWorldJavaModelFaces;
}
function zip(files){
 const entries=new Map(Object.entries(files));
 return {entries,async get(name){return entries.get(name)||null;}};
}
const cube={elements:[{from:[0,0,0],to:[16,16,16],faces:{
 up:{texture:'#up',rotation:90},down:{texture:'#up'},
 north:{texture:'#north'},south:{texture:'#south'},
 east:{texture:'#east'},west:{texture:'#west'}
}}],textures:Object.fromEntries(['up','north','south','east','west']
 .map(name=>[name,'minecraft:block/synthetic/'+name]))};
test('single matching Java multipart condition selects a full-cube local model',async()=>{
 const pack=zip(Object.fromEntries([
  ['state:stone',enc({multipart:[
   {when:{OR:[{facing:'south'},{powered:'true'}]},apply:{model:'minecraft:block/unused'}},
   {when:{AND:[{facing:'north'},{powered:'false'}]},apply:{model:'minecraft:block/synthetic_cube',y:90}},
  ]})],
  ['model:synthetic_cube',enc(cube)],
  ...['up','north','south','east','west'].map(name=>['block:synthetic/'+name,Uint8Array.of(1)])
 ]));
 const faces=await resolver().resolve(pack,'stone');
 assert.equal(faces.top,'block:synthetic/up');
 assert.equal(faces.sides.east,'block:synthetic/north');
 assert.equal(faces.sides.north,'block:synthetic/west');
 assert.equal(faces.faceUV.up.rotation,180);
});
test('pipe-separated predicates and uvlock use default-state matches',()=>{
 const m=resolver();
 const selected=m.stateVariant({multipart:[{
  when:{facing:'west|north',powered:'true|false'},
  apply:{model:'minecraft:block/synthetic_cube',y:270,uvlock:true}
 }]});
 assert.equal(selected.name,'synthetic_cube');
 assert.equal(selected.y,270);
 assert.equal(selected.uvlock,true);
});
test('multiple matching multipart parts never flatten layered geometry into one cube',async()=>{
 const m=resolver();
 const state={multipart:[
  {apply:{model:'minecraft:block/cube_a'}},
  {when:{facing:'north'},apply:{model:'minecraft:block/cube_b'}}
 ]};
 assert.equal(m.stateVariant(state),null);
 const pack=zip({
  'state:stone':enc(state),
  'model:stone':enc({parent:'minecraft:block/cube_all',textures:{all:'minecraft:block/fallback'}}),
  'model:cube_all':enc({elements:[{from:[0,0,0],to:[16,16,16],
   faces:{up:{texture:'#all'},down:{texture:'#all'},north:{texture:'#all'},
    south:{texture:'#all'},east:{texture:'#all'},west:{texture:'#all'}}}]}),
  'block:fallback':Uint8Array.of(1)
 });
 assert.equal((await m.resolve(pack,'stone')).top,'block:fallback');
});
test('unsafe or unsupported multipart conditions and rotations are rejected',()=>{
 const m=resolver();
 for(const data of [
  {multipart:[{when:{unknown:'false'},apply:{model:'minecraft:block/a'}}]},
  {multipart:[{when:{OR:[]},apply:{model:'minecraft:block/a'}}]},
  {multipart:[{when:{facing:['north']},apply:{model:'minecraft:block/a'}}]},
  {multipart:[{apply:{model:'othermod:block/a'}}]},
  {multipart:[{apply:{model:'minecraft:block/a',x:90}}]},
  {multipart:[{apply:{model:'minecraft:block/a',y:45}}]},
  {multipart:[{apply:{model:'minecraft:block/../unsafe'}}]},
  {multipart:[{when:{AND:[{OR:[]}]},apply:{model:'minecraft:block/a'}}]}
 ])assert.equal(m.stateVariant(data),null);
 assert.equal(m.stateVariant({variants:{'':{model:'minecraft:block/stone'}}}).name,'stone',
  'existing Java variants remain supported');
});
