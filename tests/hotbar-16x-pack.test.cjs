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
