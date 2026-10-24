/* MineWorld 4.9 — independent 16px reference-informed block face designs.
 * Original pixel arrangements, not extracted Minecraft texture assets.
 * Refines recognizability while retaining all 168 existing block identities. */
(()=>{
 'use strict';
 const engine=window.MineWorldPixelMaterials;
 if(!engine)throw Error('Base pixel materials must load first');
 const old=engine.paint;
 const clamp=n=>Math.max(0,Math.min(255,Math.round(n)));
 const hash=(x,y,s)=>{
   let n=(Math.imul(x+173,73856093)^Math.imul(y+83,19349663)^Math.imul(s+19,83492791))|0;
   n=Math.imul(n^(n>>>15),2246822519);return ((n^(n>>>13))>>>0)/4294967295;
 };
 const rgb=(c,d=0)=>[clamp(c[0]+d),clamp(c[1]+d),clamp(c[2]+d),255];
 function patches(x,y,seed,palette){
   const coarse=hash(x>>2,y>>2,seed),mid=hash(x>>1,y>>1,seed+71),fine=hash(x,y,seed+103);
   const index=coarse<.17?0:coarse>.82?3:mid>.69?2:1;
   return rgb(palette[index],fine>.972?-12:0);
 }
 const dirt=[[77,52,35],[112,77,49],[130,91,58],[155,110,72]];
 const grass=[[55,100,36],[83,132,43],[101,157,54],[137,173,63]];
 const stone=[[73,76,75],[112,114,112],[132,133,130],[160,162,159]];
 const deep=[[37,42,48],[62,67,73],[79,83,89],[101,104,109]];
 const sand=[[168,157,116],[211,198,147],[224,212,162],[237,225,180]];
 const redSand=[[130,69,46],[175,91,57],[191,104,64],[218,131,80]];
 const gravel=[[62,64,65],[104,106,104],[134,136,134],[175,177,173]];
 function terrain(b,face,x,y){
   if(b===1){
     if(face===0)return patches(x,y,101,grass);
     if(face===2)return patches(x,y,202,dirt);
     const depth=[3,4,3,2,4,3,5,3,4,2,3,4,3,5,3,4][x];
     const dangling=y===depth&&hash(x,0,105)>.6;
     return y<depth||dangling?patches(x,y,101,grass):patches(x,y,202,dirt);
   }
   if(b===2||b===29)return patches(x,y,202+(b===29?13:0),b===29?[[62,47,37],[94,68,48],[118,86,58],[146,109,74]]:dirt);
   if(b===3||b===58){
     const isDeep=b===58,pal=isDeep?deep:stone;
     const fracture=hash(x>>2,y>>2,b+300)>.67&&
       ((x%4===0&&y%4!==3)||(y%4===1&&x%4===2));
     return fracture?rgb(pal[0],-5):patches(x,y,b+330,pal);
   }
   if(b===4||b===26)return patches(x,y,b+451,b===4?sand:redSand);
   if(b===92)return patches(x,y,92,gravel);
   if(b===28){
     if(face===0)return patches(x,y,28,[[50,91,44],[66,108,49],[86,132,56],[115,144,64]]);
     return patches(x,y,28,[[60,46,36],[91,69,50],[111,86,61],[141,109,72]]);
   }
   return null;
 }
 function cobble(x,y,dark=false){
   // Deliberately jagged stone boundaries rather than a regular brick grid.
   const row=Math.floor(y/5),shift=[0,3,1,4][row],w=[6,7,5,6][row];
   const xx=x+shift,local=xx%w,by=y%5;
   const corner=local===0||by===0||(by===4&&local>=w-2)||(by===1&&local===w-1);
   const c=dark?deep:stone;
   const variation=hash(Math.floor(xx/w),row,621);
   const center=variation<.3?c[1]:variation>.7?c[3]:c[2];
   return corner?rgb(c[0],-12):rgb(center,hash(x>>1,y>>1,721)>.73?-13:5);
 }
 const logIds=new Set([5,15,30,32,34,36,38,40,42,78,80]);
 const logColors={
  5:[[54,37,23],[84,57,35],[107,74,43],[141,100,58]],
  15:[[73,51,37],[101,71,48],[131,94,63],[158,119,82]],
  30:[[39,32,26],[66,51,37],[85,67,48],[112,86,60]],
  32:[[178,170,145],[208,197,171],[227,220,197],[242,231,211]],
  34:[[71,60,46],[104,86,60],[126,104,77],[151,123,88]],
  36:[[61,42,30],[91,65,40],[125,87,53],[155,114,74]],
  38:[[65,48,49],[89,66,61],[119,88,77],[144,111,98]],
  40:[[88,55,65],[119,74,87],[145,99,108],[171,126,135]],
  42:[[85,83,71],[121,120,105],[151,151,132],[181,180,158]],
  78:[[66,24,43],[103,41,63],[139,62,81],[167,89,105]],
  80:[[25,69,66],[41,108,104],[62,145,136],[95,175,163]]
 };
 function log(b,face,x,y){
   const p=logColors[b];
   if(face!==1){
     const r=Math.max(Math.abs(x-7.5),Math.abs(y-7.5));
     const ring=Math.floor(r/1.65)%2;
     const knot=r<2;
     return rgb(knot?p[0]:ring?p[1]:p[2],hash(x>>1,y>>1,b)>.84?10:0);
   }
   if(b===32){
     const black=(x===3||x===4||x===12)&&hash(x>>1,y>>1,32)>.43;
     return black?rgb([44,48,44]):patches(x,y,32,p);
   }
   const grain=(x===1||x===4||x===9||x===13||(x===7&&y>3&&y<12));
   const breakLine=(x===4&&y===8)||(x===9&&y===5);
   return grain?rgb(p[0],breakLine?18:0):patches(x,y,b+92,p);
 }
 function ore(b,x,y){
   const minerals={
     18:[[30,31,32],[54,56,57],[70,72,72]],
     19:[[119,76,56],[167,109,73],[216,160,110]],
     83:[[134,123,108],[197,184,162],[241,225,200]],
     84:[[141,92,25],[213,157,48],[248,213,98]],
     95:[[110,72,46],[178,112,69],[225,154,99]],
     96:[[151,113,30],[216,166,44],[248,216,91]],
     97:[[123,23,27],[187,40,44],[245,67,72]],
     98:[[30,40,120],[42,67,199],[83,113,241]],
     99:[[24,106,112],[51,180,191],[100,232,229]],
     100:[[21,101,60],[42,170,96],[95,221,141]]
   };
   const deepOre=b>=101&&b<=108,kind=deepOre?b-8:b;
   const colors=minerals[kind]||minerals[18];
   const cx=x>>2,cy=y>>2;
   const seed=hash(cx,cy,kind+601);
   const vein=seed>.55&&hash(x>>1,y>>1,kind+122)>.28;
   const glint=vein&&hash(x,y,kind+833)>.79;
   if(vein)return rgb(glint?colors[2]:hash(x>>1,y>>1,kind+74)>.5?colors[1]:colors[0]);
   return terrain(deepOre?58:3,1,x,y);
 }
 function fluid(b,x,y){
   if(b===7){
     const wave=((y+((x>>2)%3))%7===0);
     const glint=hash(x>>2,y>>2,721)>.83;
     return rgb(wave?[89,151,207]:glint?[55,126,189]:[38,103,170],hash(x,y,7)>.96?16:0);
   }
   const channel=(x+Math.floor(y/3)*3)%8<2;
   const fleck=hash(x>>1,y>>1,66)>.78;
   return rgb(channel?[250,193,52]:fleck?[246,133,30]:[213,70,20]);
 }
 function paint(b,face,x,y){
   x&=15;y&=15;
   const t=terrain(b,face,x,y);if(t)return t;
   if(b===61)return cobble(x,y);
   if(b===67||b===68)return cobble(x,y,true);
   if(logIds.has(b))return log(b,face,x,y);
   if(b===18||b===19||b===83||b===84||(b>=95&&b<=108))return ore(b,x,y);
   if(b===7||b===66)return fluid(b,x,y);
   if(b===11||b===52||b===132){
     const base=b===52?[[46,34,31],[75,55,48],[98,75,64],[123,96,77]]:b===132?[[80,46,82],[124,78,121],[157,106,149],[187,136,173]]:[[101,65,36],[153,101,55],[185,132,78],[212,160,101]];
     const seam=y%4===0,join=(x+(Math.floor(y/4)%2?8:0))%15===0;
     return seam?rgb(base[0]):join?rgb(base[1],-20):patches(x,y,b+81,base);
   }
   return old(b,face,x,y);
 }
 engine.paint=paint;
 engine.version='4.9-reference-refined';
})();
