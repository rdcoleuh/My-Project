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

/*
 * Opt-in bridge from packed exposed faces to the live renderer's interleaved
 * [world xyz, shaded rgb, atlas uv] triangle layout (8 floats per vertex).
 * No proprietary bitmap data or texture coordinates are embedded: callers
 * supply the UV resolver for their player-imported atlas. This remains a
 * staging API until the 384-layer chunk stream is wired into live WebGL.
 * A per-section face budget prevents accidental multi-megabyte allocations
 * on memory-constrained mobile devices.
 */
const QUADS=Object.freeze([
  [[0,0,1],[0,1,1],[0,1,0],[0,0,0]], // west (-X)
  [[1,0,0],[1,1,0],[1,1,1],[1,0,1]], // east (+X)
  [[0,0,1],[0,0,0],[1,0,0],[1,0,1]], // down (-Y)
  [[0,1,0],[0,1,1],[1,1,1],[1,1,0]], // up (+Y)
  [[0,0,0],[0,1,0],[1,1,0],[1,0,0]], // north (-Z)
  [[1,0,1],[1,1,1],[0,1,1],[0,0,1]]  // south (+Z)
]);
const FACE_SHADE=Object.freeze([.72,.72,.45,1,.80,.83]);
const TRIANGLES=Object.freeze([0,1,2,0,2,3]);
const CORNER_UV=Object.freeze([[0,0],[0,1],[1,1],[1,0]]);
const CUBE=Object.freeze({left:0,right:1,bottom:0,top:1,front:0,back:1});
function faceCorner(face,v){
 const [x,y,z]=v;
 let u,t;
 if(face===3){u=x;t=z;}
 else if(face===2){u=x;t=1-z;}
 else if(face===1){u=1-z;t=1-y;}
 else if(face===0){u=z;t=1-y;}
 else if(face===5){u=1-x;t=1-y;}
 else {u=x;t=1-y;}
 return u?(t?2:3):(t?1:0);
}
function buildTriangles(plan,{originX=0,originZ=0,uvForFace,shapeForBlock,maxFaces=8192}={}){
 if(!plan||Object.prototype.toString.call(plan.faces)!=='[object Uint32Array]'||
    plan.chunkSize!==16||!Number.isSafeInteger(plan.minY)||
    !Number.isSafeInteger(plan.maxY)||plan.maxY<plan.minY||
    plan.maxY-plan.minY>=16||plan.faceCount!==plan.faces.length||
    plan.faceCount<0||plan.faceCount>24576)
  throw new RangeError('Invalid section face plan');
 if(!Number.isSafeInteger(originX)||!Number.isSafeInteger(originZ)||
    !Number.isSafeInteger(originX+16)||!Number.isSafeInteger(originZ+16))
  throw new RangeError('Invalid section world origin');
 if(!Number.isSafeInteger(maxFaces)||maxFaces<1||maxFaces>24576||
    plan.faceCount>maxFaces)
  throw new RangeError('Section geometry exceeds face budget');
 if(uvForFace!==undefined&&typeof uvForFace!=='function'||
    shapeForBlock!==undefined&&typeof shapeForBlock!=='function')
  throw new TypeError('Expected section geometry callbacks');
 // Validate the packed plan before allocating any GPU-bound buffers.
 const decoded=[];
 for(const packed of plan.faces){
  const face=unpack(packed,plan.minY);
  if(!face||face.face>5||face.block===0||face.y>plan.maxY)
   throw new RangeError('Invalid packed section face');
  decoded.push(face);
 }
 const out=new Float32Array(decoded.length*TRIANGLES.length*8);
 const shapes=new Map();
 let cursor=0;
 for(const p of decoded){
  let shape=shapes.get(p.block);
  if(!shape){
   shape=shapeForBlock?shapeForBlock(p.block):null;
   if(shape==null)shape=CUBE;
   const values=['left','right','bottom','top','front','back'].map(k=>shape[k]);
   if(!values.every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1)||
      shape.left>shape.right||shape.bottom>shape.top||shape.front>shape.back)
    throw new RangeError('Invalid section block shape');
   shapes.set(p.block,shape);
  }
  const verts=QUADS[p.face];
  const uv=verts.map(v=>{
   const corner=faceCorner(p.face,v);
   const pair=uvForFace?uvForFace(p.block,p.face,corner):CORNER_UV[corner];
   if(!pair||pair.length!==2||![pair[0],pair[1]].every(n=>
       typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1))
    throw new RangeError('Invalid player atlas UV');
   return [pair[0],pair[1]];
  });
  for(const i of TRIANGLES){
   const v=verts[i],point=uv[i];
   out[cursor++]=originX+p.x+(v[0]?shape.right:shape.left);
   out[cursor++]=p.y+(v[1]?shape.top:shape.bottom);
   out[cursor++]=originZ+p.z+(v[2]?shape.back:shape.front);
   out[cursor++]=FACE_SHADE[p.face];
   out[cursor++]=FACE_SHADE[p.face];
   out[cursor++]=FACE_SHADE[p.face];
   out[cursor++]=point[0];out[cursor++]=point[1];
  }
 }
 return Object.freeze({vertices:out,stride:8,vertexCount:decoded.length*6,
  triangleCount:decoded.length*2,faceCount:decoded.length,
  originX,originZ,minY:plan.minY,revision:plan.revision});
}

window.MineWorldSectionFaces=Object.freeze({FACE,plan,unpack,buildTriangles});
})();
