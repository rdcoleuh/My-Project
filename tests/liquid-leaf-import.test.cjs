/* Local liquid and foliage mapping; synthetic PNG headers, never original artwork. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=n=>fs.readFileSync(path.join(__dirname,'..',n),'utf8');
const source=read('local-resource-pack.js');
test('still top/bottom and flowing side mappings have ordered partial-pack fallbacks',()=>{
 const a=source.indexOf('const mappings=new Map();'),b=source.indexOf('function readArchive(buffer)');
 const {textureName,aliases}=vm.runInNewContext(source.slice(a,b)+'\n({textureName,aliases})',
  {window:{MineWorldBlockGuide:{names:[]}}});
 for(const [id,still,flow] of [[7,'water_still','water_flow'],[66,'lava_still','lava_flow']]){
  assert.equal(textureName(id,0),still);
  assert.equal(textureName(id,1),flow);
  assert.equal(textureName(id,2),still);
  assert.ok(aliases[flow].includes(still));
 }
 assert.ok(aliases.water_flow.indexOf('water_flow_grey')<aliases.water_flow.indexOf('water_still'));
 for(const id of [6,31,33,35,37,39,41,43])assert.match(textureName(id,0),/leaves/);
});
function png(label,w=16,h=16){
 const b=Buffer.alloc(24);
 Buffer.from([137,80,78,71,13,10,26,10]).copy(b);
 b.writeUInt32BE(w,16);b.writeUInt32BE(h,20);
 return Buffer.concat([b,Buffer.from(label)]);
}
function file(name,bytes){return {name,size:bytes.length,
 arrayBuffer:async()=>Uint8Array.from(bytes).buffer};}
function boot(max=2048,coarse=false){
 const canvases=[],uploads=[],blobs=new Map();let serial=0;
 class Canvas{
  constructor(){this.width=16;this.height=16;this.calls=[];canvases.push(this);}
  getContext(){
   if(!this.ctx){
    const self=this;
    this.ctx={imageSmoothingEnabled:false,globalAlpha:1,
     clearRect(...a){self.calls.push(['clear',...a]);},
     drawImage(im,...a){self.calls.push(['draw',im.label||'canvas',...a]);},
     getImageData(_x,_y,w,h){return {data:new Uint8ClampedArray(w*h*4)};},
     putImageData(){}};
   }
   return this.ctx;
  }
  toDataURL(){return 'data:image/png;base64,synthetic';}
 }
 class Image{
  constructor(){this.width=16;this.height=16;this.label='unknown';}
  set src(v){queueMicrotask(async()=>{
   if(v.startsWith('data:')){this.width=256;this.height=1024;this.label='original';}
   else{const b=Buffer.from(await blobs.get(v).arrayBuffer());
    this.width=b.readUInt32BE(16);this.height=b.readUInt32BE(20);
    this.label=b.subarray(24).toString();}
   this.onload?.();
  });}
 }
 const gl={TEXTURE0:1,TEXTURE_2D:2,RGBA:3,UNSIGNED_BYTE:4,
  UNPACK_FLIP_Y_WEBGL:5,TEXTURE_MIN_FILTER:6,TEXTURE_MAG_FILTER:7,NEAREST:8,
  MAX_TEXTURE_SIZE:9,activeTexture(){},bindTexture(){},pixelStorei(){},
  texImage2D(){},texParameteri(){},isContextLost(){return false;},
  getParameter(){return max;},texSubImage2D(...a){uploads.push(a);}};
 const window={matchMedia:()=>({matches:coarse}),navigator:{deviceMemory:8},
  MineWorldResourcePackContext:{gl,texture:{},baseURL:'data:image/png;base64,original'},
  MineWorldAtlas:{dataURL:'data:image/png;base64,original'},
  MineWorldBlockGuide:{names:Array(170).fill('stone')},
  MineWorldSound:{clearSamples(){}},MineWorldBridge:{refreshTextureUI(){}}};
 const ctx={window,document:{createElement:()=>new Canvas(),querySelector:()=>null},
  Image,URL:{createObjectURL(blob){const url='blob:synthetic'+(++serial);blobs.set(url,blob);return url;},
    revokeObjectURL(url){blobs.delete(url);}},Blob,
  Uint8Array,Uint8ClampedArray,TextDecoder,ArrayBuffer,DataView,Math,Number,
  JSON,console,performance:{now:()=>0},queueMicrotask};
 for(const n of ['resource-animation.js','bedrock-flipbook.js','local-resource-pack.js'])
  vm.runInNewContext(read(n),ctx,{filename:n});
 return {pack:window.MineWorldLocalTextures,canvases,uploads};
}
function hasDraw(canvas,label,x,y,size){
 return canvas.calls.some(c=>c[0]==='draw'&&c[1]===label&&
  c[c.length-4]===x&&c[c.length-3]===y&&
  c[c.length-2]===size&&c[c.length-1]===size);
}
test('Java animated still/flow textures map independently and 32px leaf alpha is cleared',async()=>{
 const {pack,canvases,uploads}=boot();
 const files=[];
 for(const [name,w,h] of [['water_still',16,64],['water_flow',32,128],
  ['lava_still',16,48],['lava_flow',32,96]]){
  files.push(file(name+'.png',png(name,w,h)));
  files.push(file(name+'.png.mcmeta',Buffer.from('{"animation":{"frametime":2}}')));
 }
 files.push(file('oak_leaves.png',png('oak_leaves',32,32)));
 const result=await pack.loadFiles(files);
 assert.equal(result.faces,9);
 assert.equal(result.animatedFaces,6);
 assert.equal(result.atlasTilePixels,32);
 const atlas=canvases.find(c=>c.width===512&&c.height===2048);
 assert.ok(atlas,'HD atlas required for 32px flow and leaf artwork');
 for(const [id,still,flow] of [[7,'water_still','water_flow'],[66,'lava_still','lava_flow']]){
  for(const [face,name] of [[0,still],[1,flow],[2,still]]){
   const tile=id*3+face,x=tile%16*32,y=Math.floor(tile/16)*32;
   assert.ok(hasDraw(atlas,name,x,y,32),'incorrect liquid sprite '+id+':'+face);
  }
 }
 for(let face=0;face<3;face++){
  const tile=6*3+face,x=tile%16*32,y=Math.floor(tile/16)*32;
  const index=atlas.calls.findIndex(c=>c[0]==='draw'&&c[1]==='oak_leaves'&&
    c[c.length-4]===x&&c[c.length-3]===y);
  assert.ok(index>=0,'missing leaf face');
  assert.ok(atlas.calls.slice(0,index).some(c=>c[0]==='clear'&&
    c[1]===x&&c[2]===y&&c[3]===32&&c[4]===32),
    'leaf alpha must not reveal old procedural texture');
 }
 assert.equal(atlas.ctx.imageSmoothingEnabled,false);
 assert.equal(pack.updateAnimation(0,60,false),6);
 assert.equal(uploads.length,6);
 await pack.clear();
 assert.equal(pack.hasImportedFace(7,1),false);
});
test('still-only liquid packs fill side faces on limited mobile GPUs',async()=>{
 const {pack,canvases}=boot(1024);
 const result=await pack.loadFiles([
  file('water_still.png',png('water_still',32,32)),
  file('lava_still.png',png('lava_still',32,32)),
  file('oak_leaves.png',png('oak_leaves',32,32))
 ]);
 assert.equal(result.faces,9);
 assert.equal(result.atlasTilePixels,16);
 assert.ok(!canvases.some(c=>c.width===512),'2048px atlas is unsupported');
 for(const id of [7,66])for(let face=0;face<3;face++)
  assert.equal(pack.hasImportedFace(id,face),true);
 await pack.clear();
});
test('Bedrock grey flowing-water flipbook animates the side only',async()=>{
 const {pack}=boot();
 const meta=Buffer.from(JSON.stringify([{
  flipbook_texture:'textures/blocks/water_flow_grey',
  frames:[2,1,0],ticks_per_frame:2,blend_frames:false
 }]));
 const result=await pack.loadFiles([
  file('water_flow_grey.png',png('water_flow_grey',16,48)),
  file('flipbook_textures.json',meta)
 ]);
 assert.equal(result.faces,1);
 assert.equal(result.bedrockAnimatedFaces,1);
 assert.equal(result.animatedFaces,1);
 assert.equal(pack.hasImportedFace(7,0),false);
 assert.equal(pack.hasImportedFace(7,1),true);
 assert.equal(pack.hasImportedFace(7,2),false);
 await pack.clear();
});

test('desktop 4096px GPU retains native 64px animated water and transparent leaf texels',async()=>{
 const {pack,canvases,uploads}=boot(4096,false);
 const result=await pack.loadFiles([
  file('water_still.png',png('water_still',64,192)),
  file('water_still.png.mcmeta',Buffer.from('{"animation":{"frametime":2}}')),
  file('oak_leaves.png',png('oak_leaves',64,64))
 ]);
 assert.equal(result.atlasTilePixels,64);
 assert.equal(result.faces,6);
 const atlas=canvases.find(c=>c.width===1024&&c.height===4096);
 assert.ok(atlas,'desktop 64px atlas should fit a 4096px GPU');
 for(const [id,name] of [[7,'water_still'],[6,'oak_leaves']]){
  const tile=id*3,x=tile%16*64,y=Math.floor(tile/16)*64;
  assert.ok(hasDraw(atlas,name,x,y,64),'64px source pixels must remain sharp');
 }
 assert.equal(atlas.ctx.imageSmoothingEnabled,false);
 assert.equal(pack.updateAnimation(0,60,false),3);
 assert.equal(uploads.length,3);
 assert.ok(uploads.every(call=>call.at(-1).width===64&&call.at(-1).height===64));
 await pack.clear();
});
test('coarse-pointer mobile keeps a bounded 32px atlas even on a 4096px GPU',async()=>{
 const {pack,canvases}=boot(4096,true);
 const result=await pack.loadFiles([file('oak_leaves.png',png('oak_leaves',64,64))]);
 assert.equal(result.atlasTilePixels,32);
 assert.ok(canvases.some(c=>c.width===512&&c.height===2048));
 assert.ok(!canvases.some(c=>c.width===1024&&c.height===4096));
 await pack.clear();
});
