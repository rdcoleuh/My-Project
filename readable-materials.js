/* MineWorld 6.1 — original hand-designed 16×16 recognisable material faces.
 * Source texture pixel art is procedural and independently authored.
 * This is not a recolor/copy of Minecraft, Eaglercraft, or any resource pack.
 * Valid calls: paint(blockId, face: 0 top | 1 side | 2 bottom, x, y).
 */
(()=>{
'use strict';
const pixels=window.MineWorldPixelMaterials;
if(!pixels)throw Error('Missing base 16px block materials');
const previous=pixels.paint;
const clamp=n=>Math.max(0,Math.min(255,Math.round(n)));
const pack=(p,shift=0)=>[clamp(p[0]+shift),clamp(p[1]+shift),clamp(p[2]+shift),255];
function random(x,y,s){
 let h=Math.imul((x|0)+137,0x27d4eb2d)^Math.imul((y|0)+711,0x165667b1)^Math.imul((s|0)+371,0x85ebca6b);
 h=Math.imul(h^(h>>>15),0x7feb352d);return ((h^(h>>>13))>>>0)/4294967295;
}
const r=(x,y,s)=>random(x|0,y|0,s|0);
const shade=(p,x,y,id,spread=8)=>{
 const block=(r(x>>1,y>>1,id*109)-.5)*spread;
 const fine=(r(x,y,id*193)-.5)*(spread*.7);
 return pack(p,Math.round(block+fine));
};
const pal=(base,dx=15)=>{
 const c=base;
 return [c.map(v=>clamp(v-dx*1.35)),c.map(v=>clamp(v-dx*.55)),c,c.map(v=>clamp(v+dx*.74))];
};
const pick=(pal,x,y,s,scale=2)=>{
 const v=r(Math.floor(x/scale),Math.floor(y/scale),s)*.76+r(x,y,s+17)*.24;
 return pal[v<.18?0:v<.48?1:v<.81?2:3];
};
const stonePal={
 3:pal([124,125,122],13),58:pal([69,72,77],12),68:pal([54,54,59],9),
 69:pal([87,87,91],10),67:pal([79,80,80],11),121:pal([211,210,157],11),
 130:pal([204,203,156],9),131:pal([168,116,170],12),132:pal([179,125,179],15),
 55:pal([66,130,116],17),24:pal([209,193,146],14),54:pal([199,184,133],14),
 72:pal([65,34,38],10),74:pal([72,35,43],9),53:pal([118,123,121],12),
 25:pal([168,121,102],12),27:pal([176,87,62],11),66:pal([221,80,23],15)
};
const ores={
 18:[[27,30,32],[43,46,50],[61,65,67],[81,84,83]],
 19:[[105,79,60],[145,102,69],[193,144,97],[229,184,130]],
 95:[[109,68,46],[154,96,58],[204,137,75],[229,171,102]],
 96:[[135,104,23],[194,151,40],[247,201,75],[255,230,122]],
 97:[[100,14,20],[177,24,34],[237,44,49],[254,83,77]],
 98:[[18,46,111],[29,78,158],[45,111,218],[93,151,241]],
 99:[[19,100,109],[24,165,176],[80,220,230],[180,248,246]],
 100:[[18,86,42],[29,139,63],[59,196,88],[139,249,149]],
 83:[[122,113,105],[169,154,142],[213,196,174],[245,231,205]],
 84:[[135,81,24],[198,118,29],[237,175,59],[252,222,111]]
};
const oreSource={101:18,102:19,103:95,104:96,105:97,106:98,107:99,108:100};
for(const [a,b] of Object.entries(oreSource))ores[Number(a)]=ores[b];
function rock(id,face,x,y){
 const p=stonePal[id],host=pick(p,x,y,id*71,3);
 if(id===58||id===68||id===67){
   // Deepslate and basalt have narrow layered striations, unlike stone's broad noise.
   const d=id===67?((x+y*2)%5):((y+Math.floor(x/5)*2)%6);
   if(d===0)return shade(p[0],x,y,id,5);
   if(d===1)return shade(p[1],x,y,id,4);
   if(r(x>>1,y>>1,id*47)>.84&&d===3)return shade(p[3],x,y,id,3);
 }
 if(id===121){ // irregular light yellow End stone pits
   if(r(x>>1,y>>1,1217)>.87&&(x+y)%4<3)return shade(p[0],x,y,id,6);
   if(r(x,y,1218)>.95)return shade(p[3],x,y,id,2);
 }
 if(id===131||id===132){ // purpur not a flat solid purple
   const pattern=id===132&&face===1?x%4:Math.abs((x*3+y*2)%9);
   if(pattern===0)return pack(p[0],-6);
   if(pattern===1)return pack(p[3],5);
 }
 if(id===55&&r(x>>2,y>>2,id*12)>.84&&((x+y)%4===1))return shade(p[3],x,y,id,7);
 if(r(x,y,id*87)>.967)return shade(p[3],x,y,id,4);
 if(r(x>>2,y>>2,id*83)>.83&&(x+2*y)%6===0)return shade(p[0],x,y,id,5);
 return shade(host,x,y,id,5);
}
function ore(id,face,x,y){
 const source=oreSource[id]||id,colors=ores[id],host=id>=101&&id<=108?58:
   (source===83||source===84)?50:3;
 const deposits=source===97?[[3,4,2.6],[10,2,2.3],[11,9,2.4],[4,12,2.3]]:
   source===98?[[4,3,2.4],[12,6,3.3],[6,12,3.2]]:
   source===99?[[3,3,2.1],[10,5,2.8],[5,12,3.3],[13,12,1.6]]:
   source===100?[[5,4,2.2],[11,6,2.1],[5,12,2.3]]:
   [[4,3,2.9],[11,5,2.6],[7,11,3.2]];
 let intensity=0;
 for(let i=0;i<deposits.length;i++){
   const [cx,cy,size]=deposits[i];
   // Original angular, contiguous mineral fragments with stepped pixel edges.
   const ux=Math.abs(x-cx),uy=Math.abs(y-cy),
     stagger=((x*3+y*5+source+i)%7===0?.75:0),
     perimeter=ux*.79+uy*.95+stagger;
   if(perimeter<size+.7&&r(x>>1,y>>1,source*67+i)>.115){
     const facet=perimeter<size-1.0?2:perimeter<size-.1?1:0;
     intensity=Math.max(intensity,facet+1);
   }
 }
 if(intensity){
   const accent=(x+y)%4===0?1:0;
   const palIndex=Math.min(3,intensity+accent-1);
   if(intensity===1&&r(x,y,source*100)>.82)return pack(colors[0],-8);
   return shade(colors[palIndex],x,y,source,5);
 }
 return host===50?previous(50,face,x,y):rock(host,face,x,y);
}
const logs={
 5:{wood:[154,120,81],bark:[90,65,40]},
 15:{wood:[163,127,92],bark:[102,83,59]},
 30:{wood:[147,116,80],bark:[68,49,36]},
 32:{wood:[215,205,173],bark:[208,202,185],birch:true},
 34:{wood:[177,131,92],bark:[117,112,105]},
 36:{wood:[165,132,93],bark:[87,70,49]},
 38:{wood:[155,112,100],bark:[104,56,57]},
 40:{wood:[211,161,159],bark:[87,65,72],cherry:true},
 42:{wood:[194,178,157],bark:[109,108,99]},
 78:{wood:[157,97,104],bark:[96,44,62],crimson:true},
 80:{wood:[81,177,163],bark:[40,106,107],warped:true}
};
function logTexture(id,face,x,y){
 const q=logs[id],b=pal(q.bark,14),w=pal(q.wood,15);
 if(face===0||face===2){
   const dx=x-7.4,dy=y-7.7,rad=Math.max(Math.abs(dx),Math.abs(dy));
   if(rad>6.8)return shade(pick(b,x,y,id*45,2),x,y,id,4);
   const noisy=rad+r(x>>1,y>>1,id*64)*.75,
   ring=Math.floor(noisy*1.12)%3;
   if(Math.abs(dx)<1&&Math.abs(dy)<1)return pack(w[0],-9);
   if(ring===0)return shade(w[1],x,y,id,5);
   if(ring===1)return shade(w[3],x,y,id,6);
   return shade(w[2],x,y,id,5);
 }
 if(q.birch){
   // Birch: pale clean bark with scattered detached charcoal dash marks.
   const scar=(Math.floor(y/3)+(x>>1))%7===0||(x>=3&&x<=6&&y===4)||(x>=9&&x<=13&&y===12);
   if(scar&&r(x>>1,y>>1,id*73)>.17)return pack([65,65,64],r(x,y,123)>.5?10:0);
   if((x===0||x===15)&&y%4!==1)return pack([113,110,102]);
   return shade(pick(pal([216,213,202],7),x,y,320,3),x,y,324,2);
 }
 const strand=(x+Math.floor(r(x>>2,y>>2,id*51)*2))%5;
 if(strand===0)return shade(b[0],x,y,id,4);
 if(strand===1)return shade(b[1],x,y,id,4);
 if(strand===2&&y%7===1)return shade(b[3],x,y,id,4);
 if(q.cherry&&r(x,y,404)>.947)return pack([173,142,142]);
 if(q.crimson||q.warped){
   if((y+2*x)%9===0&&r(x,y,id*20)>.48)return pack(q.warped?[40,190,175]:[180,80,115]);
 }
 if(r(x>>1,y>>1,id*50)>.72&&x%4===3)return shade(b[0],x,y,id,4);
 return shade(pick(b,x,y,id*40,2),x,y,id,4);
}
const leafPal={
 6:[54,112,40],12:[168,61,42],13:[215,111,37],14:[209,164,50],
 31:[49,84,46],33:[102,134,68],35:[115,126,49],37:[49,124,57],
 39:[52,99,80],41:[226,164,184],43:[125,149,131]
};
function leafTexture(id,face,x,y){
 const p=pal(leafPal[id],22),
   seed=id*166,patch=r(x>>1,y>>1,seed),
   centerX=x%4,centerY=y%4;
 const darkGap=patch>.90&&centerX>=2&&centerY<=1;
 if(darkGap)return shade(p[0],x,y,id,5);
 if(id===31){ // Spruce: tight dark needle lines
   if((x+y)%5===0&&r(x>>1,y>>1,seed+7)>.36)return shade(p[0],x,y,id,4);
   if(x%3===0&&centerY<=1)return shade(p[3],x,y,id,6);
 }
 if(id===41){ // Cherry: branching pale-pink petal clusters
   if(r(x>>2,y>>2,seed+9)>.66&&(centerX+centerY)%3!==0)return shade([242,190,208],x,y,id,8);
   if(r(x,y,seed+11)>.90)return pack([183,92,141]);
 }
 if(id===43){ // pale oak: desaturated olive-green
   if(r(x,y,seed+11)>.94)return pack([181,181,151]);
 }
 // Four-pixel clusters look leafy from distance, not grayscale salt-and-pepper.
 if(centerX===0&&centerY===1&&patch>.55)return shade(p[0],x,y,id,5);
 if((centerX===2||centerY===2)&&patch>.61)return shade(p[3],x,y,id,5);
 return shade(pick(p,x,y,seed,2),x,y,id,7);
}
function plankTexture(id,face,x,y){
 const p=id===11?pal([162,119,72],23):pal([97,72,52],19);
 const board=Math.floor(y/4),off=board%2?8:0,z=(x+off)%16;
 if(y%4===0)return pack(p[0],-14);
 if(y%4===1)return shade(p[3],x,y,id,4);
 if(z===0&&y%4>0)return pack(p[0],-8);
 const vein=r(x>>2,board,id*22);
 if(vein>.75&&y%4===3)return shade(p[0],x,y,id,4);
 if(y%4===2&&x%7===3&&r(x,y,id)>.68)return shade(p[3],x,y,id,4);
 return shade(pick(p,x+off,board,id*65,3),x,y,id,5);
}
function cleanBrick(id,face,x,y){
 const p=stonePal[id],sand=id===24||id===54,nether=id===72||id===74;
 const length=sand?8:nether?7:8,height=sand?5:nether?4:5,
 row=Math.floor(y/height),offset=row%2?Math.floor(length/2):0,
 col=(x+offset)%length;
 if(y%height===0||col===0)return pack(p[0],-17);
 if(y%height===1||col===1)return pack(p[1],-6);
 if(y%height===height-1||col===length-1)return pack(p[1],3);
 if((id===54||id===74)&&face===1){
   const frame=Math.max(Math.abs(x-7.5),Math.abs(y-7.5));
   if(frame>3&&frame<4.7)return pack(p[0],-8);
 }
 if(id===24&&y===12)return pack(p[1],-11);
 if(id===53&&x===12&&y%5>1&&r(x,y,53)>.7)return pack(p[0],-9);
 return shade(pick(p,x,y,id*19+row,2),x,y,id,4);
}
function mineralBlock(id,face,x,y){
 const solids={
 56:[177,107,70],110:[39,69,159],111:[36,151,96],112:[66,191,202],
 113:[182,106,76],114:[229,192,69],115:[186,200,201],
 116:[46,48,50],117:[185,39,43],135:[71,75,80],91:[65,54,43]
 };
 const base=solids[id],p=pal(base,id===116?8:17);
 const rim=(x<=1||x>=14||y<=1||y>=14);
 if(rim)return shade(p[0],x,y,id,3);
 if(id===116){ // coal block has chunky, jet-black facets
   if((x+y*3)%7===0)return pack(p[3]);
   return shade(pick(p,x,y,116,3),x,y,id,4);
 }
 if(id===135){ // netherite: dark metallic segmented plates
   if(x===7||y===7)return pack(p[0],-10);
   if(Math.abs(x-7.5)<3&&Math.abs(y-7.5)<3)return pack(p[3],-1);
   if((x+y)%5===0)return pack(p[1]);
 }
 if(id===91){
   if((x%5===1||y%6===2)&&r(x>>2,y>>1,id*10)>.60)return pack([173,132,48]);
   return rock(68,face,x,y);
 }
 const joint=face===0?(y===4||y===12):(x===4||x===12);
 if(joint)return shade(p[1],x,y,id,4);
 if(x>2&&x<8&&y>2&&y<8)return shade(p[3],x,y,id,6);
 if((x+y)%7===0&&r(x,y,id*37)>.5)return pack(p[0]);
 return shade(pick(p,x,y,id*123,3),x,y,id,5);
}
function endNether(id,face,x,y){
 const p=id===50?pal([102,46,47],18):
   id===65?pal([110,53,54],17):
   id===70?pal([87,71,58],16):
   id===71?pal([103,83,69],13):
   id===79?pal([145,52,81],22):
   id===81?pal([58,128,133],17):
   id===75?pal([137,57,68],24):
   id===76?pal([42,149,129],20):
   id===88?pal([142,64,24],18):
   id===85?pal([100,75,55],17):
   id===86?pal([215,202,164],18):
   id===90?pal([202,139,68],18):
   id===122?pal([128,95,154],19):
   id===123?pal([165,113,181],18):
   id===127?pal([25,93,100],15):
   id===129?pal([49,49,59],13):
   pal([77,76,81],12);
 if(id===50||id===65){
   // Very dark maroon pores with rough but stable 2×2 pixel areas.
   if(r(x>>1,y>>1,id*17)>.78&&(x+y)%4<3)return shade(p[0],x,y,id,4);
   if(r(x,y,id*91)>.97)return pack(p[3],8);
 }
 if(id===70){ // Soul sand: weathered dark pits
   const sink=r(x>>2,y>>2,700)*.65+r(x,y,701)*.35;
   if(sink>.73&&(x+y)%6<4)return shade(p[0],x,y,id,4);
 }
 if(id===75||id===76){ // Nylium top: moss crust; sides are red Netherrack
   if(face===2)return endNether(50,face,x,y);
   if(face===1&&y>3)return endNether(50,face,x,y);
   if(r(x>>1,y>>1,id*31)>.83&&x%3!==1)return shade(p[3],x,y,id,6);
 }
 if(id===88){ // Magma glowing cracks
   const glow=(x+Math.floor(y/2)*3)%7===0||(y+Math.floor(x/3)*2)%7===1;
   if(glow)return pack(r(x,y,882)>.5?[255,170,29]:[236,109,13]);
   return shade(p[r(x>>1,y>>1,id*44)>.6?0:1],x,y,id,4);
 }
 if(id===85){ // Layered ancient alloy ore in Nether rock
   if(x%6===0||y%6===0)return pack([61,53,49]);
   if((x+y)%7===2)return pack([173,112,71]);
 }
 if(id===86){ // Bone block concentric marrow
   if(face===0||face===2){
    const d=Math.max(Math.abs(x-7.5),Math.abs(y-7.5));
    if(d<3)return pack([100,94,82]);
    if(d<5)return pack([174,158,126]);
   }
   if(face===1&&x%6===1)return pack([173,160,135]);
 }
 if(id===122||id===123){ // Chorus has sparse branching grain, not cloudy stone
   if((x+2*y)%7===0)return shade(p[0],x,y,id,5);
   if(id===123&&(x+y)%5===0)return pack([224,180,215]);
 }
 if(id===129){
   const q=Math.abs(x-7.5)+Math.abs(y-7.5);
   if(q<4)return pack([90,73,112]);
   if(q<7)return pack([48,39,58]);
 }
 return shade(pick(p,x,y,id*39,2),x,y,id,6);
}
function naturalGround(id,face,x,y){
 const dirt=[[74,48,31],[100,67,43],[130,88,58],[159,117,81]];
 const sand=id===26?pal([191,102,56],13):pal([220,204,152],12);
 const mud=pal([56,55,52],10);
 const snow=pal([236,240,238],7);
 const soil=pick(dirt,x,y,id*13,3);
 const grain=r(x,y,id*91);
 if(id===26||id===4)return shade(grain>.965?sand[0]:pick(sand,x,y,id*20,2),x,y,id,4);
 if(id===21)return shade(pick(snow,x,y,id*79,3),x,y,id,4);
 if(id===47)return shade(grain>.94?mud[3]:pick(mud,x,y,id*53,3),x,y,id,5);
 if(id===46){ // Moss surface: grass-like plush fibers
   const p=pal([76,117,48],20);
   if((x+y*3)%7===0)return pack(p[3]);
   return shade(pick(p,x,y,id*21,2),x,y,id,5);
 }
 if(id===29&&grain>.84)return pack([94,94,82]);
 if(id===28){
  if(face===0)return shade(pick(pal([93,100,57],16),x,y,id*41,2),x,y,id,4);
  if(face===1&&y<3+Math.floor(r(x>>1,0,280)*2))return pack([86,90,52],5);
 }
 if(id===57){const p=pal([156,165,163],12);return shade(pick(p,x,y,id,3),x,y,id,4);}
 if(id===92){const p=pal([131,129,124],28);
   if(grain>.91)return shade(p[3],x,y,id,3);
   if(r(x>>1,y>>1,id*13)>.79&&x%3!==0)return pack(p[0],-4);
   return shade(pick(p,x,y,id*52,2),x,y,id,5);
 }
 if(id===2||id===29||id===28){
   if(grain>.95)return pack([144,132,105]);
   if(r(x>>2,y>>2,id*28)>.82&&(x+2*y)%6===0)return pack([75,65,53]);
   return shade(soil,x,y,id,6);
 }
 return previous(id,face,x,y);
}
const HANDLED=new Set([
  ...Object.keys(ores).map(Number),...Object.keys(logs).map(Number),
  ...Object.keys(leafPal).map(Number),...Object.keys(stonePal).map(Number),
  ...[4,11,52,21,26,28,29,46,47,57,92,2],
  ...[50,65,70,71,75,76,79,81,88,85,86,90,122,123,127,129],
  ...[56,110,111,112,113,114,115,116,117,135,91]
]);
function paint(id,face,x,y){
 x=(x|0)&15;y=(y|0)&15;
 if(ores[id])return ore(id,face,x,y);
 if(logs[id])return logTexture(id,face,x,y);
 if(leafPal[id])return leafTexture(id,face,x,y);
 if(id===11||id===52)return plankTexture(id,face,x,y);
 if(id===53||id===24||id===54||id===72||id===74)return cleanBrick(id,face,x,y);
 if(id===61){ // Cobblestone uses larger hand-broken irregular pieces instead of brick rows
   const p=stonePal[3],row=Math.floor(y/5),offset=(row%2)*4;
   const seam=(y+Math.floor(r(x>>2,row,609)*2))%5===0||(x+offset+Math.floor(r(row,y,611)*3))%7===0;
   if(seam)return pack([69,72,71]);
   if(y%5===1||(x+offset)%7===1)return shade(p[3],x,y,id,4);
   return shade(pick(p,x,y,id*71,3),x,y,id,7);
 }
 if(id===68||id===69||id===67||id===58||id===121||id===130||id===131||id===132||id===55)return rock(id,face,x,y);
 if([56,110,111,112,113,114,115,116,117,135,91].includes(id))return mineralBlock(id,face,x,y);
 if([50,65,70,71,75,76,79,81,88,85,86,90,122,123,127,129].includes(id))return endNether(id,face,x,y);
 if([2,4,21,26,28,29,46,47,57,92].includes(id))return naturalGround(id,face,x,y);
 if(id===25||id===27)return rock(id,face,x,y);
 return previous(id,face,x,y);
}
pixels.paint=paint;
pixels.version='6.1-original-recognisable-pixel-forms';
window.MineWorldReadableMaterials=Object.freeze({
 version:pixels.version,pixelsPerFace:16,ids:[...HANDLED].sort((a,b)=>a-b),
 source:'original material-based pixel designs'
});
})();