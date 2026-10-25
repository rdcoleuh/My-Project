/* MineWorld 6.18 — original procedural 16x16 pixel materials for EVERY mob.
 * The shader multiplies these grayscale pixels by model colors; no third-party
 * textures, sprite sheets, source game code, or Minecraft bitmap assets.
 */
(()=>{
 'use strict';
 const SIZE=16,COLS=16;
 const corners=[[0,0],[0,1],[1,1],[1,0]];
 let positions=new Map(),rows=1;
 function stableHash(s){
   let h=2166136261;
   for(const c of String(s)){h=Math.imul(h^c.charCodeAt(0),16777619);}
   return h>>>0;
 }
 function shade(kind,x,y){
   const seed=stableHash(kind),sx=x>>1,sy=y>>1;
   let n=(Math.imul(sx+seed,1103515245)^Math.imul(sy+seed>>>1,12345))>>>0;
   n^=n>>>11;n=Math.imul(n,2246822519);n^=n>>>13;
   const grain=(n&255)/255;
   const seams=x===0||x===15||y===0||y===15;
   const clusters=((x+Math.floor(seed%5)*3)%(5+(seed%3))===0)&&(y%4===0);
   const tone=Math.max(150,Math.min(255,Math.round(226+(grain-.5)*27+(clusters?-12:0)+(seams?-9:0))));
   return tone;
 }
 function create(gl,species){
   if(!gl||!species)return null;
   const names=[...new Set([...Object.keys(species),'vehicle'])].sort();
   positions=new Map(names.map((kind,i)=>[kind,i]));
   rows=Math.max(1,Math.ceil(names.length/COLS));
   const canvas=document.createElement('canvas');canvas.width=COLS*SIZE;canvas.height=rows*SIZE;
   const ctx=canvas.getContext('2d',{alpha:true});
   if(!ctx)return null;
   const pixels=ctx.createImageData(canvas.width,canvas.height);
   for(let i=0;i<names.length;i++){
     const kind=names[i],col=i%COLS,row=Math.floor(i/COLS);
     for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
       const t=shade(kind,x,y),j=((row*SIZE+y)*canvas.width+col*SIZE+x)*4;
       pixels.data[j]=t;pixels.data[j+1]=t;pixels.data[j+2]=t;pixels.data[j+3]=255;
     }
   }
   ctx.putImageData(pixels,0,0);
   const texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
   return texture;
 }
 function uv(kind,corner){
   const index=positions.get(kind)??positions.get('vehicle')??0;
   const col=index%COLS,row=Math.floor(index/COLS),point=corners[corner&3]||corners[0];
   return [(col*SIZE+.5+point[0]*(SIZE-1))/(SIZE*COLS),
    (row*SIZE+.5+point[1]*(SIZE-1))/(SIZE*rows)];
 }
 window.MineWorldMobPixels=Object.freeze({create,uv,shade,get count(){return positions.size;},size:SIZE});
})();