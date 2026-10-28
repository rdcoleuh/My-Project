/* Vertical-coordinate codec and world-height profiles. Existing saved worlds
 * deliberately remain in the 48-layer legacy profile until an explicit,
 * versioned migration is implemented. No player data is rewritten here.
 * Original MineWorld implementation; no third-party game assets.
 */
(()=>{'use strict';
const LEGACY=Object.freeze({minY:0,maxY:47,seaLevel:14});
const OVERWORLD=Object.freeze({minY:-64,maxY:319,seaLevel:63});
function create({width=10000,depth=10000,minY=0,maxY=47,chunkSize=16}={}){
  const params=[width,depth,minY,maxY,chunkSize];
  if(!params.every(Number.isSafeInteger)||width<1||depth<1||chunkSize<1||maxY<minY)throw new RangeError('Invalid world dimensions');
  const height=maxY-minY+1,volume=width*depth*height;
  if(!Number.isSafeInteger(volume*3))throw new RangeError('World exceeds safe index range');
  const inside=(x,y,z)=>Number.isInteger(x)&&Number.isInteger(y)&&Number.isInteger(z)&&x>=0&&x<width&&z>=0&&z<depth&&y>=minY&&y<=maxY;
  // Same linear ordering as old MineWorld when minY=0: saves stay readable.
  const index=(x,y,z)=>(x*depth+z)*height+(y-minY);
  const decode=n=>{
    if(!Number.isSafeInteger(n)||n<0||n>=volume)return null;
    const y=n%height+minY,z=Math.floor(n/height)%depth,x=Math.floor(n/(depth*height));
    return {x,y,z};
  };
  const chunkIndex=(x,y,z)=>((x%chunkSize)*chunkSize+(z%chunkSize))*height+(y-minY);
  const networkIndex=(x,y,z,dimension='overworld')=>{
    const d=dimension==='overworld'?0:dimension==='nether'?1:dimension==='end'?2:-1;
    if(d<0||!inside(x,y,z))return null;
    return d*volume+index(x,y,z);
  };
  const decodeNetwork=n=>{
    if(!Number.isSafeInteger(n)||n<0||n>=volume*3)return null;
    const d=Math.floor(n/volume),point=decode(n%volume);
    return point?{...point,dimension:['overworld','nether','end'][d]}:null;
  };
  return Object.freeze({width,depth,minY,maxY,height,chunkSize,volume,inside,index,decode,chunkIndex,networkIndex,decodeNetwork});
}
window.MineWorldWorldDepth=Object.freeze({LEGACY,OVERWORLD,create});
})();