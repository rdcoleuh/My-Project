/* Broken modern Java PNGs must not hide valid historical aliases.
 * Synthetic PNG headers only: no original Minecraft bitmap bytes are bundled.
 */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=n=>fs.readFileSync(path.join(__dirname,'..',n),'utf8');
const header=[137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,16,0,0,0,16];
const bytes=marker=>Uint8Array.from([...header,marker]);
const file=(name,data)=>({name,size:data.length,arrayBuffer:async()=>Uint8Array.from(data).buffer});
function setup(){
 const blobs=new Map(),draws=[],warnings=[];
 let counter=0;
 class Canvas{
  constructor(){this.width=16;this.height=16;}
  getContext(){return {imageSmoothingEnabled:false,globalAlpha:1,
   clearRect(){},drawImage(image,...args){draws.push({tag:image.tag,args});},
   getImageData(_x,_y,w,h){return {data:new Uint8ClampedArray(w*h*4)};},
   putImageData(){}};}
  toDataURL(){return 'data:image/png;base64,original';}
 }
 class Image{
  constructor(){this.width=16;this.height=16;this.tag=-1;}
  set src(value){
   if(!String(value).startsWith('blob:')){
    this.tag=99;this.width=256;this.height=1024;
    queueMicrotask(()=>this.onload?.());return;
   }
   blobs.get(value).arrayBuffer().then(buffer=>{
    const tag=new Uint8Array(buffer)[24];
    if(!tag){this.onerror?.();return;}
    this.tag=tag;this.width=16;this.height=tag===2?32:16;
    this.onload?.();
   }).catch(error=>this.onerror?.(error));
  }
 }
 const gl={TEXTURE0:1,TEXTURE_2D:2,RGBA:3,UNSIGNED_BYTE:4,
  UNPACK_FLIP_Y_WEBGL:5,TEXTURE_MIN_FILTER:6,TEXTURE_MAG_FILTER:7,NEAREST:8,
  activeTexture(){},bindTexture(){},pixelStorei(){},texParameteri(){},
  texImage2D(){},texSubImage2D(){},isContextLost(){return false;}};
 const window={MineWorldResourcePackContext:{gl,texture:{},baseURL:'data:image/png;base64,original'},
  MineWorldAtlas:{dataURL:'data:image/png;base64,original'},
  MineWorldBlockGuide:{names:Array(170).fill('unknown_block')},
  MineWorldSound:{clearSamples(){}},MineWorldBridge:{refreshTextureUI(){}}};
 const ctx={window,document:{createElement:()=>new Canvas(),querySelector:()=>null},
  Image,URL:{createObjectURL(blob){const key='blob:'+ ++counter;blobs.set(key,blob);return key;},
   revokeObjectURL(key){blobs.delete(key);}},
  Blob,Uint8Array,Uint8ClampedArray,ArrayBuffer,DataView,TextDecoder,
  Math,JSON,Number,console:{warn(...args){warnings.push(args)},log(){}},
  queueMicrotask,performance:{now:()=>0}};
 vm.runInNewContext(read('resource-animation.js'),ctx);
 vm.runInNewContext(read('local-resource-pack.js'),ctx);
 return {pack:window.MineWorldLocalTextures,draws,warnings};
}
test('corrupt modern furnace PNG falls back to valid historical Java filename and its own animation metadata',async()=>{
 const {pack,draws,warnings}=setup();
 const result=await pack.loadFiles([
  file('furnace_front.png',bytes(0)),
  file('furnace_front_off.png',bytes(2)),
  file('furnace_front_off.png.mcmeta',Buffer.from('{"animation":{"frametime":3,"frames":[1,0]}}'))
 ]);
 assert.equal(result.faces,1,'the Java furnace front is still imported');
 assert.equal(result.animatedFaces,1,'metadata follows the decoded alias, not the corrupt canonical PNG');
 assert.ok(draws.some(d=>d.tag===2&&d.args.length===8),'the legacy animated sprite is painted');
 assert.ok(warnings.some(w=>String(w[0]).includes('furnace_front')));
 assert.equal(pack.active,true);
});
test('valid canonical Java PNG takes precedence over a legacy alias and is decoded once',async()=>{
 const {pack,draws}=setup();
 const result=await pack.loadFiles([
  file('furnace_front.png',bytes(3)),file('furnace_front_off.png',bytes(2))
 ]);
 assert.equal(result.faces,1);
 assert.equal(result.animatedFaces,0,'unused legacy .mcmeta does not animate canonical sprite');
 assert.ok(draws.some(d=>d.tag===3),'modern PNG paints the face');
 assert.ok(!draws.some(d=>d.tag===2),'unused alias never paints the face');
});
test('all corrupt matching PNGs are safely rejected instead of replacing the working atlas',async()=>{
 const {pack}=setup();
 await assert.rejects(pack.loadFiles([
  file('furnace_front.png',bytes(0)),file('furnace_front_off.png',bytes(0))
 ]),/No compatible block, item or sound files found/);
 assert.equal(pack.active,false);
 assert.equal(pack.lastResult,null);
});
