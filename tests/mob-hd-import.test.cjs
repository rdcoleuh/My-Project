/* Synthetic HD import regressions: no original Minecraft artwork is bundled. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
function boot(maxTexture=2048){
 const uploads=[],draws=[],params=[];
 const canvas={width:0,height:0};
 const ctx={imageSmoothingEnabled:true,
  createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),
  putImageData(){},
  drawImage(...args){draws.push({args,smoothing:ctx.imageSmoothingEnabled});}};
 canvas.getContext=()=>ctx;
 const gl={TEXTURE0:1,TEXTURE_2D:2,RGBA:3,UNSIGNED_BYTE:4,UNPACK_FLIP_Y_WEBGL:5,
  TEXTURE_WRAP_S:6,TEXTURE_WRAP_T:7,TEXTURE_MIN_FILTER:8,TEXTURE_MAG_FILTER:9,
  CLAMP_TO_EDGE:10,NEAREST:11,MAX_TEXTURE_SIZE:12,
  getParameter:()=>maxTexture,createTexture:()=>({}),
  activeTexture(){},bindTexture(){},pixelStorei(){},
  texParameteri(...args){params.push(args);},
  texImage2D(...args){uploads.push({width:args[5].width,height:args[5].height});}};
 const context={window:{},document:{createElement:()=>canvas},Map,Set,Math,Object,Number,Uint8ClampedArray};
 vm.runInNewContext(read('entity-texture-maps.js'),context);
 vm.runInNewContext(read('mob-pixel-art.js'),context);
 const art=context.window.MineWorldMobPixels;
 art.create(gl,{cow:{},zombie:{}});
 return {art,canvas,draws,uploads,params,gl};
}
test('256px player-owned skins retain native 32px face crops in bounded sharp atlas',()=>{
 const x=boot();
 const imported=x.art.applyImported(new Map([
  ['cow',{width:256,height:128}],['item:diamond',{width:32,height:32}]]));
 assert.equal(imported,2);
 assert.equal(x.art.size,32);
 assert.equal(x.canvas.width,512);
 assert.ok(x.canvas.height<=2048);
 assert.ok(x.canvas.width*x.canvas.height*4<=4*1024*1024);
 assert.ok(x.draws.some(d=>d.args[1]===24&&d.args[2]===24&&
   d.args[3]===32&&d.args[4]===32&&d.args[7]===32&&d.args[8]===32),
   'high-density cow head should preserve its 32x32 face pixels');
 assert.ok(x.draws.every(d=>d.smoothing===false));
 assert.ok(x.params.some(a=>a[1]===x.gl.TEXTURE_MIN_FILTER&&a[2]===x.gl.NEAREST));
 assert.ok(x.params.some(a=>a[1]===x.gl.TEXTURE_MAG_FILTER&&a[2]===x.gl.NEAREST));
 const a=x.art.uv('cow',0,'head','front'),b=x.art.uv('cow',3,'head','front');
 assert.ok(Math.abs(b[0]-a[0]-31/512)<1e-10,'UV covers 32 native texels, inset half pixel');
 x.art.applyImported(new Map());
 assert.equal(x.art.size,16,'clearing a pack restores 16px procedural fallback');
 assert.equal(x.canvas.width,256);
 assert.equal(x.art.importedCount,0);
});
test('16px items stay compact, while wider classic mob body crops retain detail',()=>{
 const x=boot();
 x.art.applyImported(new Map([['item:apple',{width:16,height:16}]]));
 assert.equal(x.art.size,16);
 assert.equal(x.canvas.width,256);
 const y=boot();
 y.art.applyImported(new Map([['cow',{width:64,height:32}]]));
 assert.equal(y.art.size,32,'some classic mob body faces are wider than 16 source pixels');
 assert.ok(y.draws.some(d=>d.args[1]===28&&d.args[2]===14&&
   d.args[3]===12&&d.args[4]===18),
   'mapped cow body retains full 12x18 source crop without an extra generic head copy');
});
test('non-square HD world item keeps its aspect ratio and centered transparent margins',()=>{
 const x=boot();
 x.art.applyImported(new Map([['item:arrow',{width:32,height:16}]]));
 assert.equal(x.art.size,32);
 const d=x.draws.find(d=>d.args[0].width===32&&d.args[0].height===16);
 assert.ok(d);
 assert.deepEqual(d.args.slice(-2),[32,16]);
 assert.equal(d.args[6],8,'32x16 source is vertically centered in a 32px atlas tile');
 assert.equal(d.smoothing,false);
});
test('mobile MAX_TEXTURE_SIZE forces 16px tiles rather than uploading oversized HD atlas',()=>{
 const x=boot(256);
 x.art.applyImported(new Map([['cow',{width:256,height:128}],['item:diamond',{width:32,height:32}]]));
 assert.equal(x.art.size,16);
 assert.equal(x.canvas.width,256);
 assert.ok(x.canvas.height<=256);
 assert.ok(x.uploads.at(-1).width<=256&&x.uploads.at(-1).height<=256);
});
test('world saves remain untouched by local HD mob rendering',()=>{
 const source=read('mob-pixel-art.js');
 assert.doesNotMatch(source,/localStorage|indexedDB|fetch\(/);
 assert.match(source,/MAX_TEXTURE_SIZE/);
 assert.match(source,/imageSmoothingEnabled=false/);
});
