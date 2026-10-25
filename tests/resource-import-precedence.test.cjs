/* Regression: deterministic player-owned Java resource precedence and animation starts. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
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
function zipParser(){
 const body=read('local-resource-pack.js').match(/function readArchive\(buffer\)\{[\s\S]*?(?=\nfunction imageFromPng)/)?.[0];
 assert.ok(body);
 return vm.runInNewContext(body+'\nreadArchive',{ArrayBuffer,DataView,Uint8Array,TextDecoder,
  Blob,DecompressionStream,Math,Error});
}
test('modern vanilla sprites and metadata win over legacy and root duplicates in any ZIP order',async()=>{
 const paths=[
  ['textures/block/stone.png',[1]],
  ['assets/minecraft/textures/blocks/stone.png',[2]],
  ['assets/minecraft/textures/block/stone.png',[3]],
  ['assets/minecraft/textures/blocks/stone.png',[4]],
  ['assets/minecraft/textures/block/stone.png.mcmeta',[5]],
  ['assets/minecraft/textures/blocks/stone.png.mcmeta',[6]],
  ['assets/othermod/textures/block/stone.png',[9]],
  ['textures/block/stone.png',[7]]
 ];
 for(const files of [paths,paths.slice().reverse()]){
  const zip=zipParser()(archive(files));
  assert.deepEqual([...await zip.get('stone')],[3],'modern vanilla must beat legacy or root sprites');
  assert.deepEqual([...await zip.get('meta:stone')],[5],'modern animation metadata must win');
 }
});
test('first .mcmeta frame is painted immediately for block, grass overlay and workstation side',async()=>{
 const draws=[],uploads=[];
 class Canvas{
  constructor(){this.width=16;this.height=16;}
  getContext(){return {imageSmoothingEnabled:false,globalAlpha:1,clearRect(){},
   drawImage(...args){draws.push(args);},
   getImageData(_x,_y,w,h){return {data:new Uint8ClampedArray(w*h*4)};},putImageData(){}};}
  toDataURL(){return 'data:image/png;base64,original';}
 }
 class Image{
  constructor(){this.width=64;this.height=16;}
  set src(_src){queueMicrotask(()=>this.onload?.());}
 }
 const gl={TEXTURE0:1,TEXTURE_2D:2,RGBA:3,UNSIGNED_BYTE:4,
  UNPACK_FLIP_Y_WEBGL:5,TEXTURE_MIN_FILTER:6,TEXTURE_MAG_FILTER:7,NEAREST:8,
  activeTexture(){},bindTexture(){},pixelStorei(){},texParameteri(){},
  texImage2D(...args){uploads.push(args);},texSubImage2D(){},isContextLost(){return false;}};
 const window={MineWorldResourcePackContext:{gl,texture:{},baseURL:'data:image/png;base64,original'},
  MineWorldAtlas:{dataURL:'data:image/png;base64,original',
   alternateFaces:{168:{tile:510,name:'crafting_table_side',sideAxis:'x'}}},
  MineWorldBlockGuide:{names:Array(170).fill('unknown_block')},
  MineWorldSound:{clearSamples(){}},MineWorldBridge:{refreshTextureUI(){}}};
 const context={window,document:{createElement:()=>new Canvas(),querySelector:()=>null},
  Image,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},Blob,
  Uint8Array,Uint8ClampedArray,TextDecoder,ArrayBuffer,DataView,Math,Number,
  JSON,console,performance:{now:()=>0},queueMicrotask};
 vm.runInNewContext(read('resource-animation.js'),context);
 vm.runInNewContext(read('local-resource-pack.js'),context);
 const png=Buffer.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,16,0,0,0,16]);
 const meta=Buffer.from('{"animation":{"width":16,"height":16,"frametime":2,"frames":[3,1]}}');
 const input=['water_still','grass_block_side_overlay','crafting_table_side']
  .flatMap(name=>[[name+'.png',png],[name+'.png.mcmeta',meta]])
  .map(([name,bytes])=>({name,size:bytes.length,arrayBuffer:async()=>Uint8Array.from(bytes).buffer}));
 const pack=window.MineWorldLocalTextures,result=await pack.loadFiles(input);
 assert.equal(result.animatedFaces,5);
 const first=draws.filter(args=>args.length===9&&args[3]===16&&args[4]===16);
 assert.equal(first.length,5,'three water faces, one grass overlay and one extra side');
 assert.ok(first.every(args=>args[1]===48&&args[2]===0),
  'all imported animated sprites must begin at metadata frame index 3');
 assert.equal(uploads.length,1,'import updates the atlas once');
 assert.equal(pack.updateAnimation(0,60,false),5);
 await pack.clear();
 assert.equal(pack.active,false);
});
