/* Player-owned Java model JSON references can select exact local PNGs.
 * No original Minecraft bitmaps are checked into the test repository.
 */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
const enc=value=>Uint8Array.from(Buffer.from(JSON.stringify(value)));
function resolver(){
 const window={};
 vm.runInNewContext(read('java-model-faces.js'),{window,TextDecoder,JSON,Object,Set});
 return window.MineWorldJavaModelFaces;
}
function zip(values){
 const entries=new Map(Object.entries(values));
 return {entries,async get(key){return entries.get(key)||null;}};
}
const cube={elements:[{from:[0,0,0],to:[16,16,16],faces:Object.fromEntries(
 ['up','down','north','south','east','west'].map(dir=>[dir,{texture:'#all'}]))}]};
test('local Java model inheritance resolves custom nested PNGs for all three faces',async()=>{
 const pack=zip({
  'model:stone':enc({parent:'minecraft:block/cube_all',textures:{all:'minecraft:block/custom/stone_alt'}}),
  'model:cube_all':enc(cube),
  'block:custom/stone_alt':Uint8Array.from([1])
 });
 const m=resolver();
 assert.equal(m.nameFor(3,'Stone'),'stone');
 assert.equal(m.nameFor(1,'Grass'),'grass_block');
 assert.equal(m.texturePath('minecraft:block/custom/stone_alt'),'block:custom/stone_alt');
 const result=await m.resolve(pack,'stone');
 assert.equal(result.top,'block:custom/stone_alt');
 assert.equal(result.side,'block:custom/stone_alt');
 assert.equal(result.bottom,'block:custom/stone_alt');
});
test('different Java front and side sprites cannot collapse into one side face',async()=>{
 const pack=zip({
  'model:furnace':enc({textures:{top:'minecraft:block/furnace_top',front:'minecraft:block/furnace_front',side:'minecraft:block/furnace_side'},
   elements:[{from:[0,0,0],to:[16,16,16],faces:{
    up:{texture:'#top'},down:{texture:'#top'},north:{texture:'#front'},
    south:{texture:'#side'},east:{texture:'#side'},west:{texture:'#side'}}}]}),
  'block:furnace_top':Uint8Array.from([1]),
  'block:furnace_front':Uint8Array.from([1]),
  'block:furnace_side':Uint8Array.from([1])
 });
 const result=await resolver().resolve(pack,'furnace');
 assert.equal(result.top,'block:furnace_top');
 assert.equal(result.bottom,'block:furnace_top');
 assert.equal(result.side,null,'existing workstation directional faces must remain in control');
});
test('missing sprites, noncube geometry, untrusted namespaces and cyclic model parents are ignored',async()=>{
 const m=resolver();
 assert.equal(m.modelPath('othermod:block/stone'),null);
 assert.equal(m.texturePath('othermod:block/stone'),null);
 assert.equal(m.modelPath('minecraft:block/../stone'),null);
 const partial=zip({'model:slab':enc({textures:{all:'minecraft:block/stone'},elements:[
  {from:[0,0,0],to:[16,8,16],faces:{up:{texture:'#all'}}}]}),
  'block:stone':Uint8Array.from([1])});
 assert.equal(await m.resolve(partial,'slab'),null);
 const missing=zip({'model:stone':enc({textures:{all:'minecraft:block/absent'}})});
 assert.equal(await m.resolve(missing,'stone'),null);
 const cyclic=zip({'model:stone':enc({parent:'minecraft:block/stone',textures:{all:'minecraft:block/stone'}}),
  'block:stone':Uint8Array.from([1])});
 assert.equal((await m.resolve(cyclic,'stone')).top,'block:stone');
});
test('folder import applies model-selected nested block PNGs without changing world saves',async()=>{
 const draws=[];
 class Canvas{
  constructor(){this.width=256;this.height=1024;}
  getContext(){return {imageSmoothingEnabled:false,clearRect(){},drawImage(...args){draws.push(args);},
   getImageData(_x,_y,w,h){return {data:new Uint8ClampedArray(w*h*4)};},putImageData(){}};}
  toDataURL(){return 'data:image/png;base64,base';}
 }
 class Image{constructor(){this.width=16;this.height=16;}set src(_){queueMicrotask(()=>this.onload?.());}}
 const gl={TEXTURE0:1,TEXTURE_2D:2,RGBA:3,UNSIGNED_BYTE:4,
  UNPACK_FLIP_Y_WEBGL:5,TEXTURE_MIN_FILTER:6,TEXTURE_MAG_FILTER:7,NEAREST:8,
  activeTexture(){},bindTexture(){},pixelStorei(){},texParameteri(){},texImage2D(){},isContextLost(){return false;}};
 const window={MineWorldResourcePackContext:{gl,texture:{},baseURL:'data:image/png;base64,base'},
  MineWorldAtlas:{dataURL:'data:image/png;base64,base'},
  MineWorldBlockGuide:{names:Array(170).fill('unused')},
  MineWorldSound:{clearSamples(){}},MineWorldBridge:{refreshTextureUI(){}}};
 window.MineWorldBlockGuide.names[3]='Stone';
 const context={window,document:{createElement:()=>new Canvas(),querySelector:()=>null},
  Image,URL:{createObjectURL:()=> 'blob:local',revokeObjectURL(){}},
  Blob,Uint8Array,Uint8ClampedArray,ArrayBuffer,DataView,TextDecoder,Math,JSON,Number,
  console,queueMicrotask,performance:{now:()=>0}};
 vm.runInNewContext(read('java-model-faces.js'),context);
 vm.runInNewContext(read('local-resource-pack.js'),context);
 const png=Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,16,0,0,0,16]);
 const model=enc({parent:'minecraft:block/cube_all',textures:{all:'minecraft:block/custom/stone_alt'}});
 const file=(name,bytes)=>({name:name.split('/').at(-1),webkitRelativePath:'MyPack/'+name,
  size:bytes.length,async arrayBuffer(){return Uint8Array.from(bytes).buffer;}});
 const result=await window.MineWorldLocalTextures.loadFiles([
  file('assets/minecraft/models/block/stone.json',model),
  file('assets/minecraft/textures/block/custom/stone_alt.png',png)]);
 assert.equal(result.modelMappedFaces,3);
 assert.equal(result.faces,3,'all three stone faces use model-selected original pixels');
 assert.equal(window.MineWorldLocalTextures.active,true);
 assert.ok(draws.length>=4,'three imported block faces plus original atlas copy');
});
