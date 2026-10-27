/* Synthetic HUD-only resource pack regression: no bundled game artwork. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const png=Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,16,0,0,0,16]);
function zip(files){
 const local=[],central=[];let offset=0;
 for(const [name,data] of files){
  const n=Buffer.from(name),b=Buffer.from(data),a=Buffer.alloc(30+n.length),c=Buffer.alloc(46+n.length);
  a.writeUInt32LE(0x04034b50,0);a.writeUInt16LE(20,4);a.writeUInt32LE(b.length,18);
  a.writeUInt32LE(b.length,22);a.writeUInt16LE(n.length,26);n.copy(a,30);
  c.writeUInt32LE(0x02014b50,0);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);
  c.writeUInt32LE(b.length,20);c.writeUInt32LE(b.length,24);c.writeUInt16LE(n.length,28);c.writeUInt32LE(offset,42);n.copy(c,46);
  local.push(a,b);central.push(c);offset+=a.length+b.length;
 }
 const end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);
 end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);
 end.writeUInt32LE(central.reduce((n,b)=>n+b.length,0),12);end.writeUInt32LE(offset,16);
 return Uint8Array.from(Buffer.concat([...local,...central,end])).buffer;
}
function boot(imageWidth=16,imageHeight=16){
 const draws=[];let decoded=0;
 class Canvas{
  constructor(){this.width=256;this.height=1024;}
  getContext(){return {imageSmoothingEnabled:true,clearRect(){},drawImage(...args){draws.push(args)},
   getImageData(_x,_y,w,h){return {data:new Uint8ClampedArray(w*h*4)}},putImageData(){}};}
  toDataURL(){return 'data:image/png;base64,owned';}
 }
 class Image{constructor(){decoded++;this.width=imageWidth;this.height=imageHeight;}
  set src(_){queueMicrotask(()=>this.onload?.());}}
 const gl={TEXTURE0:1,TEXTURE_2D:2,RGBA:3,UNSIGNED_BYTE:4,UNPACK_FLIP_Y_WEBGL:5,
  TEXTURE_MIN_FILTER:6,TEXTURE_MAG_FILTER:7,NEAREST:8,
  activeTexture(){},bindTexture(){},pixelStorei(){},texImage2D(){},texParameteri(){},
  isContextLost(){return false}};
 const window={MineWorldResourcePackContext:{gl,texture:{},baseURL:'data:image/png;base64,base'},
  MineWorldAtlas:{dataURL:'data:image/png;base64,base'},
  MineWorldBlockGuide:{names:Array(170).fill('unknown_block')},
  MineWorldBridge:{refreshTextureUI(){}},MineWorldSound:{clearSamples(){}}};
 const context={window,document:{createElement:()=>new Canvas(),querySelector:()=>null},
  Image,URL:{createObjectURL:()=> 'blob:owned',revokeObjectURL(){}},Blob,Uint8Array,
  Uint8ClampedArray,TextDecoder,ArrayBuffer,DataView,Math,Number,JSON,console,queueMicrotask,
  performance:{now:()=>0}};
 vm.runInNewContext(read('hotbar-sprite-uv.js'),context);
 vm.runInNewContext(read('local-resource-pack.js'),context);
 return {pack:window.MineWorldLocalTextures,draws,get decoded(){return decoded}};
}
test('Java GUI-only folder is accepted and missing half-heart uses the imported empty backing',async()=>{
 const b=boot();
 const files=['heart/full','heart/container','food_full','food_empty','hotbar'].map(name=>({
  name:name.split('/').at(-1)+'.png',
  webkitRelativePath:'pack/assets/minecraft/textures/gui/sprites/hud/'+name+'.png',
  size:png.length,arrayBuffer:async()=>png.buffer
 }));
 const result=await b.pack.loadFiles(files);
 assert.equal(result.faces,0);assert.equal(result.items,0);assert.equal(result.hudAssets,5);
 assert.equal(b.pack.active,false,'GUI-only pack must not claim block coverage');
 assert.equal(b.pack.hasPack,true,'GUI-only artwork is loaded and available');
 const before=b.draws.length;
 assert.equal(await b.pack.hudIcon('heart','half'),'data:image/png;base64,owned');
 const ops=b.draws.slice(before);
 assert.equal(ops.length,2,'draw empty underlay, then cropped full heart');
 assert.equal(ops[0].length,5);
 assert.equal(ops[1].length,9);
 assert.equal(ops[1][3],8,'crop exactly half the 16-pixel source width');
 assert.equal(ops[1][7],8,'render exactly half the destination width');
 assert.equal(await b.pack.hudIcon('heart','half'),'data:image/png;base64,owned');
 assert.equal(b.draws.length,before+2,'half sprite is cached');
 await b.pack.clear();
 assert.equal(b.pack.active,false);
 assert.equal(b.pack.hasPack,false);
 assert.equal(await b.pack.hudIcon('heart','half'),null);
});
test('Bedrock HUD-only ZIP imports without blocks and keeps selected slot artwork',async()=>{
 const b=boot(),buffer=zip([
  ['textures/ui/heart.png',png],['textures/ui/heart_background.png',png],
  ['textures/ui/hunger_full.png',png],['textures/ui/hunger_background.png',png],
  ['textures/ui/selected_hotbar_slot.png',png]
 ]);
 const result=await b.pack.loadFile({name:'owned-hud.mcpack',arrayBuffer:async()=>buffer});
 assert.equal(result.faces,0);assert.equal(result.hudAssets,5);
 assert.equal(b.pack.active,false);
 assert.equal(b.pack.hasPack,true);
 assert.equal(await b.pack.hudIcon('food','half'),'data:image/png;base64,owned');
 assert.equal(await b.pack.hudIcon('hotbar','selected'),'data:image/png;base64,owned');
});
test('oversized decoded HUD artwork is skipped without a canvas allocation',async()=>{
 const b=boot(4097,16),file={name:'heart.png',
  webkitRelativePath:'textures/ui/heart.png',size:png.length,arrayBuffer:async()=>png.buffer};
 await b.pack.loadFiles([file]);
 const before=b.draws.length;
 assert.equal(await b.pack.hudIcon('heart','full'),null);
 assert.equal(b.draws.length,before);
});

test('oversized PNG headers are rejected before decoding imported HUD and item artwork',async()=>{
 const b=boot(),huge=Uint8Array.from(png);
 // PNG IHDR: 10000 x 10000, despite a tiny compressed file.
 huge.set([0,0,39,16],16);huge.set([0,0,39,16],20);
 const files=[
  {name:'heart.png',webkitRelativePath:'textures/ui/heart.png'},
  {name:'diamond.png',webkitRelativePath:'textures/items/diamond.png'}
 ].map(file=>({...file,size:huge.length,arrayBuffer:async()=>huge.buffer}));
 await b.pack.loadFiles(files);
 const before=b.decoded;
 assert.equal(await b.pack.hudIcon('heart','full'),null);
 assert.equal(await b.pack.itemIcon('diamond'),null);
 assert.equal(b.decoded,before,'malicious PNG headers must never reach Image decoding');
});
test('valid imported item icon still uses a small nearest-neighbor canvas',async()=>{
 const b=boot(),file={name:'diamond.png',webkitRelativePath:'textures/items/diamond.png',
   size:png.length,arrayBuffer:async()=>png.buffer};
 await b.pack.loadFiles([file]);
 assert.equal(await b.pack.itemIcon('diamond'),'data:image/png;base64,owned');
 assert.ok(b.draws.some(args=>args.length===9),'valid sprite is drawn with explicit source and destination rectangles');
});

test('a square GUI sprite is not stretched into a nine-slot hotbar sheet',async()=>{
 const b=boot(16,16),file={name:'hotbar.png',
  webkitRelativePath:'assets/minecraft/textures/gui/sprites/hud/hotbar.png',
  size:png.length,arrayBuffer:async()=>png.buffer};
 await b.pack.loadFiles([file]);
 const before=b.draws.length;
 assert.equal(await b.pack.hudIcon('hotbar','background'),null);
 assert.equal(await b.pack.hudIcon('hotbar','slot0'),null);
 assert.equal(b.draws.length,before,'invalid full-bar art should not draw onto a HUD canvas');
});
test('a valid bordered player-owned bar remains available and slices the last slot',async()=>{
 const b=boot(182,22),file={name:'hotbar.png',
  webkitRelativePath:'assets/minecraft/textures/gui/sprites/hud/hotbar.png',
  size:png.length,arrayBuffer:async()=>png.buffer};
 await b.pack.loadFiles([file]);
 assert.equal(await b.pack.hudIcon('hotbar','background'),'data:image/png;base64,owned');
 const before=b.draws.length;
 assert.equal(await b.pack.hudIcon('hotbar','slot8'),'data:image/png;base64,owned');
 assert.ok(b.draws.slice(before).some(args=>args.length===9&&
   args[1]===161&&args[2]===1&&args[3]===20&&args[4]===20),
   'last slot must use its own unscaled source rectangle');
});

test('corrupt optional empty-heart PNG does not hide a valid full or synthesized half heart',async()=>{
 const b=boot(),broken=Uint8Array.from([0,1,2,3,4,5]);
 const files=[
  {name:'full.png',webkitRelativePath:'pack/assets/minecraft/textures/gui/sprites/hud/heart/full.png',data:png},
  {name:'container.png',webkitRelativePath:'pack/assets/minecraft/textures/gui/sprites/hud/heart/container.png',data:broken}
 ].map(({name,webkitRelativePath,data})=>({name,webkitRelativePath,size:data.length,arrayBuffer:async()=>data.buffer}));
 await b.pack.loadFiles(files);
 const before=b.draws.length;
 assert.equal(await b.pack.hudIcon('heart','full'),'data:image/png;base64,owned');
 assert.equal(await b.pack.hudIcon('heart','half'),'data:image/png;base64,owned');
 const operations=b.draws.slice(before);
 assert.equal(operations.length,2,'full and half art render without a corrupt optional backing');
 assert.equal(operations[1].length,9,'synthesized half crops the valid full sprite');
});
test('one-pixel-wide HUD artwork is rejected instead of stretched into a heart',async()=>{
 const b=boot(1,16);
 const files=['full','container'].map(name=>({
  name:name+'.png',webkitRelativePath:'pack/assets/minecraft/textures/gui/sprites/hud/heart/'+name+'.png',
  size:png.length,arrayBuffer:async()=>png.buffer
 }));
 await b.pack.loadFiles(files);
 const before=b.draws.length;
 assert.equal(await b.pack.hudIcon('heart','full'),null,'malformed full glyph uses procedural fallback');
 assert.equal(await b.pack.hudIcon('heart','half'),null,'malformed full glyph cannot synthesize a half');
 assert.equal(b.draws.length,before,'no stretched or blank HUD canvas is allocated');
});


test('broken explicit and generic hotbar slots recover from a valid imported nine-cell sheet',async()=>{
 const b=boot(182,22),bad=Uint8Array.from([0,1,2,3]);
 const entries=[
  ['hotbar.png','assets/minecraft/textures/gui/sprites/hud/hotbar.png',png],
  ['hotbar_0.png','textures/ui/hotbar_0.png',bad],
  ['hotbar_slot.png','textures/ui/hotbar_slot.png',bad]
 ].map(([name,webkitRelativePath,data])=>({
  name,webkitRelativePath,size:data.length,arrayBuffer:async()=>data.buffer
 }));
 await b.pack.loadFiles(entries);
 const before=b.draws.length;
 assert.equal(await b.pack.hudIcon('hotbar','slot0'),'data:image/png;base64,owned');
 assert.equal(await b.pack.hudIcon('hotbar','slot1'),'data:image/png;base64,owned');
 const slices=b.draws.slice(before).filter(args=>args.length===9);
 assert.equal(slices.length,2);
 assert.deepEqual(slices.map(args=>[args[1],args[2],args[3],args[4]]),
  [[1,1,20,20],[21,1,20,20]]);
 assert.equal(await b.pack.hudIcon('hotbar','slot0'),'data:image/png;base64,owned');
 assert.equal(b.draws.length,before+2,'recovered slot is cached');
});
test('bad explicit numbered slot recovers from a valid generic slot without a bar sheet',async()=>{
 const b=boot(20,20),bad=Uint8Array.from([0,1,2,3]);
 const entries=[
  ['hotbar_3.png','textures/ui/hotbar_3.png',bad],
  ['hotbar_slot.png','textures/ui/hotbar_slot.png',png]
 ].map(([name,webkitRelativePath,data])=>({
  name,webkitRelativePath,size:data.length,arrayBuffer:async()=>data.buffer
 }));
 await b.pack.loadFiles(entries);
 const before=b.draws.length;
 assert.equal(await b.pack.hudIcon('hotbar','slot3'),'data:image/png;base64,owned');
 assert.ok(b.draws.slice(before).some(args=>args.length===3),
  'generic square sprite is drawn without incorrectly slicing a sheet');
});
