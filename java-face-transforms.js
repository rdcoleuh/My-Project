/* MineWorld 6.41 — imported Java model per-face UV transforms (local metadata only).
   Correct crop, horizontal/vertical flips, and 90-degree texture rotations;
   no original game art and no world-save or collision changes. */
(()=>{
'use strict';
const dirs=['up','down','north','south','east','west'];
let active=new Map();
function side(n){
 if(!Array.isArray(n)||n.length!==3)return null;
 if(n[1]===1)return 'up';if(n[1]===-1)return 'down';
 if(n[0]===1)return 'east';if(n[0]===-1)return 'west';
 if(n[2]===1)return 'south';if(n[2]===-1)return 'north';
 return null;
}
function valid(v){
 if(!v||typeof v!=='object'||!Number.isInteger(v.rotation)||![0,90,180,270].includes(v.rotation)||
 !Array.isArray(v.uv)||v.uv.length!==4||
 !v.uv.every(x=>Number.isFinite(x)&&x>=0&&x<=16)||
 v.uv[0]===v.uv[2]||v.uv[1]===v.uv[3])return null;
 return Object.freeze({rotation:v.rotation,uv:Object.freeze([...v.uv])});
}
function commit(rows){
 const next=new Map();
 if(rows?.entries)for(const [id,faces] of rows){
  if(!Number.isInteger(id)||id<1||id>169||!faces)continue;
  const row={};for(const dir of dirs){const face=valid(faces[dir]);if(face)row[dir]=face;}
  if(Object.keys(row).length)next.set(id,Object.freeze(row));
 }
 active=next;return active.size;
}
function descriptor(id,n){return active.get(id)?.[side(n)]||null;}
function corner(base,face){
 let k=(base+face.rotation/90)%4;
 let u=k>=2?1:0,v=k===1||k===2?1:0;
 if(face.uv[2]<face.uv[0])u=1-u;
 if(face.uv[3]<face.uv[1])v=1-v;
 return u?(v?2:3):(v?1:0);
}
function sample(id,n,base,atlas,textureFace,tile,fallback){
 const face=descriptor(id,n);
 if(!face||!atlas?.uv||!Number.isInteger(base)||base<0||base>3)return fallback;
 const [u0,v0,u1,v1]=face.uv;
 return atlas.uv(id,textureFace,corner(base,face),
  Math.abs(u1-u0)/16,Math.abs(v1-v0)/16,
  Math.min(u0,u1)/16,Math.min(v0,v1)/16,tile);
}
function stats(){let faces=0;for(const row of active.values())faces+=Object.keys(row).length;return {blocks:active.size,faces};}
window.MineWorldJavaFaceTransforms=Object.freeze({side,commit,descriptor,sample,stats});
})();