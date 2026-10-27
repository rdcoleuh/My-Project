'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','block-item-icons.js'),'utf8');
function preview(overrides={}){
  const seen=[];
  const window={
    MineWorldPixelMaterials:{paint:(id,face)=>{seen.push(['procedural',face]);return [face*30,10,20,255];}},
    ...overrides
  };
  const document={createElement:()=>({
    width:32,height:32,
    getContext:()=>({
      imageSmoothingEnabled:true,
      createImageData:(w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)}),
      putImageData(){},clearRect(){},
      getImageData:()=>({data:new Uint8ClampedArray(16*16*4)})
    })
  })};
  vm.runInNewContext(source,{window,document,Uint8ClampedArray,Math,Number,Array,Object});
  const canvas=document.createElement('canvas');
  assert.equal(window.MineWorldBlockItemIcons.paint(canvas,20),true);
  return {seen,canvas};
}
test('procedural hotbar previews use top, side, side (never bottom for east wall)',()=>{
  const {seen}=preview();
  const faces=[...new Set(seen.map(x=>x[1]))];
  assert.deepEqual(faces,[0,1]);
  assert.equal(seen.filter(x=>x[1]===0).length,256);
  assert.equal(seen.filter(x=>x[1]===1).length,512);
});
test('imported non-directional previews never use bottom tile on right wall',()=>{
  const faces=[];
  preview({
    MineWorldLocalTextures:{active:true,drawFace:(_ctx,_id,face)=>{faces.push(face);return true;}},
    MineWorldJavaDirectionalFaces:{tile:()=>null}
  });
  assert.deepEqual(faces,[0,1,1]);
});
test('imported directional model tiles override both wall faces independently',()=>{
  const tiles=[];
  const faceNormals=[];
  preview({
    MineWorldLocalTextures:{
      active:true,
      drawAtlasTile:(_ctx,tile)=>{tiles.push(tile);return true;},
      drawFace:()=>{throw Error('directional face should not use generic fallback');}
    },
    MineWorldJavaDirectionalFaces:{tile:(_id,normal)=>{
      faceNormals.push(normal.join(','));
      return normal[1]===1?80:normal[2]===-1?81:82;
    }}
  });
  assert.deepEqual(tiles,[80,81,82]);
  assert.deepEqual(faceNormals,['0,1,0','0,0,-1','1,0,0']);
});
