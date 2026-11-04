'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const window={};vm.runInNewContext(read('hotbar-sprite-uv.js'),{window});
const uv=window.MineWorldHotbarUV;
function paintCell(rgba,width,height,index,filled=true){
 const rect=uv.slotRect(width,height,index);
 assert.ok(rect,'valid slot '+index);
 const thickness=rect.width/20;
 for(let y=rect.y;y<rect.y+rect.height;y++)
  for(let x=rect.x;x<rect.x+rect.width;x++){
   const edge=x<rect.x+thickness||x>=rect.x+rect.width-thickness||
     y<rect.y+thickness||y>=rect.y+rect.height-thickness;
   rgba[(y*width+x)*4+3]=filled&&edge?255:0;
  }
}
test('bordered and seamless 1x, 2x, 4x bars need alpha in all nine cells',()=>{
 for(const [nativeWidth,nativeHeight] of [[182,22],[180,20]]){
  for(const scale of [1,2,4]){
   const width=nativeWidth*scale,height=nativeHeight*scale;
   const pixels=new Uint8ClampedArray(width*height*4);
   assert.equal(uv.hasCompleteBarAlpha(pixels,width,height),false);
   for(let i=0;i<9;i++)paintCell(pixels,width,height,i);
   assert.equal(uv.hasCompleteBarAlpha(pixels,width,height),true);
   paintCell(pixels,width,height,4,false);
   assert.equal(uv.hasCompleteBarAlpha(pixels,width,height),false);
  }
 }
});
test('a shared outer Java border cannot impersonate nine painted slots',()=>{
 const width=182,height=22,pixels=new Uint8ClampedArray(width*height*4);
 for(let x=0;x<width;x++){
  pixels[x*4+3]=255;
  pixels[((height-1)*width+x)*4+3]=255;
 }
 assert.equal(uv.hasVisibleAlpha(pixels),true);
 assert.equal(uv.hasCompleteBarAlpha(pixels,width,height),false,
  'top and bottom frame alone leave every slot interior transparent');
 for(let i=0;i<9;i++)paintCell(pixels,width,height,i);
 assert.equal(uv.hasCompleteBarAlpha(pixels,width,height),true,
  'a thin independent outline in every slot is valid');
 paintCell(pixels,width,height,5,false);
 assert.equal(uv.hasCompleteBarAlpha(pixels,width,height),false,
  'one blank interior still triggers procedural fallback');
});
test('sparse pixels fail while original outlined slots pass at native and HD scales',()=>{
 for(const [w,h] of [[182,22],[180,20],[364,44],[360,40],[728,88]]){
  const pixels=new Uint8ClampedArray(w*h*4);
  for(let i=0;i<9;i++){
   const r=uv.slotRect(w,h,i);
   pixels[(r.y*w+r.x)*4+3]=255;
  }
  assert.equal(uv.hasCompleteBarAlpha(pixels,w,h),false);
  for(let i=0;i<9;i++)paintCell(pixels,w,h,i);
  assert.equal(uv.hasCompleteBarAlpha(pixels,w,h),true);
 }
});
test('every slot needs coherent artwork even when its alpha exceeds five percent',()=>{
 const w=180,h=20,pixels=new Uint8ClampedArray(w*h*4);
 for(let i=0;i<9;i++)paintCell(pixels,w,h,i);
 paintCell(pixels,w,h,8,false);
 const r=uv.slotRect(w,h,8);
 // A single top row reaches five percent, but is not a complete slot.
 for(let n=0;n<r.width;n++)pixels[(r.y*w+r.x+n)*4+3]=255;
 assert.equal(uv.hasCompleteBarAlpha(pixels,w,h),false);
 // A complete outline restores this slot without changing the other eight.
 paintCell(pixels,w,h,8);
 assert.equal(uv.hasCompleteBarAlpha(pixels,w,h),true);
 // One missing slot must still invalidate the imported background.
 paintCell(pixels,w,h,2,false);
 assert.equal(uv.hasCompleteBarAlpha(pixels,w,h),false);
});
test('opaque unrelated atlas pixels do not disguise blank cells',()=>{
 const width=182,height=22,pixels=new Uint8ClampedArray(width*height*4);
 pixels[3]=255; // outside all slot interiors
 paintCell(pixels,width,height,0);
 assert.equal(uv.hasVisibleAlpha(pixels),true);
 assert.equal(uv.hasCompleteBarAlpha(pixels,width,height),false);
 for(let i=1;i<9;i++)paintCell(pixels,width,height,i);
 assert.equal(uv.hasCompleteBarAlpha(pixels,width,height),true);
});
test('malformed dimensions and RGBA buffers fail closed',()=>{
 const pixels=new Uint8ClampedArray(182*22*4);
 for(const [w,h,rgba] of [[182,22,null],[182,22,[]],[182,22,pixels.subarray(0,100)],
   [180,22,pixels],[182.5,22,pixels],[4096,4096,pixels],[0,0,pixels]]){
  assert.equal(uv.hasCompleteBarAlpha(rgba,w,h),false);
 }
});
test('importer checks full sheet only for background, keeping numbered slot fallbacks',()=>{
 const source=read('local-resource-pack.js');
 assert.ok(source.includes('hasCompleteBarAlpha(pixels,width,height)'));
 assert.ok(source.includes('if((sliced||legacy&&numberedSlot)&&'),
  'derived numbered slots must validate their entire imported sheet');
 assert.ok(source.includes("visibleCandidate(attempt,candidateRect,kind==='hotbar'&&fill==='background')"));
 assert.ok(source.includes('candidate===legacyKey'));
 assert.ok(source.includes('sliced?window.MineWorldHotbarUV?.slotRect'));
 assert.match(read('sw.js'),/const VERSION='mineworld-[^']+';/,
  'the importer must remain cached under a versioned service worker');
});

