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
// Explicit, non-mutating conversion of edit indices for a future versioned save
// migration. Coordinates are absolute; only the serialized index changes.
// A rejected edit aborts the entire conversion rather than losing user blocks.
function reindexEdits(edits,source,target){
  if(Object.prototype.toString.call(edits)!=='[object Map]')throw new TypeError('Expected a Map of saved edits');
  if(!source||!target||source.width!==target.width||source.depth!==target.depth||
     typeof source.decode!=='function'||typeof target.index!=='function'||typeof target.inside!=='function')
    throw new RangeError('Incompatible world profiles');
  const result=new Map();
  for(const [oldIndex,block] of edits){
    const point=source.decode(oldIndex);
    if(!point||!target.inside(point.x,point.y,point.z))
      throw new RangeError('Saved edit lies outside target world');
    if(!Number.isSafeInteger(block)||block<0||block>255)
      throw new RangeError('Invalid saved block identifier');
    const nextIndex=target.index(point.x,point.y,point.z);
    if(result.has(nextIndex))throw new RangeError('Saved edit index collision');
    result.set(nextIndex,block);
  }
  return result;
}
// A mixed-height world must not reuse the same dimension volume for every
// network offset. The Overworld may be 384 layers while the Nether and End
// remain 48; allocate each dimension its own non-overlapping index interval.
// This is an opt-in codec and does not change live legacy saves or networking.
function createDimensionCodec({width=10000,depth=10000,chunkSize=16,
  overworld=OVERWORLD,nether=LEGACY,end=LEGACY}={}){
  const names=['overworld','nether','end'];
  const profiles={overworld,nether,end},codecs={},offsets={};
  let total=0;
  for(const name of names){
    const p=profiles[name];
    if(!p||!Number.isSafeInteger(p.minY)||!Number.isSafeInteger(p.maxY))
      throw new RangeError('Invalid dimension profile');
    const codec=create({width,depth,chunkSize,minY:p.minY,maxY:p.maxY});
    offsets[name]=total;codecs[name]=codec;
    total+=codec.volume;
    if(!Number.isSafeInteger(total))throw new RangeError('Combined dimensions exceed safe index range');
  }
  const networkIndex=(x,y,z,dimension='overworld')=>{
    const codec=names.includes(dimension)?codecs[dimension]:null;
    return codec&&codec.inside(x,y,z)?offsets[dimension]+codec.index(x,y,z):null;
  };
  const decodeNetwork=n=>{
    if(!Number.isSafeInteger(n)||n<0||n>=total)return null;
    for(let d=names.length-1;d>=0;d--){
      const name=names[d];
      if(n>=offsets[name]){
        const point=codecs[name].decode(n-offsets[name]);
        return point?{...point,dimension:name}:null;
      }
    }
    return null;
  };
  return Object.freeze({width,depth,chunkSize,volume:total,
    codecs:Object.freeze(codecs),offsets:Object.freeze(offsets),
    networkIndex,decodeNetwork});
}
// Reindex all three dimensions atomically. A corrupt or out-of-bounds edit
// aborts conversion; callers retain their untouched original save map.
function reindexNetworkEdits(edits,source,target){
  if(Object.prototype.toString.call(edits)!=='[object Map]')
    throw new TypeError('Expected a Map of network edits');
  if(!source||!target||source.width!==target.width||source.depth!==target.depth||
    typeof source.decodeNetwork!=='function'||typeof target.networkIndex!=='function')
    throw new RangeError('Incompatible dimension codecs');
  const converted=new Map();
  for(const [oldIndex,block] of edits){
    const point=source.decodeNetwork(oldIndex);
    if(!point)throw new RangeError('Saved network edit is invalid');
    if(!Number.isSafeInteger(block)||block<0||block>255)
      throw new RangeError('Invalid saved block identifier');
    const next=target.networkIndex(point.x,point.y,point.z,point.dimension);
    if(next===null)throw new RangeError('Saved network edit lies outside target dimension');
    if(converted.has(next))throw new RangeError('Saved network edit index collision');
    converted.set(next,block);
  }
  return converted;
}

