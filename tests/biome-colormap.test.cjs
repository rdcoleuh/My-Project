/* MineWorld local pack colormap tests: player-supplied Java PNG data, never bundled. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'..','local-resource-pack.js'),'utf8');
const sampler=src.match(/function samplePlainsColormap\(image\)[\s\S]*?(?=\nasync function readPackTints)/)?.[0];
if(!sampler)throw Error('Java colormap sampler missing');
function createSampler(pixel,enabled=true){
 const calls=[],ctx={
  imageSmoothingEnabled:true,
  drawImage(...args){calls.push(args)},
  ...(enabled?{getImageData:()=>({data:new Uint8ClampedArray(pixel)})}:{})
 };
 const canvas={width:0,height:0,getContext:()=>ctx};
 const env={document:{createElement:type=>{assert.equal(type,'canvas');return canvas}}};
 const fn=vm.runInNewContext(sampler+'\nsamplePlainsColormap',env);
 return {fn,calls,ctx,canvas};
}
test('Java plains colormap samples the correct source coordinate with nearest-neighbor',()=>{
 const {fn,calls,ctx}=createSampler([145,189,89,255]);
 assert.deepEqual(Array.from(fn({width:256,height:256})),[145,189,89]);
 assert.deepEqual(calls[0].slice(1),[50,173,1,1,0,0,1,1]);
 assert.equal(ctx.imageSmoothingEnabled,false);
});
test('undersized PNG, empty pixels and unsupported canvases gracefully use fallback',()=>{
 const data=createSampler([3,6,9,255]);
 assert.equal(data.fn({width:16,height:16}),null);
 assert.equal(data.fn(null),null);
 assert.equal(data.calls.length,0);
 const noPixelRead=createSampler([1,2,3,255],false);
 assert.equal(noPixelRead.fn({width:256,height:256}),null);
 const transparent=createSampler([0,0,0,0]);
 assert.equal(transparent.fn({width:256,height:256}),null);
});
test('resource importer recognizes both Java colormaps and local grass overlay',()=>{
 for(const marker of [
  "const mapColor=relative?.match(", "found.set('colormap:'+mapColor[1]",
  "'colormap:'+png[1]", "for(const key of ['grass','foliage'])",
  "const importedTints=await readPackTints(zip)",
  "state.tint=importedTints.palette", "get grassTint(){return [...state.tint.grass];}",
  "get foliageTint(){return [...state.tint.foliage];}", "sprite('grass_block_side_overlay')"
 ])assert.ok(src.includes(marker),'Missing importer wiring: '+marker);
});
