/* MineWorld: independently authored deterministic Overworld ore veins.
 * World height is 48 rather than Minecraft's -64..320. These are compressed
 * depth distributions informed by the general idea of real ore layering.
 * Never writes outside the 16x16 chunk; neighboring chunks share seam-safe
 * candidate positions, and player edits remain authoritative afterward.
 */
(() => {
  'use strict';
  const CHUNK=16, WORLD=10000;
  let seed=85721;
  const TYPES=[
    {name:'Coal',stone:18,deep:101,min:8,max:39,peak:17,chance:.70,radius:2,tier:'Wood',drop:'Coal',color:'#505559'},
    {name:'Iron',stone:19,deep:102,min:4,max:37,peak:19,chance:.39,radius:2,tier:'Stone',drop:'Raw iron',color:'#c28d71'},
    {name:'Copper',stone:95,deep:103,min:8,max:34,peak:23,chance:.42,radius:2,tier:'Stone',drop:'Raw copper',color:'#ce824e'},
    {name:'Gold',stone:96,deep:104,min:3,max:24,peak:12,chance:.23,radius:1,tier:'Iron',drop:'Raw gold',color:'#f2bf38'},
    {name:'Redstone',stone:97,deep:105,min:3,max:17,peak:7,chance:.19,radius:1,tier:'Iron',drop:'Redstone dust',color:'#ea4238'},
    {name:'Lapis Lazuli',stone:98,deep:106,min:6,max:26,peak:16,chance:.28,radius:1,tier:'Stone',drop:'Lapis lazuli',color:'#3766d1'},
    {name:'Diamond',stone:99,deep:107,min:3,max:15,peak:6,chance:.13,radius:1,tier:'Iron',drop:'Diamond',color:'#66e9e3'},
    {name:'Emerald',stone:100,deep:108,min:8,max:39,peak:26,chance:.25,radius:0,tier:'Iron',drop:'Emerald',color:'#38d46b'}
  ];
  // Deep-world Y bands are independent of the original compressed 48-layer
  // distributions. The legacy bands remain unchanged for existing saves.
  const DEEP_BANDS=Object.freeze({
    Coal:{min:0,max:192,peak:96},Iron:{min:-64,max:192,peak:16},
    Copper:{min:-16,max:112,peak:48},Gold:{min:-64,max:32,peak:-16},
    Redstone:{min:-64,max:16,peak:-56},'Lapis Lazuli':{min:-64,max:64,peak:0},
    Diamond:{min:-64,max:16,peak:-58},Emerald:{min:-16,max:256,peak:128}
  });
  const idMap=new Map();for(const spec of TYPES){idMap.set(spec.stone,spec);idMap.set(spec.deep,spec);}
  function setSeed(s){seed=(Math.floor(Number(s))||85721)>>>0;return seed;}
  function hash(x,y,z,t){
    let v=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(z|0,1442695041)^Math.imul((seed+t*8191)|0,1274126177);
    v=Math.imul(v^(v>>>13),1274126177);return (v^(v>>>16))>>>0;
  }
  function chance(x,y,z,t){return hash(x,y,z,t)/4294967296;}
  function weight(y,ore,biome){
    if(y<ore.min||y>ore.max)return 0;
    const range=Math.max(1,y>ore.peak?ore.max-ore.peak:ore.peak-ore.min);
    let w=.25+.75*(1-Math.abs(y-ore.peak)/range);
    if(ore.name==='Gold'&&/Badlands/.test(biome))w*=2.2;
    if(ore.name==='Copper'&&/Stony|Dripstone/.test(biome))w*=1.45;
    if(ore.name==='Iron'&&/Peaks|Slopes|Mountain/.test(biome)&&y>18)w*=1.7;
    if(ore.name==='Emerald')w=/Peaks|Grove|Slopes|Meadow|Mountain|Stony/.test(biome)?w*2.4:w*.045;
    return Math.min(2.5,w);
  }
  function generate({data,cx,cz,H=48,minY=0,sea=14,biomeAt,terrainAt,protectedEdits}){
    const x0=cx*CHUNK,z0=cz*CHUNK;
    const at=(x,y,z)=>((x-x0)*CHUNK+(z-z0))*H+(y-minY);
    const inside=(x,y,z)=>x>=x0&&x<x0+CHUNK&&z>=z0&&z<z0+CHUNK&&x>=0&&x<WORLD&&z>=0&&z<WORLD&&y>minY+2&&y<minY+H;
    const cell=5;
    for(let type=0;type<TYPES.length;type++){
      const base=TYPES[type],ore=minY<0?{...base,...DEEP_BANDS[base.name]}:base;
      for(let gx=Math.floor((x0-ore.radius)/cell);gx<=Math.floor((x0+CHUNK-1+ore.radius)/cell);gx++)
      for(let gz=Math.floor((z0-ore.radius)/cell);gz<=Math.floor((z0+CHUNK-1+ore.radius)/cell);gz++)
      for(let gy=Math.floor(ore.min/cell);gy<=Math.ceil(ore.max/cell);gy++){
        const anchorX=gx*cell+Math.floor(chance(gx,gy,gz,type*15+1)*cell);
        const anchorZ=gz*cell+Math.floor(chance(gx,gy,gz,type*15+2)*cell);
        const anchorY=gy*cell+Math.floor(chance(gx,gy,gz,type*15+3)*cell);
        if(anchorX<0||anchorX>=WORLD||anchorZ<0||anchorZ>=WORLD||anchorY<ore.min||anchorY>ore.max)continue;
        const biome=biomeAt(anchorX,anchorZ).name;
        const threshold=ore.chance*weight(anchorY,ore,biome);
        if(chance(gx,gy,gz,type*15+4)>threshold)continue;
        const radius=ore.radius;
        for(let ox=-radius;ox<=radius;ox++)for(let oy=-radius;oy<=radius;oy++)for(let oz=-radius;oz<=radius;oz++){
          if(ox*ox+oy*oy+oz*oz>radius*radius+.3)continue;
          const x=anchorX+ox,y=anchorY+oy,z=anchorZ+oz;
          if(!inside(x,y,z))continue;
          if(y>=terrainAt(x,z,sea,H,minY)-3)continue;
          if(chance(x,y,z,type*15+5)<.13)continue;
          const i=at(x,y,z),rock=data[i];
          if(rock!==3&&rock!==58)continue;
          data[i]=rock===58?ore.deep:ore.stone;
        }
      }
    }
    // Ground truth: preserve manually mined or built blocks in regenerated chunks.
    if(protectedEdits&&protectedEdits.size){
      for(const [index,block] of protectedEdits){
        const x=Math.floor(index/(WORLD*H)),z=Math.floor(index/H)%WORLD,y=index%H+minY;
        if(inside(x,y,z))data[at(x,y,z)]=block;
      }
    }
    return data;
  }
  window.MineWorldOres={TYPES,ids:idMap,setSeed,generate};
})();
