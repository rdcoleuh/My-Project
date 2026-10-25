/* MineWorld 5.3 — optional lightweight animations of ORIGINAL 16x16 textures.
   Updates only 16-pixel tiles with texSubImage2D; never rebuilds world meshes.
   Throttles low-FPS devices and keeps the game's existing save format intact. */
(()=>{
'use strict';
const SIZE=16,COLS=16;
const fast=[7,66,88,87];   // water, lava, magma, portal
const extra=[55,64,89,126]; // prismarine, sculk, sea lantern, end portal
const pixels=new Uint8Array(SIZE*SIZE*4);
let last=-Infinity,rendered=0,disabled=false;
const clamp=n=>Math.max(0,Math.min(255,Math.round(n)));
function update(gl,texture,t,fps,touch,hasImportedFace){
 if(disabled||!gl||!texture||!(Number.isFinite(t)))return;
 const slow=Number.isFinite(fps)&&fps>0&&fps<(touch?24:30);
 const cadence=slow?1500:touch?370:230;
 if(t-last<cadence)return;
 last=t;
 if(typeof gl.isContextLost==='function'&&gl.isContextLost())return;
 const source=window.MineWorldPixelMaterials;
 if(!source||typeof source.paint!=='function')return;
 const selection=slow?[7,66]:touch?fast:fast.concat(extra);
 // Each texture retains its independent material palette and no copied pixels.
 try{
   gl.bindTexture(gl.TEXTURE_2D,texture);
   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
   for(const block of selection){
     const frame=Math.floor(t/(block===66?260:390));
     for(let face=0;face<3;face++){
       // A partial player-owned Java pack must not freeze unrelated procedural
       // water, lava, portal, or luminous faces. Never overwrite imported pixels.
       if(typeof hasImportedFace==='function'&&hasImportedFace(block,face))continue;
       for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
         const sy=(y+(block===7?frame:block===66?frame*2:Math.floor(frame/2)))&15;
         const sx=(x+(block===66?Math.floor(frame/2):block===87?frame:block===7?Math.floor(frame/3):0))&15;
         const c=source.paint(block,face,sx,sy),off=(y*SIZE+x)*4;
         // Hand-designed sparkle modulation. All colors stay in 8-bit gamut.
         const gleam=(x*3+y*5+frame*7+block)%23;
         const delta=gleam===0?19:gleam===1?-8:0;
         pixels[off]=clamp(c[0]+delta);
         pixels[off+1]=clamp(c[1]+delta);
         pixels[off+2]=clamp(c[2]+delta);
         pixels[off+3]=255;
       }
       const tile=block*3+face;
       gl.texSubImage2D(gl.TEXTURE_2D,0,(tile%COLS)*SIZE,Math.floor(tile/COLS)*SIZE,
         SIZE,SIZE,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
       rendered++;
     }
   }
 }catch(err){
   // Texture animation is decorative; keep gameplay running if the GPU rejects uploads.
   disabled=true;console.warn('MineWorld optional texture animation disabled:',err);
 }
}
window.MineWorldTextureMotion=Object.freeze({update,status:()=>({tilesUpdated:rendered,disabled})});
})();