/* MineWorld 6.3 — deliberately structured, independently drawn classic voxel tiles.
 * Every tile stays on the 16×16 grid. These shapes, palettes and hashes are original:
 * no Mojang/Eaglercraft image, pixel trace, atlas, or copied texture map.
 */
(()=>{
'use strict';
const engine=window.MineWorldPixelMaterials;if(!engine)return;
const prior=engine.paint;
const improvedIds=[1,2,3,4,8,11,24,26,28,29,52,53,61,92,137,138,170];
const rgb=(r,g,b)=>[r,g,b,255],bound=v=>Math.max(0,Math.min(255,Math.round(v)));
const C=(p,d=0)=>rgb(bound(p[0]+d),bound(p[1]+d),bound(p[2]+d));
const h=(x,y,s)=>{
 let n=Math.imul((x|0)+971,374761393)^Math.imul((y|0)+271,668265263)^Math.imul((s|0)+35,1442695041);
 n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;
};
const pick=(palette,x,y,s)=>{
 const coarse=h(x>>2,y>>2,s)*.35,medium=h(x>>1,y>>1,s+311)*.45,grain=h(x,y,s+613)*.2;
 const v=coarse+medium+grain;
 return C(palette[v<.23?0:v<.5?1:v<.77?2:3],(h(x,y,s+842)-.5)*7);
};
const dirtColors=[[77,52,36],[103,71,46],[123,84,55],[146,101,65]];
const grassColors=[[55,112,34],[70,131,41],[87,148,49],[109,163,56]];
const rockColors=[[94,96,93],[116,117,114],[131,133,131],[150,150,145]];
const sandColors=[[179,162,120],[208,189,141],[223,209,162],[237,226,185]];
const gritColors=[[70,73,76],[100,102,100],[130,131,127],[163,160,156]];
function dirt(x,y,coarse=false){
 const pebble=h(x>>1,y>>1,210)> (coarse?.74:.93);
 if(pebble)return pick(coarse?gritColors:[[108,98,81],[134,126,104],[157,147,125],[181,168,143]],x,y,490);
 const clump=h(x>>2,y>>2,47);
 const d=clump>.79?-8:clump<.18?7:0;
 const c=pick(dirtColors,x,y,11);
 return C(c,d);
}
function grassTop(x,y){
 const clump=h(x>>1,y>>1,690),tuft=h(x,y,318),seam=h(x>>2,y>>2,181);
 if(clump<.13&&tuft>.3)return C([42,103,33],h(x,y,801)*8);
 if(seam>.84&&y%3===0)return C([116,158,56],h(x,y,1009)*6);
 return pick(grassColors,x,y,620);
}
function grassSide(x,y){
 const depth=2+Math.floor(h(x>>1,0,108)*2)+Number(h(x,0,193)>.84);
 const roots=(x+Math.floor(h(x>>1,y>>1,125)*3))%5===2;
 if(y<depth||(roots&&y===depth&&h(x,y,208)>.30))
   return pick(grassColors,x,y,740);
 if((x+y)%7===0&&y<depth+3&&h(x,y,795)>.48)
   return C([86,105,51],h(x,y,997)*13);
 return dirt(x,y);
}
function rock(x,y){
 const plate=h(x>>2,y>>2,51),grain=h(x>>1,y>>1,79);
 const chip=plate>.70&&(x%4===0||y%4===1)&&grain>.43;
 if(chip)return C([94,97,95],(h(x,y,341)-.5)*15);
 const c=pick(rockColors,x,y,930);
 if(h(x,y,73)>.972)return C([165,166,161]);
 return C(c,plate>.76?-4:plate<.12?5:0);
}
function sand(x,y,red=false){
 const palette=red?[[152,79,55],[176,94,59],[199,115,70],[220,135,79]]:sandColors;
 const n=h(x,y,red?199:88);
 if(n>.956)return C(palette[0],-4);
 if(n<.045)return C(palette[3],5);
 return pick(palette,x,y,red?170:59);
}
function gravel(x,y){
 const pebble=h(x>>1,y>>1,118)> .71;
 const bright=h(x,y,215)>.945;
 if(bright)return C([192,189,180],h(x,y,815)*8);
 if(pebble)return C([64,66,67],h(x,y,516)*12);
 return pick(gritColors,x,y,335);
}
// Hand-shaped stone boundaries: variable row heights and broken side contours,
// not smooth brickwork or high-frequency static.
function cobble(x,y){
 const row=y<4?0:y<9?1:y<13?2:3;
 const start=[0,4,9,13][row],ht=[4,5,4,3][row];
 const width=[6,7,5,8][row],off=[0,3,1,5][row];
 const px=(x+off)%width,py=y-start;
 const stoneSeed=row*29+Math.floor((x+off)/width)*71;
 const irregular=h(x>>1,y>>1,stoneSeed+71)>.81;
 const vertical=px===0||(px===1&&irregular);
 const horizontal=py===0||(py===1&&irregular&&px<width-2);
 if(vertical||horizontal)return C([63,69,68],Math.round((h(x,y,stoneSeed)-.5)*14));
 const innerRim=px===1||py===1||px===width-1||py===ht-1;
 const c=innerRim?[102,110,109]:
   h(x>>1,y>>1,stoneSeed+49)>.61?[155,158,151]:[126,134,132];
 return C(c,Math.round((h(x,y,stoneSeed+69)-.5)*22));
}
function plank(x,y,dark=false){
 const palette=dark?[[61,46,38],[79,59,47],[100,74,57],[125,96,73]]:
                    [[100,68,39],[140,97,57],[173,123,76],[197,150,99]];
 const board=Math.floor(y/4),off=board%2?8:0,slot=(x+off)%16;
 const seam=y%4===0,join=slot===0&&y%4>0,raised=y%4===1;
 const line=slot===4||slot===11;
 if(seam)return C(palette[0],-4);
 if(join)return C(palette[0],5);
 if(raised)return C(palette[2],11);
 if(line&&h(x>>1,board,67)>.27)return C(palette[1],-8);
 const knot=(slot-8)*(slot-8)+(y%4-2)*(y%4-2)<5&&h(board,0,63)>.72;
 if(knot)return C(palette[0],3);
 return pick(palette,x,y,640+Number(dark)*117);
}
function brick(x,y,stone=false){
 const row=Math.floor(y/4),offset=row%2?4:0,xx=(x+offset)%8,yy=y%4;
 const palette=stone?[[75,77,76],[99,101,99],[127,131,129],[154,157,152]]:
                    [[101,52,46],[135,66,51],[164,78,56],[187,102,72]];
 if(yy===0||xx===0)return C(stone?[61,66,66]:[81,70,65],(h(x,y,200)-.5)*9);
 if(yy===1||xx===1)return C(palette[1],3);
 return pick(palette,x,y,stone?703:811);
}
function sandstone(x,y,face){
 if(face===0||face===2)return sand(x,y);
 const stripe=y===4||y===11,cut=x%8===0&&y>4&&y<11;
 return stripe||cut?C([183,168,130],(h(x,y,251)-.5)*12):pick(sandColors,x,y,259);
}
function podzol(x,y,face){
 if(face===2)return dirt(x,y);
 if(face===1&&y>=3)return dirt(x,y);
 const p=[[67,55,37],[89,70,44],[112,86,48],[131,108,67]];
 if(h(x>>1,y>>1,299)>.80)return C([82,104,55]);
 return pick(p,x,y,201);
}
function farmland(x,y,hydrated,face){
 if(face===2)return dirt(x,y);
 if(face===1&&y>3)return dirt(x,y);
 const row=face===0?x:y,groove=row%4===0||row%4===1;
 const pal=hydrated?[[48,43,37],[72,61,47],[88,70,54],[108,84,61]]:
                    [[67,47,33],[91,61,41],[119,78,53],[145,96,65]];
 const c=groove?pal[0]:pick(pal,x,y,hydrated?871:870);
 return C(c,groove?-6:7);
}
// Independently designed dark foundation pixel tile, not a third-party bitmap.
function bedrock(x,y){
 const palette=[[24,27,30],[40,44,47],[59,64,66],[79,83,82]];
 const patch=h(x>>2,y>>2,1700),grain=h(x>>1,y>>1,1701);
 const index=patch<.25?0:patch<.54?1:patch<.83?2:3;
 const seam=(x%4===0&&grain>.72)||(y%4===0&&grain<.16);
 return C(palette[seam?Math.max(0,index-1):index],(h(x,y,1702)-.5)*8);
}
function paint(id,face,x,y){
 x&=15;y&=15;
 if(id===1)return face===0?grassTop(x,y):face===2?dirt(x,y):grassSide(x,y);
 if(id===2)return dirt(x,y);
 if(id===3)return rock(x,y);
 if(id===4||id===26)return sand(x,y,id===26);
 if(id===8||id===53)return brick(x,y,id===53);
 if(id===11||id===52)return plank(x,y,id===52);
 if(id===24)return sandstone(x,y,face);
 if(id===28)return podzol(x,y,face);
 if(id===29)return dirt(x,y,true);
 if(id===61)return cobble(x,y);
 if(id===92)return gravel(x,y);
 if(id===137||id===138)return farmland(x,y,id===138,face);
 if(id===170)return bedrock(x,y);
 return prior(id,face,x,y);
}
engine.paint=paint;
engine.version='6.3-original-core-material-silhouettes';
window.MineWorldCorePixelArt=Object.freeze({pixelSize:16,ids:improvedIds,version:engine.version,paint});
})();