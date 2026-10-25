/* MineWorld block-face UV axes.
 * Each face is viewed from outside: the top edge of a side face points up,
 * never down; front/back and east/west keep their own readable handedness.
 * No changes to block IDs, chunk data, world saves or bitmap assets.
 */
(()=>{
'use strict';
// atlas tile corners: top-left=0, bottom-left=1, bottom-right=2, top-right=3.
const coordToCorner=(u,v)=>u? v?2:3 : v?1:0;
function corner(normal,vertex){
 if(!Array.isArray(normal)||!Array.isArray(vertex))return 0;
 const [nx,ny,nz]=normal, [x,y,z]=vertex;
 let u,v;
 if(ny===1){u=x;v=z;} // up: north at top, west at left
 else if(ny===-1){u=x;v=1-z;} // down, viewed from below
 else if(nx===1){u=1-z;v=1-y;} // east, viewed from +X
 else if(nx===-1){u=z;v=1-y;} // west, viewed from -X
 else if(nz===1){u=1-x;v=1-y;} // south, viewed from +Z
 else {u=x;v=1-y;} // north, viewed from -Z
 return coordToCorner(u>=.5?1:0,v>=.5?1:0);
}
window.MineWorldFaceUV=Object.freeze({corner});
})();