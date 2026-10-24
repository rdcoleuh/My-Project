/* Local Minecraft texture experiment — mock ZIP and WebGL regression tests.
   Run: node --test tests/local-texture-pack.test.cjs
   No Minecraft art files are used or distributed in this test. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const zlib=require('node:zlib');
const root=path.resolve(__dirname,'..');
function archive(files,method=8){
 const locals=[],centrals=[];let offset=0;
 for(const [path,payload] of files){
   const filename=Buffer.from(path,'utf8'),input=Buffer.from(payload),compressed=method===8?zlib.deflateRawSync(input):input;
   const local=Buffer.alloc(30+filename.length);
   local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(20,4);local.writeUInt16LE(method,8);
   local.writeUInt32LE(compressed.length,18);local.writeUInt32LE(input.length,22);
   local.writeUInt16LE(filename.length,26);filename.copy(local,30);
   locals.push(local,compressed);
   const central=Buffer.alloc(46+filename.length);
   central.writeUInt32LE(0x02014b50,0);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);
   central.writeUInt16LE(method,10);central.writeUInt32LE(compressed.length,20);
   central.writeUInt32LE(input.length,24);central.writeUInt16LE(filename.length,28);
   central.writeUInt32LE(offset,42);filename.copy(central,46);centrals.push(central);
   offset+=local.length+compressed.length;
 }
 const centralSize=centrals.reduce((n,b)=>n+b.length,0),end=Buffer.alloc(22);
 end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);
 end.writeUInt32LE(centralSize,12);end.writeUInt32LE(offset,16);
 return Uint8Array.from(Buffer.concat([...locals,...centrals,end])).buffer;
}
class FakeElement{
 constructor(name='div'){this.name=name;this.children=[];this.handlers={};this.style={};this.width=256;this.height=512;this.disabled=false;this.files=[];this.value='';this.textContent='';}
 append(...nodes){this.children.push(...nodes);}appendChild(e){this.children.push(e);}
 setAttribute(){}addEventListener(event,fn){this.handlers[event]=fn;}
 getContext(){return {imageSmoothingEnabled:false,drawImage(){},clearRect(){}};}
 toDataURL(){return 'data:image/png;base64,stub';}
}
class FakeImage{
 constructor(){this.width=16;this.height=16;}
 set src(value){queueMicrotask(()=>this.onload?.());}
}
const FakeURL={createObjectURL:()=> 'blob:fake',revokeObjectURL(){}};
function setup(){
 const areas=[new FakeElement('options'),new FakeElement('pause')],uploads=[];
 const gl={
  TEXTURE0:33984,TEXTURE_2D:3553,RGBA:6408,UNSIGNED_BYTE:5121,
  UNPACK_FLIP_Y_WEBGL:37440,TEXTURE_MIN_FILTER:10241,TEXTURE_MAG_FILTER:10240,NEAREST:9728,
  isContextLost:()=>false,activeTexture(){},bindTexture(){},pixelStorei(){},
  texImage2D(){uploads.push('full-atlas-upload');},texParameteri(){}
 };
 const window={
   MineWorldExperimentalAtlas:{gl,texture:{},baseURL:'data:image/png;base64,original'},
   MineWorldAtlas:{dataURL:'original'},MineWorldBlockGuide:{names:Array(170).fill('')}
 };
 const document={
  createElement:tag=>new FakeElement(tag),
  querySelector:selector=>selector.includes('mw-options')?areas[0]:{parentNode:areas[1]}
 };
 const context={window,document,Image:FakeImage,Blob,URL:FakeURL,TextDecoder,
   DecompressionStream,Response,console,queueMicrotask,Uint8Array,ArrayBuffer,DataView};
 vm.createContext(context);
 vm.runInContext(fs.readFileSync(path.join(root,'local-texture-pack.js'),'utf8'),context);
 return {api:window.MineWorldLocalTextures,areas,uploads,window};
}
function png(){const data=Buffer.alloc(24);Buffer.from([137,80,78,71,13,10,26,10]).copy(data);return data;}
test('imports actual user-provided archive paths and restores atlas, no assets persist',async()=>{
 const {api,areas,uploads,window}=setup();
 assert.equal(areas[0].children.length,1);assert.equal(areas[1].children.length,1);
 const input=archive([
  ['assets/minecraft/textures/block/grass_block_top.png',png()],
  ['assets/minecraft/textures/block/grass_block_side.png',png()],
  ['assets/minecraft/textures/block/dirt.png',png()],
  ['assets/minecraft/textures/entity/pig.png',png()]
 ]);
 assert.equal(api.inspectZip(input).length,3,'only block textures recognized');
 const file={name:'client.jar',arrayBuffer:async()=>input};
 const result=await api.loadFile(file);
 assert.ok(result.faces>=3);
 assert.ok(result.blocks>=1);
 assert.equal(api.active,true);
 assert.equal(uploads.length,1);
 assert.equal(window.MineWorldAtlas.dataURL,'data:image/png;base64,stub');
 await api.clear();
 assert.equal(api.active,false);
 assert.equal(uploads.length,2);
});
test('no asset match is safe, and missing texture paths fall back',async()=>{
 const {api,uploads}=setup();
 const zip=archive([['assets/minecraft/textures/entity/cow.png',png()]],0);
 assert.deepEqual(Array.from(api.inspectZip(zip)),[]);
 await assert.rejects(api.loadFile({name:'resource.zip',arrayBuffer:async()=>zip}),/No Java Edition block PNGs/);
 assert.equal(api.active,false);
 assert.equal(uploads.length,0);
 assert.equal(api.textureName(1,0),'grass_block_top');
 assert.equal(api.textureName(1,1),'grass_block_side');
 assert.equal(api.textureName(1,2),'dirt');
});
test('unpublished experiment preserves live game saves and excludes embedded textures',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const loader=fs.readFileSync(path.join(root,'local-texture-pack.js'),'utf8');
 assert.ok(html.includes('mineworld-selfhost-v1'));
 assert.ok(html.includes('survivalHotbar'));
 assert.ok(html.includes('local-texture-pack.js'));
 assert.ok(!loader.includes('data:image/png;base64,'),'no bundled data URI textures');
 assert.ok(loader.includes('Select a .zip resource pack or Java client.jar'));
 assert.ok(!loader.includes('localStorage.setItem'),'no saved asset content');
 assert.ok(!loader.includes('fetch('),'never fetches external assets');
});