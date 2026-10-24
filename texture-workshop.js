/* MineWorld 5.3 — original, independently authored 16-pixel block detail pass.
 * Recognition inspired by the Minecraft Wiki's sizes/material descriptions only.
 * These are NEW procedurally generated patterns, NOT copies or one-pixel edits.
 * Existing block IDs and serialized inventories are never changed. */
(()=>{
'use strict';
const previous=window.MineWorldPixelMaterials;
if(!previous)throw Error('Base MineWorld materials unavailable');
const fallback=previous.paint;
const color=(r,g,b)=>[Math.max(0,Math.min(255,Math.round(r))),Math.max(0,Math.min(255,Math.round(g))),Math.max(0,Math.min(255,Math.round(b))),255];
function hash(x,y,s){let n=Math.imul(x+151,374761393)^Math.imul(y+379,668265263)^Math.imul(s+311,1274126177);n=Math.imul(n^(n>>>15),2246822519);return ((n^(n>>>13))>>>0)/4294967295;}
function palette(p,x,y,s){
 const v=hash(x>>2,y>>2,s),w=hash(x>>1,y>>1,s+49);
 const i=v<.2?0:v>.8?3:w>.59?2:1;const q=p[i],f=hash(x,y,s+90)>.98?-12:0;
 return color(q[0]+f,q[1]+f,q[2]+f);
}
const oreColors={
 18:[[20,22,24],[39,43,44],[59,62,62],[80,83,80]],
 19:[[96,60,41],[147,95,62],[194,131,88],[231,171,121]],
 83:[[115,100,88],[177,155,136],[223,208,191],[246,234,213]],
 84:[[115,72,18],[186,124,32],[237,179,55],[255,223,108]],
 95:[[90,47,25],[150,80,41],[205,118,65],[244,163,95]],
 96:[[115,89,23],[181,138,34],[240,196,61],[255,232,120]],
 97:[[109,24,23],[175,35,32],[221,47,48],[251,92,76]],
 98:[[22,34,87],[41,63,142],[52,87,188],[91,130,225]],
 99:[[17,83,95],[39,143,153],[54,191,203],[124,240,232]],
 100:[[15,80,45],[31,133,73],[56,180,97],[124,231,153]]
};
for(let id=101;id<=108;id++)oreColors[id]=oreColors[[18,19,95,96,97,98,99,100][id-101]];
function vein(b,x,y){
 const deep=b>=101&&b<=108;
 const host=deep?58:3;
 const p=oreColors[b];
 // Three aligned, irregular mineral clusters per tile. Every ore gets a distinct mask.
 const loci=[[3+(b%3),3],[12,6+(b%2)],[6,12]];
 for(let i=0;i<loci.length;i++){
   const [cx,cy]=loci[i],dx=x-cx,dy=y-cy;
   const silhouette=(dx*dx+dy*dy)<=(i===2?10:8)&&
     hash(x>>1,y>>1,b*37+i)> (i===1?.22:.16) &&
     !(Math.abs(dx)===3&&Math.abs(dy)>=2);
   if(silhouette){
     const edge=Math.abs(dx)+Math.abs(dy)>3;
     return palette(edge?[p[0],p[0],p[1],p[2]]:p,x,y,b+900+i);
   }
 }
 return fallback(host,1,x,y);
}
const endStone=[[131,129,98],[173,171,129],[205,203,166],[226,222,185]];
const purpur=[[95,56,96],[137,83,135],[173,116,166],[202,147,192]];
const cobalt=[[19,39,49],[31,61,77],[43,91,108],[79,130,138]];
function endwork(b,f,x,y){
 if(b===121){
   const crater=hash(x>>2,y>>2,121)>.69&&(x%4===0||y%4===1);
   return crater?color(125,123,98):palette(endStone,x,y,121);
 }
 if(b===130){
   const mortar=x%8===0||y%5===0;
   return mortar?color(120,117,95):palette(endStone,x,y,130);
 }
 if(b===131||b===132){
   if(b===132&&f!==1){
     const ring=(Math.floor(Math.max(Math.abs(x-7.5),Math.abs(y-7.5))/2)%2);
     return palette(ring?purpur:[[62,43,65],[99,63,107],[129,86,127],[170,115,165]],x,y,b);
   }
   const grout=b===131&&(y%5===0||(x+(Math.floor(y/5)%2?4:0))%8===0);
   const rib=b===132&&(x===4||x===10);
   return grout?color(91,58,92):rib?color(105,60,104):palette(purpur,x,y,b);
 }
 if(b===55)return palette(cobalt,x,y,b);
 return null;
}
function distinctive(b,f,x,y){
 if(b===155){ // composter: dark recessed wooden container
   if(f===0&&x>2&&x<13&&y>2&&y<13)return palette([[24,37,25],[36,52,30],[54,64,37],[70,77,46]],x,y,b);
   const stave=x%4===0||x===1||x===14;
   const rim=y<3||y>13;
   return stave?color(72,50,28):rim?color(95,67,33):
     palette([[79,56,29],[119,80,42],[152,105,56],[183,132,72]],x,y,b);
 }
 if(b===158){ // mapmaker: neatly divided charts and tool drawers
   if(f===0){if(x===7||y===7)return color(106,72,40);if(x>2&&x<13&&y>2&&y<13)return palette([[135,130,92],[181,162,109],[206,182,126],[227,201,148]],x,y,b);}
   if(y===5||y===12)return color(88,64,40);
   return palette([[68,49,32],[116,81,50],[146,106,66],[174,129,82]],x,y,b);
 }
 if(b===159){ // brewing stand: dark stand, bright glass bottles
   const glass=(x===4||x===8||x===12)&&y>=4&&y<=11;
   const metal=(x>=6&&x<=9)||y>=12;
   return glass?color(121,176,177):metal?color(72,76,72):
     palette([[56,48,36],[96,80,53],[141,110,69],[174,135,83]],x,y,b);
 }
 if(b===160){ // barrel: metal hoops and circular end grain
   if(f!==1){const d=Math.max(Math.abs(x-7.5),Math.abs(y-7.5));return d>5?color(65,64,61):d<2?color(110,76,47):palette([[75,53,37],[115,79,51],[151,110,68],[184,137,83]],x,y,b);}
   if(y===3||y===12)return color(81,83,81);
   return x%4===0?color(72,47,29):palette([[73,49,27],[119,81,43],[157,110,59],[184,139,80]],x,y,b);
 }
 if(b===161){ // fletching station: crossed arrow quills and pale trim
   const border=x<2||y<2||x>13||y>13;
   if(f===0){if(border)return color(98,63,35);
     const arrow=(x===y||x+y===15)&&(x>=4&&x<=11);
     return arrow?color(208,210,181):palette([[104,75,39],[147,103,49],[175,129,72],[204,162,106]],x,y,b);}
   if(border)return color(97,59,37);
   if(y>=6&&y<=10&&x>=5&&x<=10)return color(152,167,144);
   return palette([[87,60,37],[126,88,49],[169,119,72],[199,151,93]],x,y,b);
 }
 if(b===162){ // cauldron: inset dark basin and slate iron walls
   if(f===0&&x>2&&x<13&&y>2&&y<13)return palette([[14,18,21],[25,34,37],[40,49,54],[57,69,74]],x,y,b);
   if(x<3||x>12||y<3||y>12)return color(75,79,81);
   return palette([[37,42,44],[54,58,60],[76,83,83],[104,109,106]],x,y,b);
 }
 if(b===163){ // lectern: open book on warm wood
   if(f===0&&x>2&&x<13&&y>3&&y<13){
     if(x===7||x===8)return color(108,88,57);
     return palette([[170,164,136],[213,206,172],[235,227,198],[247,244,226]],x,y,b);
   }
   return x%5===0?color(76,51,31):palette([[92,61,36],[123,80,48],[160,112,65],[194,145,90]],x,y,b);
 }
 if(b===164){ // stonecutter: toothed saw across gray tabletop
   if(f===0){const blade=(x===7||x===8)&&y>2&&y<14;
     return blade?color(201,207,197):palette([[77,81,82],[112,119,115],[137,144,141],[168,176,169]],x,y,b);}
   return palette([[81,70,53],[117,93,68],[141,119,84],[168,145,104]],x,y,b);
 }
 if(b===165){ // loom: intersecting woven threads
   if(f===0&&(x%4===0||y%4===0))return color(214,187,140);
   if(x===3||x===12||y===3||y===12)return color(92,64,38);
   return palette([[68,49,32],[113,81,50],[151,108,66],[193,146,96]],x,y,b);
 }
 if(b===167){ // grindstone: bright center of a radial gray wheel
   const rim=Math.max(Math.abs(x-7.5),Math.abs(y-7.5));
   if(f===0&&rim<5)return rim<2?color(74,79,80):palette([[91,93,94],[121,124,125],[152,156,155],[177,183,179]],x,y,b);
   if(y===7||y===8)return color(185,185,173);
   return palette([[56,56,57],[86,86,87],[117,117,117],[149,149,147]],x,y,b);
 }
 if(b===51){ // obsidian: deep purple, fractured mineral glass
   const crack=(x===4&&y>=2&&y<=10)||(y===9&&x>=4&&x<=12)||(x===11&&y>=9);
   if(crack&&hash(x>>2,y>>2,51)>.28)return color(74,47,107);
   return palette([[13,14,25],[27,24,39],[37,29,59],[59,43,83]],x,y,51);
 }
 if(b===64){ // sculk: bright specks within dark organic clusters
   const spark=hash(x>>1,y>>1,64)>.82&&hash(x,y,164)>.45;
   return spark?color(65,201,205):palette([[9,21,27],[12,32,41],[17,51,59],[23,78,81]],x,y,64);
 }
 if(b===57){ // clay: soft cool earth, subtly layered
   const seam=(y%7===1)&&hash(x>>2,y>>2,57)>.51;
   return seam?color(99,112,109):palette([[96,110,109],[125,139,135],[146,157,152],[176,184,174]],x,y,57);
 }
 if(b===60){ // bound wheat / hay: directional fibers and dark ropes
   const rope=f===0?(x===5||x===11):(y===4||y===11);
   const straw=f===0?(y%3===1):(x%3===1);
   return rope?color(105,84,41):straw?color(220,181,86):palette([[128,95,43],[166,127,53],[195,155,61],[237,202,105]],x,y,60);
 }
 if(b===137||b===138){
   const furrow=x%4===0||x%4===1,wet=b===138;
   const base=wet?[[38,30,25],[62,43,30],[81,60,42],[101,79,52]]:[[62,42,28],[88,57,36],[119,77,49],[141,99,65]];
   return furrow?palette([base[0],base[0],base[1],base[1]],x,y,b):palette(base,x,y,b);
 }
 if(b===86){
   const seam=f===1?(y%6===0):(x%7===0);
   return seam?color(148,139,109):palette([[150,145,123],[192,187,154],[219,217,181],[244,241,215]],x,y,86);
 }
 return null;
}
previous.paint=function(id,face,x,y){
 x&=15;y&=15;
 if(Object.prototype.hasOwnProperty.call(oreColors,id))return vein(id,x,y);
 const e=endwork(id,face,x,y);if(e)return e;
 const d=distinctive(id,face,x,y);if(d)return d;
 return fallback(id,face,x,y);
};
previous.version='5.3-new-pixel-art';
window.MineWorldTextureWorkshop=Object.freeze({version:previous.version,source:'original procedural pixels',blockFaces:16});
})();