/* MineWorld 6.5 — hand-designed, independently generated 16x16 block silhouettes.
 * This layer emphasizes recognizable color placement, connected shapes, and
 * separate top/side/bottom faces rather than scattering random detail.
 * No third-party bitmaps, pixels, or traced texture arrays are used.
 * Save IDs, materials, block dimensions, animations and controls are untouched.
 */
(()=>{
'use strict';
const engine=window.MineWorldPixelMaterials;
if(!engine)return;
const prior=engine.paint;
const clamp=v=>Math.max(0,Math.min(255,Math.round(v)));
const rgba=(v,delta=0,alpha=255)=>[clamp(v[0]+delta),clamp(v[1]+delta),clamp(v[2]+delta),alpha];
function hash(x,y,s){
 let n=Math.imul(x+1013,374761393)^Math.imul(y+859,668265263)^Math.imul(s+73,1442695041);
 n=Math.imul(n^(n>>>13),1274126177);
 return ((n^(n>>>16))>>>0)/4294967295;
}
const P={
 grass:[[43,94,32],[66,122,43],[88,147,52],[120,172,64]],
 dirt:[[71,47,33],[102,67,44],[128,88,55],[155,110,70]],
 stone:[[88,90,88],[111,113,110],[132,134,130],[155,156,152]],
 deep:[[42,47,51],[62,68,72],[82,88,92],[102,108,110]],
 sand:[[170,158,117],[204,190,145],[224,210,165],[241,227,187]],
 redSand:[[142,76,52],[181,99,61],[205,120,73],[222,143,87]],
 gravel:[[64,66,66],[104,105,103],[135,134,130],[180,176,170]],
 cobble:[[68,72,69],[101,108,106],[129,136,132],[158,163,156]],
 brick:[[94,52,44],[131,63,49],[166,82,61],[189,106,83]],
 stonebrick:[[68,73,72],[101,109,106],[129,136,132],[156,163,157]],
 netherbrick:[[36,21,27],[62,27,34],[87,35,42],[115,48,55]],
 endbrick:[[139,143,105],[177,180,132],[204,208,160],[226,229,185]],
 paleWood:[[92,60,37],[133,88,53],[166,118,72],[200,154,102]],
 darkWood:[[53,38,32],[74,53,41],[99,73,55],[126,99,76]],
 nether:[[67,27,32],[90,32,35],[117,42,44],[145,56,54]],
 blackstone:[[29,30,34],[46,47,51],[61,62,67],[79,80,85]],
 endstone:[[154,159,120],[187,190,149],[214,215,170],[235,233,191]]
};
function cluster(p,x,y,s){
 const a=hash(x>>2,y>>2,s)*.42+hash(x>>1,y>>1,s+29)*.39+hash(x,y,s+77)*.19;
 const i=a<.22?0:a<.46?1:a<.78?2:3;
 return rgba(p[i],hash(x,y,s+109)>.982?8:0);
}
function dirt(x,y,coarse=false){
 const fleck=hash(x>>1,y>>1,209);
 if(coarse&&fleck>.77)return cluster(P.gravel,x,y,318);
 const pebble=hash(x,y,701)>.973;
 if(pebble)return rgba([167,147,113],hash(x,y,921)*12);
 if(fleck<.1&&(x+y)%3===1)return rgba([74,52,36]);
 return cluster(P.dirt,x,y,31);
}
function grass(x,y,face){
 if(face===2)return dirt(x,y);
 const green=()=> {
  const fleck=hash(x,y,711),tuft=hash(x>>1,y>>1,515);
  if((x+y*3)%7===0&&tuft>.49)return rgba([44,103,34],fleck*8);
  if(fleck>.92&&tuft>.58)return rgba([143,174,73]);
  return cluster(P.grass,x,y,643);
 };
 if(face===0)return green();
 const overhang=2+Math.floor(hash(x>>1,0,391)*2)+(hash(x,1,404)>.83?1:0);
 if(y<overhang||y===overhang&&hash(x,y,512)>.53)return green();
 if(y<overhang+3&&hash(x,y,133)>.86)return rgba([67,104,40]);
 return dirt(x,y);
}
function rock(x,y,deep=false){
 const p=deep?P.deep:P.stone;
 const slab=hash(x>>2,y>>2,deep?963:973);
 const chip=hash(x>>1,y>>1,deep?683:673);
 if(chip>.82&&(x+y)%6===0)return rgba(p[0],-3);
 if(chip<.16&&x%4===1&&y%4>0)return rgba(p[3],3);
 const c=cluster(p,x,y,deep?115:119);
 return rgba(c,slab>.85?-4:slab<.1?4:0);
}
function sand(x,y,red=false){
 const p=red?P.redSand:P.sand,grain=hash(x,y,red?810:809);
 if(grain>.974)return rgba(p[0],-2);
 if(grain<.035)return rgba(p[3],4);
 return cluster(p,x,y,red?320:319);
}
function gravel(x,y){
 const shard=hash(x>>1,y>>1,233),corner=(x%3===0||y%3===1);
 if(shard>.73&&corner)return rgba(P.gravel[0],hash(x,y,72)*11);
 if(shard<.25&&corner)return rgba(P.gravel[3],-4);
 return cluster(P.gravel,x,y,338);
}
function cobble(x,y){
 // Uneven fieldstone rows and individual stone facets, never regular bricks.
 const heights=[0,4,9,13,16],row=y<4?0:y<9?1:y<13?2:3;
 const py=y-heights[row],offset=[0,3,7,2][row];
 const step=[6,7,5,7][row],xx=x+offset,col=xx%step;
 const corner=(hash((xx/step)|0,row,177)>.6);
 if(py===0||col===0||(corner&&py===1&&col===1))return rgba(P.cobble[0],-8);
 if(py===1||col===1)return rgba(P.cobble[1],-4);
 const facet=hash(x>>1,y>>1,963+row);
 if(facet>.78&&py>1)return rgba(P.cobble[3],4);
 return cluster(P.cobble,x,y,100+row*17);
}
function planks(x,y,dark=false){
 const p=dark?P.darkWood:P.paleWood;
 const row=y>>2,off=row%2?7:0,z=(x+off)%16,depth=y%4;
 if(depth===0)return rgba(p[0],-9);
 if(z===0&&depth!==1)return rgba(p[0],-5);
 if(depth===1)return rgba(p[3],5);
 const grain=hash(x>>1,row,dark?33:34),wavy=(x+Math.floor(hash(x>>2,row,81)*3))%7===0;
 if(depth===2&&wavy&&grain>.27)return rgba(p[0],1);
 if(depth===3&&grain>.76&&x%5===1)return rgba(p[3],0);
 return cluster(p,x,row*3+depth,dark?492:491);
}
function masonry(id,x,y){
 const type=id===8?'brick':id===53?'stonebrick':id===72||id===74?'netherbrick':'endbrick';
 const p=P[type],width=type==='netherbrick'?8:8,height=type==='netherbrick'?4:4;
 const row=(y/height)|0,z=(x+(row%2?width/2:0))%width,dy=y%height;
 if(dy===0||z===0)return rgba(p[0],-10);
 if(dy===1||z===1)return rgba(p[1],-2);
 const pit=hash(x>>1,y>>1,id*131);
 if(pit>.88&&z>2)return rgba(p[0],-1);
 return cluster(p,x,y,id*14);
}
function sandstone(x,y,face){
 if(face!==1)return sand(x,y);
 if(y===4||y===11)return rgba([167,149,109],-2);
 if(y===5||y===12)return rgba([217,195,149],6);
 const chip=hash(x>>1,y>>1,24);
 if(chip>.86&&(y%4===2))return rgba([183,162,119]);
 return sand(x,y);
}
const LOGS={
 5:[[104,76,49],[164,123,78],[61,45,32]],
 15:[[121,90,65],[181,133,87],[76,56,42]],
 30:[[71,53,43],[136,106,76],[43,34,29]],
 32:[[205,205,188],[186,172,132],[49,51,46]],
 34:[[111,107,103],[167,127,93],[67,64,62]],
 36:[[116,84,58],[174,127,81],[69,50,35]],
 38:[[88,47,44],[179,109,87],[55,29,30]],
 40:[[84,51,62],[215,162,169],[53,35,43]],
 42:[[154,155,148],[182,172,151],[94,96,90]],
 78:[[110,48,70],[185,91,113],[65,31,49]],
 80:[[42,103,105],[93,179,168],[25,67,72]]
};
function log(id,face,x,y){
 const [b,core,dark]=LOGS[id],end=face!==1;
 const n=hash(x>>1,y>>1,id*41);
 if(end){
  const dist=Math.max(Math.abs(x-7.5),Math.abs(y-7.5));
  if(dist>6.5)return rgba(b,(n-.5)*17);
  const crooked=hash(x>>1,y>>1,id*17)>.7?.35:0;
  const ring=Math.floor((dist+crooked)*1.2)%3===0;
  const col=ring?dark:core;
  if(dist<1.8)return rgba(dark,14);
  return rgba(col,(n-.5)*16);
 }
 if(id===32){
  const scar=hash(x>>1,y>>1,32)>.67&&
   ((x+Math.floor(y/4))%5<3)&&(y%4===0||y%5===2);
  if(scar&&x>1&&x<15)return rgba(dark,(hash(x,y,72)-.5)*16);
  if(x===0||x===15)return rgba([151,152,141],(n-.5)*18);
  return rgba(b,(n-.5)*19);
 }
 const line=(x+Math.floor(hash(x>>2,y>>2,id*31)*2))%5===0;
 const scratch=hash(x>>1,y>>2,id*17)>.71&&x%4===1;
 if(line||scratch)return rgba(dark,(n-.5)*16);
 const light=hash(x,y,id*221)>.83;
 return rgba(light?core:b,(n-.5)*17);
}
const LEAF_BASE={
 6:[71,132,49],12:[163,68,42],13:[175,113,38],14:[180,152,49],
 31:[62,109,49],33:[91,146,63],35:[124,132,43],37:[70,125,51],
 39:[68,110,70],41:[221,151,172],43:[145,160,137],
 79:[151,52,75],81:[49,135,139]
};
function leaf(id,x,y,alpha){
 const base=LEAF_BASE[id],patch=hash(x>>2,y>>2,id*71),
       fleck=hash(x>>1,y>>1,id*113),pin=hash(x,y,id*31);
 const shadow=patch<.31?-33:patch>.7?21:0;
 let delta=shadow+(fleck>.7?13:fleck<.18?-13:0);
 if((x+y*2+id)%9===0&&pin>.53)delta+=14;
 return rgba(base,delta,alpha);
}
const ORES={
 18:[37,40,44],19:[204,153,111],83:[227,214,190],84:[232,173,56],
 95:[204,129,75],96:[249,196,46],97:[189,38,40],98:[44,83,196],
 99:[49,186,189],100:[39,180,88],101:[37,40,44],102:[204,153,111],
 103:[204,129,75],104:[249,196,46],105:[189,38,40],106:[44,83,196],
 107:[49,186,189],108:[39,180,88]
};
function ore(id,face,x,y){
 const mineral=ORES[id],deep=id>=101&&id<=108,nether=id===83||id===84;
 const host=deep?rock(x,y,true):nether?netherrack(x,y):rock(x,y,false);
 const centers=[[3,4,3],[11,3,2],[8,9,3],[3,13,2],[13,12,2]];
 let hit=-1,dist=100;
 for(let i=0;i<centers.length;i++){
  const [cx,cy,size]=centers[i],dx=Math.abs(x-cx),dy=Math.abs(y-cy);
  const distortion=hash(x>>1,y>>1,id*8+i)>.8?1:0;
  const metric=dx*.83+dy+distortion;
  if(metric<=size&&metric<dist){hit=i;dist=metric;}
 }
 if(hit<0)return host;
 // Angular connected crystals, 1px dark and bright facets, no blurry glow.
 const rim=dist>centers[hit][2]-.9,highlight=(x+y+hit+id)%4===0;
 const shade=rim?-30:highlight?25:6;
 const color=rgba(mineral,shade+(hash(x,y,id*47)>.91?10:0));
 if(id===18||id===101)return rgba([38,40,42],rim?-15:highlight?11:0);
 return color;
}
function netherrack(x,y,variant=50){
 const n=hash(x>>2,y>>2,510+variant),rim=hash(x>>1,y>>1,551+variant);
 if(rim>.84&&(x+2*y)%6===0)return rgba(P.nether[0],variant===65?-15:-7);
 const c=cluster(P.nether,x,y,variant+(n>.7?9:0));
 return variant===65?rgba(c,-13):c;
}
function obsidian(x,y){
 const p=[[17,16,27],[26,22,36],[41,29,53],[63,39,71]];
 const line=hash(x>>2,y>>2,51)>.68&&((x+2*y)%10===0||(2*x+y)%13===0);
 if(line)return rgba(p[3],hash(x,y,51)*8);
 return cluster(p,x,y,651);
}
function endstone(x,y){
 const n=hash(x>>1,y>>1,121),pit=n>.82&&((x+y)%4<2);
 if(pit)return rgba(P.endstone[0],-8);
 return cluster(P.endstone,x,y,121);
}
function paint(id,face,x,y){
 x=(x|0)&15;y=(y|0)&15;
 const before=prior(id,face,x,y);
 if(id<1||id>169||!before||before.length!==4)return before;
 const alpha=before[3];
 if(alpha===0)return before;
 if(id===1)return grass(x,y,face);
 if(id===2)return dirt(x,y);
 if(id===3)return rock(x,y);
 if(id===4||id===26)return sand(x,y,id===26);
 if(id===29)return dirt(x,y,true);
 if(id===92)return gravel(x,y);
 if(id===61)return cobble(x,y);
 if(id===11||id===52)return planks(x,y,id===52);
 if(id===8||id===53||id===72||id===74||id===130)return masonry(id,x,y);
 if(id===24)return sandstone(x,y,face);
 if(LOGS[id])return log(id,face,x,y);
 if(LEAF_BASE[id])return leaf(id,x,y,alpha);
 if(ORES[id])return ore(id,face,x,y);
 if(id===50||id===65)return netherrack(x,y,id);
 if(id===58)return rock(x,y,true);
 if(id===51)return obsidian(x,y);
 if(id===121)return endstone(x,y);
 if(id===9){
  const edge=x===0||y===0||x===15||y===15;
  if(edge)return rgba([113,159,176],-8,alpha);
  if((x===2&&y>=2&&y<=6)||(y===2&&x>=2&&x<=6))return rgba([221,240,243],0,alpha);
  if((x===13&&y>=9&&y<=13)||(y===13&&x>=10&&x<=13))return rgba([186,215,225],0,alpha);
 }
 return before;
}
const paintedIds=Object.freeze([1,2,3,4,8,9,11,24,26,29,50,51,52,53,58,61,65,72,74,92,121,130,
 ...Object.keys(LOGS).map(Number),...Object.keys(LEAF_BASE).map(Number),...Object.keys(ORES).map(Number)]);
engine.paint=paint;
engine.version='6.5-original-shaped-pixels';
window.MineWorldClassicForms=Object.freeze({version:engine.version,pixelSize:16,paintedIds,paint,source:'independent 16px material illustrations'});
})();