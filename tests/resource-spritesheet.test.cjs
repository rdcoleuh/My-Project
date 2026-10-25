/* MineWorld 6.12 — actual Java .mcmeta row-major sprite-sheet regression. */
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
function timeline(){
 const window={};
 vm.runInNewContext(read('resource-animation.js'),{window,Math,Number,JSON,Object});
 return window.MineWorldResourceAnimation;
}
test('Java .mcmeta explicit width/height selects row-major frames',()=>{
 const t=timeline(),im={width:64,height:32};
 const meta=JSON.stringify({animation:{width:16,height:16,frametime:1,frames:[0,5,7]}});
 const g=t.frameDimensions(im,meta);
 assert.equal(g.count,8);
 assert.equal(g.columns,4);
 assert.equal(g.rows,2);
 assert.deepEqual(Object.values(t.frameRect(im,5,g)),[16,16,16,16]);
 assert.deepEqual(Object.values(t.frameRect(im,7,g)),[48,16,16,16]);
 assert.equal(t.indexAt(t.parse(meta,g.count),50),5);
 assert.equal(t.indexAt(t.parse(meta,g.count),100),7);
});
test('without explicit frame sizes legacy vertical PNG strips remain compatible',()=>{
 const t=timeline(),g=t.frameDimensions({width:16,height:64});
 assert.equal(g.count,4);
 assert.equal(t.frameRect({width:16,height:64},3,g).y,48);
 assert.equal(t.frameDimensions({width:64,height:16}).count,1);
 assert.equal(t.frameDimensions({width:32,height:32},'{"animation":{"width":16,"height":16}}').count,4);
});
test('real local importer draws correct sheet frames into 16px atlas and uploads only changed tiles',async()=>{
 const drawCalls=[],uploads=[],window={};
 const ctx={
  imageSmoothingEnabled:false,globalAlpha:1,clearRect(){},
  drawImage(...args){drawCalls.push(args)},
  getImageData(_x,_y,w,h){return {data:new Uint8ClampedArray(w*h*4)}},
  putImageData(){}
 };
 class Canvas{
  constructor(){this.width=16;this.height=16;}
  getContext(){return ctx;}
  toDataURL(){return 'data:image/png;base64,original';}
 }
 class Image{
  constructor(){this.width=64;this.height=32;}
  set src(_value){queueMicrotask(()=>this.onload?.());}
 }
 const gl={
  TEXTURE0:1,TEXTURE_2D:2,RGBA:3,UNSIGNED_BYTE:4,UNPACK_FLIP_Y_WEBGL:5,
  TEXTURE_MIN_FILTER:6,TEXTURE_MAG_FILTER:7,NEAREST:8,
  activeTexture(){},bindTexture(){},pixelStorei(){},texImage2D(){},
  texSubImage2D(...args){uploads.push(args)},texParameteri(){},isContextLost(){return false;}
 };
 Object.assign(window,{
  MineWorldResourcePackContext:{gl,texture:{},baseURL:'data:image/png;base64,original'},
  MineWorldAtlas:{dataURL:'data:image/png;base64,original'},
  MineWorldBlockGuide:{names:Array.from({length:170},()=> 'unknown_block')},
  MineWorldSound:{clearSamples(){}},MineWorldBridge:{refreshTextureUI(){}}
 });
 const context={window,document:{createElement:()=>new Canvas(),querySelector:()=>null},
  Image,URL:{createObjectURL:()=> 'blob:mock',revokeObjectURL(){}},Blob,
  Uint8Array,Uint8ClampedArray,TextDecoder,ArrayBuffer,DataView,Math,Number,
  JSON,console,performance:{now:()=>0},queueMicrotask};
 vm.runInNewContext(read('resource-animation.js'),context);
 vm.runInNewContext(read('local-resource-pack.js'),context);
 const png=Buffer.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,16,0,0,0,16]);
 const meta=Buffer.from('{"animation":{"width":16,"height":16,"frametime":1,"frames":[0,5,7]}}');
 const files=[['water_still.png',png],['water_still.png.mcmeta',meta]].map(([name,bytes])=>({
  name,size:bytes.length,arrayBuffer:async()=>Uint8Array.from(bytes).buffer
 }));
 const pack=window.MineWorldLocalTextures;
 const result=await pack.loadFiles(files);
 assert.equal(result.animatedFaces,3);
 assert.ok(drawCalls.some(a=>a.length===9&&a[1]===0&&a[2]===0&&a[3]===16&&a[4]===16),
  'First frame must crop to 16px, not shrink the whole sheet');
 drawCalls.length=0;
 assert.equal(pack.updateAnimation(0,60,false),3);
 drawCalls.length=0;
 assert.equal(pack.updateAnimation(100,60,false),3);
 assert.ok(drawCalls.some(a=>a.length===9&&a[1]===48&&a[2]===16&&a[3]===16&&a[4]===16),
  'Third timeline entry must use frame 7 at x=48,y=16');
 assert.equal(uploads.length,6);
 await pack.clear();
 assert.equal(pack.updateAnimation(200,60,false),0);
});
