/* Player-owned Java PNG import: extra workstation sides, exact atlas coordinates.
 * No original Minecraft image assets are included in this repository.
 */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=n=>fs.readFileSync(path.join(root,n),'utf8');
const html=read('index.html');
const art=html.match(/\/\* MineWorld original procedural 16x16 voxel pixel-art atlas\. No external assets\. \*\/\s*\(\(\) => \{[\s\S]*?\}\)\(\);/);
const png=Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,16,0,0,0,16]);
function create(){
 const uploads=[],draws=[],created=[];
 class Canvas{
   constructor(){this.width=16;this.height=16;created.push(this);}
   getContext(){return {imageSmoothingEnabled:false,globalAlpha:1,clearRect(){},
     drawImage(...args){draws.push(args);},
     getImageData(_x,_y,w,h){return {data:new Uint8ClampedArray(w*h*4)};},putImageData(){}};}
   toDataURL(){return 'data:image/png;base64,original';}
 }
 class Image{
   constructor(){this.width=16;this.height=16;}
   set src(_url){queueMicrotask(()=>this.onload?.());}
 }
 const gl={TEXTURE0:1,TEXTURE_2D:2,RGBA:3,UNSIGNED_BYTE:4,
   UNPACK_FLIP_Y_WEBGL:5,TEXTURE_MIN_FILTER:6,TEXTURE_MAG_FILTER:7,NEAREST:8,
   activeTexture(){},bindTexture(){},pixelStorei(){},texParameteri(){},
   texImage2D(...args){uploads.push(args);},isContextLost(){return false;}};
 const window={MineWorldResourcePackContext:{gl,texture:{},baseURL:'data:image/png;base64,original'},
   MineWorldBlockGuide:{names:Array(170).fill('unknown_block')},
   MineWorldSound:{clearSamples(){}},MineWorldBridge:{refreshTextureUI(){}}};
 const context={window,document:{createElement:()=>new Canvas(),querySelector:()=>null},
   Image,URL:{createObjectURL:()=> 'blob:mock',revokeObjectURL(){}},Blob,
   Uint8Array,Uint8ClampedArray,TextDecoder,ArrayBuffer,DataView,Math,Number,
   JSON,console,performance:{now:()=>0},queueMicrotask};
 vm.runInNewContext(art[0],context);
 window.MineWorldAtlas.dataURL='data:image/png;base64,original';
 vm.runInNewContext(read('local-resource-pack.js'),context);
 return {pack:window.MineWorldLocalTextures,atlas:window.MineWorldAtlas,uploads,draws,created};
}
const file=name=>({name:name+'.png',size:png.length,arrayBuffer:async()=>png.slice().buffer});
test('player-provided workstation PNGs fill 11 separate side slots in a 256x1024 atlas',async()=>{
 const x=create();
 const spriteNames=new Set();
 for(const extra of Object.values(x.atlas.alternateFaces)){
   spriteNames.add(extra.name);if(extra.extra)spriteNames.add(extra.extra.name);
 }
 assert.equal(spriteNames.size,10,'one smithing_table_side sprite is shared by two MineWorld block IDs');
 const result=await x.pack.loadFiles([...spriteNames].map(file));
 assert.equal(result.directionalFaces,11,'both smithing table IDs and three cartography sides get their own tiles');
 assert.equal(result.totalFaces,507,'normal 169x3 face mapping stays unchanged');
 assert.equal(result.blocks,10);
 assert.ok(x.uploads.some(call=>call[call.length-1].width===256&&call[call.length-1].height===1024));
 const preview={clearRect(){},drawImage(...args){x.draws.push(['preview',...args]);}};
 assert.equal(x.pack.drawFace(preview,158,4),true);
 assert.ok(x.draws.some(call=>call[0]==='preview'&&call[2]===80&&call[3]===512),
   'cartography third side must read tile 517 (x=80,y=512)');
 assert.equal(x.pack.drawFace(preview,158,3),true);
 assert.ok(x.draws.some(call=>call[0]==='preview'&&call[2]===240&&call[3]===496),
   'cartography west side must keep original tile 511');
 await x.pack.clear();
 assert.equal(x.pack.active,false);
});
test('correct Java workstation bottom files are imported independently of directional side files',async()=>{
 const x=create();
 const result=await x.pack.loadFiles(['dark_oak_planks','birch_planks','cartography_table_side2','cartography_table_side3','fletching_table_side'].map(file));
 const missing=new Set(result.missingFaces.map(({id,face})=>id+':'+face));
 assert.equal(missing.has('158:2'),false,'cartography bottom must use dark oak planks');
 assert.equal(missing.has('161:2'),false,'fletching bottom must use birch planks');
 assert.equal(result.directionalFaces,3);
 assert.equal(x.pack.textureName(158,2),'dark_oak_planks');
 assert.equal(x.pack.textureName(161,2),'birch_planks');
});