// A thin ONE-pixel native outline must remain valid at 4x/8x; requiring
// five-percent fill rejects otherwise complete player-owned HD GUI artwork.
test('single-source-pixel HD slot outlines are accepted without smoothing',()=>{
 for(const [width,height] of [[728,88],[720,80],[1456,176],[1440,160]]){
  const pixels=new Uint8ClampedArray(width*height*4);
  for(let i=0;i<9;i++){
   const r=uv.slotRect(width,height,i);
   for(let x=r.x;x<r.x+r.width;x++){
    pixels[(r.y*width+x)*4+3]=255;
    pixels[((r.y+r.height-1)*width+x)*4+3]=255;
   }
   for(let y=r.y;y<r.y+r.height;y++){
    pixels[(y*width+r.x)*4+3]=255;
    pixels[(y*width+r.x+r.width-1)*4+3]=255;
   }
  }
  assert.equal(uv.hasCompleteBarAlpha(pixels,width,height),true);
  const blank=uv.slotRect(width,height,5);
  for(let y=blank.y;y<blank.y+blank.height;y++)
   for(let x=blank.x;x<blank.x+blank.width;x++)
    pixels[(y*width+x)*4+3]=0;
  assert.equal(uv.hasCompleteBarAlpha(pixels,width,height),false,
   'one missing slot must restore the procedural bar');
 }
});
test('HD scattered pixels cannot impersonate complete outlined slots',()=>{
 const width=720,height=80,pixels=new Uint8ClampedArray(width*height*4);
 for(let i=0;i<9;i++){
  const r=uv.slotRect(width,height,i);
  // Four corners and a handful of stray pixels do not make an outline.
  for(const [x,y] of [[r.x,r.y],[r.x+r.width-1,r.y],
    [r.x,r.y+r.height-1],[r.x+r.width-1,r.y+r.height-1],
    [r.x+10,r.y+10],[r.x+20,r.y+20]])
   pixels[(y*width+x)*4+3]=255;
 }
 assert.equal(uv.hasCompleteBarAlpha(pixels,width,height),false);
});
