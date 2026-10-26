/* Synthetic local item artwork; no copyrighted textures are included. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=n=>fs.readFileSync(path.join(__dirname,'..',n),'utf8');
function png(w,h){
 const b=Buffer.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,0,0,0,0,0]);
 b.writeUInt32BE(w,16);b.writeUInt32BE(h,20);return b;
}
function zip(entries){
 const local=[],central=[];let offset=0;
 for(const [name,bytes] of entries){
  const filename=Buffer.from(name),data=Buffer.from(bytes);
  const head=Buffer.alloc(30+filename.length);head.writeUInt32LE(0x04034b50,0);
  head.writeUInt16LE(20,4);head.writeUInt32LE(data.length,18);
  head.writeUInt32LE(data.length,22);head.writeUInt16LE(filename.length,26);filename.copy(head,30);
  const dir=Buffer.alloc(46+filename.length);dir.writeUInt32LE(0x02014b50,0);
  dir.writeUInt16LE(20,4);dir.writeUInt16LE(20,6);
  dir.writeUInt32LE(data.length,20);dir.writeUInt32LE(data.length,24);
  dir.writeUInt16LE(filename.length,28);dir.writeUInt32LE(offset,42);filename.copy(dir,46);
  local.push(head,data);central.push(dir);offset+=head.length+data.length;
 }
 const end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);
 end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);
 end.writeUInt32LE(central.reduce((n,b)=>n+b.length,0),12);end.writeUInt32LE(offset,16);
 return Uint8Array.from(Buffer.concat([...local,...central,end])).buffer;
}
function boot(){
 const draws=[],mobMaps=[],blobs=new Map();
 class Canvas{
  constructor(){this.width=16;this.height=16;}
  getContext(){return {imageSmoothingEnabled:false,clearRect(){},drawImage(...args){draws.push(args);},
   getImageData(_x,_y,w,h){return {data:new Uint8ClampedArray(w*h*4)};},putImageData(){}};}
  toDataURL(){return 'data:image/png;base64,synthetic';}
 }
 class Image{
  constructor(){this.width=16;this.height=16;}
  set src(url){
   const blob=blobs.get(url);
   if(!blob){queueMicrotask(()=>this.onload?.());return;}
   blob.arrayBuffer().then(buffer=>{
    const view=new DataView(buffer);
    this.width=view.getUint32(16);this.height=view.getUint32(20);
    this.onload?.();
   }).catch(error=>this.onerror?.(error));
  }
 }
 const gl={TEXTURE0:1,TEXTURE_2D:2,RGBA:3,UNSIGNED_BYTE:4,UNPACK_FLIP_Y_WEBGL:5,
  TEXTURE_MIN_FILTER:6,TEXTURE_MAG_FILTER:7,NEAREST:8,
  activeTexture(){},bindTexture(){},pixelStorei(){},texParameteri(){},texImage2D(){},
  isContextLost(){return false;}};
 const window={MineWorldResourcePackContext:{gl,texture:{},baseURL:'data:image/png;base64,original'},
  MineWorldAtlas:{dataURL:'data:image/png;base64,original'},
  MineWorldBlockGuide:{names:Array(170).fill('unknown_block')},
  MineWorldSound:{clearSamples(){}},MineWorldBridge:{refreshTextureUI(){}},
  MineWorldMobPixels:{kinds:[],applyImported(map){mobMaps.push(map);return map.size;}}};
 const URL={createObjectURL(blob){const name='blob:synthetic:'+blobs.size;blobs.set(name,blob);return name;},
  revokeObjectURL(name){blobs.delete(name);}};
 const context={window,document:{createElement:()=>new Canvas(),querySelector:()=>null},
  Image,URL,Blob,Uint8Array,Uint8ClampedArray,TextDecoder,ArrayBuffer,DataView,
  queueMicrotask,console,Math,JSON,Number,performance:{now:()=>0}};
 vm.runInNewContext(read('resource-animation.js'),context);
 vm.runInNewContext(read('local-resource-pack.js'),context);
 return {pack:window.MineWorldLocalTextures,draws,mobMaps};
}
function folderFile(name,bytes){
 return {name:name.split('/').at(-1),webkitRelativePath:'OwnedPack/'+name,
  size:bytes.length,async arrayBuffer(){return Uint8Array.from(bytes).buffer;}};
}
test('Java ZIP .mcmeta chooses first authored item frame for inventory and drops',async()=>{
 const b=boot(),meta=Buffer.from(JSON.stringify({animation:{frames:[2,0,1,3]}}));
 const archive=zip([
  ['assets/othermod/textures/item/diamond_sword.png.mcmeta',Buffer.from('wrong namespace')],
  ['assets/minecraft/textures/item/diamond_sword.png',png(16,64)],
  ['assets/minecraft/textures/item/diamond_sword.png.mcmeta',meta]]);
 const keys=b.pack.inspectZip(archive);
 assert.ok(keys.includes('meta:item:diamond_sword'));
 assert.equal(keys.filter(k=>k==='meta:item:diamond_sword').length,1);
 const report=await b.pack.loadFile({name:'owned.jar',arrayBuffer:async()=>archive});
 assert.equal(report.items,1);
 const dropped=b.mobMaps.at(-1).get('item:diamond_sword');
 assert.equal(dropped.width,16);assert.equal(dropped.height,16);
 assert.ok(b.draws.some(a=>a[1]===0&&a[2]===32&&a[3]===16&&a[4]===16));
 assert.equal(await b.pack.itemIcon('diamondSword'),'data:image/png;base64,synthetic');
 const last=b.draws.at(-1);
 assert.deepEqual(last.slice(1,5),[0,32,16,16]);
 assert.deepEqual(last.slice(7,9),[16,16]);
});
test('folder imports honor explicitly sized horizontal item animations',async()=>{
 const b=boot(),meta=Buffer.from(JSON.stringify({animation:{width:16,height:16,frames:[1,0]}}));
 const report=await b.pack.loadFiles([
  folderFile('assets/minecraft/textures/item/emerald.png',png(32,16)),
  folderFile('assets/minecraft/textures/item/emerald.png.mcmeta',meta)]);
 assert.equal(report.items,1);
 assert.equal(b.mobMaps.at(-1).get('item:emerald').width,16);
 await b.pack.itemIcon('emerald');
 assert.deepEqual(b.draws.at(-1).slice(1,5),[16,0,16,16]);
});
test('static rectangular items retain full source aspect ratio without metadata',async()=>{
 const b=boot(),archive=zip([['assets/minecraft/textures/item/stick.png',png(32,16)]]);
 await b.pack.loadFile({name:'static.zip',arrayBuffer:async()=>archive});
 const dropped=b.mobMaps.at(-1).get('item:stick');
 assert.equal(dropped.width,32);assert.equal(dropped.height,16);
 await b.pack.itemIcon('stick');
 const args=b.draws.at(-1);
 assert.deepEqual(args.slice(1,5),[0,0,32,16]);
 assert.deepEqual(args.slice(7,9),[32,16]);
});
