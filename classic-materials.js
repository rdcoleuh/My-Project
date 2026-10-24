/* MineWorld 5.4 — original classic-inspired 16x16 material designs.
 * Hand-authored mathematical pixel shapes and distinct palettes, no Minecraft
 * texture bitmaps or one-pixel-modified copyrighted assets. Saves unchanged. */
(()=>{
'use strict';
const engine=window.MineWorldPixelMaterials;
if(!engine)throw Error('Materials base required');
const previous=engine.paint;
const clamp=n=>Math.max(0,Math.min(255,Math.round(n)));
const rgba=(c,delta=0)=>[clamp(c[0]+delta),clamp(c[1]+delta),clamp(c[2]+delta),255];
function rand(x,y,s){let z=Math.imul((x|0)+1237,374761393)^Math.imul((y|0)+1709,668265263)^Math.imul((s|0)+811,1274126177);z=Math.imul(z^(z>>>15),2246822519);return ((z^(z>>>13))>>>0)/4294967295;}
function fleck(p,x,y,s,scale=3){
 const c=rand(Math.floor(x/scale),Math.floor(y/scale),s),m=rand(x>>1,y>>1,s+91),f=rand(x,y,s+203);
 return rgba(p[c<.16?0:c>.79?3:m>.53?2:1],f>.975?9:f<.018?-10:0);
}
const ground={
 2:[[70,47,32],[94,63,42],[123,85,54],[148,108,73]],
 3:[[83,85,84],[107,109,107],[132,134,132],[157,159,154]],
 4:[[166,154,111],[195,181,133],[217,203,152],[237,223,174]],
 21:[[187,207,217],[215,227,232],[235,242,242],[250,253,250]],
 26:[[129,70,44],[159,89,53],[190,107,62],[215,133,84]],
 29:[[68,52,39],[98,74,49],[125,99,67],[158,127,86]],
 46:[[39,73,35],[58,99,40],[81,126,53],[116,149,65]],
 47:[[42,41,40],[63,58,52],[83,75,64],[106,96,79]],
 50:[[64,29,31],[85,35,37],[113,43,42],[138,59,53]],
 57:[[99,117,118],[127,143,143],[155,166,165],[176,184,179]],
 58:[[41,44,48],[57,62,68],[77,81,87],[101,105,110]],
 65:[[58,26,30],[86,35,38],[112,47,47],[142,62,61]],
 70:[[37,36,38],[57,54,52],[77,69,66],[98,84,75]],
 71:[[43,43,41],[64,59,55],[83,75,69],[108,95,82]],
 92:[[67,69,68],[94,96,94],[130,130,127],[167,165,162]]
};
const GRASS=[[48,91,36],[67,116,43],[88,142,53],[116,167,64]];
function terrain(id,f,x,y){
 if(id===1){
   if(f===0)return fleck(GRASS,x,y,101,2);
   if(f===2)return terrain(2,1,x,y);
   const depth=2+Math.floor(rand(x>>1,0,117)*3),grass=y<depth||(y<depth+2&&rand(x,y,179)>.72);
   return grass?fleck(GRASS,x,y,111,2):terrain(2,1,x,y);
 }
 if(id===28){
   if(f===0)return fleck([[51,67,40],[74,88,47],[94,105,55],[132,125,75]],x,y,28);
   if(y<2+Math.floor(rand(x>>1,0,28)*2))return fleck([[60,69,42],[86,98,52],[111,118,59],[142,132,77]],x,y,28,2);
   return fleck([[69,49,37],[94,70,49],[119,92,61],[148,121,78]],x,y,28);
 }
 const p=ground[id];if(!p)return null;
 const fracture=(id===3||id===58)&&rand(x>>2,y>>2,id*199)>.75&&(x%4===1||y%5===3)&&rand(x,y,126)>.38;
 if(fracture)return rgba(p[0],-9);
 const smallStone=(id===2||id===29||id===92)&&rand(x>>1,y>>1,id*71)>.82&&((x+2*y)%5===0||id===29);
 if(smallStone)return rgba(id===92?[185,183,174]:[127,117,101],-2);
 const hollow=(id===70||id===71)&&rand(x>>2,y>>2,id*9)>.68&&(x%4===1||y%4===2);
 if(hollow)return rgba(p[0],-11);
 return fleck(p,x,y,id*73,(id===4||id===26||id===92)?2:3);
}
const logs={
 5:[[53,37,22],[78,52,28],[113,78,43],[147,110,69]],
 15:[[69,49,31],[100,72,46],[133,99,64],[161,123,82]],
 30:[[38,33,28],[59,47,34],[86,64,44],[111,86,61]],
 32:[[141,137,121],[179,168,145],[217,210,188],[238,232,214]],
 34:[[65,53,43],[100,81,59],[130,108,80],[156,133,98]],
 36:[[63,44,31],[91,65,43],[125,94,61],[163,126,87]],
 38:[[65,46,47],[95,71,66],[129,98,86],[164,134,109]],
 40:[[80,51,58],[112,72,82],[146,100,110],[178,136,139]],
 42:[[87,84,73],[114,109,93],[152,145,127],[192,180,158]],
 78:[[66,23,43],[100,39,60],[139,60,84],[179,91,112]],
 80:[[24,62,62],[37,95,95],[60,143,133],[95,186,168]]
};
function wood(id,f,x,y){
 const p=logs[id];
 if(f!==1){
   // Broad offset-growth square rings: independent hand-defined contours.
   const r=Math.max(Math.abs(x-7.5),Math.abs(y-7.5)),ring=Math.floor(r*1.19)%3;
   const check=(x===8&&y>=9&&y<=12)||(y===8&&x>=9&&x<=12);
   if(check&&rand(x,y,id+333)>.24)return rgba(p[0],-12);
   return fleck(r<1.5?[p[0],p[0],p[1],p[1]]:ring===1?[p[0],p[1],p[1],p[2]]:p,x,y,id+111,2);
 }
 if(id===32&&(x===3||x===11||x===12)&&rand(x>>1,y>>1,32)>.38)return rgba([55,57,53]);
 if(id===42&&y%6===1&&rand(x>>2,y>>1,42)>.41)return rgba([85,79,71]);
 if((x%5===1||x%7===3)&&rand(x>>1,y>>2,id+88)>.47)return rgba(p[0],-6);
 return fleck(p,x,y,id+77,2);
}
const leaves={
 6:[[36,74,32],[47,104,39],[70,136,49],[99,160,56]],
 12:[[87,33,32],[125,44,36],[161,58,43],[201,89,57]],
 13:[[110,48,29],[158,77,35],[210,111,40],[237,151,58]],
 14:[[126,103,35],[167,133,43],[209,175,58],[240,205,92]],
 31:[[25,50,34],[35,78,43],[47,100,55],[67,130,64]],
 33:[[55,88,39],[79,116,49],[104,147,62],[146,175,87]],
 35:[[75,85,36],[103,111,48],[137,147,63],[172,178,87]],
 37:[[26,69,32],[36,99,41],[52,130,52],[82,160,66]],
 39:[[33,66,54],[44,93,71],[65,121,88],[100,149,112]],
 41:[[130,78,102],[185,121,151],[232,164,185],[252,201,212]],
 43:[[78,104,94],[110,138,123],[160,179,157],[202,208,186]]
};
function leaf(id,x,y){
 const p=leaves[id],cluster=rand(x>>1,y>>1,id*19);
 const veins=((x+3*y)%11===2||((x-y)%9===1&&cluster>.75));
 if(cluster>.86&&rand(x,y,id+121)>.46)return rgba(p[0],-12);
 if(veins)return rgba(p[1],-8);
 return fleck(p,x,y,id*14,2);
}
const planks={
 11:[[79,54,34],[113,77,46],[157,110,67],[195,147,96]],
 52:[[46,35,29],[70,53,41],[105,78,57],[143,109,79]]
};
function plank(id,f,x,y){
 const p=planks[id],coord=f===2?x:y,across=f===2?y:x,
   strip=Math.floor(coord/4),joint=(across+(strip%2)*7)%16;
 if(coord%4===0||joint===0)return rgba(p[0],-9);
 if(rand(across>>1,strip,id+177)>.68&&coord%4===2)return rgba(p[1],-5);
 if(joint===2&&coord%4===1)return rgba(p[0],-15);
 return fleck(p,x,y,id*12,2);
}
const minerals={
 18:[[20,22,23],[32,35,36],[48,50,51],[69,72,71]],
 19:[[92,65,50],[131,92,64],[174,122,80],[210,163,107]],
 83:[[113,104,94],[156,143,130],[207,190,166],[239,224,201]],
 84:[[118,79,22],[175,121,30],[226,176,48],[251,219,97]],
 95:[[93,59,39],[137,84,52],[189,121,73],[224,155,105]],
 96:[[106,83,24],[172,129,32],[223,178,51],[253,220,106]],
 97:[[90,23,28],[151,34,39],[208,48,48],[244,83,77]],
 98:[[25,43,95],[40,63,149],[62,95,205],[105,141,230]],
 99:[[18,82,101],[32,134,149],[55,187,193],[127,234,220]],
 100:[[17,75,44],[27,120,62],[48,169,89],[125,223,137]]
};
for(let i=101;i<=108;i++)minerals[i]=minerals[[18,19,95,96,97,98,99,100][i-101]];
function mineral(id,f,x,y){
 const host=id>=101?58:3,p=minerals[id],centers=[[3+(id%3),4],[11,6+(id%2)],[7,12]];
 for(let i=0;i<centers.length;i++){
   const [ax,ay]=centers[i],dx=x-ax,dy=y-ay;
   const dist=dx*dx+dy*dy+rand(x>>1,y>>1,id*97+i)*6;
   if(dist<(i===1?11:9)&&rand(x>>1,y>>1,id+301+i)>.16){
     const sparkle=rand(x,y,id*37)>.82;
     return rgba(p[sparkle?3:dist>5?1:2],sparkle?6:-3);
   }
 }
 return terrain(host,f,x,y);
}
const polished={
 56:[[95,51,39],[138,78,52],[177,110,69],[215,153,100]],
 110:[[18,39,100],[29,58,145],[46,79,192],[77,116,221]],
 111:[[13,85,54],[23,126,78],[41,174,107],[98,215,146]],
 112:[[28,103,105],[52,161,177],[94,216,223],[182,248,235]],
 113:[[96,53,40],[139,77,53],[184,115,75],[219,155,105]],
 114:[[137,106,26],[196,151,42],[232,197,78],[253,226,129]],
 115:[[90,101,107],[137,148,152],[190,196,194],[224,229,223]],
 116:[[25,27,30],[41,44,46],[60,64,66],[87,90,91]],
 117:[[99,16,22],[153,22,27],[206,33,36],[244,57,61]],
 135:[[28,31,34],[45,48,53],[68,71,77],[100,105,109]]
};
function metal(id,f,x,y){
 const p=polished[id],corner=(x<2||x>13)&&(y<2||y>13);
 if(corner)return rgba(p[0],-5);
 if((f===0?(y===1||y===14):(x===1||x===14))||
   ((id===112||id===115||id===135)&&(x===7||y===7)))return rgba(p[1],-9);
 if(rand(x>>2,y>>2,id*23)>.81&&x%5===3)return rgba(p[3],12);
 return fleck(p,x,y,id*79);
}
const cutBlock={
 8:[[92,49,43],[131,65,53],[167,83,64],[193,107,84]],
 24:[[144,127,91],[179,160,112],[212,193,143],[241,222,180]],
 53:[[83,85,84],[107,109,107],[132,134,132],[157,159,154]],
 54:[[139,126,91],[171,151,112],[209,191,146],[235,217,177]],
 72:[[40,25,28],[66,33,38],[94,44,44],[122,58,51]],
 74:[[35,23,27],[61,31,39],[89,43,46],[117,56,55]]
};
function masonry(id,f,x,y){
 const p=cutBlock[id],sand=id===24||id===54,nether=id===72||id===74,stone=id===53,
   h=sand||stone?5:4,w=sand||stone?8:7,row=Math.floor(y/h),
   pos=(x+(row%2?Math.floor(w/2):0))%w;
 if(y%h===0||pos===0)return rgba(p[0],-13);
 if(y%h===1||pos===1)return rgba(p[1],-10);
 if((id===54||id===74)&&f===1){
   const ring=Math.max(Math.abs(x-7.5),Math.abs(y-7.5));
   if(ring>3.5&&ring<5||x===7&&y>=5&&y<=10)return rgba(p[0],-10);
 }
 if(id===24&&f===1&&y>=10&&y<=11)return rgba(p[0],-6);
 return fleck(p,x,y,id*29);
}
const other={
 25:[[108,76,63],[145,105,84],[168,125,100],[193,146,116]],
 27:[[112,53,44],[151,70,52],[178,84,60],[203,105,74]],
 48:[[90,29,33],[142,47,43],[187,66,54],[228,90,70]],
 49:[[90,65,44],[135,99,63],[180,139,89],[210,172,121]],
 90:[[141,76,30],[179,110,46],[220,153,65],[250,207,115]]
};
function special(id,f,x,y){
 if(id===61||id===68||id===69){
   const p=id===61?ground[3]:id===68?[[26,29,32],[41,43,47],[57,58,62],[74,75,78]]:
     [[44,44,48],[65,65,69],[84,84,87],[108,107,108]];
   const band=Math.floor((y+1)/5),shift=(band*3+id)%7,skew=(x+shift)%7;
   if(y%5===0||skew===0||skew===1&&y%5===4)return rgba(p[0],-9);
   return fleck(p,x,y,id*31+Math.floor(rand(Math.floor((x+shift)/7),band,id*271)*13),2);
 }
 if(id===9){
   const border=x===0||x===15||y===0||y===15;
   if(border)return rgba([146,201,209]);
   const reflection=(x===3&&y>2&&y<11)||(y===3&&x>3&&x<10)||(x===12&&y>8&&y<13);
   return reflection?rgba([233,249,248]):fleck([[157,191,200],[184,216,222],[211,231,231],[231,243,240]],x,y,9,4);
 }
 if(id===22||id===23){
   const p=id===22?[[83,143,177],[131,184,212],[169,214,229],[201,234,241]]:
                  [[83,112,152],[121,152,182],[155,185,213],[191,212,226]];
   if((x===5&&y>=3&&y<=11)||(y===10&&x>=5&&x<=12)||(x===11&&y>=10&&y<=13))return rgba(p[0],2);
   return fleck(p,x,y,id*49);
 }
 if(id===44){
   if(f===0||f===2){
     if(Math.max(Math.abs(x-7.5),Math.abs(y-7.5))>5)return rgba([42,93,41]);
     return fleck([[62,115,39],[84,139,49],[108,166,63],[144,188,82]],x,y,44,2);
   }
   if(y%6===4&&x%5===2)return rgba([203,204,133]);
   if(x%5===0)return rgba([37,97,39]);
   return fleck([[42,91,36],[61,115,45],[79,139,52],[102,159,69]],x,y,44,2);
 }
 if(id===10||id===90){
   const p=id===10?[[128,86,51],[184,141,79],[230,193,124],[255,233,167]]:other[90];
   if(rand(x>>2,y>>2,id+10)>.75&&rand(x,y,196)>.47)return rgba(p[3],8);
   return fleck(p,x,y,id*31);
 }
 if(id===67){
   if(f!==1)return fleck([[44,44,48],[65,65,69],[84,84,87],[108,107,108]],x,y,67,2);
   if(x%4===1&&rand(x>>2,y>>1,67)>.27)return rgba([34,38,40]);
   return fleck([[44,44,48],[65,65,69],[84,84,87],[108,107,108]],x,y,67,3);
 }
 if(id===75||id===76){
   if(f===2)return terrain(50,f,x,y);
   if(f===1&&y>3)return terrain(50,f,x,y);
   const p=id===75?[[68,26,42],[103,43,56],[139,63,77],[177,88,109]]:
                   [[27,75,74],[43,115,105],[66,153,131],[100,190,158]];
   return fleck(p,x,y,id*21,2);
 }
 if(other[id])return fleck(other[id],x,y,id*13);
 return null;
}
engine.paint=function(id,face,x,y){
 x&=15;y&=15;
 if(minerals[id])return mineral(id,face,x,y);
 if(logs[id])return wood(id,face,x,y);
 if(leaves[id])return leaf(id,x,y);
 if(planks[id])return plank(id,face,x,y);
 if(polished[id])return metal(id,face,x,y);
 if(cutBlock[id])return masonry(id,face,x,y);
 const t=terrain(id,face,x,y);if(t)return t;
 const o=special(id,face,x,y);if(o)return o;
 return previous(id,face,x,y);
};
engine.version='5.4-original-classic-materials';
window.MineWorldClassicMaterials=Object.freeze({version:engine.version,pixels:16,source:'independent procedural pixel art'});
})();