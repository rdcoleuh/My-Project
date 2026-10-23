/* MineWorld Nether: original deterministic 10,000 x 10,000 underworld dimension.
   5 biomes, ceilings, lava seas, fungus forests and generated landmarks.
   Independently authored. Not Minecraft terrain-generation code or texture data. */
(() => {
 'use strict';
 const WORLD=10000,CHUNK=16,H=48, LAVA_LEVEL=9, CENTER=5000;
 let seed=85721;
 const BIOMES=[
  {name:'Nether Wastes',color:'#aa3527',floor:65,detail:68,mobs:['zombified_piglin','piglin','ghast','magma_cube','strider']},
  {name:'Crimson Forest',color:'#ad233e',floor:75,detail:77,mobs:['piglin','hoglin','zombified_piglin','strider']},
  {name:'Warped Forest',color:'#169d95',floor:76,detail:79,mobs:['enderman','strider']},
  {name:'Soul Sand Valley',color:'#706d8a',floor:70,detail:71,mobs:['skeleton','ghast','enderman','strider']},
  {name:'Basalt Deltas',color:'#666976',floor:67,detail:69,mobs:['magma_cube','ghast','strider']}
 ];
 const hash=(x,z,s=0)=>{let n=Math.imul(x|0,374761393)^Math.imul(z|0,668265263)^Math.imul((seed+s)|0,1274126177);n=Math.imul(n^(n>>>13),1274126177);return (n^(n>>>16))>>>0};
 const rand=(x,z,s=0)=>hash(x,z,s)/4294967295;
 const smooth=(t)=>t*t*(3-2*t);
 function noise(x,z,scale,s=0){const xx=x/scale,zz=z/scale,ix=Math.floor(xx),iz=Math.floor(zz),a=smooth(xx-ix),b=smooth(zz-iz);const v=(u,w)=>rand(ix+u,iz+w,s);return (1-a)*((1-b)*v(0,0)+b*v(0,1))+a*((1-b)*v(1,0)+b*v(1,1));}
 function setSeed(x){seed=Math.max(1,Math.min(99999999,Number(x)|0||85721));return seed;}
 function biomeIndex(x,z){const n=noise(x+152,z-79,140,114)*.72+noise(x-750,z+500,58,115)*.28;return n<.33?3:n<.455?2:n<.575?1:n<.69?4:0;}
 function biomeAt(x,z){const index=biomeIndex(x,z);return {...BIOMES[index],index};}
 function surfaceAt(x,z){const b=biomeIndex(x,z);let y=12+noise(x,z,34,201)*11+noise(x,z,11,202)*5;
  if(b===4)y+=noise(x,z,7,203)*5-2;
  if(b===3)y-=3;
  // Safe flat arrival platform; regardless of seed, the central portal isn't in lava.
  if(Math.abs(x-CENTER)<9&&Math.abs(z-CENTER)<9)y=Math.max(19,y);
  return Math.max(5,Math.min(29,Math.floor(y)));
 }
 function ceilingAt(x,z){return Math.max(36,Math.min(46,42+Math.floor(noise(x,z,25,230)*5)));}
 function landmarkAt(x,z){const gx=Math.floor(x/208),gz=Math.floor(z/208);
  const ax=gx*208+28+(hash(gx,gz,410)%145),az=gz*208+28+(hash(gx,gz,411)%145);
  const b=biomeIndex(ax,az);
  const v=hash(gx,gz,412)%5;
  const kind=v===0?'Nether Fortress':v===1&&b!==4?'Bastion Remnant':v===2?'Ruined Portal':v===3&&b===3?'Nether Fossil':'Lava Well';
  return {x:ax,z:az,kind};
 }
 function destination(index){const target=Number(index);
  let closest=null,dist=Infinity;
  for(let ix=-7;ix<=7;ix++)for(let iz=-7;iz<=7;iz++){
    const x=CENTER+ix*69,z=CENTER+iz*69;if(x<2||x>WORLD-3||z<2||z>WORLD-3||biomeIndex(x,z)!==target)continue;
    const d=ix*ix+iz*iz;if(d<dist){dist=d;closest={x,z};}
  }
  return closest||{x:CENTER+128,z:CENTER+128};
 }
 function generateChunk({cx,cz,H:height=H,edits=null}){
  const data=new Uint8Array(CHUNK*CHUNK*height),x0=cx*CHUNK,z0=cz*CHUNK;
  const ok=(x,y,z)=>x>=x0&&x<x0+CHUNK&&z>=z0&&z<z0+CHUNK&&y>=0&&y<height;
  const at=(x,y,z)=>((x-x0)*CHUNK+(z-z0))*height+y;
  const put=(x,y,z,id,onlyAir=false)=>{if(ok(x,y,z)){const i=at(x,y,z);if(!onlyAir||!data[i])data[i]=id;}};
  const get=(x,y,z)=>ok(x,y,z)?data[at(x,y,z)]:0;
  for(let dx=0;dx<CHUNK;dx++)for(let dz=0;dz<CHUNK;dz++){
    const x=x0+dx,z=z0+dz;if(x>=WORLD||z>=WORLD)continue;
    const b=biomeIndex(x,z),top=surfaceAt(x,z),ceil=ceilingAt(x,z);
    const surface=BIOMES[b].floor,under=(b===4?68:65);
    for(let y=0;y<=top;y++){
      let id=y===0?58:y>=top-2?surface:under;
      if(y<top-4&&y>2){const ore=rand(x*17+y*13,z*31+y*5,1021);if(ore>.991)id=84;else if(ore>.967)id=83;else if(ore>.961)id=85;}
      put(x,y,z,id);
    }
    for(let y=top+1;y<=LAVA_LEVEL;y++)put(x,y,z,66);
    for(let y=ceil;y<height;y++)put(x,y,z,y===height-1?58:65);
    // Cavernous netherrack shelves / firelit hollow columns.
    if(top>12){for(let y=5;y<top-3;y++){
      const cave=noise(x+y*1.35,z-y*1.65,19,300)*.64+noise(x-y*.3,z+y*2.1,8,301)*.36;
      if(cave>.765)put(x,y,z,y<=LAVA_LEVEL?66:0);
    }}
    if(b===4&&rand(x,z,22)>.88)put(x,top,z,69);
    if(b===3&&rand(x,z,23)>.89)put(x,top,z,71);
    if(rand(x*31,z*11,25)>.996&&top>10)put(x,top,z,68);
    // Nether ores and glowstone speckles on hanging ceilings.
    if(rand(x,z,400)>.984){for(let y=ceil-1;y>=ceil-3;y--)put(x,y,z,10);}
  }
  // Sample trees outside chunk boundaries to make canopies consistent.
  for(let x=x0-4;x<x0+CHUNK+4;x++)for(let z=z0-4;z<z0+CHUNK+4;z++){
    const b=biomeIndex(x,z),surface=surfaceAt(x,z),roll=rand(x,z,571);
    if(x<2||x>=WORLD-2||z<2||z>=WORLD-2||surface<LAVA_LEVEL)continue;
    if((b!==1&&b!==2)||roll>.022)continue;
    const log=b===1?78:80,wart=b===1?79:81,roots=b===1?77:82,h=3+(hash(x,z,572)%4);
    for(let y=1;y<=h;y++)put(x,surface+y,z,log);
    const ty=surface+h;
    for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)for(let dy=-1;dy<=2;dy++){
      if(Math.abs(dx)+Math.abs(dz)+Math.abs(dy)>.01+4||Math.abs(dx)===2&&Math.abs(dz)===2)continue;
      put(x+dx,ty+dy,z+dz,wart,true);
    }
    put(x,ty+2,z,10,true);
    if(rand(x,z,573)>.65)put(x+2,surface+1,z,roots,true);
  }
  // Deterministic structures. Same landmark is stamped into every overlapping chunk.
  for(let gx=Math.floor((x0-32)/208);gx<=Math.floor((x0+CHUNK+32)/208);gx++)
  for(let gz=Math.floor((z0-32)/208);gz<=Math.floor((z0+CHUNK+32)/208);gz++){
    const gxX=gx*208+28+(hash(gx,gz,410)%145),gzZ=gz*208+28+(hash(gx,gz,411)%145);
    if(gxX<8||gxX>=WORLD-8||gzZ<8||gzZ>=WORLD-8)continue;
    const b=biomeIndex(gxX,gzZ),v=hash(gx,gz,412)%5;
    const type=v===0?'fortress':v===1&&b!==4?'bastion':v===2?'portal':v===3&&b===3?'fossil':'well';
    const y=surfaceAt(gxX,gzZ)+1;
    if(type==='fortress'||type==='bastion'){
      const wall=type==='fortress'?72:69,trim=type==='fortress'?74:84,r=type==='fortress'?10:8;
      for(let ox=-r;ox<=r;ox++)for(let oz=-r;oz<=r;oz++){
        const X=gxX+ox,Z=gzZ+oz;
        if(Math.abs(ox)>r-2&&Math.abs(oz)>r-2)continue;
        put(X,y-1,Z,trim);
        if(Math.abs(ox)===r||Math.abs(oz)===r)for(let dy=0;dy<6;dy++)put(X,y+dy,Z,wall);
        else if(Math.abs(ox)<=r-2&&Math.abs(oz)<=r-2)for(let dy=0;dy<4;dy++)put(X,y+dy,Z,0);
        if(Math.abs(ox)===r||Math.abs(oz)===r)put(X,y+6,Z,trim);
      }
      for(let dy=0;dy<4;dy++)put(gxX,y+dy,gzZ-r,0);
      for(let n=-18;n<=18;n++)for(let w=-2;w<=2;w++)put(gxX+n,y-1,gzZ+w,wall);
      put(gxX,y,gzZ,10);
      if(type==='fortress')for(let a=-3;a<=3;a++)put(gxX+a,y+1,gzZ+3,73);
      if(type==='bastion')for(let a=-2;a<=2;a++)put(gxX+a,y+1,gzZ+2,84);
      put(gxX+2,y,gzZ+2,119);
      if(type==='bastion')put(gxX-2,y,gzZ-2,119);
      put(gxX+2,y,gzZ+2,119);
      if(type==='bastion')put(gxX-2,y,gzZ-2,119);
    }else if(type==='portal'){
      for(let dx=-3;dx<=3;dx++)for(let dy=0;dy<=6;dy++){
        const border=Math.abs(dx)===3||dy===0||dy===6;
        put(gxX+dx,y+dy,gzZ,border?51:dy>0&&dy<6?0:65);
      }
      put(gxX-1,y+6,gzZ,65);put(gxX+3,y+5,gzZ,65);
      put(gxX+4,y,gzZ+1,119);
      put(gxX+4,y,gzZ+1,119);
    }else if(type==='fossil'){
      for(let i=-7;i<=7;i++)put(gxX+i,y+1,gzZ,86);
      for(let i=-6;i<=6;i+=3){for(let dy=0;dy<4;dy++)put(gxX+i,y+dy,gzZ-2,86);put(gxX+i,y+3,gzZ+2,86);}
      put(gxX+2,y,gzZ+2,119);
      put(gxX+2,y,gzZ+2,119);
    }else{
      for(let dx=-3;dx<=3;dx++)for(let dz=-3;dz<=3;dz++){
        if(Math.abs(dx)===3||Math.abs(dz)===3)put(gxX+dx,y,gzZ+dz,69);
        else put(gxX+dx,y,gzZ+dz,66);
      put(gxX+4,y,gzZ+1,119);
      put(gxX+4,y,gzZ+1,119);
      }
    }
  }
  // Arrival portal and basalt safe platform independent of the seed.
  const sx=CENTER,sz=CENTER,sy=surfaceAt(sx,sz)+1;
  for(let x=sx-5;x<=sx+5;x++)for(let z=sz-5;z<=sz+5;z++)put(x,sy-1,z,69);
  for(let x=sx-2;x<=sx+2;x++)for(let y=sy;y<=sy+4;y++)put(x,y,sz+3,(Math.abs(x-sx)===2||y===sy||y===sy+4)?51:87);
  // Saved blocks take precedence over procedural generation.
  if(edits&&edits.size)for(const [i,b] of edits){const x=Math.floor(i/(WORLD*height)),z=Math.floor(i/height)%WORLD,y=i%height;if(ok(x,y,z))put(x,y,z,b);}
  return data;
 }
 window.MineWorldNether={WORLD,CHUNK,H,BIOMES,LAVA_LEVEL,CENTER,setSeed,biomeIndex,biomeAt,surfaceAt,ceilingAt,landmarkAt,destination,generateChunk};
})();
