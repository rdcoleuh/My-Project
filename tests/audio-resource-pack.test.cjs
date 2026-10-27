/* MineWorld 5.9 — original sound and optional local pack regression tests. */
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
class Node{
 constructor(tag='div'){this.tag=tag;this.children=[];this.style={};this.handlers={};this.attributes={};this.width=256;this.height=512;this.files=[];this.value='';}
 append(...nodes){this.children.push(...nodes)}appendChild(el){this.children.push(el);return el}
 addEventListener(k,fn){this.handlers[k]=fn}setAttribute(k,v){this.attributes[k]=v}
 getContext(){return {imageSmoothingEnabled:false,drawImage(){},clearRect(){},
  createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){}}}
 toDataURL(){return 'data:image/png;base64,original'}
}
class FakeContext{
 constructor(){this.currentTime=1;this.sampleRate=22050;this.state='running';this.calls=[];this.destination={};}
 createOscillator(){this.calls.push('osc');return {type:'',frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},start(){},stop(){}}}
 createGain(){return {gain:{value:1,setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}}}
 createBuffer(channels,samples){return {getChannelData:()=>new Float32Array(samples)}}
 createBufferSource(){this.calls.push('sample');return {connect(){},start(){},stop(){},buffer:null}}
 async decodeAudioData(){return {duration:.6}}
}
test('original sound engine creates sounds only after a user interaction, persists volume and disables safely',async()=>{
 const store=new Map(),pane=new Node('section'),instances=[];
 const fakeDoc={querySelector:()=>({parentNode:pane}),createElement:x=>new Node(x)};
 const context={
  window:{AudioContext:class extends FakeContext{constructor(){super();instances.push(this)}}},
  document:fakeDoc,console,Math,Number,performance:{now:()=>1000},
  localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},Uint8Array
 };
 vm.runInNewContext(read('sound-engine.js'),context,{filename:'sound-engine.js'});
 const api=context.window.MineWorldSound;
 assert.equal(api.state().available,true);
 assert.equal(instances.length,0,'autoplay must not start on page load');
 assert.equal(api.play('break','stone'),true);
 assert.equal(instances.length,1);
 assert.ok(instances[0].calls.includes('osc'));
 assert.equal(api.classify('Oak Log'),'wood');
 assert.equal(api.classify('Grass'),'soft');
 assert.equal(api.classify('Diamond Ore'),'stone');
  assert.equal(await api.loadSound('pickup',new Uint8Array([3,1,4,1])),true);
 assert.equal(api.state().customSounds,1);
 api.setEnabled(false);assert.equal(api.play('place','stone'),false);
 api.setEnabled(true);api.setVolume(.25);assert.equal(api.state().volume,.25);
 api.clearSamples();assert.equal(api.state().customSounds,0);
 assert.ok(store.has('mineworld-sound-settings-v1'));
 assert.equal(pane.children.length,1,'pause menu sound controls installed');
});
function packZip(files){
 const local=[],central=[];let offset=0;
 for(const [name,bytes] of files){
  const fname=Buffer.from(name),value=Buffer.from(bytes);
  const head=Buffer.alloc(30+fname.length);head.writeUInt32LE(0x04034b50,0);
  head.writeUInt16LE(20,4);head.writeUInt16LE(0,8);
  head.writeUInt32LE(value.length,18);head.writeUInt32LE(value.length,22);
  head.writeUInt16LE(fname.length,26);fname.copy(head,30);local.push(head,value);
  const cent=Buffer.alloc(46+fname.length);
  cent.writeUInt32LE(0x02014b50,0);cent.writeUInt16LE(20,4);cent.writeUInt16LE(20,6);
  cent.writeUInt32LE(value.length,20);cent.writeUInt32LE(value.length,24);
  cent.writeUInt16LE(fname.length,28);cent.writeUInt32LE(offset,42);
  fname.copy(cent,46);central.push(cent);offset+=head.length+value.length;
 }
 const footer=Buffer.alloc(22);footer.writeUInt32LE(0x06054b50,0);
 footer.writeUInt16LE(files.length,8);footer.writeUInt16LE(files.length,10);
 footer.writeUInt32LE(central.reduce((n,c)=>n+c.length,0),12);footer.writeUInt32LE(offset,16);
 return Uint8Array.from(Buffer.concat([...local,...central,footer])).buffer;
}
test('user-selected ZIP imports only matching PNG tiles and compatible OGG sounds; reset restores originals',async()=>{
 const soundTypes=[],uploads=[],pane=new Node('pause'),welcome=new Node('welcome'),saves=[];
 class FakeImage{
  constructor(){this.width=16;this.height=16;}
  set src(url){queueMicrotask(()=>this.onload?.());}
 }
 const gl={TEXTURE0:1,TEXTURE_2D:2,RGBA:3,UNSIGNED_BYTE:4,
  UNPACK_FLIP_Y_WEBGL:5,TEXTURE_MIN_FILTER:6,TEXTURE_MAG_FILTER:7,NEAREST:8,
  activeTexture(){},bindTexture(){},pixelStorei(){},
  texImage2D(){uploads.push('atlas')},texParameteri(){},isContextLost:()=>false};
 const win={
  MineWorldResourcePackContext:{gl,texture:{},baseURL:'data:image/png;base64,original'},
  MineWorldBlockGuide:{names:Array.from({length:170},()=> 'stone')},
  MineWorldAtlas:{dataURL:'data:image/png;base64,original'},
  MineWorldBridge:{refreshTextureUI(){saves.push('redraw')}},
  MineWorldSound:{
   clearSamples(){soundTypes.push('clear')},
   async loadSound(kind){soundTypes.push(kind);return true}
  }
 };
 const doc={createElement:x=>new Node(x),
  querySelector:q=>q.startsWith('#pause')?{parentNode:pane}:q.startsWith('#welcome')?{parentNode:welcome}:null};
 const ctx={window:win,document:doc,Image:FakeImage,URL:{
  createObjectURL:()=> 'blob:fake',revokeObjectURL(){}},
  Blob,Response,DecompressionStream,TextDecoder,Uint8Array,ArrayBuffer,DataView,console,queueMicrotask};
 vm.runInNewContext(read('local-resource-pack.js'),ctx,{filename:'local-resource-pack.js'});
 const api=win.MineWorldLocalTextures;
 const png=Buffer.alloc(24);Buffer.from([137,80,78,71,13,10,26,10]).copy(png);
 const archive=packZip([
  ['assets/minecraft/textures/block/grass_block_top.png',png],
  ['assets/minecraft/textures/blocks/grass_side.png',png],
  ['assets/minecraft/sounds/random/pop.ogg',Buffer.from([79,103,103,83])],
  ['assets/minecraft/textures/entity/creeper.png',png]
 ]);
 const keys=api.inspectZip(archive);
 assert.ok(keys.includes('grass_block_top'));
 assert.ok(keys.includes('grass_side'));
 assert.ok(keys.includes('sound:random/pop'));
 assert.equal(keys.includes('creeper'),false);
 const result=await api.loadFile({name:'my-pack.zip',arrayBuffer:async()=>archive});
 assert.ok(result.faces>=2);
 assert.equal(result.sounds,1);
 assert.equal(api.active,true);
 assert.ok(soundTypes.includes('pickup'));
 assert.ok(uploads.length>=1);
 assert.ok(saves.length>=1);
 await api.clear();
 assert.equal(api.active,false);
 assert.ok(soundTypes.filter(t=>t==='clear').length>=2);
 assert.equal(uploads.length,2);
 assert.equal(pane.children.length,1);
 assert.equal(welcome.children.length,1);
 const direct=[
   ['grass_block_top.png',png],['grass_block_side.png',png],['dirt.png',png],
   ['oak_log.png',png],['oak_log_top.png',png],['diamond_ore.png',png]
 ].map(([name,bytes])=>({name,size:bytes.length,arrayBuffer:async()=>Uint8Array.from(bytes).buffer}));
 const loaded=await api.loadFiles(direct);
 assert.ok(loaded.faces>=10,'Extracted PNG files must map onto multiple common blocks');
 assert.equal(loaded.totalFaces,507);
 assert.ok(loaded.coverage>0&&loaded.coverage<100);
 assert.ok(loaded.unmapped.includes('stone'));
 assert.equal(api.lastResult,loaded);
 assert.equal(api.active,true);
 await api.clear();
 assert.equal(api.active,false);
 assert.equal(uploads.length,4,'Direct sprite import is uploaded once and can be reversed');
});
test('game wires sound events, imported texture atlas, original save keys and offline cached modules',()=>{
 const html=read('index.html'),sw=read('sw.js'),readme=read('README.md');
 for(const file of ['sound-engine.js','local-resource-pack.js']){
  assert.ok(html.includes('src="./'+file+'"'),file+' missing');
  assert.ok(sw.includes("'./"+file+"'"),file+' uncached');
 }
 for(const key of ["sound?.play('break'","sound?.play('place'",
  "sound?.play('jump'","sound?.play('hurt'","sound?.play('pickup'",
  "MineWorldResourcePackContext","const localPack=window.MineWorldLocalTextures",
  "worldLibrary.key(mode,'original')","mineworld-selfhost-v1"])
  assert.ok(html.includes(key),'missing '+key);
 assert.ok(read('block-guide.js').includes('MineWorldLocalTextures?.drawFace'));
 for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(m[1].trim())new Function(m[1]);
 assert.ok(readme.length>100);
});

