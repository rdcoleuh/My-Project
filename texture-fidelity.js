/* MineWorld 6.1 — independent fidelity pass for procedural 16×16 block textures.
 * Inspired by broadly recognizable voxel-building material conventions:
 * bark and end-grain, leaf clusters, rock-host ores, sediment, Nether/End
 * and functional blocks. NO Minecraft/Mojang image pixels or masks are used.
 * Ids retain their earlier mappings, inventories and world saves.
 */
(()=>{
'use strict';
const engine=window.MineWorldPixelMaterials;if(!engine)return;
const original=engine.paint;
const LOGS={
 5:{base:[104,79,53],core:[167,132,85],stripe:[63,49,37]},
 15:{base:[114,88,67],core:[192,153,101],stripe:[72,52,40]},
 30:{base:[73,58,49],core:[127,103,73],stripe:[48,37,33]},
 32:{base:[197,196,172],core:[180,164,117],stripe:[54,53,47],birch:true},
 34:{base:[101,99,97],core:[164,122,84],stripe:[72,66,59]},
 36:{base:[117,86,61],core:[184,145,101],stripe:[69,52,38]},
 38:{base:[89,52,46],core:[183,112,85],stripe:[61,32,32]},
 40:{base:[72,51,60],core:[225,171,172],stripe:[46,36,45]},
 42:{base:[152,151,144],core:[179,168,144],stripe:[98,93,89]},
 78:{base:[117,54,79],core:[181,94,120],stripe:[75,32,53]},
 80:{base:[47,104,106],core:[93,186,172],stripe:[29,65,67]}
};
const LEAVES={
 6:[68,126,42],12:[169,63,37],13:[177,105,29],14:[185,152,48],
 31:[45,97,42],33:[71,137,53],35:[114,133,43],37:[48,109,42],
 39:[67,99,66],41:[219,150,175],43:[140,159,135],
 79:[151,44,64],81:[44,114,121]
};
const ORES={
 18:{metal:[39,43,45],rock:3},19:{metal:[195,133,94],rock:3},
 83:{metal:[239,224,200],rock:50},84:{metal:[232,178,57],rock:50},
 95:{metal:[200,129,79],rock:3},96:{metal:[234,189,49],rock:3},
 97:{metal:[198,38,41],rock:3},98:{metal:[45,84,204],rock:3},
 99:{metal:[46,197,190],rock:3},100:{metal:[42,192,114],rock:3},
 101:{metal:[41,43,46],rock:58},102:{metal:[195,137,100],rock:58},
 103:{metal:[199,129,77],rock:58},104:{metal:[237,181,49],rock:58},
 105:{metal:[190,39,43],rock:58},106:{metal:[56,76,198],rock:58},
 107:{metal:[53,192,182],rock:58},108:{metal:[45,189,111],rock:58}
};
const CROP={
 139:{kind:0,stage:0},140:{kind:0,stage:1},141:{kind:0,stage:2},142:{kind:0,stage:3},
 143:{kind:1,stage:0},144:{kind:1,stage:1},145:{kind:1,stage:2},146:{kind:1,stage:3},
 147:{kind:2,stage:0},148:{kind:2,stage:1},149:{kind:2,stage:2},150:{kind:2,stage:3},
 151:{kind:3,stage:0},152:{kind:3,stage:1},153:{kind:3,stage:2},154:{kind:3,stage:3}
};
const RGB={
 obsidian:[[20,16,29],[28,24,38],[39,29,49],[59,35,65]],
 blackstone:[[34,34,39],[46,46,51],[60,60,65],[78,78,82]],
 basalt:[[46,48,50],[61,64,66],[82,83,85],[99,101,104]],
 deepslate:[[40,46,49],[56,63,68],[73,80,85],[96,99,103]],
 netherrack:[[72,29,30],[93,34,39],[118,43,44],[142,55,54]],
 endstone:[[163,165,124],[191,190,151],[216,215,169],[230,229,187]],
 purpur:[[116,79,121],[148,101,146],[171,124,168],[192,148,182]],
 soul:[[53,49,44],[71,62,53],[87,78,67],[106,92,79]],
 sand:[[166,151,113],[190,177,133],[220,202,159],[236,224,188]],
 gravel:[[71,70,70],[100,100,100],[130,127,125],[166,163,160]],
 mud:[[46,47,44],[63,61,55],[77,74,65],[91,85,73]]
};
const MINERALS={
 110:[37,76,179],111:[36,166,95],112:[61,185,202],
 113:[177,111,68],114:[221,181,57],115:[189,196,198],
 116:[49,49,54],117:[164,31,35],135:[58,52,62]
};
const UTILS=new Set([10,20,53,54,55,59,60,69,72,74,85,86,88,90,91,109,110,111,112,113,114,115,116,117,
 118,119,120,125,129,130,131,132,135,136,155,156,157,158,159,160,161,162,163,164,165,166,167]);
const BLOCKS=new Set([...Object.keys(LOGS),...Object.keys(LEAVES),...Object.keys(ORES),...Object.keys(CROP),
 ...Object.keys(MINERALS),...UTILS,21,22,23,24,25,27,28,29,46,47,50,51,58,62,63,64,65,67,68,70,71,73,75,76,77,82,87,89,92,93,94,121,122,123,124,126,127,128,133,134]);
const clamp=n=>Math.max(0,Math.min(255,Math.round(n)));
function rand(x,y,seed){
 let h=Math.imul((x|0)+137,374761393)^Math.imul((y|0)+911,668265263)^Math.imul((seed|0)+43,1274126177);
 h=Math.imul(h^(h>>>13),1274126177);
 return ((h^(h>>>16))>>>0)/4294967295;
}
function out(c,n=0){return [clamp(c[0]+n),clamp(c[1]+n),clamp(c[2]+n),255]}
function tint(c,v){return out(c,Math.round(v))}
function blend(a,b,t){return out(a.map((v,i)=>v*(1-t)+b[i]*t))}
function shade(c,x,y,seed,scale=4,range=20){
 const macro=rand(x>>2,y>>2,seed)*.43+rand(x>>1,y>>1,seed+47)*.38+rand(x,y,seed+13)*.19;
 const stagger=Math.round((macro-.5)*range/5)*5;
 return tint(c,stagger+(rand(x,y,seed+93)>.979?9:0));
}
function sample(p,x,y,s,size=3){
 const n=rand(Math.floor(x/size),Math.floor(y/size),s)*.62+rand(x,y,s+51)*.38;
 const i=n<.20?0:n<.46?1:n<.79?2:3;
 return shade(p[i],x,y,s+217,2,5);
}
function ring(id,x,y,top){
 const spec=LOGS[id],cx=x-7.5,cy=y-7.5;
 if(top){
  const ellipse=Math.max(Math.abs(cx)*(1+rand(id,0,41)*.11),Math.abs(cy)*.93);
  const n=rand(x>>1,y>>1,id*31);
  const band=(Math.floor(ellipse/1.65)+Math.floor(n*1.5))%3;
  const base=band===1?spec.stripe:band===2?spec.core:blend(spec.core,spec.base,.52);
  const centre=ellipse<1.8?[69,51,38]:base;
  return shade(centre,x,y,id*101,3,13);
 }
 if(spec.birch){
  // Bright smooth birch-like trunk with genuinely dark, irregular horizontal flecks.
  const scar=rand(x>>1,Math.floor(y/3),id*8)>.71&&(y%3===0||y%4===2)&&x>1&&x<15;
  const chip=x===0||x===15||x===1||x===14;
  return shade(scar?spec.stripe:chip?[137,137,124]:spec.base,x,y,id*9,2,11);
 }
 const fibre=rand(Math.floor(x/3),y>>2,id*14);
 const trench=(x+Math.floor(rand(x>>2,y>>2,id*12)*2))%5===0;
 const crack=trench&&fibre>.21;
 const fleck=rand(x,y,id*14+11)>.94;
 const c=crack?spec.stripe:fleck?spec.core:fibre>.54?blend(spec.base,spec.stripe,.15):spec.base;
 return shade(c,x,y,id*7,3,17);
}
function leaf(id,x,y){
 const base=LEAVES[id];
 // Coherent clumps with 2×2 silhouettes, tiny gaps and sparse highlighted pixels.
 const macro=rand(x>>2,y>>2,id*62),mid=rand(x>>1,y>>1,id*31);
 const edge=rand(x,y,id*74);
 const n=macro*.45+mid*.45+edge*.1;
 const bright=n>.56,deep=n<.29;
 const gaps=(mid<.12&&edge>.62)||(macro<.16&&x%3===0&&y%2===1);
 const autumn=[12,13,14].includes(id),cherry=id===41;
 return shade(gaps?blend(base,[20,31,24],.5):
   deep?blend(base,[18,30,18],autumn?.23:.36):
   bright?blend(base,[232,231,174],cherry?.19:.14):base,x,y,id*18,2,11);
}
function ore(id,x,y,face){
 const def=ORES[id],rock=def.rock,base=rock===3?original(3,face,x,y):rock===58?original(58,face,x,y):original(50,face,x,y);
 const g=rand(Math.floor(x/4),Math.floor(y/4),id*5+47),
       link=rand(Math.floor((x+2)/3),Math.floor((y+1)/3),id*5+18),
       center=rand(Math.floor(x/2),Math.floor(y/2),id*5+3);
 const vein=(g>.58&&link>.29)||(g>.32&&link>.84)||(center>.90&&g>.38);
 if(!vein)return base;
 const rim=(center<.29)||(x%4===0&&g<.66);
 const mineral=def.metal;
 return rim?blend(mineral,base,.36):shade(mineral,x,y,id*12,2,38);
}
function masonry(p,x,y,id,opt={}){
 const {height=5,width=8,stagger=true}=opt;
 const row=Math.floor(y/height),offset=stagger&&row%2?Math.floor(width/2):0;
 const col=(x+offset)%width,vertical=col===0,horizontal=y%height===0;
 if(vertical||horizontal)return shade(p[0],x,y,id*51,2,9);
 if(col===1||y%height===1)return shade(p[1],x,y,id*73,2,8);
 const fleck=rand(x>>1,y>>1,id*74);
 const c=fleck<.31?p[2]:fleck>.75?p[3]:blend(p[2],p[3],.4);
 return shade(c,x,y,id*20,2,10);
}
function netherRock(id,x,y,face){
 if([50,65].includes(id)){
  const p=RGB.netherrack,g=rand(x>>2,y>>2,id*9),vein=(x+Math.floor(y/3))%7===0&&g>.47;
  const c=vein?p[0]:g<.23?p[1]:g>.77?p[3]:p[2];
  return shade(c,x,y,id*56,3,17);
 }
 if(id===51)return sample(RGB.obsidian,x,y,id,4);
 if(id===58)return sample(RGB.deepslate,x,y,id,3);
 if(id===67){
  if(face!==1){
   const r=Math.max(Math.abs(x-7.5),Math.abs(y-7.5)),band=(Math.floor(r/2)+Math.floor(rand(x>>1,y>>1,id)*2))%3;
   return shade(RGB.basalt[band+1],x,y,id*23,3,9);
  }
  const line=(x+Math.floor(rand(x>>2,y>>1,id)*2))%4===0;
  return shade(line?RGB.basalt[0]:RGB.basalt[2],x,y,id*17,2,18);
 }
 if(id===68)return sample(RGB.blackstone,x,y,id,3);
 if(id===69)return masonry(RGB.blackstone,x,y,id,{height:6,width:7});
 if(id===70){
  const p=RGB.soul,pattern=rand(x>>2,y>>2,702),
  hollow=(x>3&&x<7&&y>6&&y<12)||(x>9&&x<13&&y>6&&y<12);
  return shade(hollow?p[0]:pattern>.62?p[3]:p[2],x,y,id*9,2,13);
 }
 if(id===71)return sample(RGB.soul,x,y,id,2);
 if(id===72||id===74)return masonry([[51,23,27],[75,31,37],[92,39,42],[122,52,53]],x,y,id,{height:4,width:8});
 if(id===75||id===76){
  const crimson=id===75;
  if(face===2)return netherRock(50,x,y,face);
  if(face===1&&y>2)return netherRock(50,x,y,face);
  const p=crimson?[[69,26,43],[104,38,55],[137,53,69],[169,77,91]]:
                  [[26,78,80],[42,108,107],[59,151,139],[84,191,164]];
  return sample(p,x,y,id,2);
 }
 if(id===88){
  const fissure=(rand(x>>2,y>>2,id*31)>.36)&&((x+2*y)%7<2||(2*x+y)%9<2);
  if(fissure)return shade([237,124,28],x,y,id,2,45);
  return sample([[40,31,29],[64,42,31],[82,53,32],[117,72,32]],x,y,id,3);
 }
 if(id===91){
  const glint=rand(x>>1,y>>1,id*21)>.88&&(x+y)%4!==0;
  return glint?shade([218,164,66],x,y,193,2,17):netherRock(68,x,y,face);
 }
 return null;
}
function endRock(id,x,y,face){
 if(id===121)return sample(RGB.endstone,x,y,id,3);
 if(id===130)return masonry([[132,128,97],[165,166,132],[196,198,158],[220,221,177]],x,y,id,{height:5,width:8});
 if(id===131)return sample(RGB.purpur,x,y,id,3);
 if(id===132){
  if(face!==1){const r=Math.max(Math.abs(x-7.5),Math.abs(y-7.5));return sample(RGB.purpur,x,y,id+Math.floor(r),3)}
  return shade((x%4===0)?RGB.purpur[0]:RGB.purpur[2],x,y,id*37,2,13);
 }
 if(id===122||id===123){
  const gold=id===123&&y<5;
  return shade(gold?[195,169,93]:rand(x>>1,y>>1,id)>.51?[151,107,156]:[101,70,114],x,y,id,3,10);
 }
 if(id===125){
  if(face===0){
   const rim=x<3||x>12||y<3||y>12;
   const eye=Math.abs(x-7.5)<=2.5&&Math.abs(y-7.5)<=2.5;
   return shade(eye?[83,159,146]:rim?[45,81,75]:[120,155,132],x,y,id,2,12);
  }
  return masonry([[32,53,51],[54,82,71],[72,104,91],[91,125,108]],x,y,id,{height:5,width:8});
 }
 return null;
}
function minerals(id,x,y,face){
 const base=MINERALS[id];
 if([110,111,112,113,114,115,116,117,135].includes(id)){
  const bevel=x===0||y===0||x===15||y===15;
  const lip=(x===1||y===1),inner=x>1&&x<14&&y>1&&y<14;
  const ridge=(x+y+Math.floor(rand(x>>2,y>>2,id)*3))%10===0;
  return shade(bevel?blend(base,[16,19,22],.32):lip?blend(base,[236,234,218],.17):ridge&&inner?
    blend(base,[233,239,229],.13):base,x,y,id*71,2,16);
 }
 return null;
}
function utility(id,x,y,face){
 if(id===10||id===90||id===109){
  const p=id===10?[[127,85,49],[174,136,74],[219,177,103],[244,222,149]]:
          id===90?[[128,78,48],[178,120,68],[219,174,102],[250,217,146]]:
          [[76,53,32],[114,82,49],[180,132,71],[217,180,90]];
  const seam=x%5===0||y%6===0;return seam?shade(p[0],x,y,id*6,2,11):sample(p,x,y,id,3);
 }
 if(id===53)return masonry([[67,68,65],[96,100,96],[124,127,124],[151,153,147]],x,y,id);
 if(id===55)return masonry([[29,68,69],[49,109,111],[76,145,138],[116,178,162]],x,y,id);
 if(id===54){const base=original(54,face,x,y);
  if(face!==1)return base;
  const cut=(x>=3&&x<=12&&y>=4&&y<=12&&(x===4||y===4||x===11||y===11));
  return cut?shade([154,132,91],x,y,id,2,10):base;}
 if(id===59||id===128){
  const frame=x<3||y<2||x>12||y>13;const bulb=(x>=5&&x<=10&&y>=4&&y<=12);
  return shade(frame?[72,72,67]:bulb?[242,207,120]:[132,108,77],x,y,id,2,8);
 }
 if(id===60||id===86){
  const tie=id===60?face===0?(x===5||x===10):(y===5||y===11):(x===5||x===10);
  const straw=id===60?(face===1?x%3===0:y%3===0):(face===1?y%4===0:x%4===0);
  const gold=id===60;
  return shade(tie?[102,81,50]:straw?gold?[173,143,72]:[155,147,125]:gold?[213,187,108]:[218,208,174],x,y,id*13,2,12);
 }
 if([118,119,120,160].includes(id)){
  const open=id===120,barrel=id===118||id===160;
  const rim=x<2||x>13||y<2||y>13;
  const plank=y%5===0||x%5===0;
  const latch=x>=7&&x<=9&&y>=6&&y<=9&&face===1;
  const metal=rim&&barrel&&(y%4===0||x%4===0);
  return shade(latch?[194,171,93]:metal?[72,73,68]:rim?[64,42,27]:
   plank?[103,67,39]:open?[62,41,32]:[142,91,51],x,y,id*21,2,16);
 }
 if(id===136||id===166||id===168){
  if(face===0){
   const grid=x%4===0||y%4===0,diagonal=(x+y)%7===0;
   return shade(grid?[75,52,33]:diagonal?[161,149,112]:[147,103,67],x,y,id,2,16);
  }
  if(face===2)return original(11,face,x,y);
  const rim=x<2||x>13||y<2||y>13,inset=x>=4&&x<=11&&y>=4&&y<=11;
  const tool=id!==168&&(x+y)%6===0;
  return shade(rim?[82,52,32]:inset?tool?[184,180,156]:[60,76,72]:[150,99,62],x,y,id,2,14);
 }
 if([20,156,157].includes(id)){
  const furnace=id===20,blast=id===156;
  if(face===0)return sample([[69,66,62],[100,98,94],[134,131,125],[159,155,148]],x,y,id,3);
  if(face===2)return sample(RGB.deepslate,x,y,id,3);
  const rim=x<2||x>13||y<2||y>13,door=x>3&&x<12&&y>4&&y<13;
  const fire=x>4&&x<11&&y>8&&y<13;
  return shade(rim?[73,72,69]:fire?(y%4===0?[201,103,39]:[24,27,29]):
    door?(blast?[68,80,82]:furnace?[37,37,40]:[81,70,58]):[128,128,122],x,y,id,2,12);
 }
 if([155,158,159,161,162,163,164,165,167].includes(id)){
  const border=x<2||x>13||y<2||y>13;
  const metal=id===159||id===162||id===164||id===167;
  const base=metal?[94,99,99]:[140,105,66];
  const inset=(x>3&&x<12&&y>4&&y<12);
  const sig=rand(x>>2,y>>2,id*17)>.6;
  return shade(border?blend(base,[24,25,24],.37):inset?sig?blend(base,[211,204,168],.37):
    blend(base,[36,45,48],.41):base,x,y,id*37,2,13);
 }
 return null;
}
function crop(id,x,y,face){
 const info=CROP[id],stage=info.stage,plant=info.kind,reach=[4,7,11,15][stage];
 // True alpha cutouts: vegetation does not paint an opaque brown tile.
 const root=15-y,stalk=(x+(plant%2))%5===1||(x+plant)%6===3;
 const n=rand(x>>1,y>>1,id*17),spread=(x+2*y+plant)%5;
 const growing=root<=reach&&root>=0;
 const leaf=growing&&root>=2&&
   (stalk||(spread<=1&&n>.34)||(stage>=2&&spread===3&&n>.67));
 const berry=stage===3&&root>5&&plant!==0&&n>.75;
 if(!leaf&&!berry)return [0,0,0,0];
 const palette=plant===0?[[60,129,48],[84,153,53],[149,159,57],[214,182,81]]:
               plant===1?[[46,124,46],[66,153,57],[85,169,58],[196,110,53]]:
               plant===2?[[50,113,46],[73,143,59],[91,170,70],[161,143,71]]:
                         [[64,117,49],[89,146,61],[101,158,76],[162,69,94]];
 const color=berry?palette[3]:palette[stage===3&&root>=reach-4?3:Math.min(stage,2)];
 return shade(color,x,y,id*15,2,23);
}
function paint(id,face,x,y){
 x&=15;y&=15;
 const log=LOGS[id];if(log)return ring(id,x,y,face!==1);
 if(LEAVES[id])return leaf(id,x,y);
 if(ORES[id])return ore(id,x,y,face);
 if(CROP[id])return crop(id,x,y,face);
 if(id===28){
  if(face===0)return leaf(31,x,y);
  if(face===2)return original(2,face,x,y);
  return y<=2?leaf(31,x,y):original(2,face,x,y);
 }
 if(id===29){
  const p=RGB.gravel,grit=rand(x>>1,y>>1,29)>.65;
  return grit?sample(p,x,y,id,3):original(2,face,x,y);
 }
 if(id===46)return sample([[32,78,32],[50,112,47],[70,148,66],[93,164,84]],x,y,id,3);
 if(id===47)return sample(RGB.mud,x,y,id,3);
 if(id===21)return sample([[190,197,201],[220,225,226],[235,236,234],[247,248,244]],x,y,id,3);
 if(id===22||id===23){
  const deep=id===23,p=deep?[[69,116,158],[97,148,180],[131,181,204],[167,208,223]]:
          [[105,176,199],[143,200,215],[181,219,229],[217,236,240]];
  const line=(x+y+id)%13===0;
  return line?tint(p[3],10):sample(p,x,y,id,3);
 }
 if([24,25,27].includes(id)){
  if(id!==24)return shade(id===25?[157,112,94]:[157,84,61],x,y,id,3,23);
  if(face!==1)return sample(RGB.sand,x,y,id,3);
  const band=y===4||y===11;return band?shade([181,162,120],x,y,id,3,9):sample(RGB.sand,x,y,id,3);
 }
 if([50,51,58,65,67,68,69,70,71,72,74,75,76,88,91].includes(id))return netherRock(id,x,y,face);
 if([121,122,123,125,130,131,132].includes(id))return endRock(id,x,y,face);
 if(id===62||id===64){
  const p=id===64?[[9,30,41],[18,52,57],[35,96,102],[51,147,159]]:
                    [[31,78,67],[45,115,95],[62,146,125],[90,169,153]];
  const speck=(x+y)%11===0||rand(x>>2,y>>2,id)>.9;
  return speck?tint(p[3],3):sample(p,x,y,id,3);
 }
 if(id===63)return sample([[67,57,48],[87,71,59],[120,99,75],[143,120,91]],x,y,id,3);
 if(id===73||id===77||id===82||id===93||id===94)return original(id,face,x,y);
 if(id===87||id===126||id===127||id===89||id===124||id===129||id===133||id===134)return original(id,face,x,y);
 if(MINERALS[id])return minerals(id,x,y,face);
 const util=utility(id,x,y,face);if(util)return util;
 return original(id,face,x,y);
}
engine.paint=paint;
engine.version='6.1-original-fidelity-16x16';
window.MineWorldTextureFidelity=Object.freeze({
 version:engine.version,pixelSize:16,improvedIds:[...BLOCKS].map(Number).filter(Number.isInteger).sort((a,b)=>a-b),
 paletteSource:'independent procedural art',render:(id,face,x,y)=>paint(id,face,x,y)
});
})();