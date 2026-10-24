/* MineWorld 5.1 — independently drawn 16x16 voxel surfaces.
   Inspired by real block proportions and recognizable material categories.
   No Mojang textures, screenshots, or proprietary image files are used.
   The function is intentionally stateless: changing appearance never changes save IDs. */
(()=>{
  'use strict';
  const material=window.MineWorldPixelMaterials;
  if(!material)throw Error('MineWorld texture base not loaded');
  const previous=material.paint;
  const lim=v=>Math.max(0,Math.min(255,Math.round(v)));
  const rgba=(c,n=0)=>[lim(c[0]+n),lim(c[1]+n),lim(c[2]+n),255];
  function h(x,y,seed){
    let n=Math.imul((x|0)+211,374761393)^Math.imul((y|0)+997,668265263)^Math.imul((seed|0)+43,1274126177);
    n=Math.imul(n^(n>>>15),2246822519);
    return ((n^(n>>>13))>>>0)/4294967295;
  }
  function mosaic(x,y,k,p){
    const a=h(x>>2,y>>2,k),b=h(x>>1,y>>1,k+23),c=h(x,y,k+67);
    const i=a<.20?0:a>.83?3:b>.58?2:1;
    return rgba(p[i],c>.975?-13:0);
  }
  const turf=[[45,90,35],[66,119,43],[90,146,48],[123,172,62]];
  const soil=[[67,46,32],[97,66,43],[122,83,54],[151,111,74]];
  const rock=[[74,78,77],[110,116,112],[136,140,136],[165,169,162]];
  const paleSand=[[167,154,116],[201,190,145],[222,210,160],[242,229,183]];
  const gravel=[[72,71,69],[103,101,99],[139,136,131],[175,171,164]];
  const foliage=new Map([
    [6,[[33,83,31],[53,112,40],[72,139,46],[109,167,60]]],
    [12,[[92,31,28],[139,46,35],[170,65,43],[201,88,54]]],
    [13,[[117,59,21],[175,91,31],[205,128,39],[239,163,59]]],
    [14,[[130,102,33],[179,147,49],[209,179,63],[236,211,92]]],
    [31,[[28,62,42],[40,84,52],[59,110,66],[88,130,80]]],
    [33,[[61,96,34],[82,125,45],[110,156,62],[146,175,82]]],
    [35,[[78,88,36],[109,118,42],[141,150,54],[169,176,76]]],
    [37,[[26,81,28],[37,109,38],[55,141,49],[82,165,66]]],
    [39,[[29,72,54],[43,101,66],[61,125,82],[90,149,100]]],
    [41,[[115,67,88],[177,111,137],[226,153,177],[246,197,212]]],
    [43,[[77,104,100],[116,146,139],[159,181,169],[196,212,194]]],
    [79,[[77,21,38],[124,34,52],[163,48,64],[201,65,76]]],
    [81,[[21,73,74],[34,106,105],[51,142,136],[76,176,165]]]
  ]);
  function grassSide(x,y){
    const fringe=2+Math.floor(h(x,0,101)*3);
    const notch=(h(x>>1,1,102)>.73&&y===fringe);
    if(y<fringe||notch)return mosaic(x,y,101,turf);
    const root=(y<fringe+5&&((x+3*y)%13===0)&&h(x,y,244)>.4);
    if(root)return rgba([70,92,34]);
    return dirt(x,y);
  }
  function dirt(x,y){
    // Very small roots and sharp stone chips, not an even per-pixel static filter.
    const stoneChip=h(x>>1,y>>1,243)>.89&&((x&1)===(y&1));
    if(stoneChip)return rgba([132,126,105],h(x,y,232)>.5?15:-18);
    const root=h(x>>2,y>>2,101)>.83&&((x+2*y)%9===0);
    if(root)return rgba([60,45,29]);
    return mosaic(x,y,22,soil);
  }
  function stone(x,y,deep=false){
    const p=deep?[[40,43,49],[63,69,76],[82,87,93],[109,113,118]]:rock;
    const cell=h(x>>2,y>>2,314+(deep?11:0));
    const joint=(x%4===0&&y%4<3&&cell>.61)||(y%4===1&&x%4>=2&&cell<.16);
    if(joint)return rgba(p[0],-7);
    const nick=h(x,y,413+(deep?7:0))>.984;
    if(nick)return rgba(p[3],12);
    return mosaic(x,y,401+(deep?31:0),p);
  }
  function planks(id,x,y){
    const cherry=id===132,night=id===52;
    const palette=cherry?[[72,40,68],[118,72,106],[159,104,139],[192,140,169]]:
      night?[[50,38,34],[77,56,46],[105,77,62],[136,103,81]]:
      [[88,57,31],[129,84,45],[165,113,62],[198,149,89]];
    const row=Math.floor(y/4),off=row%2?8:0;
    const edge=y%4===0||(x+off)%16===0;
    if(edge)return rgba(palette[0],-6);
    const grain=(h(x>>2,row,id+24)>.53&&y%4===2&&x%7!==0);
    const knot=(h(row,Math.floor((x+off)/16),id+77)>.82&&(x+off)%16>=11&&(x+off)%16<=13&&y%4===2);
    const nails=(x+off)%16===2&&y%4===1;
    if(nails)return rgba(palette[0],-15);
    if(knot)return rgba(palette[0]);
    if(grain)return rgba(palette[1],-7);
    return mosaic(x,y,id+13,palette);
  }
  function leafy(id,x,y){
    const palette=foliage.get(id);
    const gap=h(x>>1,y>>1,id+521)>.88;
    const vein=((x+y)%7===1)&&h(x>>2,y>>2,id+55)>.45;
    if(gap)return rgba(palette[0],-8);
    if(vein)return rgba(palette[1],-3);
    return mosaic(x,y,id+29,palette);
  }
  function water(x,y){
    const drift=(y+Math.floor(x/4)*2)%7;
    if(drift===0&&h(x>>2,y>>1,7)>.25)return rgba([93,162,207]);
    if(drift===1&&h(x>>2,y>>2,71)>.55)return rgba([58,130,181]);
    return mosaic(x,y,7,[[27,83,144],[36,104,164],[44,124,181],[67,144,194]]);
  }
  function lava(x,y){
    const lane=(x+Math.floor(y/3)*2)%7;
    if(lane<=1)return rgba([255,194,62],h(x,y,66)>.82?22:-10);
    if(h(x>>1,y>>1,214)>.72)return rgba([239,130,25]);
    return mosaic(x,y,66,[[116,39,24],[183,56,19],[216,83,21],[248,122,27]]);
  }
  material.paint=function(block,face,x,y){
    x&=15;y&=15;
    if(block===1)return face===0?mosaic(x,y,78,turf):face===2?dirt(x,y):grassSide(x,y);
    if(block===2)return dirt(x,y);
    if(block===3||block===58)return stone(x,y,block===58);
    if(block===4)return mosaic(x,y,4,paleSand);
    if(block===92)return mosaic(x,y,92,gravel);
    if(block===11||block===52||block===132)return planks(block,x,y);
    if(foliage.has(block))return leafy(block,x,y);
    if(block===7)return water(x,y);
    if(block===66)return lava(x,y);
    return previous(block,face,x,y);
  };
  material.version='5.1-original-voxel-surfaces';
  window.MineWorldTexturePolish=Object.freeze({version:material.version,texturePixels:16});
})();