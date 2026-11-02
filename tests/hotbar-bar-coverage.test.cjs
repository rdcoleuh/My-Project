'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const window={};vm.runInNewContext(read('hotbar-sprite-uv.js'),{window});
const uv=window.MineWorldHotbarUV;
function paintCell(rgba,width,height,index){
 const rect=uv.slotRect(width,height,index);
 assert.ok(rect,'valid slot '+index);
 rgba[(rect.y*width+rect.x)*4+3]=255; // actual slot edge, not the shared outer frame
}
test('bordered and seamless 1x, 2x, 4x bars need alpha in all nine cells',()=>{
 for(const [nativeWidth,nativeHeight] of [[182,22],[180,20]]){
  for(const scale of [1,2,4]){
   const width=nativeWidth*scale,height=nativeHeight*scale;
   const pixels=new Uint8ClampedArray(width*height*4);
   assert.equal(uv.hasCompleteBarAlpha(pixels,width,height),false);
   for(let i=0;i<9;i++)paintCell(pixels,width,height,i);
   assert.equal(uv.hasCompleteBarAlpha(pixels,width,height),true);
   const cell=uv.slotRect(width,height,4);
   pixels[(cell.y*width+cell.x)*4+3]=0;
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
 const blank=uv.slotRect(width,height,5);
 pixels[(blank.y*width+blank.x)*4+3]=0;
 assert.equal(uv.hasCompleteBarAlpha(pixels,width,height),false,
  'one blank interior still triggers procedural fallback');
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
 assert.ok(source.includes("visibleCandidate(attempt,candidateRect,kind==='hotbar'&&fill==='background')"));
 assert.ok(source.includes('candidate===legacyKey'));
 assert.ok(source.includes('sliced?window.MineWorldHotbarUV?.slotRect'));
 assert.match(read('sw.js'),/const VERSION='mineworld-[^']+';/,
  'the importer must remain cached under a versioned service worker');
});
