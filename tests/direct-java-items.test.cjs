/* Exact player-supplied Java Edition item PNGs, no bundled copyrighted bitmaps. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const PNG=Buffer.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,16,0,0,0,16]);
function boot(){
 const draws=[],uploads=[],urls=[];
 class Canvas{
  constructor(){this.width=16;this.height=16;}
  getContext(){return {imageSmoothingEnabled:false,clearRect(){},drawImage(...args){draws.push(args);},
    getImageData(_x,_y,w,h){return {data:new Uint8ClampedArray(w*h*4)};},putImageData(){}};}
  toDataURL(){return 'data:image/png;base64,localItem';}
 }
 class Image{
  constructor(){this.width=16;this.height=16;}
  set src(v){queueMicrotask(()=>this.onload?.());}
 }
 const gl={TEXTURE0:1,TEXTURE_2D:2,RGBA:3,UNSIGNED_BYTE:4,UNPACK_FLIP_Y_WEBGL:5,
  TEXTURE_MIN_FILTER:6,TEXTURE_MAG_FILTER:7,NEAREST:8,
  activeTexture(){},bindTexture(){},pixelStorei(){},texParameteri(){},texImage2D(...args){uploads.push(args);},
  isContextLost(){return false;}};
 const win={MineWorldResourcePackContext:{gl,texture:{},baseURL:'data:image/png;base64,original'},
  MineWorldAtlas:{dataURL:'data:image/png;base64,original'},
  MineWorldBlockGuide:{names:Array(170).fill('unknown_block')},
  MineWorldSound:{clearSamples(){}},MineWorldBridge:{refreshTextureUI(){}}};
 const ctx={window:win,document:{createElement:()=>new Canvas(),querySelector:()=>null},
  URL:{createObjectURL:()=>{const k='blob:item:'+urls.length;urls.push(k);return k},revokeObjectURL(){}},
  Image,Blob,Uint8Array,Uint8ClampedArray,TextDecoder,ArrayBuffer,DataView,
  queueMicrotask,console,Math,JSON,Number,performance:{now:()=>0}};
 vm.runInNewContext(read('local-resource-pack.js'),ctx,{filename:'local-resource-pack.js'});
 return {pack:win.MineWorldLocalTextures,draws,uploads,urls};
}
function file(name,folder=''){
 return {name,webkitRelativePath:folder?folder+'/'+name:'',size:PNG.length,
   async arrayBuffer(){return Uint8Array.from(PNG).buffer;}};
}
function zip(entries){
 const local=[],central=[];let offset=0;
 for(const [name,bytes] of entries){
  const filename=Buffer.from(name),data=Buffer.from(bytes);
  const head=Buffer.alloc(30+filename.length);
  head.writeUInt32LE(0x04034b50,0);head.writeUInt16LE(20,4);
  head.writeUInt32LE(data.length,18);head.writeUInt32LE(data.length,22);
  head.writeUInt16LE(filename.length,26);filename.copy(head,30);
  const dir=Buffer.alloc(46+filename.length);dir.writeUInt32LE(0x02014b50,0);
  dir.writeUInt16LE(20,4);dir.writeUInt16LE(20,6);
  dir.writeUInt32LE(data.length,20);dir.writeUInt32LE(data.length,24);
  dir.writeUInt16LE(filename.length,28);dir.writeUInt32LE(offset,42);filename.copy(dir,46);
  local.push(head,data);central.push(dir);offset+=head.length+data.length;
 }
 const end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);
 end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);
 end.writeUInt32LE(central.reduce((sum,b)=>sum+b.length,0),12);
 end.writeUInt32LE(offset,16);
 return Uint8Array.from(Buffer.concat([...local,...central,end])).buffer;
}
test('Java client ZIP reads original items namespace and ignores modded duplicate',async()=>{
 const b=boot(),buf=zip([
 ['assets/othermod/textures/item/diamond_sword.png',PNG],
 ['textures/items/diamond_sword.png',Buffer.from([1])],
 ['assets/minecraft/textures/item/diamond_sword.png',PNG],
 ['assets/minecraft/textures/item/iron_ingot.png',PNG]
 ]);
 const names=b.pack.inspectZip(buf);
 assert.ok(names.includes('item:diamond_sword'));
 assert.ok(names.includes('item:iron_ingot'));
 assert.equal(names.filter(x=>x==='item:diamond_sword').length,1);
 const report=await b.pack.loadFile({name:'client.jar',arrayBuffer:async()=>buf});
 assert.equal(report.items,2);
 assert.equal(report.faces,0);
 assert.equal(b.pack.active,false,'an item-only pack must not claim block face coverage');
 assert.equal(b.pack.availableItemTextures,2);
 assert.equal(await b.pack.itemIcon('diamondSword'),'data:image/png;base64,localItem');
 assert.equal(await b.pack.itemIcon('iron'),'data:image/png;base64,localItem');
 assert.equal(await b.pack.itemIcon('unused'),null);
 assert.ok(b.draws.length>0);
 assert.equal(b.uploads.length,0,'item-only ZIP must not overwrite the world block atlas');
});
test('direct extracted item sprite wins over fallback; reset releases local bytes',async()=>{
 const b=boot();
 const data=await b.pack.loadFiles([file('iron_sword.png','Pack/assets/minecraft/textures/item')]);
 assert.equal(data.items,1);
 assert.equal(b.pack.itemName('ironSword'),'iron_sword');
 assert.equal(b.pack.itemName('flintSteel'),'flint_and_steel');
 assert.equal(b.pack.itemName('../../file'),null);
 assert.equal(await b.pack.itemIcon('ironSword'),'data:image/png;base64,localItem');
 const count=b.urls.length;
 assert.equal(await b.pack.itemIcon('ironSword'),'data:image/png;base64,localItem');
 assert.equal(b.urls.length,count,'item sprite must be decoded once');
 await b.pack.clear();
 assert.equal(b.pack.availableItemTextures,0,'reset clears imported item counter');
 assert.equal(await b.pack.itemIcon('ironSword'),null,'reset cannot return stale PNG');
});
test('real inventory shows direct local item sprites and keeps blocks unchanged',()=>{
 const ui=read('java-inventory-ui.js');
 assert.match(ui,/MineWorldLocalTextures\?\.itemIcon/);
 assert.match(ui,/image-rendering:pixelated/);
 assert.match(ui,/itemView\(s.key,button\)/);
 assert.match(ui,/blockImage\(Number\(key.slice\(6\)\),where\)/);
 assert.ok(!ui.includes('https://minecraft'));
 assert.ok(read('index.html').includes('mineworld-selfhost-v1'));
 assert.ok(ui.includes('Math.floor(tile/16)/63*100'),
   'all block icons must address the current full-height atlas');
 assert.ok(read('java-inventory.css').includes('background-size:1600% 6400%'),
   'atlas background scaling must use all 64 rows, not the former 32 rows');
});
