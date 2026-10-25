/* MineWorld .mcpack import — no original or redistributed game assets. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const FAKE_PNG=Buffer.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,16,0,0,0,16]);
function zip(files){
 const local=[],central=[];let offset=0;
 for(const [name,payload] of files){
  const n=Buffer.from(name),bytes=Buffer.from(payload),lh=Buffer.alloc(30+n.length),ch=Buffer.alloc(46+n.length);
  lh.writeUInt32LE(0x04034b50,0);lh.writeUInt16LE(20,4);lh.writeUInt32LE(bytes.length,18);
  lh.writeUInt32LE(bytes.length,22);lh.writeUInt16LE(n.length,26);n.copy(lh,30);
  ch.writeUInt32LE(0x02014b50,0);ch.writeUInt16LE(20,4);ch.writeUInt16LE(20,6);
  ch.writeUInt32LE(bytes.length,20);ch.writeUInt32LE(bytes.length,24);
  ch.writeUInt16LE(n.length,28);ch.writeUInt32LE(offset,42);n.copy(ch,46);
  local.push(lh,bytes);central.push(ch);offset+=lh.length+bytes.length;
 }
 const end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(files.length,8);
 end.writeUInt16LE(files.length,10);end.writeUInt32LE(central.reduce((a,b)=>a+b.length,0),12);
 end.writeUInt32LE(offset,16);
 return Uint8Array.from(Buffer.concat([...local,...central,end])).buffer;
}
function boot(){
 const draws=[];
 class Canvas{
  constructor(){this.width=16;this.height=16;}
  getContext(){return {imageSmoothingEnabled:false,globalAlpha:1,clearRect(){},
   drawImage(...args){draws.push(args);},
   getImageData(_x,_y,w,h){return {data:new Uint8ClampedArray(w*h*4)};},putImageData(){}};}
  toDataURL(){return 'data:image/png;base64,local';}
 }
 class Image{constructor(){this.width=this.height=16;}set src(_){queueMicrotask(()=>this.onload?.());}}
 const gl={TEXTURE0:1,TEXTURE_2D:2,RGBA:3,UNSIGNED_BYTE:4,UNPACK_FLIP_Y_WEBGL:5,
  TEXTURE_MIN_FILTER:6,TEXTURE_MAG_FILTER:7,NEAREST:8,activeTexture(){},bindTexture(){},pixelStorei(){},
  texImage2D(){},texParameteri(){},isContextLost(){return false;}};
 const win={MineWorldResourcePackContext:{gl,texture:{},baseURL:'data:image/png;base64,fallback'},
  MineWorldAtlas:{dataURL:'data:image/png;base64,fallback'},
  MineWorldBlockGuide:{names:Array(170).fill('unknown_block')},
  MineWorldBridge:{refreshTextureUI(){}},MineWorldSound:{clearSamples(){}}};
 const ctx={window:win,document:{createElement:()=>new Canvas(),querySelector:()=>null},
  URL:{createObjectURL:()=> 'blob:local',revokeObjectURL(){}},
  Image,Blob,Uint8Array,Uint8ClampedArray,TextDecoder,ArrayBuffer,DataView,Math,Number,JSON,
  console,queueMicrotask,performance:{now:()=>0}};
 vm.runInNewContext(read('local-resource-pack.js'),ctx);
 return {pack:win.MineWorldLocalTextures,draws};
}
test('Bedrock .mcpack reads its own textures/blocks and textures/items PNGs',async()=>{
 const b=boot(),buffer=zip([
  ['manifest.json',Buffer.from('{"format_version":2}')],
  ['textures/blocks/stone.png',FAKE_PNG],
  ['textures/blocks/planks_oak.png',FAKE_PNG],
  ['textures/blocks/log_oak.png',FAKE_PNG],
  ['textures/blocks/log_oak_top.png',FAKE_PNG],
  ['textures/items/iron_sword.png',FAKE_PNG],
  ['assets/somemod/textures/blocks/stone.png',FAKE_PNG]
 ]);
 const names=b.pack.inspectZip(buffer);
 assert.ok(names.includes('stone'),'a Bedrock block PNG is discovered');
 assert.ok(names.includes('item:iron_sword'),'Bedrock items directory is discovered');
 assert.equal(names.filter(n=>n==='stone').length,1,'other mod asset excluded');
 const result=await b.pack.loadFile({name:'PhoneResources.mcpack',arrayBuffer:async()=>buffer});
 assert.ok(result.faces>=6,'stone, planks and log faces are mapped');
 assert.equal(result.items,1);
 assert.equal(result.totalFaces,507);
 assert.equal(await b.pack.itemIcon('ironSword'),'data:image/png;base64,local');
 assert.equal(b.pack.active,true);
 assert.ok(b.draws.length>1);
 await b.pack.clear();
 assert.equal(b.pack.availableItemTextures,0);
 assert.equal(await b.pack.itemIcon('ironSword'),null);
});
test('accept Bedrock .mcpack in inventory picker and optional private storage without accepting .apk/.ipa',()=>{
 const pack=read('local-resource-pack.js'),storage=read('local-pack-storage.js'),ui=read('java-inventory-ui.js');
 for(const src of [pack,storage,ui])assert.match(src,/mcpack/);
 assert.match(pack,/\.zip,\.jar,\.mcpack/);
 assert.doesNotMatch(pack,/\.apk,\.ipa/);
 assert.doesNotMatch(storage,/fetch\(/);
 assert.doesNotMatch(pack,/fetch\(/);
 assert.ok(read('index.html').includes('mineworld-selfhost-v1'));
});
