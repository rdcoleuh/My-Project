'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const window={};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','hotbar-sprite-uv.js'),'utf8'),{window});
const uv=window.MineWorldHotbarUV;
test('16x imported Java and seamless GUI sheets retain thin native-pixel outlines',()=>{
 for(const [width,height] of [[182*16,22*16],[180*16,20*16]]){
  const rgba=new Uint8ClampedArray(width*height*4);
  for(let i=0;i<9;i++){
   const r=uv.slotRect(width,height,i);
   assert.ok(r);
   for(let x=r.x;x<r.x+r.width;x++){
    rgba[(r.y*width+x)*4+3]=255;
    rgba[((r.y+r.height-1)*width+x)*4+3]=255;
   }
   for(let y=r.y;y<r.y+r.height;y++){
    rgba[(y*width+r.x)*4+3]=255;
    rgba[(y*width+r.x+r.width-1)*4+3]=255;
   }
  }
  assert.equal(uv.hasCompleteBarAlpha(rgba,width,height),true);
  const missing=uv.slotRect(width,height,4);
  for(let y=missing.y;y<missing.y+missing.height;y++)
   for(let x=missing.x;x<missing.x+missing.width;x++)
    rgba[(y*width+x)*4+3]=0;
  assert.equal(uv.hasCompleteBarAlpha(rgba,width,height),false);
 }
});
test('oversized RGBA sheets remain rejected to bound mobile scan work',()=>{
 const width=4096,height=1025;
 assert.equal(uv.hasCompleteBarAlpha(new Uint8ClampedArray(4),width,height),false);
});

test('disconnected alpha dashes cannot masquerade as thin HD slot borders',()=>{
 const width=182*8,height=22*8;
 const rgba=new Uint8ClampedArray(width*height*4);
 for(let i=0;i<9;i++){
  const r=uv.slotRect(width,height,i);
  // 80% coverage on each edge, but deliberately broken into short runs.
  for(let x=0;x<r.width;x++)if(x%5!==0){
   rgba[(r.y*width+r.x+x)*4+3]=255;
   rgba[((r.y+r.height-1)*width+r.x+x)*4+3]=255;
  }
  for(let y=0;y<r.height;y++)if(y%5!==0){
   rgba[((r.y+y)*width+r.x)*4+3]=255;
   rgba[((r.y+y)*width+r.x+r.width-1)*4+3]=255;
  }
 }
 assert.equal(uv.hasCompleteBarAlpha(rgba,width,height),false);
});

test('16x imported GUI sheets accept thin outlines inset by four source pixels',()=>{
 const width=182*16,height=22*16;
 const rgba=new Uint8ClampedArray(width*height*4);
 for(let i=0;i<9;i++){
  const r=uv.slotRect(width,height,i),inset=4;
  for(let x=r.x+inset;x<r.x+r.width-inset;x++){
   rgba[((r.y+inset)*width+x)*4+3]=255;
   rgba[((r.y+r.height-1-inset)*width+x)*4+3]=255;
  }
  for(let y=r.y+inset;y<r.y+r.height-inset;y++){
   rgba[(y*width+r.x+inset)*4+3]=255;
   rgba[(y*width+r.x+r.width-1-inset)*4+3]=255;
  }
 }
 assert.equal(uv.hasCompleteBarAlpha(rgba,width,height),true);
 // Missing one inset border must still reject the incomplete imported bar.
 const r=uv.slotRect(width,height,5);
 for(let x=r.x;x<r.x+r.width;x++)
  rgba[((r.y+4)*width+x)*4+3]=0;
 assert.equal(uv.hasCompleteBarAlpha(rgba,width,height),false);
});

test('opaque corner patches cannot suppress fallback for missing imported slots',()=>{
 const width=182*4,height=22*4;
 const rgba=new Uint8ClampedArray(width*height*4);
 for(let i=0;i<9;i++){
  const r=uv.slotRect(width,height,i);
  for(let y=r.y;y<r.y+r.height;y++)
   for(let x=r.x;x<r.x+r.width;x++)
    rgba[(y*width+x)*4+3]=255;
 }
 assert.equal(uv.hasCompleteBarAlpha(rgba,width,height),true);
 const r=uv.slotRect(width,height,3);
 for(let y=r.y;y<r.y+r.height;y++)
  for(let x=r.x;x<r.x+r.width;x++)
   rgba[(y*width+x)*4+3]=0;
 // More than 5% opaque pixels, but only in one corner of the slot.
 for(let y=r.y;y<r.y+Math.ceil(r.height*.3);y++)
  for(let x=r.x;x<r.x+Math.ceil(r.width*.3);x++)
   rgba[(y*width+x)*4+3]=255;
 assert.equal(uv.hasCompleteBarAlpha(rgba,width,height),false);
});

test('dense disconnected dashed borders do not bypass coherent-outline validation',()=>{
 const width=182*4,height=22*4,rgba=new Uint8ClampedArray(width*height*4);
 for(let i=0;i<9;i++){
  const r=uv.slotRect(width,height,i);
  // A two-pixel thick broken frame exceeds the former five-percent threshold.
  for(let x=0;x<r.width;x++)if(x%6!==0){
   for(const y of [r.y,r.y+1,r.y+r.height-2,r.y+r.height-1])
    rgba[(y*width+r.x+x)*4+3]=255;
  }
  for(let y=0;y<r.height;y++)if(y%6!==0){
   for(const x of [r.x,r.x+1,r.x+r.width-2,r.x+r.width-1])
    rgba[((r.y+y)*width+x)*4+3]=255;
  }
 }
 assert.equal(uv.hasCompleteBarAlpha(rgba,width,height),false);
});
