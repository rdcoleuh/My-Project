/* MineWorld 6.18 — original procedural 16x16 pixel materials for EVERY mob.
 * The shader multiplies these grayscale pixels by model colors; no third-party
 * textures, sprite sheets, source game code, or Minecraft bitmap assets.
 */
(()=>{
 'use strict';
 const SIZE=16,COLS=16;
 const faceKey=(kind,part,face)=>kind+'|'+part+'|'+face;
 const corners=[[0,0],[0,1],[1,1],[1,0]];
 let positions=new Map(),rows=1,baseKinds=[],canvas=null,ctx=null,gpu=null,texture=null;
 let imported=new Set(),tilePixels=SIZE;
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
   baseKinds=names.slice();
   tilePixels=SIZE;
   positions=new Map(names.map((kind,i)=>[kind,i]));
   rows=Math.max(1,Math.ceil(names.length/COLS));
   canvas=document.createElement('canvas');canvas.width=COLS*SIZE;canvas.height=rows*SIZE;
   ctx=canvas.getContext('2d',{alpha:true});
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
   texture=gl.createTexture();gpu=gl;gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
   imported.clear();
  return texture;
 }
 // Import a player-owned entity skin or item PNG by scaling a meaningful
 // part of the artwork into MineWorld's original cuboid material layout.
 // This is not a 1:1 Bedrock model UV mapping; those geometries differ.
 function applyImported(artworks){
   if(!gpu||!canvas||!ctx||!(artworks instanceof Map))return 0;
   const entries=[...artworks].filter(([name,img])=>typeof name==='string'&&img&&
     Number.isFinite(img.width)&&Number.isFinite(img.height)&&img.width>0&&img.height>0&&
     img.width<=2048&&img.height<=2048);
   // Keep stable species slots and a separate tile for every mapped cuboid face.
   const mapper=window.MineWorldEntityTextureMaps;
   const faceTiles=[];
   for(const [kind,img] of entries){
     if(kind.startsWith('item:')||!mapper)continue;
     for(const part of Object.keys(mapper.defs[kind]||{})){
       for(const face of mapper.faces){
         const rect=mapper.rect(kind,part,face,img);
         if(rect)faceTiles.push({key:faceKey(kind,part,face),img,rect});
       }
     }
   }
   const keys=[...baseKinds,...entries.map(([name])=>name).filter(name=>!baseKinds.includes(name)),
     ...faceTiles.map(tile=>tile.key)];
   const atlasRows=Math.max(1,Math.ceil(keys.length/COLS));
   // Preserve up to 32 source pixels per face/item only when the entire atlas
   // fits both WebGL MAX_TEXTURE_SIZE and a 4 MiB mobile-friendly RGBA budget.
   // Even classic skins can have body crops wider than 16 source pixels.
   const maxTexture=typeof gpu.getParameter==='function'&&gpu.MAX_TEXTURE_SIZE!==undefined?
     gpu.getParameter(gpu.MAX_TEXTURE_SIZE):2048;
   const maxSide=Number.isFinite(maxTexture)&&maxTexture>0?maxTexture:2048;
   const highDetail=faceTiles.some(t=>Math.max(t.rect.width,t.rect.height)>SIZE)||
     entries.some(([name,img])=>{
       if(name.startsWith('item:'))return Math.max(img.width,img.height)>SIZE;
       return img.width>=64&&img.height>=32?
         Math.min(img.width/8,img.height/4)>SIZE:Math.min(img.width,img.height)>SIZE;
     });
   const HD=32;
   tilePixels=highDetail&&COLS*HD<=maxSide&&atlasRows*HD<=maxSide&&
     COLS*HD*atlasRows*HD*4<=4*1024*1024?HD:SIZE;
   positions=new Map(keys.map((key,i)=>[key,i]));
   rows=atlasRows;
   canvas.width=COLS*tilePixels;canvas.height=rows*tilePixels;
   const pixels=ctx.createImageData(canvas.width,canvas.height);
   for(let i=0;i<keys.length;i++){
     const kind=keys[i],col=i%COLS,row=Math.floor(i/COLS);
     for(let y=0;y<tilePixels;y++)for(let x=0;x<tilePixels;x++){
       const t=tilePixels/SIZE;
       const tone=shade(kind,Math.floor(x/t),Math.floor(y/t));
       const j=((row*tilePixels+y)*canvas.width+col*tilePixels+x)*4;
       pixels.data[j]=tone;pixels.data[j+1]=tone;pixels.data[j+2]=tone;pixels.data[j+3]=255;
     }
   }
   ctx.putImageData(pixels,0,0);
   imported=new Set();
   for(const [key,img] of entries){
     const index=positions.get(key),dx=(index%COLS)*tilePixels,dy=Math.floor(index/COLS)*tilePixels;
     let sx=0,sy=0,sw=img.width,sh=img.height;
     if(!key.startsWith('item:')&&img.width>=64&&img.height>=32){
       // Head front texture is an 8x8 region of a classic 64-wide skin.
       const scale=img.width/64;
       sx=8*scale;sy=8*scale;sw=8*scale;sh=8*scale;
       if(sy+sh>img.height){sx=0;sy=0;sw=img.width;sh=img.height;}
     }
     // Do not squeeze a rectangular player-owned item into a square sprite.
     const fit=key.startsWith('item:')?Math.min(tilePixels/sw,tilePixels/sh):1;
     const width=key.startsWith('item:')?Math.max(1,Math.round(sw*fit)):tilePixels;
     const height=key.startsWith('item:')?Math.max(1,Math.round(sh*fit)):tilePixels;
     // Imported PNG alpha must replace, not reveal, procedural fallback pixels.
     // Clear the full slot, including padding around non-square item sprites.
     ctx.clearRect?.(dx,dy,tilePixels,tilePixels);
     ctx.imageSmoothingEnabled=false;
     ctx.drawImage(img,sx,sy,sw,sh,dx+Math.floor((tilePixels-width)/2),
       dy+Math.floor((tilePixels-height)/2),width,height);
     imported.add(key);
   }
   for(const {key,img,rect} of faceTiles){
     const index=positions.get(key),dx=(index%COLS)*tilePixels,dy=Math.floor(index/COLS)*tilePixels;
     ctx.imageSmoothingEnabled=false;
     // Transparent mob-face texels must not expose the grayscale base atlas.
     ctx.clearRect?.(dx,dy,tilePixels,tilePixels);
     ctx.imageSmoothingEnabled=false;
     ctx.drawImage(img,rect.x,rect.y,rect.width,rect.height,dx,dy,tilePixels,tilePixels);
   }
   gpu.activeTexture(gpu.TEXTURE0);gpu.bindTexture(gpu.TEXTURE_2D,texture);
   gpu.pixelStorei(gpu.UNPACK_FLIP_Y_WEBGL,false);
   gpu.texImage2D(gpu.TEXTURE_2D,0,gpu.RGBA,gpu.RGBA,gpu.UNSIGNED_BYTE,canvas);
   gpu.texParameteri(gpu.TEXTURE_2D,gpu.TEXTURE_MIN_FILTER,gpu.NEAREST);
   gpu.texParameteri(gpu.TEXTURE_2D,gpu.TEXTURE_MAG_FILTER,gpu.NEAREST);
   return imported.size;
 }
 function hasMapped(kind,part,face){
   return imported.has(kind)&&positions.has(faceKey(kind,part,face));
 }
 function uv(kind,corner,part,face){
   const index=(part&&face?positions.get(faceKey(kind,part,face)):undefined)
     ??positions.get(kind)??positions.get('vehicle')??0;
   const col=index%COLS,row=Math.floor(index/COLS),point=corners[corner&3]||corners[0];
   return [(col*tilePixels+.5+point[0]*(tilePixels-1))/(tilePixels*COLS),
    (row*tilePixels+.5+point[1]*(tilePixels-1))/(tilePixels*rows)];
 }
 window.MineWorldMobPixels=Object.freeze({create,uv,shade,applyImported,
  hasImported:key=>imported.has(key),hasMapped,get kinds(){return baseKinds.slice();},
  get importedCount(){return imported.size;},get count(){return positions.size;},get size(){return tilePixels;}});
})();