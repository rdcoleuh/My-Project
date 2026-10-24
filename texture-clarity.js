/* MineWorld 6.0 — sharper original 16x16 environmental tile detailing.
 * Independent mathematical patterns; no copied Minecraft assets/pixel maps.
 * All overridden faces remain exactly 16 source pixels wide and high. */
(()=>{
'use strict';
const m=window.MineWorldPixelMaterials;if(!m)return;
const old=m.paint,c=n=>Math.max(0,Math.min(255,Math.round(n)));
function h(x,y,s){let t=Math.imul((x|0)+1473,1597334677)^Math.imul((y|0)+392,3812015801)^Math.imul((s|0)+61,95868997);t=Math.imul(t^(t>>>15),2246822519);return ((t^(t>>>13))>>>0)/4294967295}
function color(rgb,shade=0){return [c(rgb[0]+shade),c(rgb[1]+shade),c(rgb[2]+shade),255]}
function choose(p,x,y,s,area=3){const v=h(Math.floor(x/area),Math.floor(y/area),s)*.6+h(x,y,s+99)*.4;return color(p[v<.19?0:v<.47?1:v<.78?2:3],h(x,y,s+12)>.95?8:0)}
const grass=[[38,93,31],[55,113,35],[75,137,46],[103,161,52]];
const earth=[[71,48,33],[101,69,44],[133,91,58],[159,113,75]];
const stone=[[86,87,86],[110,110,109],[131,133,131],[156,156,151]];
const sand=[[170,156,113],[200,181,131],[225,207,159],[242,229,187]];
const mortar=[78,56,50],brick=[[107,57,44],[141,68,51],[170,85,58],[200,117,82]];
const planks=[[91,62,36],[119,83,51],[158,117,75],[187,148,104]];
const gravel=[[70,73,72],[105,106,102],[133,133,130],[179,174,168]];
function grassTile(face,x,y){
 if(face===0){
   const vein=h(x>>1,y>>1,351);
   if(vein>.76&&(x+y*3)%7<2)return color([104,159,57]);
   if(vein<.11&&y%3===0)return color([29,80,25]);
   return choose(grass,x,y,110,2);
 }
 if(face===2)return choose(earth,x,y,204,3);
 const canopy=2+Math.floor(h(x>>1,0,418)*3),fringe=h(x,y,411)>.7&&y<canopy+2;
 if(y<canopy||fringe)return choose(grass,x,y,410,2);
 if(y===canopy+2&&h(x,y,419)>.8)return color([87,98,43]);
 return choose(earth,x,y,201,3);
}
function dirtTile(x,y){
 const root=h(x>>2,y>>2,201)>.71&&(x+3*y)%9===1;
 if(root)return color([77,70,49]);
 const pebble=h(x,y,281)>.935;
 if(pebble)return color([141,130,111]);
 return choose(earth,x,y,202,3);
}
function stoneTile(x,y){
 const crack=h(x>>2,y>>2,150)>.72&&(x%4===1||y%5===0)&&h(x,y,151)>.4;
 if(crack)return color([72,76,74]);
 const grain=h(x,y,199)>.966;
 if(grain)return color([171,172,168]);
 return choose(stone,x,y,145,3);
}
function sandTile(x,y){
 const spot=h(x,y,91);
 if(spot>.945)return color([154,141,105]);
 if(spot<.045)return color([250,238,191]);
 return choose(sand,x,y,88,4);
}
function brickTile(x,y){
 const row=Math.floor(y/4),offset=row%2?4:0,col=(x+offset)%8;
 if(y%4===0||col===0)return color(mortar,-8);
 if(y%4===1||col===1)return color([114,70,56]);
 if(h(x>>1,row,880)>.8&&y%4===2)return color([198,123,90]);
 return choose(brick,x,y,828,2);
}
function plankTile(face,x,y){
 const a=face===1?y:x,b=face===1?x:y;
 const row=Math.floor(a/4),off=(row%2)*8;
 if(a%4===0)return color([80,50,28]);
 if((b+off)%16===0)return color([87,53,27]);
 if(a%4===1)return choose(planks,x,y,770,2);
 if(h(b>>2,row,811)>.58&&b%4===1)return color([90,57,30]);
 return choose(planks,x,y,702,3);
}
function rubbleTile(x,y){
 const row=Math.floor(y/5),off=(row%2)*4,r=(x+off)%7;
 const joint=(y+Math.floor(h(x>>2,y>>2,63)*2))%5===0||r===0;
 if(joint)return color([62,64,62]);
 const bevel=y%5===1||r===1;
 if(bevel)return color([94,96,93]);
 return choose(stone,x,y,61+row+(r>4?7:0),3);
}
function gravelTile(x,y){
 const pebble=h(x>>1,y>>1,514),grain=h(x,y,514);
 if(pebble>.77&&grain>.45)return color([71,73,75]);
 if(grain>.90)return color([194,191,183]);
 return choose(gravel,x,y,518,2);
}
function furnaceTile(face,x,y){
 const iron=[[46,45,44],[79,77,74],[117,113,106],[146,141,133]];
 if(face===0)return choose(stone,x,y,120,3);
 if(face===2)return stoneTile(x,y);
 if(face===1){
   const rim=x<2||x>13||y<2||y>13;
   if(rim)return choose(iron,x,y,81,3);
   const upper=y<7,inside=x>=4&&x<=11;
   if(upper&&inside)return color(y===3||x%3===0?[31,31,32]:[64,58,54]);
   if(y>=9&&y<=13&&inside){
    if(y===9||y===13||x===4||x===11)return color([32,30,32]);
    const embers=h(x>>1,y>>1,305)>.78;
    return color(embers?[204,99,30]:[32,34,36]);
   }
   return choose(iron,x,y,170,3);
 }
 return choose(iron,x,y,59,3);
}
function craftingTile(face,x,y){
 if(face===0){
   const frame=x<2||x>13||y<2||y>13;
   if(frame)return choose(planks,x,y,168,3);
   if(x===7||y===8)return color([81,59,39]);
   const square=(Math.floor((x-2)/3)+Math.floor((y-2)/3))%2;
   if(square===0&&h(x,y,169)>.7)return color([183,154,101]);
   return choose([[108,83,53],[148,119,79],[174,145,101],[210,175,123]],x,y,172,3);
 }
 if(face===2)return plankTile(1,x,y);
 if(x===0||x===15||y===0||y===15)return color([68,46,27]);
 if(y>=2&&y<=7&&x>=3&&x<=12){
   if(x===4||x===11||y===3||y===7)return color([69,64,53]);
   return choose([[57,78,69],[82,103,82],[109,131,103],[145,157,126]],x,y,265,2);
 }
 if(x===7||x===8||y===9)return color([95,65,41]);
 return plankTile(1,x,y);
}
function farmlandTile(id,face,x,y){
 if(face===2)return dirtTile(x,y);
 if(face===0){
   if(x%4===0)return color(id===138?[49,49,37]:[60,47,33]);
   if(x%4===1)return color(id===138?[79,66,48]:[100,74,51]);
   return choose(id===138?[[56,52,38],[81,70,48],[95,83,61],[111,94,72]]:
                     [[78,49,31],[111,77,49],[142,97,62],[162,118,78]],x,y,id*33,3);
 }
 if(y<3)return farmlandTile(id,0,x,y);
 return dirtTile(x,y);
}
function bedTile(face,x,y){
 if(face===0){
   if(y<4)return color(x<2||x>13?[138,139,134]:[225,226,207]);
   if(x<1||x>14)return color([119,31,39]);
   const threads=h(x>>1,y>>1,169)>.76&&x%3===1;
   return color(threads?[185,47,55]:[162,31,41]);
 }
 if(face===2)return plankTile(1,x,y);
 if(y<5)return color([139,36,47]);
 if(y>12&&x%5<2)return color([107,69,40]);
 return choose(planks,x,y,169,3);
}
const replace=new Set([1,2,3,4,8,11,20,61,92,137,138,168,169]);
m.paint=function(id,face,x,y){
 x=x&15;y=y&15;
 if(id===1)return grassTile(face,x,y);
 if(id===2)return dirtTile(x,y);
 if(id===3)return stoneTile(x,y);
 if(id===4)return sandTile(x,y);
 if(id===8)return brickTile(x,y);
 if(id===11)return plankTile(face,x,y);
 if(id===20)return furnaceTile(face,x,y);
 if(id===61)return rubbleTile(x,y);
 if(id===92)return gravelTile(x,y);
 if(id===137||id===138)return farmlandTile(id,face,x,y);
 if(id===168)return craftingTile(face,x,y);
 if(id===169)return bedTile(face,x,y);
 return old(id,face,x,y);
};
m.version='6.0-original-16px-material-detail';
window.MineWorldTextureClarity=Object.freeze({ids:[...replace],version:m.version,pixelSize:16});
})();