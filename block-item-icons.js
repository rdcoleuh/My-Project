/* MineWorld original isometric 3-face block item thumbnail renderer.
 * Reads only the texture tiles already loaded by the player or our original
 * procedural 16x16 fallback. No Minecraft bitmaps or external requests.
 */
(()=>{
'use strict';
const clamp=v=>Math.max(0,Math.min(255,Math.round(v)));
function paint(canvas,blockId){
 if(!canvas||typeof canvas.getContext!=='function'||!Number.isInteger(blockId)||blockId<1||blockId>169)return false;
 const out=canvas.getContext('2d',{alpha:true});
 if(!out||typeof out.createImageData!=='function'||typeof out.putImageData!=='function')return false;
 const tiles=[];
 for(let face=0;face<3;face++){
  const tmp=document.createElement('canvas');tmp.width=tmp.height=16;
  const ctx=tmp.getContext('2d',{willReadFrequently:true});
  if(!ctx)return false;
  ctx.imageSmoothingEnabled=false;
  const active=window.MineWorldLocalTextures?.active;
  const drawn=!!active&&!!window.MineWorldLocalTextures.drawFace(ctx,blockId,face);
  if(!drawn){
   const colors=ctx.createImageData(16,16);
   const art=window.MineWorldPixelMaterials?.paint;
   if(typeof art!=='function')return false;
   for(let y=0;y<16;y++)for(let x=0;x<16;x++)
    colors.data.set(art(blockId,face,x,y),(y*16+x)*4);
   ctx.putImageData(colors,0,0);
  }
  if(typeof ctx.getImageData!=='function')return false;
  tiles.push(ctx.getImageData(0,0,16,16).data);
 }
 canvas.width=canvas.height=32;
 out.imageSmoothingEnabled=false;
 const img=out.createImageData(32,32),data=img.data;
 const put=(x,y,u,v,face,brightness)=>{
  if(u<0||u>=1||v<0||v>=1)return;
  const ix=Math.max(0,Math.min(15,Math.floor(u*16))),
        iy=Math.max(0,Math.min(15,Math.floor(v*16)));
  const idx=(iy*16+ix)*4,pix=(y*32+x)*4,tex=tiles[face];
  const alpha=tex[idx+3];
  if(!alpha)return;
  data[pix]=clamp(tex[idx]*brightness);
  data[pix+1]=clamp(tex[idx+1]*brightness);
  data[pix+2]=clamp(tex[idx+2]*brightness);
  data[pix+3]=alpha;
 };
 // Top diamond and two four-sided wall projections. Coordinates are exact
 // integer destination pixels; nearest 16x16 samples avoid blurry inventory.
 for(let y=0;y<32;y++)for(let x=0;x<32;x++){
  const dx=x+.5,dy=y+.5;
  // Left face from (4,10) to (16,16) to (16,28) to (4,22)
  let u=(dx-4)/12,v=(dy-10-u*6)/12;
  if(u>=0&&u<1&&v>=0&&v<1)put(x,y,u,v,1,.80);
  // Right face uses its OWN imported face (index 2), not the left-side texture.\n  // Right face from (16,16) to (28,10) to (28,22) to (16,28)
  u=(dx-16)/12;v=(dy-16+u*6)/12;
  if(u>=0&&u<1&&v>=0&&v<1)put(x,y,u,v,2,.72);
  // Top from (16,4), (28,10), (16,16), (4,10)
  const q=(dx-16)/12,r=(dy-4)/6;
  u=(q+r)/2;v=(r-q)/2;
  if(u>=0&&u<1&&v>=0&&v<1)put(x,y,u,v,0,1);
 }
 out.clearRect?.(0,0,32,32);
 out.putImageData(img,0,0);
 return true;
}
window.MineWorldBlockItemIcons=Object.freeze({paint});
})();