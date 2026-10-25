/* MineWorld: independently authored cuboid skin UV definitions.
 * Source textures are imported by the player; this file contains no bitmap.
 * Minecraft-style cuboid layouts: cube net [right,front,left,back] below
 * [top,bottom], in the source skin's own pixel coordinate system.
 * Each map is deliberately limited to species/parts with known layouts.
 */
(()=>{
'use strict';
const C={
 // [u, v, x(width), y(height), z(depth)] measured in a 64x32/64x64 skin.
 pig:{head:[0,0,8,8,8],body:[28,8,10,16,8],leg:[0,16,4,6,4]},
 cow:{head:[0,0,8,8,6],body:[18,4,12,18,10],leg:[0,16,4,12,4]},
 sheep:{head:[0,0,6,6,8],body:[28,8,8,16,6],leg:[0,16,4,6,4]},
 creeper:{head:[0,0,8,8,8],body:[16,16,8,12,4],leg:[0,16,4,6,4]},
 zombie:{head:[0,0,8,8,8],body:[16,16,8,12,4],leg:[0,16,4,12,4],arm:[40,16,4,12,4]},
 skeleton:{head:[0,0,8,8,8],body:[16,16,8,12,4],leg:[0,16,2,12,2],arm:[40,16,2,12,2]}
};
const defs=Object.freeze(Object.fromEntries(Object.entries(C).map(([name,parts])=>[
 name,Object.freeze(Object.fromEntries(Object.entries(parts).map(([part,value])=>[part,Object.freeze(value)])))
])));
const faces=Object.freeze(['right','left','top','bottom','front','back']);
function rect(kind,part,face,image){
 const layout=defs[kind]?.[part];
 if(!layout||!faces.includes(face)||!image||!Number.isFinite(image.width)||!Number.isFinite(image.height))return null;
 const scale=image.width/64;
 if(!Number.isFinite(scale)||scale<.5||image.height<32*scale)return null;
 const [u,v,w,h,d]=layout;
 const b={
  right:[u,v+d,d,h],
  front:[u+d,v+d,w,h],
  left:[u+d+w,v+d,d,h],
  back:[u+2*d+w,v+d,w,h],
  top:[u+d,v,w,d],
  bottom:[u+d+w,v,w,d]
 }[face];
 const [x,y,width,height]=b.map(n=>n*scale);
 if(x<0||y<0||width<=0||height<=0||x+width>image.width+.001||y+height>image.height+.001)return null;
 return {x,y,width,height};
}
// Vertex emission order differs between MineWorld's axis-aligned hostile
// cuboids and its rotating animal cuboids. Rectangles use top-left image UVs:
// 0 top-left, 1 bottom-left, 2 bottom-right, 3 top-right.
function vertexCorner(face,index,renderer='cube'){
 const k=index&3;
 const table=renderer==='animal'?{
  front:[1,2,3,0],back:[2,1,0,3],
  left:[2,1,0,3],right:[1,2,3,0],
  top:[0,3,2,1],bottom:[1,0,3,2]
 }:{
  front:[1,0,3,2],back:[1,0,3,2],
  left:[1,0,3,2],right:[1,0,3,2],
  top:[0,1,2,3],bottom:[0,1,2,3]
 };
 return (table[face]||[0,1,2,3])[k];
}
window.MineWorldEntityTextureMaps=Object.freeze({defs,faces,rect,vertexCorner});
})();