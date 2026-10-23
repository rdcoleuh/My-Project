/* MineWorld End dimension. Independently authored deterministic terrain, islands,
   landmarks and spires.  No Mojang code or art is distributed. */
(() => {
'use strict';
const WORLD=10000, CHUNK=16, H=48, CENTER=5000;
const BIOMES=[
 {name:'The End',label:'Central island',color:'#d6d29c'},
 {name:'End Highlands',label:'Chorus forests and cities',color:'#c7ba9b'},
 {name:'End Midlands',label:'Rolling islands',color:'#bbb397'},
 {name:'End Barrens',label:'Sparse island fringes',color:'#968a7e'},
 {name:'Small End Islands',label:'Void-bound archipelago',color:'#8e87a2'}
];
const END_SPAWN={x:CENTER-47,z:CENTER+7};
const STRONGHOLD={x:CENTER+116,z:CENTER-91};
const SPIRES=Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return {x:Math.round(CENTER+Math.cos(a)*29),z:Math.round(CENTER+Math.sin(a)*29),top:32+(i%3)*3};});
let seed=85721;
const hash=(x,z,s=0)=>{let n=Math.imul(x|0,374761393)^Math.imul(z|0,668265263)^Math.imul((seed+s)|0,1274126177);n=Math.imul(n^(n>>>13),1274126177);return (n^(n>>>16))>>>0};
const rand=(x,z,s=0)=>hash(x,z,s)/4294967295;
const smooth=t=>t*t*(3-2*t);
function noise(x,z,scale,s){const a=x/scale,b=z/scale,ix=Math.floor(a),iz=Math.floor(b),u=smooth(a-ix),v=smooth(b-iz);const f=(dx,dz)=>rand(ix+dx,iz+dz,s);return (1-v)*((1-u)*f(0,0)+u*f(1,0))+v*((1-u)*f(0,1)+u*f(1,1));}
function setSeed(v){seed=Math.max(1,Math.min(99999999,Number(v)|0||85721));return seed;}
function islandShape(x,z){
 const d=Math.hypot(x-CENTER,z-CENTER);
 if(d<57){const border=51+noise(x,z,14,19)*8-4;return {weight:Math.min(1,(border-d)/5+.5),surface:20+Math.floor(noise(x,z,25,20)*3),main:true};}
 if(d<72)return null;
 let best=null;
 const gx=Math.floor(x/78),gz=Math.floor(z/78);
 for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){
  const a=gx+dx,b=gz+dz;
  if(hash(a,b,33)%7===0)continue;
  const cx=a*78+10+(hash(a,b,34)%57),cz=b*78+10+(hash(a,b,35)%57);
  const rad=18+(hash(a,b,36)%22);
  const dist=Math.hypot((x-cx)/(rad*1.25),(z-cz)/(rad*.87));
  const uneven=dist+(noise(x,z,11,39)-.5)*.2;
  if(uneven<1&&(!best||uneven<best.weight))best={weight:uneven,surface:17+(hash(a,b,40)%8)+Math.floor(noise(x,z,16,41)*3),main:false};
 }
 return best;
}
function surfaceAt(x,z){const shape=islandShape(x,z);return shape?Math.min(31,shape.surface):-1;}
function biomeIndex(x,z){const d=Math.hypot(x-CENTER,z-CENTER);if(d<67)return 0;const shape=islandShape(x,z);if(!shape)return 4;
 const n=noise(x,z,130,98),height=shape.surface;
 return height>=23&&n>.43?1:height<=19?3:2;
}
function biomeAt(x,z){const index=biomeIndex(x,z);return {...BIOMES[index],index};}
const LANDMARKS=[
 {x:CENTER+178,z:CENTER+38,kind:'End City',type:'city'},
 {x:CENTER-179,z:CENTER-86,kind:'End City & Ship',type:'ship'},
 {x:CENTER+44,z:CENTER-191,kind:'End City',type:'city'},
 {x:CENTER-78,z:CENTER+195,kind:'End City & Ship',type:'ship'}
];
function landmarkAt(x,z){let best=null,dist=Infinity;for(const l of LANDMARKS){const d=Math.hypot(x-l.x,z-l.z);if(d<dist){dist=d;best=l;}}return {...best,distance:dist};}
function destination(i){const dest=[{x:CENTER,z:CENTER},{x:CENTER+178,z:CENTER+38},{x:CENTER-155,z:CENTER-88},{x:CENTER+95,z:CENTER+70},{x:CENTER+148,z:CENTER-133}];return dest[Math.max(0,Math.min(4,Number(i)|0))];}
function generateChunk({cx,cz,H:height=H,edits=null,dragonDefeated=false}){
 const x0=cx*CHUNK,z0=cz*CHUNK;
 const data=new Uint8Array(CHUNK*CHUNK*height);
 const ok=(x,y,z)=>x>=x0&&x<x0+CHUNK&&z>=z0&&z<z0+CHUNK&&y>=0&&y<height;
 const at=(x,y,z)=>((x-x0)*CHUNK+(z-z0))*height+y;
 const convert={95:121,99:122,100:123,102:124,112:51,104:126,109:129,105:127,96:131,97:130,98:132,101:128,107:119,108:134,110:130,103:125};
 const put=(x,y,z,b)=>{if(ok(x,y,z))data[at(x,y,z)]=Object.hasOwn(convert,b)?convert[b]:b;};
 for(let dx=0;dx<16;dx++)for(let dz=0;dz<16;dz++){
  const x=x0+dx,z=z0+dz;if(x<0||z<0||x>=WORLD||z>=WORLD)continue;
  const sh=islandShape(x,z);if(!sh)continue;
  const top=surfaceAt(x,z),depth=sh.main?13:Math.max(3,Math.round(4+9*(1-sh.weight)));
  for(let y=Math.max(1,top-depth);y<=top;y++)put(x,y,z,95);
  const bi=biomeIndex(x,z);
  if(!sh.main&&bi===1&&rand(x,z,51)>.993&&top+7<height){
   for(let t=1;t<5;t++)put(x,top+t,z,99);
   for(const [ox,oz] of [[-1,0],[1,0],[0,-1],[0,1]]){
    put(x+ox,top+3,z+oz,99);put(x+ox*2,top+3,z+oz*2,100);
   }
   put(x,top+5,z,100);
  }
 }
 // A fixed obsidian arrival platform. All generated geometry is chunk-local.
 for(let x=END_SPAWN.x-2;x<=END_SPAWN.x+2;x++)for(let z=END_SPAWN.z-2;z<=END_SPAWN.z+2;z++)put(x,26,z,51);
 // Towers with destructible End crystals.
 for(const s of SPIRES){for(let x=s.x-1;x<=s.x+1;x++)for(let z=s.z-1;z<=s.z+1;z++)for(let y=22;y<=s.top;y++)put(x,y,z,51);put(s.x,s.top+1,s.z,102);}
 // Dragon fountain; after victory a usable portal, egg and outward gateway appear.
 for(let x=CENTER-3;x<=CENTER+3;x++)for(let z=CENTER-3;z<=CENTER+3;z++){
  if(Math.hypot(x-CENTER,z-CENTER)<3.5){put(x,24,z,112);if(dragonDefeated&&Math.abs(x-CENTER)<=1&&Math.abs(z-CENTER)<=1)put(x,25,z,104);}
 }
 for(let y=25;y<=28;y++)put(CENTER,y,CENTER,112);
 if(dragonDefeated){put(CENTER,29,CENTER,109);put(CENTER+44,27,CENTER,105);}
 // Outer towers, elevated rooms, connecting platforms, End city ships.
 for(const l of LANDMARKS){const y=27;
  for(let x=l.x-6;x<=l.x+6;x++)for(let z=l.z-6;z<=l.z+6;z++){
   put(x,y,z,96);
   if(Math.abs(x-l.x)===6||Math.abs(z-l.z)===6){for(let k=y+1;k<=y+9;k++)put(x,k,z,97);}
   else if(Math.abs(x-l.x)<=5&&Math.abs(z-l.z)<=5){for(let k=y+1;k<=y+8;k++)put(x,k,z,0);}
   if(Math.abs(x-l.x)<6&&Math.abs(z-l.z)<6)put(x,y+10,z,97);
  }
  for(let yy=y+1;yy<=y+9;yy++)for(let dd=-1;dd<=1;dd++)put(l.x+dd,yy,l.z+6,0);
  for(let k=y+1;k<=y+8;k++)for(const [dx,dz] of [[-4,-4],[4,-4],[-4,4],[4,4]])put(l.x+dx,k,l.z+dz,98);
  for(let y0=y+2;y0<y+9;y0+=3)put(l.x,y0,l.z,101);
  // Treasure room: shulker boxes, end rods, loot and decorative head.
  put(l.x+2,y+1,l.z+2,107);put(l.x-2,y+1,l.z-2,107);
  if(l.type==='ship'){
   for(let x=l.x+11;x<=l.x+25;x++)for(let z=l.z-3;z<=l.z+3;z++){
    if(Math.abs(z-l.z)<=3-Math.abs((x-l.x-18)/8)*2){put(x,y+4,z,97);if(Math.abs(z-l.z)>2)put(x,y+5,z,97);}
   }
   for(let k=y+5;k<=y+10;k++)put(l.x+18,k,l.z,98);
   put(l.x+23,y+5,l.z,108);put(l.x+16,y+5,l.z,107);put(l.x+19,y+6,l.z,101);
  }
 }
 if(edits?.size)for(const [index,b] of edits){const x=Math.floor(index/(WORLD*height)),z=Math.floor(index/height)%WORLD,y=index%height;if(ok(x,y,z))put(x,y,z,b);}
 return data;
}
function stampStronghold({data,cx,cz,H:height=H,eyeCount=0}){
 const x0=cx*CHUNK,z0=cz*CHUNK;
 const convert={110:130,103:125,104:126};
 const put=(x,y,z,b)=>{if(x>=x0&&x<x0+CHUNK&&z>=z0&&z<z0+CHUNK&&y>=0&&y<height)data[((x-x0)*CHUNK+(z-z0))*height+y]=convert[b]||b;};
 const {x:cx0,z:cz0}=STRONGHOLD,y=25;
 for(let x=cx0-9;x<=cx0+9;x++)for(let z=cz0-9;z<=cz0+9;z++){
  put(x,y-1,z,110);
  if(Math.abs(x-cx0)===9||Math.abs(z-cz0)===9){for(let k=y;k<=y+4;k++)put(x,k,z,110);}
  else for(let k=y;k<=y+3;k++)put(x,k,z,0);
  if(Math.abs(x-cx0)===8||Math.abs(z-cz0)===8)put(x,y+4,z,110);
 }
 put(cx0-6,y,cz0-6,119);
 for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++){
  const rim=Math.abs(x)===2||Math.abs(z)===2;
  put(cx0+x,y,cz0+z,rim?103:eyeCount>=12?104:0);
 }
}
window.MineWorldEnd={WORLD,CHUNK,H,CENTER,BIOMES,END_SPAWN,STRONGHOLD,SPIRES,LANDMARKS,setSeed,biomeAt,biomeIndex,surfaceAt,landmarkAt,destination,generateChunk,stampStronghold};
})();
