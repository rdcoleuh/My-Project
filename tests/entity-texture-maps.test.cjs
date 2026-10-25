/* No proprietary skins: tests use synthetic dimensions and colorable canvas mocks. */
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
function maps(){
 const context={window:{},Number,Object,Math,Array};
 vm.runInNewContext(read('entity-texture-maps.js'),context,{filename:'entity-texture-maps.js'});
 return context.window.MineWorldEntityTextureMaps;
}
test('six face layouts use different real head/body/leg PNG rectangles',()=>{
 const m=maps(),img={width:64,height:32};
 assert.ok(Object.keys(m.defs).length>=6);
 const headFront=m.rect('cow','head','front',img);
 const headTop=m.rect('cow','head','top',img);
 const headBack=m.rect('cow','head','back',img);
 const bodyFront=m.rect('cow','body','front',img);
 const legFront=m.rect('cow','leg','front',img);
 assert.deepEqual({...headFront},{x:6,y:6,width:8,height:8});
 assert.deepEqual({...headTop},{x:6,y:0,width:8,height:6});
 assert.deepEqual({...headBack},{x:28,y:6,width:8,height:8});
 assert.ok(bodyFront.x!==headFront.x||bodyFront.y!==headFront.y);
 assert.ok(legFront.y!==headFront.y);
 for(const kind of ['cow','pig','sheep','creeper','zombie','skeleton']){
  for(const part of Object.keys(m.defs[kind])){
   for(const face of m.faces){
    const r=m.rect(kind,part,face,img);
    assert.ok(r,kind+' '+part+' '+face);
    assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=64&&r.y+r.height<=32);
   }
  }
 }
});
test('face UVs scale with imported texture resolution and reject unsupported images',()=>{
 const m=maps();
 const normal=m.rect('zombie','head','front',{width:64,height:64});
 const scaled=m.rect('zombie','head','front',{width:128,height:128});
 assert.equal(scaled.x,normal.x*2);assert.equal(scaled.y,normal.y*2);
 assert.equal(scaled.width,normal.width*2);assert.equal(scaled.height,normal.height*2);
 assert.equal(m.rect('horse','head','front',{width:64,height:64}),null);
 assert.equal(m.rect('cow','head','front',{width:32,height:10}),null);
 assert.equal(m.rect('cow','ear','front',{width:64,height:32}),null);
 assert.equal(m.rect('cow','head','front',{width:0,height:32}),null);
});
test('imported species use mapped cuboid faces with nearest-neighbor sampling and atlas restore',()=>{
 const draws=[],uploads=[],textures=[];
 class Canvas{
  constructor(){this.width=0;this.height=0;}
  getContext(){return {
   imageSmoothingEnabled:false,
   createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),
   putImageData(){},
   drawImage(...args){draws.push(args)}
  }}
 }
 const gl={TEXTURE0:1,TEXTURE_2D:2,RGBA:3,UNSIGNED_BYTE:4,
  UNPACK_FLIP_Y_WEBGL:5,TEXTURE_WRAP_S:6,TEXTURE_WRAP_T:7,
  TEXTURE_MIN_FILTER:8,TEXTURE_MAG_FILTER:9,CLAMP_TO_EDGE:10,NEAREST:11,
  createTexture:()=>({}),activeTexture(){},bindTexture(){},
  pixelStorei(){},texParameteri(...args){textures.push(args)},
  texImage2D(...args){uploads.push(args)}};
 const context={window:{},document:{createElement:()=>new Canvas()},
  Math,Uint8ClampedArray,Map,Set,Number,Object,Array};
 vm.runInNewContext(read('entity-texture-maps.js'),context);
 vm.runInNewContext(read('mob-pixel-art.js'),context);
 const art=context.window.MineWorldMobPixels;
 art.create(gl,{cow:{},zombie:{},horse:{}});
 art.applyImported(new Map([['cow',{width:64,height:32}],
  ['item:diamond',{width:16,height:16}]]));
 assert.ok(art.hasMapped('cow','head','front'));
 assert.ok(art.hasMapped('cow','body','back'));
 assert.ok(art.hasMapped('cow','leg','left'));
 assert.equal(art.hasMapped('horse','head','front'),false);
 assert.equal(art.hasMapped('item:diamond','head','front'),false);
 assert.notDeepEqual([...art.uv('cow',0,'head','front')],[...art.uv('cow',0,'body','front')]);
 assert.notDeepEqual([...art.uv('cow',0,'head','front')],[...art.uv('cow',0,'head','back')]);
 assert.ok(draws.some(a=>a[1]===6&&a[2]===6&&a[3]===8&&a[4]===8),
  'cow head front is sampled as a distinct 8x8 region');
 assert.ok(textures.some(a=>a[1]===gl.TEXTURE_MIN_FILTER&&a[2]===gl.NEAREST));
 assert.ok(uploads.length>=2);
 art.applyImported(new Map());
 assert.equal(art.hasMapped('cow','head','front'),false);
 assert.equal(art.importedCount,0);
});
test('actual animal and hostile renderers send face/part identity and preserve procedural fallback',()=>{
 const animals=read('animal-models.js'),html=read('index.html'),sw=read('sw.js');
 assert.ok(animals.includes('part,faceNames[f],k'));
 assert.ok(animals.includes("color,'leg'"));
 assert.ok(animals.includes("face,'head'"));
 assert.ok(html.includes('MineWorldMobPixels.hasMapped(m.kind,part,face)'));
 assert.ok(html.includes('MineWorldMobPixels.uv(m.kind,corner,part,face)'));
 assert.ok(html.includes('MineWorldMobPixels.hasMapped(mobKind,part,dir)'));
 assert.ok(html.includes("type.body,'leg'"),'creeper has separately mapped feet');
 assert.ok(sw.includes("'./entity-texture-maps.js'"));
 assert.ok(html.includes('mineworld-selfhost-v1'));
});