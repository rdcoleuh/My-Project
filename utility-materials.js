/* MineWorld 6.1 — additional original 16x16 workstation face artwork.
 * Independent hand-authored pixel geometry: tooling silhouettes,
 * craft-grid cut lines, latch, furnace chamber, books and tool heads.
 */
(()=>{
'use strict';
const painter=window.MineWorldPixelMaterials;if(!painter)return;
const old=painter.paint;
const P=(r,g,b)=>[r,g,b,255],lim=x=>Math.max(0,Math.min(255,Math.round(x)));
const color=(r,g,b,d=0)=>P(lim(r+d),lim(g+d),lim(b+d));
function hash(x,y,i){let v=Math.imul(x+37,374761393)^Math.imul(y+63,668265263)^Math.imul(i+81,1274126177);v=Math.imul(v^(v>>>13),1274126177);return ((v^(v>>>16))>>>0)/4294967295;}
function grain(base,x,y,i,spread=12){
 const f=(hash(x>>1,y>>1,i)-.5)*spread*1.1+(hash(x,y,i+17)-.5)*spread*.5;
 return color(base[0],base[1],base[2],f);
}
function wood(x,y,id,dark=false){
 if(x===0||x===15)return P(65,43,26);
 const row=Math.floor(y/4),seam=(y+id)%4===0;
 if(seam)return P(dark?58:88,dark?39:58,dark?29:33);
 const gr=hash(x>>2,y,id*7);
 if(x%6===0&&gr>.5)return P(dark?76:114,dark?54:73,dark?34:42);
 return grain(dark?[103,72,46]:[153,105,58],x,y,id,18);
}
function metal(x,y,id,dark=false){
 if(x===0||x===15||y===0||y===15)return P(dark?38:63,dark?39:65,dark?40:64);
 if(x===1||x===14||y===1||y===14)return P(dark?100:159,dark?105:159,dark?111:156);
 const grey=dark?[81,86,92]:[124,128,127];
 return grain(grey,x,y,id,16);
}
function chest(id,f,x,y){
 const open=id===120,brim=x<2||x>13||y<2||y>13;
 if(f===0||f===2){
  if(brim)return P(78,48,27);
  if(x===7||x===8||y===8)return P(106,65,36);
  return wood(x,y,id);
 }
 if(brim)return P(77,46,28);
 if(y===5||y===6)return P(72,43,26);
 if(y>=6&&y<=9&&x>=6&&x<=9)return P(open?107:211,open?100:177,open?79:86);
 if(y>=7&&y<=8&&x>=7&&x<=8)return P(open?41:71,open?44:59,open?40:35);
 if(y===2||y===13)return P(188,120,61);
 return wood(x,y,id);
}
function furnace(id,f,x,y){
 if(f===0||f===2)return metal(x,y,id,id===157);
 const smoker=id===157,blast=id===156;
 const outer=x<2||x>13||y<2||y>13;
 if(outer)return metal(x,y,id,smoker);
 const frame=x>=3&&x<=12&&y>=5&&y<=12&&(x<=4||x>=11||y<=6||y>=11);
 if(frame)return P(blast?183:smoker?110:101,blast?169:smoker?92:97,blast?150:smoker?74:94);
 const inside=x>=5&&x<=10&&y>=7&&y<=10;
 if(inside){
  if(smoker&&y>=9)return P(157,67,32);
  if(blast&&x%3===0)return P(58,62,63);
  return grain([39,37,38],x,y,id,9);
 }
 if(smoker&&y===3)return P(43,37,31);
 if(blast&&x%5===0)return P(68,77,79);
 return metal(x,y,id,smoker);
}
function crafting(f,x,y){
 if(f===2)return wood(x,y,168);
 if(f===0){
  const frame=x<2||x>13||y<2||y>13;
  if(frame)return wood(x,y,168);
  if(x===6||x===10||y===6||y===10)return P(78,50,29);
  const check=(Math.floor((x-2)/4)+Math.floor((y-2)/4))%2;
  if(check&&hash(x>>1,y>>1,168)>.69)return P(178,139,90);
  return grain(check?[155,113,72]:[189,154,105],x,y,168,6);
 }
 if(x<2||x>13||y<2||y>13)return P(78,49,29);
 if(y>=2&&y<=7){
  if(x===7||y===6)return P(71,49,34);
  if(x>=3&&x<=12&&y>=3&&y<=5){
   if((x>=4&&x<=6&&y===4)||(x>=9&&x<=11&&y===3))return P(56,60,56);
   return P(117,130,102);
  }
 }
 if(x===4&&y>=9&&y<=11)return P(75,70,64);
 if((x===5||x===6)&&y===9)return P(105,112,111);
 return wood(x,y,168);
}
function table(id,f,x,y){
 const metallic=[136,159,162,164,166,167].includes(id);
 const top=f===0;
 if(id===136||id===166){ // smithing benches: iron anvil/hammer over timber
  if(top){
   if(x<2||x>13||y<2||y>13)return P(52,65,65);
   if(x>=4&&x<=11&&y>=4&&y<=11)return P((x+y)%4===0?85:116,122,124);
   return P(63,68,67);
  }
  if(y<5)return metal(x,y,id,true);
  if(x>=7&&x<=9&&y>=7&&y<=12)return P(124,133,136);
  return wood(x,y,id,true);
 }
 if(id===158){ // cartographer table: parchment map on top
  if(top){
   if(x<2||x>13||y<2||y>13)return wood(x,y,id);
   if(x>=4&&x<=12&&y>=3&&y<=12){
    if(x===4||x===12||y===3||y===12)return P(171,154,111);
    if((x+y)%5===0)return P(137,160,136);
    if(y===7&&x>=7||x===8&&y>=7)return P(94,143,162);
    return grain([227,211,158],x,y,id,7);
   }
   return wood(x,y,id);
  }
  if(y<6)return P(185,156,100);
  if(x>=4&&x<=11&&y>=6&&y<=12&&x%2===0)return P(119,102,68);
  return wood(x,y,id);
 }
 if(id===161){ // fletching: crossed vanes and target marks
  if(top){
   if(x<2||x>13||y<2||y>13)return wood(x,y,id);
   if(Math.abs(x-8)+Math.abs(y-8)<4)return P(104,135,85);
   if(x===y||x+y===15)return P(199,173,103);
   return grain([134,116,79],x,y,id,12);
  }
  if(x>=4&&x<=11&&y>=4&&y<=11&&((x+y)%5===0))return P(188,167,106);
  return wood(x,y,id);
 }
 if(id===160){ // barrel
  if(top){
   const radius=Math.max(Math.abs(x-7.5),Math.abs(y-7.5));
   if(radius>6.3)return P(62,56,50);
   if(radius>5.4)return P(128,116,91);
   if((x+y)%7===0)return P(83,54,30);
   return wood(x,y,id,true);
  }
  if(y===2||y===13)return P(74,74,70);
  if(x%4===0)return P(79,53,33);
  if(y===8&&x>=6&&x<=9)return P(171,171,154);
  return wood(x,y,id);
 }
 if(id===165){ // loom: thread lattice with paired pedals
  if(top){
   if(x<2||x>13||y<2||y>13)return wood(x,y,id);
   if(x%3===0||y%3===0)return P(215,197,158);
   return P(98,79,62);
  }
  if(y>9&&x>=4&&x<=11&&x%3===0)return P(176,143,102);
  if(y===3||y===10)return P(68,43,28);
  return wood(x,y,id);
 }
 if(id===163){ // lectern: open pale pages viewed from above
  if(top){
   if(x<2||x>13||y<2||y>13)return wood(x,y,id);
   if(x===7||x===8)return P(114,74,45);
   if(y>=4&&y<=11&&x>=3&&x<=12){
    if(y===5||y===9)return P(186,179,158);
    return P(235,226,191);
   }
   return wood(x,y,id);
  }
  if(x>=4&&x<=11&&y>=3&&y<=8)return P(216,202,156);
  if(x>=6&&x<=9&&y>=9)return P(84,52,29);
  return wood(x,y,id);
 }
 if(id===164||id===167){ // stonecutter & grindstone side machinery
  if(top){
   if(x<2||x>13||y<2||y>13)return metal(x,y,id);
   const rad=Math.abs(x-8)+Math.abs(y-8);
   if(rad>4&&rad<7)return P(188,192,189);
   if(rad<=4)return P(74,80,82);
   return metal(x,y,id,true);
  }
  if(y<=3)return metal(x,y,id);
  if(y>=6&&y<=11&&x>=4&&x<=11){
   if(Math.abs(x-8)+Math.abs(y-8)<3)return P(96,102,102);
   return P(173,182,182);
  }
  return wood(x,y,id);
 }
 if(id===159){ // brewing stand flame, pots, triple bottle outline
  if(top){
   if(x>=6&&x<=9&&y>=5&&y<=10)return P(176,138,73);
   if((x===3||x===12)&&y>=8)return P(89,78,73);
   return metal(x,y,id,true);
  }
  if(x===7||x===8&&y<10)return P(194,167,97);
  if((x<=5||x>=11)&&y>=8&&y<=12)return P(94,120,118);
  if(y>=13)return P(54,57,54);
  return metal(x,y,id,true);
 }
 if(id===162){ // cauldron visibly dark basin
  if(top){
   if(x<=2||x>=13||y<=2||y>=13)return P(66,70,71);
   if(x===3||x===12||y===3||y===12)return P(144,151,152);
   if(x>=6&&x<=10&&y>=7&&y<=10)return P(49,70,77);
   return P(29,35,38);
  }
  if(y<3)return P(149,157,155);
  if(x<=3||x>=12)return P(74,78,80);
  if(x===8&&y>=4)return P(111,116,115);
  return metal(x,y,id,true);
 }
 if(id===155){ // composter
  if(top){
   if(x<3||x>12||y<3||y>12)return wood(x,y,id,true);
   if((x+y)%5===0)return P(78,92,49);
   return grain([61,55,39],x,y,id,13);
  }
  if(x<2||x>13)return P(79,49,29);
  if(y===5||y===11)return P(71,41,24);
  return wood(x,y,id,true);
 }
 if(id===118){ // mineral crate: wood-bound iron rivets
  if(x<2||x>13||y<2||y>13)return P(70,54,38);
  if((x===3||x===12)&&(y===3||y===12))return P(181,167,121);
  if(x===7||y===7)return P(114,84,47);
  return grain([150,112,66],x,y,id,12);
 }
 return metallic?metal(x,y,id,true):wood(x,y,id);
}
function glow(id,f,x,y){
 if(id===109){ // square brass cross-lattice lamp
  const rim=(x%4===0||y%4===0);
  if(rim)return P(94,67,45);
  const edge=x%4===1||y%4===1;
  return edge?grain([202,142,51],x,y,id,9):grain([240,193,99],x,y,id,9);
 }
 if(id===10){
  const n=hash(x>>2,y>>2,id*83);
  if(n>.72)return grain([252,224,149],x,y,id,12);
  if(n>.34)return grain([201,158,92],x,y,id,13);
  return grain([126,94,55],x,y,id,8);
 }
 if(id===59||id===89||id===128){
  const rim=x<3||x>12||y<2||y>13;
  if(rim)return P(id===89?72:66,id===89?120:77,id===89?169:74);
  if(x>=5&&x<=10&&y>=4&&y<=11)return P(id===89?90:241,id===89?173:198,id===89?233:112);
  return grain([126,130,118],x,y,id,9);
 }
 return old(id,f,x,y);
}
const ids=[10,20,59,89,109,118,119,120,128,136,155,156,157,158,159,160,161,162,163,164,165,166,167,168];
const set=new Set(ids);
painter.paint=(id,face,x,y)=>{
 x=(x|0)&15;y=(y|0)&15;
 if(id===119||id===120)return chest(id,face,x,y);
 if(id===20||id===156||id===157)return furnace(id,face,x,y);
 if(id===168)return crafting(face,x,y);
 if([10,59,89,109,128].includes(id))return glow(id,face,x,y);
 if([118,136,155,158,159,160,161,162,163,164,165,166,167].includes(id))return table(id,face,x,y);
 return old(id,face,x,y);
};
painter.version='6.1-original-utility-workstations';
window.MineWorldUtilityMaterials=Object.freeze({ids,version:painter.version});
})();