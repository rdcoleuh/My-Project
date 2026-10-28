const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const window={};vm.runInNewContext(read('hotbar-sprite-uv.js'),{window});
const uv=window.MineWorldHotbarUV;
test('Java hotbar sheet yields nine crisp non-overlapping slot interiors at 1x, 2x and 4x',()=>{
 for(const scale of [1,2,4]){
  const rects=Array.from({length:9},(_,i)=>uv.slotRect(182*scale,22*scale,i));
  for(let i=0;i<9;i++){
   const r=rects[i];
   assert.deepEqual({...r},{x:(1+20*i)*scale,y:scale,width:20*scale,height:20*scale});
   if(i)assert.equal(r.x-(rects[i-1].x+rects[i-1].width),0);
  }
 }
});
test('seamless 180x20 nine-cell sheets preserve exact pixel edges at 1x, 2x and 4x',()=>{
 for(const scale of [1,2,4]){
  const rects=Array.from({length:9},(_,i)=>uv.slotRect(180*scale,20*scale,i));
  for(let i=0;i<9;i++){
   const r=rects[i];
   assert.deepEqual({...r},{x:20*i*scale,y:0,width:20*scale,height:20*scale});
   if(i)assert.equal(r.x,rects[i-1].x+rects[i-1].width);
  }
 }
});
test('rejects malformed sprite dimensions and non-bar Bedrock slot images',()=>{
 for(const dims of [[20,20],[180,22],[182,16],[0,0],[182.5,22],[364,40]]){
  assert.equal(uv.slotRect(...dims,0),null,JSON.stringify(dims));
 }
 for(const index of [-1,9,1.5,NaN])assert.equal(uv.slotRect(182,22,index),null);
});
test('resource importer slices a player-owned hotbar image and keeps fallback for incompatible sheets',()=>{
 const source=read('local-resource-pack.js'),html=read('index.html'),sw=read('sw.js');
 assert.ok(read('hotbar-sprite-uv.js').includes("entries.has('hud:hotbar:background')"));
 assert.ok(source.includes('window.MineWorldHotbarUV?.slotRect'));
 assert.ok(source.includes('ctx.drawImage(image,rect.x,rect.y,rect.width,rect.height'));
 assert.ok(html.includes('mw-pack-bar-image'));
 assert.ok(html.includes('mw-pack-hotbar-slots'));
 assert.ok(html.includes('src="./hotbar-sprite-uv.js"'));
 assert.ok(sw.includes("'./hotbar-sprite-uv.js'"));
 assert.ok(html.includes('hotbarIconRequestCurrent(localPack,packGeneration,swatch)'));
});

test('generic slot artwork overrides slicing of the same imported bar sheet',()=>{
 const entries=new Map([
  ['hud:hotbar:background',true],['hud:hotbar:slot',true],
  ['hud:hotbar:slot0',true]
 ]);
 for(let i=0;i<9;i++)assert.equal(uv.shouldDeriveSlot(entries,'slot'+i),false);
 entries.delete('hud:hotbar:slot');
 assert.equal(uv.shouldDeriveSlot(entries,'slot0'),false);
 for(let i=1;i<9;i++)assert.equal(uv.shouldDeriveSlot(entries,'slot'+i),true);
 assert.equal(uv.shouldDeriveSlot(entries,'selected'),false);
 assert.equal(uv.shouldDeriveSlot(null,'slot1'),false);
 entries.delete('hud:hotbar:background');
 assert.equal(uv.shouldDeriveSlot(entries,'slot1'),false);
});
test('single imported slot and selection images must be approximately square',()=>{
 for(const dims of [[20,20],[24,24],[22,24],[64,64],[128,128],[256,256]])
  assert.equal(uv.validSlotSprite(...dims),true,JSON.stringify(dims));
 for(const dims of [[182,22],[180,20],[20,40],[0,0],[1025,1025],[NaN,20],[20.5,20]])
  assert.equal(uv.validSlotSprite(...dims),false,JSON.stringify(dims));
});
test('importer applies explicit-slot precedence and malformed GUI strip fallback',()=>{
 const source=read('local-resource-pack.js');
 assert.ok(source.includes('shouldDeriveSlot(source.entries,fill)'));
 assert.ok(source.includes('validSlotSprite(image.width,image.height)'));
});

test('imported survival icons reject stretched GUI strips but accept pixel-scaled square sprites',()=>{
 for(const dims of [[9,9],[18,18],[16,16],[32,32],[9,10],[128,128]])
  assert.equal(uv.validStatSprite(...dims),true,JSON.stringify(dims));
 for(const dims of [[182,22],[180,20],[9,20],[0,0],[1025,1025],[NaN,9],[9.5,9]])
  assert.equal(uv.validStatSprite(...dims),false,JSON.stringify(dims));
 const source=read('local-resource-pack.js');
 assert.ok(source.includes('validStatSprite(image.width,image.height)'));
 assert.ok(source.includes('validStatSprite(underlay.width,underlay.height)'));
 assert.ok(source.includes("image=await smallSpriteFromPng(await source.get('hud:legacy-icons'),4*1024*1024)"));
});

test('legacy fallback for a missing half glyph must use the atlas crop, not a half of the atlas',()=>{
 const source=read('local-resource-pack.js');
 assert.ok(source.includes("if(derivedHalf&&!legacyStat){"));
 assert.ok(source.includes("if(derivedHalf&&!legacyStat&&image.width<2)return null;"));
 const smoke=read('scripts/browser-smoke.cjs');
 assert.ok(smoke.includes("makeTestArchive('malformed-stat-sprites')"));
 assert.ok(smoke.includes("pack.hudIcon('heart',fill),pack.hudIcon('food',fill)"));
});

test('fully transparent player-imported HUD placeholders retain procedural fallback',()=>{
 const rgba=new Uint8ClampedArray([255,10,20,0,0,0,0,0]);
 assert.equal(uv.hasVisibleAlpha(rgba),false,'transparent RGB values do not count');
 assert.equal(uv.hasVisibleAlpha(new Uint8ClampedArray([0,0,0,1])),true);
 assert.equal(uv.hasVisibleAlpha(new Uint8ClampedArray([0,0,0,255])),true);
 for(const invalid of [null,[],new Uint8ClampedArray(0),new Uint8ClampedArray(3)])
  assert.equal(uv.hasVisibleAlpha(invalid),false);
 const importer=read('local-resource-pack.js'),smoke=read('scripts/browser-smoke.cjs');
 assert.ok(importer.includes('ctx.getImageData(0,0,canvas.width,canvas.height).data'));
 assert.ok(importer.includes("ctx.globalCompositeOperation='destination-over'"));
 assert.ok(smoke.includes("makeTestArchive('transparent-hud')"));
});
test('fractionally scaled nine-cell strips are rejected instead of resampled into blurry slots',()=>{
 for(const [w,h] of [[91,11],[273,33],[90,10],[270,30],[455,55],[450,50]]){
  for(let i=0;i<9;i++)assert.equal(uv.slotRect(w,h,i),null,
   'fractional source '+w+'x'+h+' must not be cropped');
 }
 for(const [w,h] of [[182*3,22*3],[180*3,20*3]]){
  const rect=uv.slotRect(w,h,8);
  assert.equal(rect.width,60);
  assert.equal(rect.height,60);
 }
});
