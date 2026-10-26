/* Player-supplied Bedrock flipbooks + independent voxel face orientation.
 * All tests use synthetic data, not copyrighted Minecraft artwork.
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
function bootTimelines(){
 const window={};
 vm.runInNewContext(read('bedrock-flipbook.js'),{window,Math,Number,JSON,Map,Array});
 vm.runInNewContext(read('resource-animation.js'),{window,Math,Number,JSON});
 return window;
}
test('Mojang Bedrock flipbook source, order, ticks, frames and blend flag are respected',()=>{
 const {MineWorldBedrockFlipbooks:b,MineWorldResourceAnimation:a}=bootTimelines();
 const data=b.parse('// Mojang sample comment\n'+JSON.stringify([
   {flipbook_texture:'textures/blocks/water_still_grey',atlas_tile:'still_water_grey',
    ticks_per_frame:2,frames:[3,1,0,2],blend_frames:false},
   {flipbook_texture:'textures/blocks/prismarine_rough',ticks_per_frame:300,
    frames:[0,1,0,2]},
   {flipbook_texture:'textures/blocks/lava_still',ticks_per_frame:16},
   {flipbook_texture:'https://example.org/steal',ticks_per_frame:1}
 ]));
 assert.equal(data.size,3,'remote path is rejected');
 const info=b.match(data,'water_still',['water_still_grey']);
 assert.equal(info.source,'water_still_grey');
 const geo=b.geometry({width:16,height:64},info);
 assert.equal(geo.count,4);
 const timeline=b.timeline(info,geo.count);
 assert.equal(timeline.frames.length,4);
 assert.equal(timeline.totalMs,400);
 assert.equal(a.sampleAt(timeline,0).index,3);
 assert.equal(a.sampleAt(timeline,99).index,3);
 assert.equal(a.sampleAt(timeline,100).index,1);
 assert.equal(a.sampleAt(timeline,199).index,1);
 assert.equal(a.sampleAt(timeline,399).index,2);
 assert.equal(a.sampleAt(timeline,75).blend,0,'explicit no-blending honored');
 const lava=b.match(data,'lava_still');
 const lt=b.timeline(lava,b.geometry({width:16,height:48},lava).count);
 assert.equal(a.sampleAt(lt,800).index,1,'16 Bedrock ticks correspond to 800ms');
 const prismarine=b.timeline(data.get('prismarine_rough'),4);
 assert.equal(prismarine.totalMs,60000,'300-tick prismarine frames retain timing');
});
test('invalid Bedrock metadata is bounded; pixel replicate is not misinterpreted as frame geometry',()=>{
 const b=bootTimelines().MineWorldBedrockFlipbooks;
 assert.equal(b.parse('{broken').size,0);
 assert.equal(b.parse('{}').size,0);
 assert.equal(b.parse('x'.repeat(270000)).size,0);
 const map=b.parse(JSON.stringify([{flipbook_texture:'textures/blocks/lava_flow',
   frames:[3,-1,99999,1],replicate:2,blend_frames:false,ticks_per_frame:-5}]));
 assert.equal(map.size,1);
 const def=map.get('lava_flow');
 assert.equal(def.replicate,2);
 const geometry=b.geometry({width:16,height:48},def);
 assert.equal(geometry.count,3,'replicate does not shrink frame dimensions');
 const tl=b.timeline(def,geometry.count);
 assert.deepEqual(Array.from(tl.frames,frame=>frame.index),[1]);
 assert.equal(tl.frames[0].time,1);
 assert.equal(b.match(map,'lava_flow')?.source,'lava_flow');
});
test('all six cube surfaces use upright and deterministic pixel UVs',()=>{
 const window={};
 vm.runInNewContext(read('block-face-uv.js'),{window,Array});
 const uv=window.MineWorldFaceUV;
 const FACE=[
  {n:[1,0,0],v:[[1,0,0],[1,1,0],[1,1,1],[1,0,1]],expected:[2,3,0,1]},
  {n:[-1,0,0],v:[[0,0,1],[0,1,1],[0,1,0],[0,0,0]],expected:[2,3,0,1]},
  {n:[0,1,0],v:[[0,1,0],[0,1,1],[1,1,1],[1,1,0]],expected:[0,1,2,3]},
  {n:[0,-1,0],v:[[0,0,1],[0,0,0],[1,0,0],[1,0,1]],expected:[0,1,2,3]},
  {n:[0,0,1],v:[[1,0,1],[1,1,1],[0,1,1],[0,0,1]],expected:[1,0,3,2]},
  {n:[0,0,-1],v:[[0,0,0],[0,1,0],[1,1,0],[1,0,0]],expected:[1,0,3,2]}
 ];
 for(const face of FACE){
   assert.deepEqual(Array.from(face.v,v=>uv.corner(face.n,v)),face.expected,
     'face '+face.n.join(',')+' has rotated/flipped source pixels');
 }
 const html=read('index.html');
 assert.ok(html.includes('MineWorldFaceUV.corner(f.n,v)'));
 assert.ok(html.includes('sourceCorner=window.MineWorldFaceUV.corner(f.n,v)') &&
     html.includes('originalUV=window.MineWorldAtlas.uv(b,textureFace,sourceCorner,spanU,spanV,0,offsetV,sourceTile)') &&
     html.includes('MineWorldJavaFaceTransforms?.sample('));
 assert.ok(read('sw.js').includes("'./block-face-uv.js'"));
});
function fakeImporter(width=16,height=64){
 const uploads=[],draws=[];
 const window={
  MineWorldResourcePackContext:{gl:null,texture:{},baseURL:'data:image/png;base64,default'},
  MineWorldAtlas:{dataURL:'data:image/png;base64,default'},
  MineWorldBlockGuide:{names:Array(170).fill('stone')},
  MineWorldSound:{clearSamples(){}},MineWorldBridge:{refreshTextureUI(){}}
 };
 const gl={TEXTURE0:1,TEXTURE_2D:2,RGBA:3,UNSIGNED_BYTE:4,
  UNPACK_FLIP_Y_WEBGL:5,TEXTURE_MIN_FILTER:6,TEXTURE_MAG_FILTER:7,NEAREST:8,
  activeTexture(){},bindTexture(){},pixelStorei(){},texParameteri(){},texImage2D(){},
  texSubImage2D(...args){uploads.push(args)},isContextLost:()=>false};
 window.MineWorldResourcePackContext.gl=gl;
 class Canvas{
  constructor(){this.width=16;this.height=16;}
  getContext(){return {
   imageSmoothingEnabled:false,globalAlpha:1,clearRect(){},drawImage(...args){draws.push(args);},
   getImageData(_x,_y,w,h){return {data:new Uint8ClampedArray(w*h*4)};},putImageData(){}};
  }
  toDataURL(){return 'data:image/png;base64,fallback';}
 }
 class Image{constructor(){this.width=width;this.height=height;}set src(_){queueMicrotask(()=>this.onload?.())}}
 const context={window,document:{createElement:()=>new Canvas(),querySelector:()=>null},
  Image,URL:{createObjectURL:()=> 'blob:synthetic',revokeObjectURL(){}},Blob,
  Uint8Array,Uint8ClampedArray,TextDecoder,ArrayBuffer,DataView,
  Math,Number,JSON,console,performance:{now:()=>0},queueMicrotask};
 vm.runInNewContext(read('bedrock-flipbook.js'),context);
 vm.runInNewContext(read('resource-animation.js'),context);
 vm.runInNewContext(read('local-resource-pack.js'),context);
 return {pack:window.MineWorldLocalTextures,uploads,draws};
}
test('actual local imported Bedrock water flipbook animates three faces on GPU and resets',async()=>{
 const {pack,uploads,draws}=fakeImporter();
 const image=Buffer.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,16,0,0,0,16]);
 const file=(name,content)=>({name,size:content.length,arrayBuffer:async()=>Uint8Array.from(content).buffer});
 const fb=Buffer.from(JSON.stringify([{
  flipbook_texture:'textures/blocks/water_still_grey',atlas_tile:'still_water_grey',
  frames:[3,2,0,1],ticks_per_frame:2,blend_frames:false}]));
 const result=await pack.loadFiles([file('water_still_grey.png',image),
  file('flipbook_textures.json',fb)]);
 assert.equal(result.bedrockDefinitions,1);
 assert.equal(result.bedrockAnimatedFaces,3);
 assert.equal(result.animatedFaces,3);
 assert.ok(draws.some(v=>v.length===9&&v[2]===48),
  'frame index 3 must be painted on first import');
 assert.equal(pack.updateAnimation(0,60,false),3);
 assert.equal(pack.updateAnimation(100,60,false),3);
 assert.equal(uploads.length,6,'only changed block tiles uploaded');
 assert.equal(pack.hasImportedFace(7,0),true);
 await pack.clear();
 assert.equal(pack.updateAnimation(500,60,false),0);
});
test('Bedrock horizontal flipbook geometry keeps each native square frame',()=>{
 const {MineWorldBedrockFlipbooks:b,MineWorldResourceAnimation:a}=bootTimelines();
 const info=b.parse(JSON.stringify([{
  flipbook_texture:'textures/blocks/water_still_grey',
  frames:[3,1,0,2],ticks_per_frame:2,blend_frames:false
 }])).get('water_still_grey');
 const geometry=b.geometry({width:64,height:16},info);
 assert.equal(geometry.count,4);
 assert.equal(geometry.columns,4);
 assert.equal(geometry.rows,1);
 assert.equal(geometry.width,16);
 assert.equal(geometry.height,16);
 assert.equal(a.frameRect({width:64,height:16},3,geometry).x,48);
 assert.equal(a.frameRect({width:64,height:16},3,geometry).y,0);
 assert.equal(a.sampleAt(b.timeline(info,geometry.count),100).index,1);
 const malformed=b.geometry({width:48,height:32},info);
 assert.equal(malformed.count,1,'non-divisible sprites remain static, without cropping');
 assert.equal(malformed.width,48);
 assert.equal(malformed.height,32);
});

test('local Bedrock importer paints horizontal animation frames from correct x offsets',async()=>{
 const {pack,draws,uploads}=fakeImporter(64,16);
 const png=Buffer.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,16,0,0,0,16]);
 const file=(name,content)=>({name,size:content.length,arrayBuffer:async()=>Uint8Array.from(content).buffer});
 const meta=Buffer.from(JSON.stringify([{
  flipbook_texture:'textures/blocks/water_still_grey',
  frames:[3,1,0,2],ticks_per_frame:2,blend_frames:false
 }]));
 const result=await pack.loadFiles([file('water_still_grey.png',png),
  file('flipbook_textures.json',meta)]);
 assert.equal(result.bedrockAnimatedFaces,3);
 assert.ok(draws.some(args=>args.length===9&&args[1]===48&&args[2]===0
   &&args[3]===16&&args[4]===16),'initial frame 3 crops x=48, not the full strip');
 assert.equal(pack.updateAnimation(0,60,false),3);
 assert.equal(pack.updateAnimation(100,60,false),3);
 assert.ok(draws.some(args=>args.length===9&&args[1]===16&&args[2]===0),
   'next frame 1 crops x=16');
 assert.equal(uploads.length,6);
 await pack.clear();
});

test('Bedrock flipbook metadata is cached as optional resource and Java metadata remains supported',()=>{
 const src=read('local-resource-pack.js'),sw=read('sw.js'),html=read('index.html');
 assert.match(src,/keep\('bedrock:flipbook'/);
 assert.match(src,/zip\.get\('bedrock:flipbook'\)/);
 assert.match(src,/if\(!zip\.entries\.has\(key\)\)/);
 assert.ok(html.indexOf('src="./bedrock-flipbook.js"')<html.indexOf('src="./local-resource-pack.js"'));
 assert.ok(sw.includes("'./bedrock-flipbook.js'"));
 assert.ok(!src.includes('https://textures.minecraft.net'),'no texture file fetched');
 assert.ok(html.includes('mineworld-selfhost-v1'),'world-save format unchanged');
});