// Split a generated chunk into independently addressable vertical sections.
// Uniform (including empty) sections use only one byte of block data. Mixed
// sections retain exact blocks with the same x,z,y ordering as legacy chunks.
// This is an opt-in staging API: the live renderer is not switched over yet.
function sectionizeChunk({data,minY=0,height,chunkSize=16,sectionHeight=16}={}){
  if(Object.prototype.toString.call(data)!=='[object Uint8Array]'||
    ![minY,height,chunkSize,sectionHeight].every(Number.isSafeInteger)||
    height<1||chunkSize<1||sectionHeight<1||
    !Number.isSafeInteger(chunkSize*chunkSize*height)||
    data.length!==chunkSize*chunkSize*height)
    throw new RangeError('Invalid vertical chunk data or dimensions');
  const sections=[];
  for(let start=0;start<height;start+=sectionHeight){
    const span=Math.min(sectionHeight,height-start),first=data[start];
    let uniform=true;
    for(let column=0;column<chunkSize*chunkSize&&uniform;column++){
      const base=column*height+start;
      for(let y=0;y<span;y++)if(data[base+y]!==first){uniform=false;break;}
    }
    let blocks=null;
    if(!uniform){
      blocks=new Uint8Array(chunkSize*chunkSize*span);
      for(let column=0;column<chunkSize*chunkSize;column++)
        blocks.set(data.subarray(column*height+start,column*height+start+span),column*span);
    }
    sections.push(Object.freeze({minY:minY+start,maxY:minY+start+span-1,
      height:span,uniform,block:uniform?first:null,data:blocks}));
  }
  const read=(x,y,z)=>{
    if(![x,y,z].every(Number.isInteger)||x<0||x>=chunkSize||z<0||z>=chunkSize||
      y<minY||y>=minY+height)return null;
    const section=sections[Math.floor((y-minY)/sectionHeight)];
    return section.uniform?section.block:
      section.data[(x*chunkSize+z)*section.height+y-section.minY];
  };
  const materialize=index=>{
    if(!Number.isInteger(index)||index<0||index>=sections.length)return null;
    const section=sections[index],out=new Uint8Array(chunkSize*chunkSize*section.height);
    if(section.uniform)out.fill(section.block);else out.set(section.data);
    return out;
  };
  const near=(y,radius=4)=>{
    if(!Number.isFinite(y)||!Number.isSafeInteger(radius)||radius<0)
      throw new RangeError('Invalid section view');
    const center=Math.max(0,Math.min(sections.length-1,
      Math.floor((y-minY)/sectionHeight)));
    return sections.map((section,index)=>({section,index})).filter(item=>
      Math.abs(item.index-center)<=radius).sort((a,b)=>
      Math.abs(a.index-center)-Math.abs(b.index-center)||a.index-b.index);
  };
  return Object.freeze({minY,maxY:minY+height-1,height,chunkSize,sectionHeight,
    sections:Object.freeze(sections),read,materialize,near});
}


 // Small occupancy flags for mesh culling, without copying full voxel arrays.
 // Conservative occupied flags after block deletion are safe; false negatives
 // after placement are not. The live setter marks newly occupied sections.
 function scanNonAirSections({data,height,chunkSize=16,sectionHeight=16}={}){
   if(Object.prototype.toString.call(data)!=='[object Uint8Array]'||
     ![height,chunkSize,sectionHeight].every(Number.isSafeInteger)||
     height<1||chunkSize<1||sectionHeight<1||
     !Number.isSafeInteger(chunkSize*chunkSize*height)||
     data.length!==chunkSize*chunkSize*height)
     throw new RangeError('Invalid section occupancy data');
   const occupied=new Uint8Array(Math.ceil(height/sectionHeight));
   for(let section=0;section<occupied.length;section++){
     const start=section*sectionHeight,span=Math.min(sectionHeight,height-start);
     scan:for(let col=0;col<chunkSize*chunkSize;col++){
       const base=col*height+start;
       for(let y=0;y<span;y++)if(data[base+y]!==0){
         occupied[section]=1;break scan;
       }
     }
   }
   return occupied;
 }

window.MineWorldWorldDepth=Object.freeze({LEGACY,OVERWORLD,create,reindexEdits,createDimensionCodec,reindexNetworkEdits,sectionizeChunk,scanNonAirSections});
})();