/* MineWorld Bedrock entity skin and item ZIP integration regressions. No Mojang files. */
const {test}=require('node:test'),assert=require('node:assert/strict'),
fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),read=name=>fs.readFileSync(path.join(root,name),'utf8');
function zip(files){
 const local=[],central=[];let offset=0;
 for(const [filename,buffer] of files){
  const name=Buffer.from(filename),bytes=Buffer.from(buffer);
  const h=Buffer.alloc(30+name.length),c=Buffer.alloc(46+name.length);
  h.writeUInt32LE(0x04034b50);h.writeUInt16LE(20,4);
  h.writeUInt32LE(bytes.length,18);h.writeUInt32LE(bytes.length,22);
  h.writeUInt16LE(name.length,26);name.copy(h,30);
  c.writeUInt32LE(0x02014b50);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);
  c.writeUInt32LE(bytes.length,20);c.writeUInt32LE(bytes.length,24);
  c.writeUInt16LE(name.length,28);c.writeUInt32LE(offset,42);name.copy(c,46);
  local.push(h,bytes);central.push(c);offset+=h.length+bytes.length;
 }
 const end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(files.length,8);
 end.writeUInt16LE(files.length,10);
 end.writeUInt32LE(central.reduce((a,b)=>a+b.length,0),12);end.writeUInt32LE(offset,16);
 const full=Buffer.concat([...local,...central,end]);
 return full.buffer.slice(full.byteOffset,full.byteOffset+full.byteLength);
}
const fakePng=Buffer.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,16,0,0,0,16]);
test('Bedrock entity subfolders and item files are recognized without mod namespace bleed-through',async()=>{
 const code=read('local-resource-pack.js').match(/function readArchive\(buffer\)\{[\s\S]*?(?=\nfunction imageFromPng)/)?.[0];
 assert.ok(code);
 const reader=vm.runInNewContext(code+'\nreadArchive',{ArrayBuffer,DataView,Uint8Array,TextDecoder,Blob,DecompressionStream,Math,Error});
 const files=[
  ['resource_pack/textures/entity/cow/cow.png',fakePng],
  ['resource_pack/textures/entity/creeper/creeper.png',fakePng],
  ['resource_pack/textures/entity/pig/pig_v3.png',fakePng],
  ['resource_pack/entity/pig.entity.json',Buffer.from(JSON.stringify({'minecraft:client_entity':{description:{textures:{default:'textures/entity/pig/pig_v3'}}}}))],
  ['resource_pack/textures/items/diamond.png',fakePng],
  ['assets/othermod/textures/entity/cow/cow.png',[99]],
  ['assets/minecraft/textures/entity/zombie/zombie.png',fakePng],
  ['textures/entity/spider/spider.png',fakePng]
 ];
 const archive=reader(zip(files));
 for(const key of ['entity:cow/cow','entity:creeper/creeper','entity:zombie/zombie',
  'entity:spider/spider','entity:pig/pig_v3','entity-def:pig','item:diamond'])assert.ok(archive.entries.has(key),key);
 assert.deepEqual([...await archive.get('entity:cow/cow')], [...fakePng]);
});
test('player-owned mob skins and dropped item PNGs feed the runtime atlas and reset safely',async()=>{
 const drawn=[],imports=[],uploads=[];
 class FakeCanvas{
  constructor(){this.width=256;this.height=1024;this.style={};this.children=[];}
  getContext(){return {imageSmoothingEnabled:false,clearRect(){},drawImage(...args){drawn.push(args);},
   createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),
   getImageData:(_x,_y,w,h)=>({data:new Uint8ClampedArray(w*h*4)}),
   putImageData(){}};}
  toDataURL(){return 'data:image/png;base64,dummy';}
 }
 class FakeImage{
  constructor(){this.width=64;this.height=32;}
  set src(_value){queueMicrotask(()=>this.onload?.());}
 }
 const gl={TEXTURE0:1,TEXTURE_2D:2,RGBA:3,UNSIGNED_BYTE:4,UNPACK_FLIP_Y_WEBGL:5,
  TEXTURE_MIN_FILTER:6,TEXTURE_MAG_FILTER:7,NEAREST:8,
  activeTexture(){},bindTexture(){},pixelStorei(){},texParameteri(){},
  texImage2D(...a){uploads.push(a);},isContextLost(){return false;}};
 const window={MineWorldAtlas:{dataURL:'data:image/png;base64,dummy'},
  MineWorldResourcePackContext:{gl,texture:{},baseURL:'data:image/png;base64,dummy'},
  MineWorldBlockGuide:{names:Array(170).fill('unknown_block')},
  MineWorldMobPixels:{kinds:['cow','creeper','zombie','pig','vehicle'],
   applyImported(entries){imports.push(new Map(entries));return entries.size;}},
  MineWorldSound:{clearSamples(){}},MineWorldBridge:{refreshTextureUI(){}}};
 const ctx={window,document:{createElement:()=>new FakeCanvas(),querySelector:()=>null},
  Image:FakeImage,URL:{createObjectURL:()=> 'blob:synth',revokeObjectURL(){}},
  Blob,Uint8Array,Uint8ClampedArray,ArrayBuffer,DataView,TextDecoder,Math,Number,JSON,
  console,performance:{now:()=>0},queueMicrotask};
 vm.runInNewContext(read('local-resource-pack.js'),ctx);
 const file={name:'player-bedrock.zip',arrayBuffer:async()=>zip([
  ['resource_pack/textures/entity/cow/cow.png',fakePng],
  ['resource_pack/textures/entity/creeper/creeper.png',fakePng],
  ['resource_pack/textures/entity/pig/pig_v3.png',fakePng],
  ['resource_pack/entity/pig.entity.json',Buffer.from(JSON.stringify({'minecraft:client_entity':{description:{textures:{default:'textures/entity/pig/pig_v3'}}}}))],
  ['resource_pack/textures/items/diamond.png',fakePng]
 ])};
 const result=await window.MineWorldLocalTextures.loadFile(file);
 assert.equal(result.entities,3);
 assert.equal(result.items,1);
 assert.equal(result.worldItemSprites,1);
 assert.equal(imports.length,1);
 assert.ok(imports[0].has('cow'));assert.ok(imports[0].has('creeper'));
 assert.ok(imports[0].has('pig'),'modern pig_v3 client-entity path must resolve');
 assert.ok(imports[0].has('item:diamond'));
 const icon=await window.MineWorldLocalTextures.itemIcon('diamond');
 assert.ok(icon.startsWith('data:image/png;'));
 await window.MineWorldLocalTextures.clear();
 assert.equal(imports.at(-1).size,0,'reset purges imported mob GPU skins');
 assert.equal(window.MineWorldLocalTextures.availableItemTextures,0);
});
test('entity material atlas samples player PNGs with preserved true colors and nearest-neighbor',()=>{
 const uploaded=[],drawn=[];
 class Canvas{
  constructor(){this.width=0;this.height=0;}
  getContext(){return {imageSmoothingEnabled:true,
   createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){},
   drawImage(...a){drawn.push(a)}};
  }
 }
 const gl={TEXTURE0:1,TEXTURE_2D:2,RGBA:3,UNSIGNED_BYTE:4,UNPACK_FLIP_Y_WEBGL:5,
  TEXTURE_WRAP_S:6,TEXTURE_WRAP_T:7,TEXTURE_MIN_FILTER:8,TEXTURE_MAG_FILTER:9,
  CLAMP_TO_EDGE:10,NEAREST:11,createTexture:()=>({}),
  activeTexture(){},bindTexture(){},pixelStorei(){},texParameteri(){},texImage2D(...a){uploaded.push(a)}};
 const context={window:{},document:{createElement:()=>new Canvas()},Math,Uint8ClampedArray,Map,Set,Number,Object};
 vm.runInNewContext(read('mob-pixel-art.js'),context);
 const m=context.window.MineWorldMobPixels;
 m.create(gl,{cow:{},creeper:{}});
 const count=m.applyImported(new Map([['cow',{width:64,height:32}],
  ['item:diamond',{width:16,height:16}]]));
 assert.equal(count,2);
 assert.equal(m.hasImported('cow'),true);assert.equal(m.hasImported('item:diamond'),true);
 assert.ok(drawn.some(args=>args[1]===8&&args[2]===8&&args[3]===8),
   'mob skin should sample the classic front-of-head pixels');
 assert.ok(drawn.some(args=>args[3]===16&&args[4]===16),
   'item pixel artwork should be sampled in full');
 assert.ok(uploaded.length>=2,'import triggers GPU atlas upload');
 assert.ok(m.uv('item:diamond',0).every(n=>n>=0&&n<=1));
 m.applyImported(new Map());assert.equal(m.hasImported('cow'),false);
});
test('renderer uses pack art for world drop blocks, mob skins and hotbar icons',()=>{
 const html=read('index.html');
 assert.ok(html.includes("MineWorldMobPixels.hasImported(mobKind)"));
 assert.ok(html.includes("MineWorldMobPixels.hasImported(m.kind)"));
 assert.ok(html.includes("itemPack?.itemIcon?.(key)"));
 assert.ok(html.includes("window.MineWorldMobPixels?.hasImported(iconKey)"));
 assert.ok(html.includes("upload(blocks,atlasTexture,true)"));
 assert.ok(html.includes("upload(itemSprites,mobPixelTexture||atlasTexture,true)"));
 assert.ok(html.includes("window.MineWorldBridge.getPlayer()")===false,'no accidental test code in game');
});
