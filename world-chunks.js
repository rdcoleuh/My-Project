/* MineWorld v3 world generator: 10,000 x 10,000 blocks, deterministic seeded chunks.
 * Original game code. Independent of proprietary Minecraft assets.
 */
(() => {
 'use strict';
 const WORLD=10000, CHUNK=16, COLS=6, ROWS=6, REGION=144, CENTER=5000;
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 let worldSeed=85721;
 const hash=(x,z,salt=0)=>{
  let n=(Math.imul(x|0,374761393)^Math.imul(z|0,668265263)^Math.imul((worldSeed+salt)|0,1274126177))|0;
  n=Math.imul(n^(n>>>13),1274126177);return (n^(n>>>16))>>>0;
 };
 const rnd=(x,z,salt=0)=>hash(x,z,salt)/4294967295;
 function noise(x,z,scale,salt=0){
  let ix=Math.floor(x/scale),iz=Math.floor(z/scale),fx=x/scale-ix,fz=z/scale-iz;
  fx=fx*fx*(3-2*fx);fz=fz*fz*(3-2*fz);
  const a=rnd(ix,iz,salt),b=rnd(ix+1,iz,salt),c=rnd(ix,iz+1,salt),d=rnd(ix+1,iz+1,salt);
  return a*(1-fx)*(1-fz)+b*fx*(1-fz)+c*(1-fx)*fz+d*fx*fz;
 }
 function seedFrom(value){
   const raw=String(value??'').trim();if(!raw)return worldSeed;
   if(/^-?\d{1,19}$/.test(raw)){
     const n=BigInt(raw);const abs=n<0n?-n:n;return abs===0n?1:Number((abs-1n)%99999999n)+1;
   }
   let v=2166136261;for(const char of raw){v=Math.imul(v^char.charCodeAt(0),16777619)>>>0;}
   return (v%99999998)+1;
 }
 function setSeed(seed){worldSeed=clamp((Math.floor(Number(seed))||85721),1,99999999);return worldSeed;}
 function zone(x,z){
   const rx=Math.floor(x/REGION),rz=Math.floor(z/REGION);
   // Every 6x6 set of regions includes all 36 biomes, in a seed-dependent order.
   const a=((rx%6)+6)%6,b=((rz%6)+6)%6;
   const t=(b*6+a+worldSeed%36)%36;
   return t;
 }
 function biomeAt(x,z){const index=zone(x,z);return {...BIOMES[index],index};}
 function terrainAt(x,z,sea=14,H=48){
   const biome=BIOMES[zone(x,z)];
   const smooth=noise(x,z,70,82)*7+noise(x,z,29,83)*4+noise(x,z,12,84)*2;
   const rough=(noise(x,z,6,85)-.5)*2.2;
   let y=sea+1+biome.height+smooth-6.5+rough;
   if(biome.water)y=Math.min(y,sea-2);
   if(/Peaks|Slopes|Stony/.test(biome.name))y+=noise(x,z,25,86)*7;
   if(/Badlands/.test(biome.name))y=Math.round(y/2)*2;
   return clamp(Math.floor(y),4,H-10);
 }
 const cacheAtlas=new Map();
 function atlasDestination(biomeIndex){
   const key=String(biomeIndex)+':'+worldSeed;
   if(cacheAtlas.has(key))return cacheAtlas.get(key);
   const startX=Math.floor(CENTER/REGION),startZ=Math.floor(CENTER/REGION);
   let result=null,best=Infinity;
   for(let dz=-5;dz<=5;dz++)for(let dx=-5;dx<=5;dx++){
      const rx=startX+dx,rz=startZ+dz,x=rx*REGION+REGION*.5,z=rz*REGION+REGION*.5;
      if(x<25||x>=WORLD-25||z<25||z>=WORLD-25||zone(x,z)!==biomeIndex)continue;
      const dd=dx*dx+dz*dz;
      if(dd<best){best=dd;result={x:Math.floor(x),z:Math.floor(z)};}
   }
   // With a 6x6 repeating pattern, every biome is present in a 11x11 search.
   if(!result)result={x:CENTER,z:CENTER};
   cacheAtlas.set(key,result);return result;
 }
  const BIOMES=[
    {name:'Frozen Ocean',top:22,under:4,height:-5,tree:'none',feature:'shipwreck',water:true},
    {name:'Snowy Plains',top:21,under:2,height:0,tree:'none',feature:'igloo'},
    {name:'Ice Spikes',top:21,under:3,height:1,tree:'spikes',feature:null},
    {name:'Snowy Taiga',top:21,under:2,height:1,tree:'spruce',feature:'cabin'},
    {name:'Snowy Slopes',top:21,under:3,height:5,tree:'sparseSpruce',feature:null},
    {name:'Frozen Peaks',top:21,under:3,height:8,tree:'none',feature:'peakTower'},
    {name:'Stony Peaks',top:3,under:3,height:7,tree:'none',feature:'watchtower'},
    {name:'Grove',top:21,under:2,height:3,tree:'spruce',feature:null},
    {name:'Taiga',top:28,under:2,height:1,tree:'spruce',feature:null},
    {name:'Old Growth Pine Taiga',top:28,under:2,height:2,tree:'pine',feature:null},
    {name:'Old Growth Spruce Taiga',top:28,under:2,height:2,tree:'bigSpruce',feature:null},
    {name:'Stony Shore',top:3,under:3,height:-2,tree:'none',feature:'shoreRuins'},
    {name:'Cold Ocean',top:4,under:57,height:-6,tree:'kelp',feature:'oceanRuins',water:true},
    {name:'Beach',top:4,under:4,height:-3,tree:'palm',feature:'well'},
    {name:'Birch Forest',top:1,under:2,height:1,tree:'birch',feature:'village'},
    {name:'Dark Forest',top:1,under:2,height:1,tree:'darkOak',feature:'manor'},
    {name:'Cherry Grove',top:1,under:2,height:3,tree:'cherry',feature:'pavilion'},
    {name:'Pale Garden',top:46,under:2,height:1,tree:'paleOak',feature:'shrine'},
    {name:'Savanna',top:1,under:2,height:0,tree:'acacia',feature:'savannaVillage'},
    {name:'Meadow',top:1,under:2,height:2,tree:'flowers',feature:null},
    {name:'Flower Forest',top:1,under:2,height:0,tree:'oak',feature:null},
    {name:'Plains',top:1,under:2,height:0,tree:'sparseOak',feature:null},
    {name:'Dappled Forest',top:1,under:2,height:1,tree:'poplar',feature:'abandonedCamp'},
    {name:'Forest',top:1,under:2,height:0,tree:'oak',feature:'trailRuins'},
    {name:'Desert',top:4,under:24,height:-1,tree:'cactus',feature:'desertTemple'},
    {name:'Badlands',top:26,under:25,height:2,tree:'none',feature:'mineshaft'},
    {name:'Wooded Badlands',top:26,under:25,height:3,tree:'sparseOak',feature:null},
    {name:'Savanna Plateau',top:1,under:2,height:3,tree:'acacia',feature:'ruinedPortal'},
    {name:'Windswept Savanna',top:3,under:3,height:4,tree:'acacia',feature:null},
    {name:'River',top:4,under:57,height:-5,tree:'reeds',feature:'bridge',water:true},
    {name:'Mangrove Swamp',top:47,under:47,height:-2,tree:'mangrove',feature:'swampHut'},
    {name:'Swamp',top:1,under:47,height:-2,tree:'swampOak',feature:'witchHut'},
    {name:'Jungle',top:1,under:2,height:1,tree:'jungle',feature:'jungleTemple'},
    {name:'Bamboo Jungle',top:1,under:2,height:0,tree:'bamboo',feature:'camp'},
    {name:'Sparse Jungle',top:1,under:2,height:0,tree:'sparseJungle',feature:null},
    {name:'Mushroom Fields',top:46,under:2,height:0,tree:'mushroom',feature:'mushroomHut'}
  ];
  const STRUCTURE_NAMES={
    shipwreck:'Shipwreck',igloo:'Igloo',cabin:'Taiga Cabin',peakTower:'Mountain Watchtower',
    watchtower:'Stone Watchtower',shoreRuins:'Coastal Ruins',oceanRuins:'Underwater Ruins',
    well:'Sandstone Well',village:'Birch Village',manor:'Woodland Manor',pavilion:'Cherry Pavilion',
    shrine:'Pale Garden Shrine',savannaVillage:'Savanna Village',abandonedCamp:'Abandoned Camp',
    trailRuins:'Trail Ruins',desertTemple:'Desert Temple',mineshaft:'Mine Entrance',
    ruinedPortal:'Ruined Portal',bridge:'Stone Bridge',swampHut:'Mangrove Cabin',
    witchHut:'Witch Hut',jungleTemple:'Jungle Temple',camp:'Bamboo Camp',mushroomHut:'Mushroom House'
  };
 function generateChunk({cx,cz,H=48,SEA=14,edits=null}){
   const data=new Uint8Array(CHUNK*CHUNK*H), x0=cx*CHUNK,z0=cz*CHUNK;
   const within=(x,y,z)=>x>=x0&&x<x0+CHUNK&&z>=z0&&z<z0+CHUNK&&y>=0&&y<H;
   const offset=(x,y,z)=>((x-x0)*CHUNK+(z-z0))*H+y;
   const put=(x,y,z,block,onlyAir=false)=>{
     if(!within(x,y,z))return;
     const i=offset(x,y,z);if(!onlyAir||data[i]===0)data[i]=block;
   };
   const get=(x,y,z)=>within(x,y,z)?data[offset(x,y,z)]:0;
   const heights=new Int16Array(CHUNK*CHUNK);
   for(let dx=0;dx<CHUNK;dx++)for(let dz=0;dz<CHUNK;dz++){
     const x=x0+dx,z=z0+dz;if(x>=WORLD||z>=WORLD)continue;
     const biome=BIOMES[zone(x,z)],top=terrainAt(x,z,SEA,H);
     heights[dx*CHUNK+dz]=top;
     for(let y=0;y<=top;y++){
       let b=y===top?biome.top:y>=top-3?biome.under:3;
       if(y<top-5&&y>3)b=y<8?58:b;
       if(/Badlands/.test(biome.name)&&y<top&&y>top-8)b=(y%4===0?27:25);
       // Rock pockets and ore bands are deterministic, not generated from a preloaded world.
       if(y>2&&y<top-3){const ore=rnd(x*19+y*7,z*13+y*11,901);if(ore>.992)b=19;else if(ore>.974)b=18;}
       put(x,y,z,b);
     }
     for(let y=top+1;y<=SEA;y++)put(x,y,z,biome.name==='Frozen Ocean'?22:7);
     // A fast repeatable tunnel carve, bounded below surface and not through structures.
     for(let y=4;y<Math.min(top-4,H-6);y++){
       const cave=noise(x+y*1.8,z-y*1.7,23,610)*.7+noise(x-y*2.6,z+y*2.3,10,611)*.3;
       if(cave>.745)put(x,y,z,0);
     }
   }
   // Tree placement samples beyond the edges so canopy crosses adjacent chunks consistently.
   const stampTree=(x,z,kind)=>{
     const top=terrainAt(x,z,SEA,H),base=top+1;
     if(top<=SEA&& !['mangrove','kelp'].includes(kind))return;
     if(base>H-10)return;
     const trunk=(id,height)=>{for(let j=0;j<height;j++)put(x,base+j,z,id);};
     const crown=(tx,ty,tz,id,radius=2)=>{
       for(let dx=-radius;dx<=radius;dx++)for(let dz=-radius;dz<=radius;dz++)for(let dy=-1;dy<=2;dy++){
         if(dx*dx+dz*dz>radius*radius+2||Math.abs(dx)===radius&&Math.abs(dz)===radius)continue;
         put(tx+dx,ty+dy,tz+dz,id,true);
       }
     };
     if(kind==='cactus'){trunk(44,2+(hash(x,z,102)%3));return;}
     if(kind==='bamboo'){trunk(45,3+(hash(x,z,103)%4));return;}
     if(kind==='spikes'){trunk(23,5+(hash(x,z,104)%4));return;}
     if(kind==='mushroom'){trunk(57,4);crown(x,base+4,z,hash(x,z,105)%2?48:49,2);return;}
     if(kind==='kelp'){trunk(45,3);return;}
     const presets={
      oak:[5,6,5,2],sparseOak:[5,6,4,2],swampOak:[5,6,5,2],birch:[32,33,6,2],
      darkOak:[5,6,6,3],spruce:[30,31,7,2],sparseSpruce:[30,31,6,2],pine:[30,31,8,2],
      bigSpruce:[30,31,8,3],acacia:[34,35,5,2],jungle:[36,37,8,3],sparseJungle:[36,37,6,2],
      mangrove:[38,39,6,3],cherry:[40,41,6,3],paleOak:[42,43,7,3],poplar:[15,12+(hash(x,z,106)%3),7,2],palm:[34,35,5,2]
     };
     const p=presets[kind];if(!p)return;
     const [log,leaf,h,r]=p;trunk(log,h);
     if(/spruce|pine/i.test(kind)){
       for(let dy=2;dy<=h;dy++){let rr=dy>h-2?1:r;for(let dx=-rr;dx<=rr;dx++)for(let dz=-rr;dz<=rr;dz++)if(Math.abs(dx)+Math.abs(dz)<rr+2)put(x+dx,base+dy,z+dz,leaf,true);}
     }else if(kind==='palm'||kind==='acacia'){
       put(x+1,base+h-1,z,log);crown(x+1,base+h,z,leaf,r);
     }else crown(x,base+h,z,leaf,r);
   };
   for(let x=x0-4;x<x0+CHUNK+4;x++)for(let z=z0-4;z<z0+CHUNK+4;z++){
     if(x<2||x>=WORLD-2||z<2||z>=WORLD-2)continue;
     const biome=BIOMES[zone(x,z)],kind=biome.tree;
     if(kind==='none'||kind==='flowers'||kind==='reeds')continue;
     const density=kind==='jungle'?.035:kind==='bamboo'?.09:kind==='cactus'?.014:kind==='bigSpruce'?.018:kind==='sparseOak'?.009:kind==='spikes'?.009:.019;
     if(rnd(x,z,120)<density&&rnd(x-1,z+1,121)<.78)stampTree(x,z,kind);
   }
   // Structures appear every few hundred blocks; all coordinates depend only on seed.
   // Each candidate is generated in every overlapping chunk, avoiding seams.
   const SPACING=192;
   for(let gx=Math.floor((x0-24)/SPACING);gx<=Math.floor((x0+CHUNK+24)/SPACING);gx++)
   for(let gz=Math.floor((z0-24)/SPACING);gz<=Math.floor((z0+CHUNK+24)/SPACING);gz++){
     const ax=gx*SPACING+40+(hash(gx,gz,180)%100),az=gz*SPACING+40+(hash(gx,gz,181)%100);
     if(ax<10||ax>=WORLD-10||az<10||az>=WORLD-10)continue;
     const biome=BIOMES[zone(ax,az)];if(!biome.feature||rnd(gx,gz,182)>.67)continue;
     const ty=terrainAt(ax,az,SEA,H)+1;
     const feature=biome.feature;
     const sandstone=/desert|well|temple/.test(feature),wood=/village|cabin|camp|hut|shipwreck|manor|pavilion/.test(feature);
     const wall=sandstone?24:wood?11:53,trim=wood?5:61,roof=wood?30:3;
     const r=/manor|temple|village/.test(feature)?5:3;
     for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++){
       const X=ax+dx,Z=az+dz;
       put(X,ty-1,Z,trim);
       if(Math.abs(dx)===r||Math.abs(dz)===r){for(let dy=0;dy<4;dy++)put(X,ty+dy,Z,wall);}
       if((Math.abs(dx)===r-1||Math.abs(dz)===r-1)&&feature.includes('Ruins'))put(X,ty+3,Z,0);
       put(X,ty+4,Z,roof);
     }
     // Door, windows, a lantern, and a roof pinnacle.
     for(let dy=0;dy<3;dy++)put(ax,ty+dy,az-r,0);
     put(ax,ty+3,az-r,9);put(ax,ty+5,az,59);
     for(let dy=1;dy<3;dy++)for(const side of [-1,1])put(ax+side*r,ty+dy,az,9);
   }
   // User edits always override generated terrain and structures, even when unloaded.
   if(edits && edits.size){
     // Each loaded chunk indexes its own edits directly, rather than scanning all edits.
     const baseX=cx*CHUNK,baseZ=cz*CHUNK;
     for(const [index,block] of edits){
       const x=Math.floor(index/(WORLD*H)),z=Math.floor(index/H)%WORLD,y=index%H;
       if(x>=baseX&&x<baseX+CHUNK&&z>=baseZ&&z<baseZ+CHUNK&&y>=0&&y<H)put(x,y,z,block);
     }
   }
   return data;
 }
 window.MineWorldBiomes={WORLD,CHUNK,COLS,ROWS,BIOMES,STRUCTURE_NAMES,REGION,setSeed,seedFrom,zone,biomeAt,terrainAt,atlasDestination,generateChunk};
})();
