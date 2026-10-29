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



/*
 * Mutable, copy-on-write section storage for future deep-world streaming.
 * Uniform 16-block slices need only a block ID until first edited. The
 * caller still owns save edits; this store never rewrites legacy save keys.
 * Coordinates are absolute Y, including negative depths.
 */
function createSectionStore(options={}){
  const source=sectionizeChunk(options);
  const {minY,maxY,height,chunkSize,sectionHeight}=source;
  const columns=chunkSize*chunkSize;
  const sections=source.sections.map(s=>({
    minY:s.minY,maxY:s.maxY,height:s.height,uniform:s.uniform,
    block:s.block,data:s.data
  }));
  const counts=countNonAirSections({data:options.data,height,chunkSize,sectionHeight});
  const flags=Uint8Array.from(counts,n=>n>0?1:0);
  // A newly loaded section containing blocks needs its first mesh. Empty
  // sections are skipped until an edit makes them visible.
  const dirty=new Set();
  for(let i=0;i<flags.length;i++)if(flags[i])dirty.add(i);
  let revision=0;
  const location=(x,y,z)=>{
    if(![x,y,z].every(Number.isSafeInteger)||x<0||x>=chunkSize||
       z<0||z>=chunkSize||y<minY||y>maxY)return null;
    const index=Math.floor((y-minY)/sectionHeight);
    const section=sections[index];
    return {index,section,offset:(x*chunkSize+z)*section.height+y-section.minY};
  };
  function get(x,y,z){
    const loc=location(x,y,z);
    return loc?(loc.section.uniform?loc.section.block:loc.section.data[loc.offset]):null;
  }
  function set(x,y,z,block){
    const loc=location(x,y,z);
    if(!loc||!Number.isSafeInteger(block)||block<0||block>255)
      throw new RangeError('Invalid section block edit');
    const {index,section,offset}=loc;
    const previous=section.uniform?section.block:section.data[offset];
    if(previous===block)return false;
    updateSectionOccupancy(counts,flags,y-minY,previous,block,sectionHeight,height);
    if(section.uniform){
      section.data=new Uint8Array(columns*section.height);
      section.data.fill(section.block);
      section.block=null;section.uniform=false;
    }
    section.data[offset]=block;
    // A block changed at the top or bottom of a slice can reveal/hide a face
    // belonging to the neighboring slice. Invalidate both sides of the seam.
    dirty.add(index);
    if(y===section.minY&&index>0)dirty.add(index-1);
    if(y===section.maxY&&index+1<sections.length)dirty.add(index+1);
    revision++;
    return true;
  }
  // Validate an entire edit batch before mutating anything. This is useful
  // for replaying saved edits and remote changes without partial corruption.
  // Each entry is [localX, absoluteY, localZ, blockId].
  function applyEdits(edits){
    if(!edits||typeof edits[Symbol.iterator]!=='function')
      throw new TypeError('Expected iterable section edits');
    const pending=[];
    for(const entry of edits){
      if(!Array.isArray(entry)||entry.length!==4||
         !location(entry[0],entry[1],entry[2])||
         !Number.isSafeInteger(entry[3])||entry[3]<0||entry[3]>255)
        throw new RangeError('Invalid section edit batch');
      pending.push(entry);
    }
    let changed=0;
    for(const [x,y,z,block] of pending)if(set(x,y,z,block))changed++;
    return changed;
  }
  function dirtySections(){return [...dirty].sort((a,b)=>a-b);}
  // Budget mesh work around the player's elevation instead of rebuilding all
  // 24 deep-world slices in one mobile frame. Empty slices must be returned as
  // 'remove' jobs: dropping their old mesh is as important as building solids.
  // A preview never acknowledges work; taking a batch drains only its entries.
  function dirtySectionsNear(y,radius=4,limit=4){
    if(!Number.isFinite(y)||!Number.isSafeInteger(radius)||radius<0||
       !Number.isSafeInteger(limit)||limit<1)
      throw new RangeError('Invalid section mesh budget');
    const center=Math.max(0,Math.min(sections.length-1,Math.floor((y-minY)/sectionHeight)));
    const pending=[...dirty].filter(index=>Math.abs(index-center)<=radius);
    pending.sort((a,b)=>Math.abs(a-center)-Math.abs(b-center)||a-b);
    return pending.slice(0,limit).map(index=>Object.freeze({
      index,minY:sections[index].minY,maxY:sections[index].maxY,
      nonAir:counts[index],action:counts[index]>0?'rebuild':'remove'
    }));
  }
  function takeDirtySectionsNear(y,radius=4,limit=4){
    const jobs=dirtySectionsNear(y,radius,limit);
    for(const job of jobs)dirty.delete(job.index);
    return jobs;
  }
  function takeDirtySections(){const result=dirtySections();dirty.clear();return result;}
  // Recompress when a section is unloaded or after a batch of edits. Scanning
  // 4096 voxels after every block placement would harm mobile frame times.
  function compact(index){
    if(!Number.isSafeInteger(index)||index<0||index>=sections.length)
      throw new RangeError('Invalid section index');
    const section=sections[index];
    if(section.uniform)return true;
    const first=section.data[0];
    for(let i=1;i<section.data.length;i++)
      if(section.data[i]!==first)return false;
    section.data=null;section.block=first;section.uniform=true;
    return true;
  }
  function materialize(index){
    if(!Number.isSafeInteger(index)||index<0||index>=sections.length)return null;
    const section=sections[index],result=new Uint8Array(columns*section.height);
    if(section.uniform)result.fill(section.block);
    else result.set(section.data);
    return result;
  }
  function rebuild(){
    const result=new Uint8Array(columns*height);
    for(let i=0;i<sections.length;i++){
      const section=sections[i],slice=materialize(i),start=section.minY-minY;
      for(let col=0;col<columns;col++)
        result.set(slice.subarray(col*section.height,(col+1)*section.height),col*height+start);
    }
    return result;
  }
  function near(y,radius=4){
    if(!Number.isFinite(y)||!Number.isSafeInteger(radius)||radius<0)
      throw new RangeError('Invalid section view');
    const center=Math.max(0,Math.min(sections.length-1,Math.floor((y-minY)/sectionHeight)));
    return sections.map((s,index)=>({
      index,minY:s.minY,maxY:s.maxY,uniform:s.uniform,nonAir:counts[index]
    })).filter(s=>Math.abs(s.index-center)<=radius).sort((a,b)=>
      Math.abs(a.index-center)-Math.abs(b.index-center)||a.index-b.index);
  }
  function stats(){
    return {sections:sections.length,uniform:sections.filter(s=>s.uniform).length,
      active:flags.reduce((n,v)=>n+(v?1:0),0),
      blocks:counts.reduce((n,v)=>n+v,0),
      payloadBytes:sections.reduce((n,s)=>n+(s.uniform?1:s.data.byteLength),0),
      dirty:dirty.size,revision};
  }
  return Object.freeze({minY,maxY,height,chunkSize,sectionHeight,get,set,applyEdits,
    dirtySections,dirtySectionsNear,takeDirtySections,takeDirtySectionsNear,compact,materialize,rebuild,near,stats});
}

 // Small occupancy flags for mesh culling, without copying full voxel arrays.
 // Conservative occupied flags after block deletion are safe; false negatives
 // after placement are not. The live setter marks newly occupied sections.

 // Exact per-section non-air counts let the live renderer clear stale
 // occupancy flags after the final block in a section is mined. This is
 // O(1) per edit, including multiplayer edits; full scans happen on load.
 function countNonAirSections({data,height,chunkSize=16,sectionHeight=16}={}){
   if(Object.prototype.toString.call(data)!=='[object Uint8Array]'||
     ![height,chunkSize,sectionHeight].every(Number.isSafeInteger)||
     height<1||chunkSize<1||sectionHeight<1||
     !Number.isSafeInteger(chunkSize*chunkSize*height)||
     data.length!==chunkSize*chunkSize*height)
     throw new RangeError('Invalid section occupancy data');
   const counts=new Uint32Array(Math.ceil(height/sectionHeight));
   for(let col=0;col<chunkSize*chunkSize;col++){
     const base=col*height;
     for(let y=0;y<height;y++)
       if(data[base+y]!==0)counts[Math.floor(y/sectionHeight)]++;
   }
   return counts;
 }
 function scanNonAirSections(options={}){
   return Uint8Array.from(countNonAirSections(options),count=>count>0?1:0);
 }
 // y is local to the chunk (0..height-1), not an absolute world Y.
 // No count change is needed when replacing one non-air block with another.
 function updateSectionOccupancy(counts,flags,y,previous,next,sectionHeight=16,height=counts.length*sectionHeight){
   if(Object.prototype.toString.call(counts)!=='[object Uint32Array]'||
     Object.prototype.toString.call(flags)!=='[object Uint8Array]'||
     !Number.isSafeInteger(y)||y<0||
     !Number.isSafeInteger(sectionHeight)||sectionHeight<1||
     !Number.isSafeInteger(height)||height<1||y>=height||
     Math.ceil(height/sectionHeight)!==counts.length||
     ![previous,next].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=255)||
     counts.length!==flags.length||Math.floor(y/sectionHeight)>=counts.length)
     throw new RangeError('Invalid section occupancy update');
   const section=Math.floor(y/sectionHeight);
   if(previous===0&&next!==0){
     if(counts[section]===4294967295)throw new RangeError('Section count overflow');
     counts[section]++;
   }else if(previous!==0&&next===0){
     if(counts[section]===0)throw new RangeError('Section count underflow');
     counts[section]--;
   }
   flags[section]=counts[section]>0?1:0;
   return flags[section];
 }

window.MineWorldWorldDepth=Object.freeze({LEGACY,OVERWORLD,create,reindexEdits,createDimensionCodec,reindexNetworkEdits,sectionizeChunk,createSectionStore,scanNonAirSections,countNonAirSections,updateSectionOccupancy});
})();