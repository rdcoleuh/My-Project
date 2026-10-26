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
 assert.deepEqual({...headBack},{x:20,y:6,width:8,height:8});
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
test('player-owned chicken skins map six separate rectangular UV nets',()=>{
 const m=maps(),img={width:64,height:32};
 const expected={
  head:{x:3,y:3,width:4,height:6},
  body:{x:6,y:15,width:6,height:8},
  wing:{x:30,y:19,width:1,height:4},
  beak:{x:16,y:2,width:4,height:2},
  comb:{x:16,y:6,width:2,height:2},
  leg:{x:29,y:3,width:3,height:5}
 };
 for(const [part,r] of Object.entries(expected)){
  assert.deepEqual({...m.rect('chicken',part,'front',img)},r,part);
  for(const face of m.faces)assert.ok(m.rect('chicken',part,face,img),part+' '+face);
  const hd=m.rect('chicken',part,'front',{width:128,height:64});
  assert.deepEqual({...hd},{x:r.x*2,y:r.y*2,width:r.width*2,height:r.height*2});
 }
 assert.equal(m.rect('chicken','wattle','front',img),null);
});
test('chicken animal cuboids expose mapped parts without exceeding geometry budget',()=>{
 const ctx={window:{},console};vm.createContext(ctx);
 vm.runInContext(read('animal-models.js'),ctx);
 const tags=new Set(),faces=new Set();
 const count=ctx.window.MineWorldAnimalModels.draw(
  {kind:'chicken',id:1,x:5,y:5,z:5,moving:false},
  (x,y,z,r,g,b,part,face)=>{tags.add(part);faces.add(face)});
 assert.ok(count>0&&count<70);
 for(const part of ['head','body','wing','beak','comb','leg','wattle','eye','tail'])
  assert.ok(tags.has(part),part+' not tagged');
 assert.equal(faces.size,6);
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
 art.create(gl,{cow:{},zombie:{},horse:{},chicken:{},sheep:{}});
 art.applyImported(new Map([['chicken',{width:64,height:32}],['cow',{width:64,height:32}],['sheep',{width:64,height:32}],
  ['item:diamond',{width:16,height:16}]]));
 assert.ok(art.hasMapped('chicken','wing','left'));
 assert.ok(art.hasMapped('chicken','beak','front'));
 assert.equal(art.hasMapped('chicken','eye','front'),false);
 assert.equal(art.hasMappedKind('chicken'),true);
 assert.equal(art.hasMappedKind('cow'),true);
 assert.equal(art.hasMappedKind('horse'),false);
 // 18 cow, 36 chicken and 18 sheep face crops + one item icon.
 assert.equal(draws.length,73);
 assert.ok(art.hasMapped('sheep','body','front'));
 assert.equal(art.hasMapped('sheep','body','front',{sheared:true}),false);
 assert.ok(art.hasMapped('sheep','head','front',{sheared:true}));
 assert.ok(art.hasMapped('sheep','leg','left',{sheared:true}));
 assert.equal(art.hasMapped('cow','eye','front'),false);
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
 assert.equal(art.hasMappedKind('chicken'),false);
});
test('actual animal and hostile renderers send face/part identity and preserve procedural fallback',()=>{
 const animals=read('animal-models.js'),html=read('index.html'),sw=read('sw.js');
 assert.ok(animals.includes('part,faceNames[f],k'));
 assert.ok(animals.includes("color,'leg'"));
 assert.ok(animals.includes("face,'head'"));
 assert.ok(html.includes('MineWorldMobPixels.hasMapped(m.kind,part,face,m)'));
 assert.ok(read('mob-pixel-art.js').includes("kind==='sheep'&&part==='body'&&appearance?.sheared"));
 assert.ok(html.includes('!window.MineWorldMobPixels.hasMappedKind(m.kind)'));
 assert.ok(read('mob-pixel-art.js').includes('if(mappedKinds.has(key)){imported.add(key);continue;}'));
 assert.ok(html.includes("MineWorldEntityTextureMaps.vertexCorner(face,corner,'animal')"));
 assert.ok(html.includes('MineWorldMobPixels.hasMapped(mobKind,part,dir)'));
 assert.ok(html.includes("type.body,'leg'"),'creeper has separately mapped feet');
 assert.ok(sw.includes("'./entity-texture-maps.js'"));
 assert.ok(html.includes('mineworld-selfhost-v1'));
});
test('imported UV faces retain upright top-left and bottom-left corners',()=>{
 const m=maps();
 // MineWorld's hostile cube starts each vertical face at its bottom edge.
 assert.equal(m.vertexCorner('front',0),1);
 assert.equal(m.vertexCorner('front',1),0);
 assert.equal(m.vertexCorner('front',2),3);
 // Rotating animal cuboids use a different vertex ordering.
 assert.equal(m.vertexCorner('front',0,'animal'),1);
 assert.equal(m.vertexCorner('front',3,'animal'),0);
 assert.equal(m.vertexCorner('top',0,'animal'),0);
 assert.equal(m.vertexCorner('top',1,'animal'),3);
 assert.equal(m.vertexCorner('back',0,'animal'),2);
 const html=read('index.html');
 assert.ok(html.includes('MineWorldEntityTextureMaps.vertexCorner(dir,i)'));
 assert.ok(html.includes("MineWorldEntityTextureMaps.vertexCorner(face,corner,'animal')"));
});
