/* MineWorld 6.7 – independently drawn 16×16 material silhouettes and details.
 * Familiar voxel material language, not copied Minecraft bitmap data or source.
 * Wraps the existing texture painter; block IDs, crop masks and atlas unchanged.
 */
(()=>{
'use strict';
const engine=window.MineWorldPixelMaterials;if(!engine)return;
const old=engine.paint;
const cap=v=>Math.max(0,Math.min(255,Math.round(v)));
const color=(p,d=0,a=255)=>[cap(p[0]+d),cap(p[1]+d),cap(p[2]+d),a];
function noise(x,y,s){
 let n=Math.imul((x|0)+1193,0x9e3779b1)^Math.imul((y|0)+977,0x85ebca6b)^Math.imul(s+433,0xc2b2ae35);
 n=Math.imul(n^(n>>>16),0x7feb352d);n=Math.imul(n^(n>>>15),0x846ca68b);
 return ((n^(n>>>16))>>>0)/4294967295;
}
function palette(p,x,y,seed){
 const block=noise(x>>2,y>>2,seed)*.52+noise(x>>1,y>>1,seed+83)*.32+noise(x,y,seed+149)*.16;
 const idx=block<.26?0:block<.48?1:block<.74?2:3;
 return color(p[idx],noise(x,y,seed+241)>.983?9:0);
}
const dirtP=[[75,48,32],[97,62,39],[121,78,48],[151,102,65]],
 grassP=[[48,101,29],[64,122,37],[83,141,41],[103,159,50]],
 stoneP=[[93,94,92],[117,119,116],[131,134,132],[158,159,156]],
 gravelP=[[65,66,66],[96,98,97],[128,128,126],[166,162,158]],
 cobbleP=[[58,63,62],[90,96,93],[121,127,122],[150,155,150]],
 oakP=[[83,59,33],[119,84,47],[160,113,63],[190,150,91]],
 darkP=[[47,33,27],[75,52,39],[101,73,51],[133,96,69]],
 brickP=[[100,48,40],[130,59,44],[168,79,56],[195,106,81]],
 stoneBrickP=[[76,81,81],[104,112,109],[131,138,134],[158,163,158]];
function earth(x,y){
 const gravel=noise(x>>1,y>>1,241)> .95&&y%3===2;
 if(gravel)return color([162,142,108],(noise(x,y,97)-.5)*15);
 if(noise(x>>1,y>>1,170)>.84&&((x+2*y)%5===0))return color(dirtP[0],-5);
 return palette(dirtP,x,y,42);
}
function grassy(x,y,face){
 if(face===2)return earth(x,y);
 const grass=()=> {
  const a=noise(x>>1,y>>1,511),b=noise(x,y,653);
  if(a>.82&&(x*3+y)%5===0)return color([125,169,54]);
  if(a<.22&&(x+y)%4===0)return color([41,103,29]);
  return palette(grassP,x,y,676);
 };
 if(face===0)return grass();
 // Uneven green fringes at the top of block sides, individual hanging blades.
 const blade=2+(noise(x>>1,0,52)>.58?1:0)+(noise(x,0,81)>.77?1:0);
 if(y<blade)return grass();
 if(y===blade&&noise(x,y,55)>.31)return grass();
 if(y===blade+1&&noise(x,0,121)>.82)return grass();
 return earth(x,y);
}
function rock(x,y,deep=false){
 const p=deep?[[40,45,50],[57,64,70],[74,83,87],[99,105,109]]:stoneP;
 const tile=noise(x>>2,y>>2,deep?58:3);
 const fine=noise(x>>1,y>>1,deep?111:151);
 const edge=(x%5===0&&y%4===2||x%7===2&&y%5===0)&&tile>.59;
 if(edge)return color(p[0],0);
 if(fine<.08&&(x+y)%3===1)return color(p[3],5);
 if(fine>.88&&x%4===1)return color(p[0],-2);
 return palette(p,x,y,deep?109:108);
}
function cobble(x,y){
 // Intentionally jagged interlocking rock outlines, not repeated square grids.
 const ybounds=[0,5,10,16],row=y<5?0:y<10?1:2;
 const width=[7,6,8][row],off=[2,6,1][row];
 const xx=(x+off)%width,yy=y-ybounds[row];
 const hash=noise((x+off)/width|0,row,771);
 const crack=yy===0||xx===0||(yy===1&&xx===1&&hash>.47)||(yy===ybounds[row+1]-ybounds[row]-1&&xx===width-1&&hash>.6);
 if(crack)return color(cobbleP[0],-8);
 if(yy===1||xx===1)return color(cobbleP[1],-5);
 const chip=noise(x>>1,y>>1,515);
 if(chip>.81&&(x+y)%3===1)return color(cobbleP[3],7);
 if(chip<.14)return color(cobbleP[1],-4);
 return palette(cobbleP,x,y,200+row*5);
}
function wood(x,y,dark=false){
 const p=dark?darkP:oakP,row=y>>2,dx=(x+(row%2?7:1))%16;
 const depth=y%4;
 if(depth===0)return color(p[0],-9);
 if(depth===1)return color(p[3],-2);
 if(dx===0&&depth===3)return color(p[0],-12);
 const n=noise(x>>1,row,dark?52:11);
 if(depth===2&&((x+Math.floor(n*3))%7===2))return color(p[1],-6);
 if(depth===3&&n>.7&&x%5===1)return color(p[3],0);
 return palette(p,x,y,dark?343:344);
}
function brick(id,x,y){
 const p=id===8?brickP:id===53?stoneBrickP:id===72?
  [[35,17,22],[63,28,35],[82,34,40],[108,45,50]]:
  [[141,143,105],[173,180,134],[203,208,159],[226,230,187]];
 const row=y>>2,xx=(x+(row%2?4:0))%8,yy=y%4;
 if(yy===0||xx===0)return color(p[0],-12);
 if(yy===1||xx===1)return color(p[1],0);
 if(noise(x>>1,y>>1,id*77)>.88&&xx>2)return color(p[0],-2);
 if(noise(x,y,id*109)>.93)return color(p[3],6);
 return palette(p,x,y,id*8);
}
const metals={
 18:[37,37,37],19:[194,152,123],83:[223,213,183],84:[220,159,37],
 95:[188,119,72],96:[231,189,52],97:[182,30,39],98:[37,66,190],
 99:[43,179,189],100:[34,177,86],101:[37,37,37],102:[194,152,123],
 103:[188,119,72],104:[231,189,52],105:[182,30,39],106:[37,66,190],
 107:[43,179,189],108:[34,177,86]
};
function ore(id,face,x,y){
 const deep=id>=101&&id<=108,nether=id===83||id===84;
 const p=metals[id];
 const host=nether?old(50,face,x,y):rock(x,y,deep);
 // Off-center crystal patches with 1px facets. Layout varies by ore species.
 const nodes=[[3,2,2],[11,3,2],[6,8,3],[12,11,2],[3,13,2]];
 const offset=id*3+face*17;
 let mineral=-1,radius=99;
 for(let i=0;i<nodes.length;i++){
  const [px,py,r]=nodes[i],cx=(px+(id+i)%3-1+16)%16,cy=(py+(id*3+i)%3-1+16)%16;
  const d=Math.abs(x-cx)+Math.abs(y-cy)*.88+(noise(x>>1,y>>1,offset+i)>.89?1:0);
  if(d<r+.8&&d<radius){radius=d;mineral=i;}
 }
 if(mineral<0)return host;
 const outline=radius>nodes[mineral][2]-.1,crystalline=((x+y+mineral)%4===0);
 if(id===18||id===101)return color(p,outline?-11:crystalline?12:-1);
 const extra=id===97||id===105?0:crystalline?23:0;
 return color(p,(outline?-27:extra)+(noise(x,y,id*31)>.89?8:0));
}
function furnace(face,x,y){
 const base=rock(x,y,false);
 if(face!==1){
  const tile=noise(x>>2,y>>2,159);
  if(y===7&&x>=3&&x<=12)return color([63,65,64],tile*12);
  return base;
 }
 const atEdge=x<2||x>13||y<2||y>13;
 if(atEdge)return color([112,113,111],noise(x,y,20)*14);
 const mouth=x>=4&&x<=11&&y>=5&&y<=11;
 if(mouth){
  if(x===4||x===11||y===5||y===11)return color([65,67,65],-5);
  return color([26,28,28],(noise(x,y,128)-.5)*11);
 }
 if(y<=3&&x>=5&&x<=10)return color([84,88,83],-2);
 return base;
}
function crafting(face,x,y){
 const woodBase=wood(x,y,false);
 const line=(n,z)=>Math.abs(n-z)<1;
 if(face===0){
  const border=x===0||x===15||y===0||y===15;
  if(border)return color([84,59,35],-5);
  if(x===1||x===14||y===1||y===14)return color([165,117,68],5);
  if(line(x,7)||line(y,7))return color([88,61,38],-9);
  const craftGrid=(x<7?0:1)+(y<7?0:2);
  const p=[[176,132,79],[149,105,60],[156,115,74],[184,137,84]][craftGrid];
  return color(p,(noise(x>>1,y>>1,168)-.5)*20);
 }
 if(x===0||x===15)return color([67,49,31],-7);
 if(x===1||x===14)return color([155,112,69]);
 if(y<3)return color([184,137,75],noise(x,y,199)*9);
 if(y>13)return color([90,62,37],-6);
 // Front tabletop tools and compartments remain readable at 16px.
 if(y===6||y===10)return color([94,62,35],-7);
 if((x>=5&&x<=10)&&(y>=7&&y<=9))return color([112,79,47],-11);
 if(x===7&&y>=3&&y<=13)return color([89,61,38],-1);
 return woodBase;
}
function chest(id,face,x,y){
 const open=id===120;
 if(face===0){
  if(open&&x>=2&&x<=13&&y>=2&&y<=13)return color([46,38,23],(noise(x>>2,y>>2,id)-.5)*9);
  if(x===0||y===0||x===15||y===15)return color([68,47,26],-5);
  if(y===7||y===8)return color([105,75,43]);
  return wood(x,y,false);
 }
 if(x<=1||x>=14||y<=1||y>=14)return color([59,41,26],-1);
 if(y===5||y===10)return color([93,58,29],-7);
 if(x===7||x===8){
  if(y>=5&&y<=9)return color([191,176,102],y===5?18:-4);
 }
 if(open&&y<5)return color([51,35,25],0);
 return color([137,86,42],(noise(x>>1,y>>1,id*27)-.5)*22);
}
function hay(face,x,y){
 if(face!==1){
  const band=x===7||x===8;
  return band?color([151,112,41],-4):color([212,180,65],(noise(x,y,60)-.5)*28);
 }
 if(y===6||y===7)return color([119,87,39],-4);
 if(x%4===0)return color([155,116,45],-6);
 if(x%4===1)return color([239,199,65],-8);
 return color([197,158,54],(noise(x,y,117)-.5)*21);
}
function cactus(face,x,y){
 if(face!==1){
  const d=Math.max(Math.abs(x-7.5),Math.abs(y-7.5));
  if(d>6)return color([44,102,38],0);
  if(d>4)return color([52,125,44],0);
  return color([61,144,51],(noise(x,y,44)-.5)*12);
 }
 if(x===0||x===15)return color([32,81,32],0);
 if(x===1||x===14)return color([46,109,42],-5);
 if((x===5||x===10)&&y%5===2)return color([193,183,90]);
 if(x%4===1)return color([46,118,41],-3);
 return color([59,139,48],(noise(x>>1,y>>1,224)-.5)*18);
}
const touched=[1,2,3,5,8,11,18,19,20,32,44,53,60,61,72,92,119,120,130,168,
 ...Object.keys(metals).map(Number),51];
function paint(id,face,x,y){
 const before=old(id,face,x,y);
 if(!before||id<1||id>169||!touched.includes(id))return before;
 if(before[3]===0)return before;
 x=(x|0)&15;y=(y|0)&15;
 if(id===1)return grassy(x,y,face);
 if(id===2)return earth(x,y);
 if(id===3)return rock(x,y,false);
 if(id===61)return cobble(x,y);
 if(id===11)return wood(x,y,false);
 if(id===8||id===53||id===72||id===130)return brick(id,x,y);
 if(metals[id])return ore(id,face,x,y);
 if(id===20)return furnace(face,x,y);
 if(id===168)return crafting(face,x,y);
 if(id===119||id===120)return chest(id,face,x,y);
 if(id===60)return hay(face,x,y);
 if(id===44)return cactus(face,x,y);
 if(id===92)return palette(gravelP,x,y,67);
 if(id===5||id===32){
  // Keep bark species identity, enhance cut rings and birch side scars.
  if(id===32&&face===1&&(y%4===1||y%5===2)&&x>1&&x<14&&noise(x>>1,y>>1,913)>.67)
   return color([58,54,49],(noise(x,y,916)-.5)*13);
  if(face!==1&&Math.max(Math.abs(x-7.5),Math.abs(y-7.5))<6.5&&
     Math.floor(Math.hypot(x-7.5,y-7.5)*1.8+noise(x>>1,y>>1,id)*.6)%3===0)
   return color(id===32?[143,123,88]:[111,74,43],(noise(x,y,id)-.5)*17);
  return before;
 }
 if(id===51&&noise(x>>2,y>>2,51)>.69&&
    ((x+2*y)%12===0||(2*x-y+16)%15===0))return color([66,39,86],5);
 return before;
}
engine.paint=paint;engine.version='6.7-handcrafted-block-shapes';
window.MineWorldTexturePrecision=Object.freeze({
 version:engine.version,size:16,originalArt:true,
 alteredIds:Object.freeze([...new Set(touched)].sort((a,b)=>a-b)),
 paint
});
})();