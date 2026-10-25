/* MineWorld 6.4 - original 16-pixel material microdetail.
 * Last painter in the stack. Preserves every block ID, face orientation,
 * transparent texel, world-save key, and preexisting gameplay mechanic.
 * This is independently designed art, not third-party game texture data.
 */
(()=>{
'use strict';
const engine=window.MineWorldPixelMaterials;
if(!engine)return;
const previous=engine.paint;
const PIXELS=16;
const familySets={
  bark:new Set([5,15,30,32,34,36,38,40,42,78,80]),
  leaves:new Set([6,12,13,14,31,33,35,37,39,41,43,79,81]),
  ore:new Set([18,19,83,84,95,96,97,98,99,100,101,102,103,104,105,106,107,108]),
  soil:new Set([1,2,4,21,24,26,28,29,46,47,57,92,137,138]),
  stone:new Set([3,25,27,53,54,55,58,61,67,68,69,70,71,121,130,131,132]),
  masonry:new Set([8,24,53,54,72,74,130,131]),
  timber:new Set([11,52,118,119,120,155,158,160,161,163,165,168]),
  plants:new Set([16,17,44,45,48,49,62,63,73,77,82,93,94]),
  metals:new Set([56,91,110,111,112,113,114,115,116,117,135]),
  glowing:new Set([7,10,59,64,66,87,88,89,90,109,124,125,126,127,128,129]),
  machines:new Set([20,59,109,118,119,120,124,125,126,127,128,129,133,134,136,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169])
};
const clamp=n=>Math.max(0,Math.min(255,Math.round(n)));
function hash(x,y,seed){
 let n=Math.imul((x|0)+1927,0x9e3779b1)^Math.imul((y|0)+719,0x85ebca6b)^Math.imul((seed|0)+137,0xc2b2ae35);
 n=Math.imul(n^(n>>>16),0x7feb352d);
 n=Math.imul(n^(n>>>15),0x846ca68b);
 return ((n^(n>>>16))>>>0)/4294967295;
}
const contains=(kind,id)=>familySets[kind].has(id);
function family(id){
 if(id>=139&&id<=154)return 'crops';
 if(contains('bark',id))return 'bark';
 if(contains('leaves',id))return 'leaves';
 if(contains('ore',id))return 'ore';
 if(contains('machines',id))return 'machines';
 if(contains('metals',id))return 'metals';
 if(contains('plants',id))return 'plants';
 if(contains('glowing',id))return 'glowing';
 if(contains('masonry',id))return 'masonry';
 if(contains('timber',id))return 'timber';
 if(contains('soil',id))return 'soil';
 if(contains('stone',id))return 'stone';
 return 'decor';
}
// Blend with the previous hand-shaped artwork rather than wiping out the
// distinctive side/top/bottom silhouettes, ores, cut-outs and workstation icons.
function paint(id,face,x,y){
 x=(x|0)&15;y=(y|0)&15;
 const original=previous(id,face,x,y);
 if(id<1||id>169||!original||original.length!==4)return original;
 if(original[3]===0)return original; // keep foliage/crop cutouts exactly as they were
 const kind=family(id);
 const coarse=hash(x>>2,y>>2,id*53+17);
 const cluster=hash(x>>1,y>>1,id*193+59);
 const grain=hash(x,y,id*311+83);
 const strength=kind==='machines'?2:kind==='metals'?4:kind==='crops'?3:5;
 let d=Math.round((coarse-.48)*strength+(cluster-.5)*strength*.76+(grain-.5)*2.6);
 // A small, deliberate lattice of contrasting texels makes the 16x16 source
 // grid visible instead of resembling smoothed or scaled 3-D noise.
 d+=(grain>.965?2:grain<.035?-2:0);
 let rr=original[0],gg=original[1],bb=original[2];
 if(kind==='bark'){
   if(face===1){
     const streak=hash(x,0,id*277+31),cut=hash(x>>1,y>>2,id+51);
     if(streak>.79&&y%5!==0)d-=6;
     else if(streak<.21&&y%4!==2)d+=5;
     if(cut>.86&&y%4===0)d-=3;
   }else{ // growth rings, distinct from side-grain
     const radius=Math.max(Math.abs(x-7.5),Math.abs(y-7.5));
     if(radius>2&&Math.floor(radius*1.8)%3===0)d-=5;
     if(radius<2.5)d+=3;
   }
 }else if(kind==='leaves'){
   const a=hash(x>>2,y>>2,id*373+11);
   const silhouette=(x+y*3+id)%7;
   if(a>.72&&silhouette<4){d+=6;gg+=2;}
   if(a<.21&&silhouette>2)d-=6;
   if(id===41&&a>.85){rr+=5;bb+=5;}
 }else if(kind==='ore'){
   const saturation=Math.max(rr,gg,bb)-Math.min(rr,gg,bb);
   const bright=Math.max(rr,gg,bb);
   // Colored seams/facets stay cohesive instead of turning mineral deposits
   // into isolated rainbow grains; the host rock is left largely undisturbed.
   if((saturation>27||id===18||id===101)&&bright>48){
     const facet=(x+2*y+id)%7,vein=hash(x>>1,y>>1,id*37);
     if(facet===0&&vein>.28)d+=10;
     else if(facet===1&&vein>.55)d-=8;
     else if(vein>.76&&facet<4)d+=3;
   }
 }else if(kind==='soil'||kind==='stone'){
   const speck=hash(x>>1,y>>1,id*331);
   if(speck>.87&&((x+3*y)%5)<2)d+=4;
   if(speck<.12&&((x+y)%4)===1)d-=5;
 }else if(kind==='timber'){
   if(y%4===2&&hash(x>>2,y>>1,id*199)>.7)d-=4;
   if(y%4===1&&hash(x>>1,y>>2,id*177)>.75)d+=3;
 }else if(kind==='masonry'){
   // Preserve grout and broken-brick edges, adding fine chipped corners.
   if((x%8===2||x%8===7)&&y%4===2&&cluster>.65)d-=6;
 }else if(kind==='metals'){
   if(x+y===12||x+y===18)d+=4;
   if(x%8===0&&y%8===0)d-=5;
 }else if(kind==='plants'||kind==='crops'){
   if((x+y*3)%7===0)d+=6;
   if((x*3+y)%11===2)d-=4;
 }
 // Distinct materials whose original iconic details need more legibility.
 if(id===9){ // Glass: glancing reflections, dark edge framing.
   const edge=x===0||x===15||y===0||y===15;
   const glint=(x===2&&y>=2&&y<=6)||(y===2&&x>=2&&x<=6)||
     (x===13&&y>=10&&y<=13)||(y===13&&x>=11&&x<=13);
   if(edge){rr=150;gg=180;bb=189;d=-12;}
   if(glint){rr=220;gg=239;bb=240;d=0;}
 }
 if(id===22||id===23){ // Ice: square blue-white fracture highlights.
   if((x+y*2+id)%13===0&&cluster>.32){rr+=14;gg+=19;bb+=20;}
   if(id===23&&((x>>2)^(y>>2))%3===0)d-=4;
 }
 if(id===44){ // Cactus: separate hard rind from sparse pale spines.
   if(face===1&&(x===1||x===14)){rr=37;gg=93;bb=32;d=0;}
   if(face===1&&(x===5||x===10)&&y%5===2){rr=168;gg=179;bb=90;d=0;}
 }
 if(id===45&&face===1){ // Bamboo: vertical cane joints.
   if(y===4||y===11){d-=14;rr+=7;}
   if(x===5||x===10)d+=5;
 }
 if(id===51){ // Obsidian's dark blue-violet fracture glints.
   if((x+2*y)%11===0&&cluster>.63){rr+=15;gg+=3;bb+=24;}
   if((x*3+y)%17===1)d-=7;
 }
 if(id===60){ // Hay: bound horizontal top, vertical stalks on sides.
   if(face===1){
     if(x%4===0)d-=12;
     if(x%4===1)d+=8;
     if(y===7||y===8){rr=139;gg=100;bb=39;d=0;}
   }else if((y===5||y===11)&&x>1&&x<14)d-=8;
 }
 if(id===64){ // Sculk: sparse cyan veins over deep dark substrate.
   if(((x+y*2)%11===0||(x*2-y+17)%13===0)&&cluster>.44){
     rr=25;gg=107;bb=116;d=6;
   }
 }
 if(id===88){ // Keep magma crack geometry while increasing hot-edge contrast.
   if(rr>180&&rr>gg*1.15){rr+=11;gg+=7;}
   else d-=4;
 }
 if(id===121&&cluster>.86&&(x+y)%3===0)d-=8; // End stone pits.
 if(id===169&&face===0&&y===2)d+=9; // bed cover stitching.
 return [clamp(rr+d),clamp(gg+d),clamp(bb+d),original[3]];
}
engine.paint=paint;
window.MineWorldTextureFacets=Object.freeze({
 version:'6.4-original-face-microdetail',pixelsPerFace:PIXELS,
 coveredIds:Object.freeze(Array.from({length:169},(_,i)=>i+1)),
 families:Object.freeze(Object.fromEntries(Object.keys(familySets).map(k=>[k,Object.freeze([...familySets[k]])]))),
 family,render:paint,originalAssetsUsed:false
});
})();