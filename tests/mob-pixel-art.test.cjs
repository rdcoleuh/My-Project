/* Independent sharp 16px mob atlas: all original and expanded species. */
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ctx={window:{},console};vm.createContext(ctx);
vm.runInContext(read('mob-pixel-art.js'),ctx);
const art=ctx.window.MineWorldMobPixels;
test('all mob species get deterministic 16x16 pixel tiles with range-safe grayscale',()=>{
 assert.equal(art.size,16);
 assert.equal(art.shade('cow',6,6),art.shade('cow',6,6));
 assert.ok(new Set(Array.from({length:256},(_,i)=>art.shade('cow',i%16,Math.floor(i/16)))).size>=6);
 for(const kind of ['cow','zombie','bee','warden','copper_golem']){
   for(let y=0;y<16;y++)for(let x=0;x<16;x++){
     const tone=art.shade(kind,x,y);
     assert.ok(Number.isInteger(tone)&&tone>=150&&tone<=255);
   }
 }
});
test('shader atlas uploads nearest-neighbor RGBA tiles for all species',()=>{
 const calls=[],pixels=[];
 const gl={TEXTURE0:1,TEXTURE_2D:2,RGBA:3,UNSIGNED_BYTE:4,UNPACK_FLIP_Y_WEBGL:5,
   TEXTURE_WRAP_S:6,TEXTURE_WRAP_T:7,TEXTURE_MIN_FILTER:8,TEXTURE_MAG_FILTER:9,
   CLAMP_TO_EDGE:10,NEAREST:11,createTexture:()=>({}),
   activeTexture(){},bindTexture(){},pixelStorei(){},
   texImage2D(...args){calls.push(['upload',args[5].width,args[5].height])},
   texParameteri(...args){calls.push(args)}};
 const canvas={width:0,height:0,getContext:()=>({
   createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),
   putImageData:v=>pixels.push(v)
 })};
 ctx.document={createElement:()=>canvas};ctx.window.document=ctx.document;
 const species=Object.fromEntries(Array.from({length:90},(_,i)=>['mob_'+i,{}]));
 assert.ok(art.create(gl,species));
 assert.equal(art.count,91);
 assert.equal(calls.find(c=>c[0]==='upload')[1],256);
 assert.equal(calls.find(c=>c[0]==='upload')[2],96);
 assert.ok(calls.some(c=>c[1]===gl.TEXTURE_MIN_FILTER&&c[2]===gl.NEAREST));
 assert.ok(calls.some(c=>c[1]===gl.TEXTURE_MAG_FILTER&&c[2]===gl.NEAREST));
 assert.equal(pixels[0].data.length,256*96*4);
 assert.notDeepEqual([...art.uv('mob_0',0)],[...art.uv('mob_1',0)]);
 assert.ok(art.uv('mob_55',3).every(x=>x>=0&&x<=1));
});
test('real renderer uses mob pixels for original animals, newer monsters and generic cuboids',()=>{
 const html=read('index.html'),sw=read('sw.js');
 assert.ok(html.includes('src="./mob-pixel-art.js"'));
 assert.ok(sw.includes("'./mob-pixel-art.js'"));
 assert.ok(html.includes('MineWorldMobPixels?.create(gl,SPECIES)'));
 assert.ok(html.includes('MineWorldMobPixels.uv(mobKind,i)'));
 assert.ok(html.includes('MineWorldMobPixels.uv(m.kind,order[index++%6])'));
 assert.ok(html.includes('gl.bindTexture(gl.TEXTURE_2D,atlasTexture);'));
 assert.ok(html.includes('gl.drawArrays(gl.TRIANGLES,0,a.length/8)'));
 assert.ok(html.includes('mineworld-selfhost-v1'));
});