test('Java JAR import ignores modded namespaces while accepting vanilla, nested and legacy paths',async()=>{
 const src=read('local-resource-pack.js');
 const body=src.match(/function readArchive\(buffer\)\{[\s\S]*?(?=\nfunction imageFromPng)/)?.[0];
 assert.ok(body,'ZIP parser should be accessible for regression tests');
 const parse=vm.runInNewContext(body+'\nreadArchive',{
  ArrayBuffer,DataView,Uint8Array,TextDecoder,Blob,DecompressionStream,Math,Error
 });
 const archive=packZip([
  ['assets/minecraft/textures/block/stone.png',[1,2,3]],
  ['assets/othermod/textures/block/stone.png',[9,9,9]],
  ['assets/othermod/textures/block/lapis_block.png',[9]],
  ['pack/assets/minecraft/textures/blocks/grass_side.png',[4]],
  ['textures/block/farmland.png',[5]],
  ['assets/minecraft/textures/block/water_still.png.mcmeta',[123,125]],
  ['assets/othermod/textures/colormap/grass.png',[7]],
  ['assets/minecraft/textures/colormap/foliage.png',[8]],
  ['assets/minecraft/sounds/block/stone/break1.ogg',[79,103,103,83]],
  ['assets/othermod/sounds/block/stone/extra.ogg',[79,103,103,83]]
 ]);
 const zip=parse(archive);
 const keys=[...zip.entries.keys()];
 assert.deepEqual([...await zip.get('stone')],[1,2,3],
  'Modded stone must never override Minecraft vanilla stone');
 for(const key of ['grass_side','farmland','meta:water_still','colormap:foliage','sound:block/stone/break1'])
  assert.ok(keys.includes(key),'Missing valid Java resource '+key);
 for(const key of ['lapis_block','colormap:grass','sound:block/stone/extra'])
  assert.equal(keys.includes(key),false,'Leaked resource from other mod namespace: '+key);
});
