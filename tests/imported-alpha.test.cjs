/* Imported player-owned PNG alpha must not reveal procedural fallback colors.
 * Synthetic dimensions only; no copyrighted source bitmaps are distributed.
 */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
function boot(maxTexture=2048){
 const events=[],uploads=[],filters=[];
 const ctx={imageSmoothingEnabled:true,
  createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),
  putImageData(){events.push(['seed'])},
  clearRect(...a){events.push(['clear',...a])},
  drawImage(...a){events.push(['draw',...a])}
 };
 class Canvas{constructor(){this.width=0;this.height=0;}getContext(){return ctx;}}
 const gl={TEXTURE0:1,TEXTURE_2D:2,RGBA:3,UNSIGNED_BYTE:4,
  UNPACK_FLIP_Y_WEBGL:5,TEXTURE_WRAP_S:6,TEXTURE_WRAP_T:7,
  TEXTURE_MIN_FILTER:8,TEXTURE_MAG_FILTER:9,CLAMP_TO_EDGE:10,NEAREST:11,
  MAX_TEXTURE_SIZE:12,getParameter(){return maxTexture},
  createTexture:()=>({}),activeTexture(){},bindTexture(){},pixelStorei(){},
  texParameteri(...a){filters.push(a)},texImage2D(...a){uploads.push(a)}
 };
 const context={window:{},document:{createElement:()=>new Canvas()},
  Math,Uint8ClampedArray,Map,Set,Number,Object,Array};
 vm.runInNewContext(read('entity-texture-maps.js'),context);
 vm.runInNewContext(read('mob-pixel-art.js'),context);
 const api=context.window.MineWorldMobPixels;
 api.create(gl,{cow:{},pig:{}});
 return {api,events,uploads,filters,gl,ctx};
}
test('imported animal faces retain opaque fallback while item icons clear their slots',()=>{
 const x=boot();
 assert.equal(x.api.applyImported(new Map([
  ['cow',{width:64,height:32}],['item:diamond',{width:16,height:16}]
 ])),2);
 assert.equal(x.api.size,32);
 const operations=x.events.filter(e=>e[0]==='clear'||e[0]==='draw');
 assert.equal(operations.filter(e=>e[0]==='draw').length,19,
  '18 cow face crops plus one item image');
 assert.equal(operations.filter(e=>e[0]==='clear').length,1,
  'only the item slot is cleared; cow faces retain opaque grayscale fallback');
 assert.equal(operations[0][0],'clear','item padding must be cleared');
 assert.equal(operations[1][0],'draw');
 for(const e of operations.slice(2))assert.equal(e[0],'draw',
  'clearing a mapped animal face can make its body disappear');
 assert.ok(!operations.some(e=>e[0]==='clear'&&e[1]===32&&e[2]===0),
  'unimported pig retains its procedural fallback');
 assert.equal(x.ctx.imageSmoothingEnabled,false);
 assert.ok(x.filters.some(a=>a[1]===x.gl.TEXTURE_MIN_FILTER&&a[2]===x.gl.NEAREST));
 assert.ok(x.api.hasMapped('cow','head','front'));
});
test('mobile atlas limit preserves transparent item padding and resetting restores fallback',()=>{
 const x=boot(256);
 assert.equal(x.api.applyImported(new Map([['item:diamond',{width:32,height:16}]])),1);
 assert.equal(x.api.size,16,'HD atlas must not exceed GPU max texture size');
 const operations=x.events.filter(e=>e[0]==='clear'||e[0]==='draw');
 assert.equal(operations.length,2);
 assert.equal(operations[0][0],'clear');
 assert.equal(operations[1][0],'draw');
 assert.equal(operations[0][3],16);
 assert.equal(operations[1][8],16);
 assert.equal(operations[1][9],8,'non-square item remains proportional');
 assert.equal(operations[1][7],operations[0][2]+4,'letterboxed transparent padding');
 assert.equal(x.api.hasImported('item:diamond'),true);
 x.api.applyImported(new Map());
 assert.equal(x.api.hasImported('item:diamond'),false);
 assert.equal(x.api.importedCount,0);
 assert.equal(x.events.filter(e=>e[0]==='clear').length,1,
  'empty reset should restore generated pixels without clearing any fallback tiles');
 assert.equal(x.uploads.length,3,'create, import, and reset each upload an atlas');
});
