/* MineWorld 6.8: Java-style animated PNG metadata and live atlas integration. */
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
function timeline(){
 const window={};
 vm.runInNewContext(read('resource-animation.js'),{window,Math,Number,JSON});
 return window.MineWorldResourceAnimation;
}
test('Java 20-tick sprite schedule supports custom order and per-frame durations',()=>{
 const a=timeline();
 const def=a.parse('{"animation":{"frametime":2,"frames":[0,{"index":2,"time":1},1]}}',3);
 assert.equal(a.indexAt(def,0),0);
 assert.equal(a.indexAt(def,99),0);
 assert.equal(a.indexAt(def,100),2);
 assert.equal(a.indexAt(def,149),2);
 assert.equal(a.indexAt(def,150),1);
 assert.equal(a.indexAt(def,249),1);
 assert.equal(a.indexAt(def,250),0);
 assert.equal(def.totalMs,250);
});
test('Java interpolate flag blends consecutive frames but does not alter order',()=>{
 const a=timeline();
 const def=a.parse('{"animation":{"frametime":2,"interpolate":true,"frames":[1,0]}}',2);
 assert.equal(a.sampleAt(def,0).index,1);
 assert.equal(a.sampleAt(def,50).blend,.5);
 assert.equal(a.sampleAt(def,100).index,0);
 assert.equal(a.sampleAt(def,150).nextIndex,1);
 assert.equal(a.sampleAt(def,150).blend,.5);
});
test('malformed or untrusted metadata is bounded and defaults safely',()=>{
 const a=timeline();
 const d=a.parse('{"animation":{"frametime":0,"frames":[-1,99999,{"index":1,"time":0},0]}}',2);
 assert.equal(d.frames.length,2);
 assert.equal(d.frames[0].index,1);
 assert.equal(d.frames[0].time,1);
 assert.equal(d.totalMs,100);
 assert.equal(a.frameDimensions({width:16,height:64}).count,4);
 assert.equal(a.frameDimensions({width:32,height:32}).count,1);
 assert.equal(a.parse('{bad',2).frames.length,2);
});
test('game loads timeline before importer, updates imported frames, and caches both',()=>{
 const html=read('index.html'),sw=read('sw.js'),pack=read('local-resource-pack.js');
 assert.ok(html.indexOf('src="./resource-animation.js"')<html.indexOf('src="./local-resource-pack.js"'));
 assert.ok(html.includes('window.MineWorldLocalTextures.updateAnimation(t,currentFPS,isTouch)'));
 assert.ok(sw.includes("'./resource-animation.js'"));
 assert.ok(pack.includes("found.set('meta:'+matchMeta[1]"));
 assert.ok(pack.includes("if(meta)key='meta:'+meta[1]"));
 assert.ok(pack.includes('gl.texSubImage2D('));
 assert.ok(pack.includes('ctx.clearRect(px,py,16,16)'));
});
test('player-supplied animated PNG updates only changed GPU tiles and resets safely',async()=>{
 const uploads=[],window={},ctx2d={
  imageSmoothingEnabled:false,globalAlpha:1,
  clearRect(){},drawImage(){},
  getImageData(_x,_y,w,h){return {data:new Uint8ClampedArray(w*h*4)};},
  putImageData(){}
 };
 class Canvas{
  constructor(){this.width=16;this.height=16;}
  getContext(){return ctx2d;}
  toDataURL(){return 'data:image/png;base64,original'}
 }
 class Image{
  constructor(){this.width=16;this.height=48;}
  set src(v){queueMicrotask(()=>this.onload?.())}
 }
 const gl={TEXTURE0:1,TEXTURE_2D:2,RGBA:3,UNSIGNED_BYTE:4,
  UNPACK_FLIP_Y_WEBGL:5,TEXTURE_MIN_FILTER:6,TEXTURE_MAG_FILTER:7,NEAREST:8,
  activeTexture(){},bindTexture(){},pixelStorei(){},texImage2D(){},
  texSubImage2D(...args){uploads.push(args)},texParameteri(){},isContextLost:()=>false};
 Object.assign(window,{
  MineWorldResourcePackContext:{gl,texture:{},baseURL:'data:image/png;base64,original'},
  MineWorldAtlas:{dataURL:'data:image/png;base64,original'},
  MineWorldSound:{clearSamples(){}},MineWorldBridge:{refreshTextureUI(){}},
  MineWorldBlockGuide:{names:Array.from({length:170},()=> 'stone')}
 });
 const context={window,document:{createElement:()=>new Canvas(),querySelector:()=>null},
  Image,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},Blob,
  Uint8Array,Uint8ClampedArray,TextDecoder,ArrayBuffer,DataView,Math,Number,
  JSON,console,performance:{now:()=>0},queueMicrotask};
 vm.runInNewContext(read('resource-animation.js'),context);
 vm.runInNewContext(read('local-resource-pack.js'),context);
 const png=Buffer.alloc(24);Buffer.from([137,80,78,71,13,10,26,10]).copy(png);
 const json=Buffer.from('{"animation":{"frametime":2,"frames":[0,2,1]}}');
 const input=[['water_still.png',png],['water_still.png.mcmeta',json]].map(([name,bytes])=>({
  name,size:bytes.length,arrayBuffer:async()=>Uint8Array.from(bytes).buffer
 }));
 const pack=window.MineWorldLocalTextures;
 const result=await pack.loadFiles(input);
 assert.equal(result.animatedFaces,3);
 assert.equal(pack.animatedFaces,3);
 assert.equal(pack.updateAnimation(0,60,false),3);
 assert.equal(pack.updateAnimation(30,60,false),0);
 assert.equal(pack.updateAnimation(100,60,false),3);
 assert.equal(uploads.length,6);
 await pack.clear();
 assert.equal(pack.animatedFaces,0);
 assert.equal(pack.updateAnimation(200,60,false),0);
});
