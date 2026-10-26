/* v6.47: synthetic source dimensions only; no Minecraft texture PNGs included. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const html=read('index.html');
const inline=html.match(/\/\* MineWorld original procedural 16x16 voxel pixel-art atlas\. No external assets\. \*\/\s*\(\(\) => \{[\s\S]*?\}\)\(\);/);
assert.ok(inline,'runtime atlas source must remain extractable for tests');
function start(size,height=size){
 const draws=[],uploads=[],subUploads=[];
 class Canvas{
  constructor(){this.width=16;this.height=16;}
  getContext(){return {imageSmoothingEnabled:false,globalAlpha:1,clearRect(){},
   drawImage(...args){draws.push(args);},
   getImageData(_x,_y,w,h){return {data:new Uint8ClampedArray(w*h*4)};},
   putImageData(){}};}
  toDataURL(){return 'data:image/png;base64,synthetic'+this.width;}
 }
 class Image{
  constructor(){this.width=size;this.height=height;}
  set src(_){queueMicrotask(()=>this.onload?.());}
 }
 const gl={TEXTURE0:1,TEXTURE_2D:2,RGBA:3,UNSIGNED_BYTE:4,
  UNPACK_FLIP_Y_WEBGL:5,TEXTURE_MIN_FILTER:6,TEXTURE_MAG_FILTER:7,NEAREST:8,
  activeTexture(){},bindTexture(){},pixelStorei(){},texParameteri(){},
  texImage2D(...a){uploads.push(a);},texSubImage2D(...a){subUploads.push(a);},
  isContextLost:()=>false};
 const window={MineWorldResourcePackContext:{gl,texture:{},baseURL:'data:image/png;base64,synthetic'},
   MineWorldBlockGuide:{names:Array(170).fill('Unknown')},
   MineWorldSound:{clearSamples(){}},
   MineWorldBridge:{refreshWorldMeshes(){},refreshTextureUI(){}}};
 window.MineWorldBlockGuide.names[3]='Stone';
 const env={window,document:{createElement:()=>new Canvas(),querySelector:()=>null},
  Image,URL:{createObjectURL:()=>'blob:test',revokeObjectURL(){}},
  Blob,Uint8Array,Uint8ClampedArray,TextDecoder,ArrayBuffer,DataView,Math,Number,
  JSON,console,performance:{now:()=>0},queueMicrotask};
 vm.runInNewContext(inline[0],env);
 window.MineWorldAtlas.dataURL='data:image/png;base64,synthetic';
 vm.runInNewContext(read('resource-animation.js'),env);
 vm.runInNewContext(read('local-resource-pack.js'),env);
 const png=Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,16,0,0,0,16]);
 const file=(name,bytes=png)=>({name,size:bytes.length,async arrayBuffer(){return Uint8Array.from(bytes).buffer;}});
 return {window,uploads,subUploads,draws,file};
}
test('32px pack keeps 32 source pixels per face without bilinear blur',async()=>{
 const x=start(32),pack=x.window.MineWorldLocalTextures;
 const data=await pack.loadFiles([x.file('stone.png')]);
 assert.equal(data.atlasTilePixels,32);
 assert.equal(data.faces,3);
 assert.equal(x.uploads.at(-1).at(-1).width,512);
 assert.equal(x.uploads.at(-1).at(-1).height,2048);
 assert.equal(x.window.MineWorldAtlas.tilePixels,32);
 // Stone top is atlas tile 9, so the first texel begins at x=288.5.
 const uv=x.window.MineWorldAtlas.uv(3,0,0);
 assert.ok(Math.abs(uv[0]-(288.5/512))<1e-10);
 assert.ok(Math.abs(uv[1]-(.5/2048))<1e-10);
 const preview={clearRect(){},drawImage(...a){x.draws.push(['preview',...a]);}};
 assert.equal(pack.drawFace(preview,3,0),true);
 assert.ok(x.draws.some(a=>a[0]==='preview'&&a[2]===288&&a[4]===32&&a[8]===16));
 // Native 32x32 pixels must actually be placed directly in 32px tile.
 assert.ok(x.draws.some(a=>a.length===9&&a[5]===288&&a[7]===32&&a[8]===32));
 await pack.clear();
 assert.equal(x.window.MineWorldAtlas.tilePixels,16);
 assert.equal(x.uploads.at(-1).at(-1).width,256);
});
test('vanilla 16px pack retains smaller atlas and exact normal texel centers',async()=>{
 const x=start(16),r=await x.window.MineWorldLocalTextures.loadFiles([x.file('stone.png')]);
 assert.equal(r.atlasTilePixels,16);
 assert.equal(x.uploads.at(-1).at(-1).width,256);
 assert.equal(x.uploads.at(-1).at(-1).height,1024);
 const u=x.window.MineWorldAtlas.uv(3,0,0)[0];
 assert.ok(Math.abs(u-(144.5/256))<1e-10);
});
test('animated 32px sprites update GPU subtiles at 32px coordinates',async()=>{
 const x=start(32,64),pack=x.window.MineWorldLocalTextures;
 const meta=Uint8Array.from(Buffer.from(JSON.stringify({animation:{frametime:1,frames:[0,1]}})));
 const r=await pack.loadFiles([x.file('stone.png'),x.file('stone.png.mcmeta',meta)]);
 assert.equal(r.atlasTilePixels,32);
 assert.ok(r.animatedFaces>0);
 const refreshed=pack.updateAnimation(100,60,false);
 assert.ok(refreshed>0);
 assert.ok(x.subUploads.some(a=>a[2]===288&&a[3]===0&&a.at(-1).width===32));
});
test('HD atlas uses nearest-neighbor everywhere and never writes to world saves',()=>{
 const src=read('local-resource-pack.js'),sw=read('sw.js');
 assert.match(src,/hctx\.imageSmoothingEnabled=false/);
 assert.match(src,/ctx\.imageSmoothingEnabled=false/);
 assert.match(src,/MineWorldAtlas\?\.setTilePixels\?\.\(tileSize\)/);
 assert.match(src,/atlasTilePixels:state\.tilePixels/);
 assert.match(sw,/const VERSION='mineworld-[^']+'/);
 assert.doesNotMatch(src,/localStorage\.setItem\(.*atlasTilePixels/);
});

test('HD local item icons keep 32px sources; 16px icons stay unchanged',async()=>{
 for(const side of [16,32]){
  const x=start(side),file=x.file('diamond.png');
  file.webkitRelativePath='assets/minecraft/textures/item/diamond.png';
  const pack=x.window.MineWorldLocalTextures;
  const result=await pack.loadFiles([x.file('stone.png'),file]);
  assert.equal(result.items,1);
  const dataURL=await pack.itemIcon('diamond');
  assert.ok(dataURL.endsWith('synthetic'+side),
   'item icon must retain original square source detail at '+side+'px');
 }
});
test('non-square local item icons preserve aspect ratio, not stretch to square',async()=>{
 const x=start(64,32),item=x.file('diamond.png');
 item.webkitRelativePath='assets/minecraft/textures/item/diamond.png';
 await x.window.MineWorldLocalTextures.loadFiles([x.file('stone.png'),item]);
 const icon=await x.window.MineWorldLocalTextures.itemIcon('diamond');
 assert.ok(icon.endsWith('synthetic32'));
 assert.ok(x.draws.some(args=>args.length===9&&args[1]===0&&args[2]===0&&
   args[3]===64&&args[4]===32&&args[7]===32&&args[8]===16),
   'HD rectangular item should draw at a bounded 32x16 without distortion');
});
