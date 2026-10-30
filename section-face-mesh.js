/* Original MineWorld experimental exposed-face planner for vertical chunk sections.
 * No proprietary textures or game code. Geometry is local to one 16x16 section;
 * source snapshots and all six neighboring planes come from the section store.
 * This is a staging API, not yet the live WebGL renderer.
 */
(()=>{'use strict';
const FACE=Object.freeze({west:0,east:1,down:2,up:3,north:4,south:5});
const SIDES=['west','east','north','south'];
// MineWorld block IDs: transparent materials must not occlude opaque faces.
// Same-type transparent neighbors still cull their internal interface.
// This conservative staging rule can later use live material metadata.
const NON_OCCLUDING=new Set([
  // Transparent, translucent, liquid and foliage materials.
  6,7,9,12,13,14,22,23,31,33,35,37,39,41,43,59,62,66,
  // Non-full-cube plants, narrow objects, portals and decorations.
  // A neighboring partial block must not erase a full stone face.
  16,17,44,45,63,73,77,82,87,89,93,94,
  119,120,122,123,124,125,126,127,128,129,
  // Farmland is lower than a cube; crops have no solid cube faces.
  137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,
  // Hollow or inset workstations and the low bed model.
  155,159,162,163,164,167,169
]);
const defaultOccludes=(neighbor,block)=>neighbor!==0&&
  (neighbor===block||!NON_OCCLUDING.has(neighbor));
const isBytes=v=>Object.prototype.toString.call(v)==='[object Uint8Array]';
function plan(snapshot,{occludes}={}){
 if(!snapshot||!isBytes(snapshot.data)||snapshot.chunkSize!==16||
    !Number.isSafeInteger(snapshot.minY)||!Number.isSafeInteger(snapshot.maxY)||
    !Number.isSafeInteger(snapshot.index)||snapshot.index<0||
    !Number.isSafeInteger(snapshot.revision)||snapshot.revision<0)
   throw new RangeError('Invalid vertical section snapshot');
 const height=snapshot.maxY-snapshot.minY+1,size=16;
 if(height<1||height>16||snapshot.data.length!==size*size*height)
   throw new RangeError('Invalid section voxel dimensions');
 for(const side of SIDES)
  if(snapshot[side]!=null&&(!isBytes(snapshot[side])||snapshot[side].length!==size*height))
   throw new RangeError('Invalid horizontal neighbor plane');
 for(const side of ['above','below'])
  if(snapshot[side]!=null&&(!isBytes(snapshot[side])||snapshot[side].length!==size*size))
   throw new RangeError('Invalid vertical neighbor plane');
 if(occludes!==undefined&&typeof occludes!=='function')
   throw new TypeError('Expected an occlusion predicate');
 const covered=occludes||defaultOccludes;
 const data=snapshot.data,faces=[];
 const voxel=(x,z,y)=>data[(x*size+z)*height+y];
 const edge=(side,edgeIndex,y)=>snapshot[side]==null?0:snapshot[side][edgeIndex*height+y];
 const plane=(side,x,z)=>snapshot[side]==null?0:snapshot[side][x*size+z];
 let occupied=0;
 // Each face is one packed unsigned integer:
 // bits 0..3 x, 4..7 z, 8..11 local y, 12..14 face, 15..22 block ID.
 // Exact per-block face records preserve player-imported atlas UVs and
 // prevent merging differently textured or transparent neighboring blocks.
 for(let x=0;x<size;x++)for(let z=0;z<size;z++)for(let y=0;y<height;y++){
  const block=voxel(x,z,y);
  if(!block)continue;
  occupied++;
  const neighbors=[
   x>0?voxel(x-1,z,y):edge('west',z,y),
   x<size-1?voxel(x+1,z,y):edge('east',z,y),
   y>0?voxel(x,z,y-1):plane('below',x,z),
   y<height-1?voxel(x,z,y+1):plane('above',x,z),
   z>0?voxel(x,z-1,y):edge('north',x,y),
   z<size-1?voxel(x,z+1,y):edge('south',x,y)
  ];
  for(let side=0;side<6;side++)
   if(!covered(neighbors[side],block,side))
    faces.push((block<<15)|(side<<12)|(y<<8)|(z<<4)|x);
 }
 return Object.freeze({
  index:snapshot.index,revision:snapshot.revision,minY:snapshot.minY,
  maxY:snapshot.maxY,chunkSize:size,occupied,faceCount:faces.length,
  missingNeighbors:Object.freeze([...SIDES,'above','below'].filter(s=>snapshot[s]==null)),
  faces:Uint32Array.from(faces)
 });
}
function unpack(packed,minY){
 if(!Number.isSafeInteger(packed)||packed<0||packed>0x7fffff||
    !Number.isSafeInteger(minY))return null;
 return {x:packed&15,z:(packed>>>4)&15,localY:(packed>>>8)&15,
  y:minY+((packed>>>8)&15),face:(packed>>>12)&7,block:(packed>>>15)&255};
}
window.MineWorldSectionFaces=Object.freeze({FACE,plan,unpack});
})();
