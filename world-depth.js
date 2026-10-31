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
  // A codec can describe a tiny world with a huge chunkSize. Validate the
  // *local* stride too, or chunkIndex can silently alias voxels past JS's
  // exact-integer range even when the global world volume is small.
  if(!Number.isSafeInteger(chunkSize*chunkSize*height))
    throw new RangeError('Chunk stride exceeds safe index range');
  const inside=(x,y,z)=>Number.isInteger(x)&&Number.isInteger(y)&&Number.isInteger(z)&&x>=0&&x<width&&z>=0&&z<depth&&y>=minY&&y<=maxY;
  // Same linear ordering as old MineWorld when minY=0: saves stay readable.
  // Never allow an invalid absolute coordinate to alias a valid saved edit.
  // In the old formula, y=maxY+1 became the next Z column's first voxel.
  const index=(x,y,z)=>inside(x,y,z)?(x*depth+z)*height+(y-minY):null;
  const decode=n=>{
    if(!Number.isSafeInteger(n)||n<0||n>=volume)return null;
    const y=n%height+minY,z=Math.floor(n/height)%depth,x=Math.floor(n/(depth*height));
    return {x,y,z};
  };
  // Match index()'s validation before mapping world coordinates into
  // a chunk-local array. Negative Y is legal only for deep-world profiles.
  const chunkIndex=(x,y,z)=>inside(x,y,z)?
    ((x%chunkSize)*chunkSize+(z%chunkSize))*height+(y-minY):null;
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
let sectionStoreSerial=0;
function createSectionStore(options={}){
  const source=sectionizeChunk(options);
  const storeId=++sectionStoreSerial;
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
  // A mesh job is acknowledged only after the GPU mesh was successfully
  // installed. Track a revision for each slice so edits made during an
  // asynchronous rebuild cannot be silently lost on acknowledgement.
  const sectionRevisions=new Uint32Array(sections.length),inFlight=new Map();
  let claimSerial=0;
  // Mesh jobs can outlive a browser tab suspension. A lease is valid only
  // while its token AND section revision still match the current state.
  const currentClaim=job=>{
    if(!job||job.storeId!==storeId||!Number.isSafeInteger(job.index)||!Number.isSafeInteger(job.claimId))return false;
    const active=inFlight.get(job.index);
    return !!active&&active.claimId===job.claimId&&
      active.revision===job.revision&&sectionRevisions[job.index]===job.revision;
  };
  const invalidate=index=>{
    dirty.add(index);sectionRevisions[index]++;
    // An edited slice (or seam neighbor) makes an in-flight mesh obsolete.
    // Release its reservation now, not after a worker timeout or stale ack:
    // otherwise frequent edits can stall visible geometry for 30 seconds.
    // Old claim IDs remain invalid, so a late worker cannot install them.
    inFlight.delete(index);
  };
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
    // A section becomes entirely air when its last solid voxel is removed.
    // Reclaim its 4096-byte (or partial-slice) payload immediately in O(1),
    // without scanning on every edit or waiting for a chunk unload. This
    // matters for deep-world mobile memory usage and does not touch saves.
    if(counts[index]===0){
      section.data=null;
      section.block=0;
      section.uniform=true;
    }
    // A block changed at the top or bottom of a slice can reveal/hide a face
    // belonging to the neighboring slice. Invalidate both sides of the seam.
    invalidate(index);
    if(y===section.minY&&index>0)invalidate(index-1);
    if(y===section.maxY&&index+1<sections.length)invalidate(index+1);
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
  // Claim/ack is the safe path for asynchronous WebGL rebuilds. Claims keep
  // dirty flags until success; failed builds can release the claim for retry.
  // A newer edit invalidates an old claim, including adjacent seam changes.
  function claimDirtySectionsNear(y,radius=4,limit=4,now=Date.now()){
    if(!Number.isFinite(now)||now<0)throw new RangeError('Invalid section mesh clock');
    if(!Number.isSafeInteger(limit)||limit<1)
      throw new RangeError('Invalid section mesh budget');
    return dirtySectionsNear(y,radius,sections.length)
      .filter(job=>!inFlight.has(job.index)).slice(0,limit).map(job=>{
        const lease=Object.freeze({...job,storeId,revision:sectionRevisions[job.index],
          claimId:++claimSerial,claimedAt:now});
        inFlight.set(job.index,lease);
        return lease;
      });
  }
  // Explicitly recover jobs abandoned when a tab is backgrounded or a
  // worker disappears. Expiry never acknowledges a mesh or loses dirty work.
  // Caller-supplied time makes suspension recovery deterministic in tests.
  function reclaimStaleMeshClaims(now=Date.now(),maxAgeMs=30000){
    if(!Number.isFinite(now)||now<0||
       !Number.isFinite(maxAgeMs)||maxAgeMs<1)
      throw new RangeError('Invalid section mesh lease timeout');
    const recovered=[];
    for(const [index,job] of inFlight){
      if(now-job.claimedAt>=maxAgeMs){
        inFlight.delete(index);recovered.push(index);
      }
    }
    return recovered.sort((a,b)=>a-b);
  }
  function completeDirtySection(job,applied){
    if(!job||job.storeId!==storeId||!Number.isSafeInteger(job.index)||
       !Number.isSafeInteger(job.claimId))return false;
    const active=inFlight.get(job.index);
    if(!active||active.claimId!==job.claimId||
       active.revision!==job.revision)return false;
    inFlight.delete(job.index);
    if(!applied)return true;
    if(sectionRevisions[job.index]!==job.revision)return false;
    dirty.delete(job.index);
    return true;
  }
  const ackDirtySection=job=>completeDirtySection(job,true);
  const releaseDirtySection=job=>completeDirtySection(job,false);
  // Retain the synchronous drain API for legacy callers, but never steal a
  // section currently owned by an asynchronous mesh job.
  function takeDirtySectionsNear(y,radius=4,limit=4){
    if(!Number.isSafeInteger(limit)||limit<1)
      throw new RangeError('Invalid section mesh budget');
    const jobs=dirtySectionsNear(y,radius,sections.length)
      .filter(job=>!inFlight.has(job.index)).slice(0,limit);
    for(const job of jobs)dirty.delete(job.index);
    return jobs;
  }
  function takeDirtySections(){
    const result=dirtySections().filter(index=>!inFlight.has(index));
    for(const index of result)dirty.delete(index);
    return result;
  }
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
  // Detached snapshot for a worker or WebGL build. A stale claim cannot
  // snapshot new geometry, and the caller can verify its lease immediately
  // before installing the mesh to avoid presenting outdated block faces.
  function materializeClaim(job){
    if(!currentClaim(job))return null;
    const section=sections[job.index];
    // Bind the detached mesh data to the originating store AND lease.
    // Revisions and section indices are not globally unique: two chunks can
    // both have revision zero, and a retried claim can share its revision.
    // Without these tokens, a worker result from another chunk or an expired
    // lease could be installed as the current chunk's geometry.
    return Object.freeze({storeId,claimId:job.claimId,
      index:job.index,revision:job.revision,
      minY:section.minY,maxY:section.maxY,data:materialize(job.index)});
  }
  // Vertical-section meshes need neighboring Y planes to hide internal
  // faces at seams. Copy only two planes, not entire adjacent sections.
  // Every array is detached from the authoritative voxel store.
  // Seam edits invalidate both section revisions before mesh installation.
  function materializeClaimWithSeams(job){
    const center=materializeClaim(job);
    if(!center)return null;
    const section=sections[job.index];
    const plane=y=>{
      const out=new Uint8Array(columns);
      for(let x=0;x<chunkSize;x++)for(let z=0;z<chunkSize;z++)
        out[x*chunkSize+z]=get(x,y,z);
      return out;
    };
    return Object.freeze({...center,chunkSize,
      below:section.minY>minY?plane(section.minY-1):null,
      above:section.maxY<maxY?plane(section.maxY+1):null});
  }

  // Horizontal chunk seams are as important as the upper/lower Y planes.
  // Unknown neighboring chunks remain null rather than pretending to be air.
  // Edge-plane index = edge coordinate * section height + local Y.
  const neighborSides=['west','east','north','south'];
  function materializeClaimWithNeighbors(job,neighbors={}){
    if(!neighbors||typeof neighbors!=='object')
      throw new TypeError('Expected adjacent section stores');
    const center=materializeClaimWithSeams(job);
    if(!center)return null;
    const section=sections[job.index],faces={},tokens={};
    for(const side of neighborSides){
      const neighbor=neighbors[side];
      if(neighbor==null){faces[side]=null;continue;}
      if(neighbor.chunkSize!==chunkSize||neighbor.minY!==minY||
         neighbor.maxY!==maxY||!Number.isSafeInteger(neighbor.storeId)||
         typeof neighbor.get!=='function'||typeof neighbor.stats!=='function')
        throw new RangeError('Incompatible adjacent section store');
      const token=Object.freeze({storeId:neighbor.storeId,revision:neighbor.stats().revision});
      const plane=new Uint8Array(chunkSize*section.height);
      for(let edge=0;edge<chunkSize;edge++)for(let y=section.minY;y<=section.maxY;y++){
        const x=side==='west'?chunkSize-1:side==='east'?0:edge;
        const z=side==='north'?chunkSize-1:side==='south'?0:edge;
        const block=neighbor.get(x,y,z);
        if(!Number.isSafeInteger(block)||block<0||block>255)return null;
        plane[edge*section.height+y-section.minY]=block;
      }
      if(neighbor.stats().revision!==token.revision||!currentClaim(job))
        return null; // A changed neighbor cannot supply a coherent snapshot.
      faces[side]=plane;tokens[side]=token;
    }
    return Object.freeze({...center,...faces,neighborTokens:Object.freeze(tokens)});
  }
  // The renderer validates every contributing chunk immediately before
  // installing the mesh. Store identity prevents same-revision replacements.
  function canInstallClaimWithNeighbors(job,snapshot,neighbors={}){
    if(!currentClaim(job)||!snapshot||snapshot.storeId!==storeId||
       snapshot.claimId!==job.claimId||snapshot.index!==job.index||
       snapshot.revision!==job.revision||!neighbors||typeof neighbors!=='object')
      return false;
    for(const side of neighborSides){
      const neighbor=neighbors[side],token=snapshot.neighborTokens?.[side];
      if(neighbor==null){
        if(snapshot[side]!==null||token)return false;
      }else if(!token||neighbor.storeId!==token.storeId||
               typeof neighbor.stats!=='function'||
               neighbor.stats().revision!==token.revision)return false;
    }
    return true;
  }
  // A chunk coordinator must notify this store when an adjacent chunk edits
  // its horizontal boundary. This invalidates geometry, not saved voxels.
  function markNeighborBoundaryDirty(y){
    if(!Number.isSafeInteger(y)||y<minY||y>maxY)
      throw new RangeError('Invalid adjacent section boundary');
    invalidate(Math.floor((y-minY)/sectionHeight));
    revision++;
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
      dirty:dirty.size,inFlight:inFlight.size,revision};
  }
  return Object.freeze({storeId,minY,maxY,height,chunkSize,sectionHeight,get,set,applyEdits,
    dirtySections,dirtySectionsNear,takeDirtySections,takeDirtySectionsNear,
    claimDirtySectionsNear,ackDirtySection,releaseDirtySection,
    reclaimStaleMeshClaims,canInstallClaim:currentClaim,materializeClaim,materializeClaimWithSeams,
    materializeClaimWithNeighbors,canInstallClaimWithNeighbors,markNeighborBoundaryDirty,
    compact,materialize,rebuild,near,stats});
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


// Save profiles are explicit before live deep-world migration. Untagged
// version-13 and older worlds remain legacy; an unfamiliar profile must never
// be decoded using the 48-layer stride and silently corrupt player builds.
const LEGACY_PROFILE='legacy-0-47',DEEP_PROFILE='overworld--64-319';
const LAST_LEGACY_SAVE_VERSION=13;
function readSaveProfile(save){
  if(!save||typeof save!=='object'||Array.isArray(save))return null;
  // An unrecognized future save may change coordinate strides even if its
  // verticalProfile field is missing or incorrectly marked as legacy.
  // Never load it through the 48-layer codec and overwrite the original.
  if(Object.prototype.hasOwnProperty.call(save,'version')&&
     (!Number.isSafeInteger(save.version)||save.version<0||
      save.version>LAST_LEGACY_SAVE_VERSION))return null;
  if(!Object.prototype.hasOwnProperty.call(save,'verticalProfile'))return LEGACY_PROFILE;
  return save.verticalProfile===LEGACY_PROFILE||save.verticalProfile===DEEP_PROFILE?
    save.verticalProfile:null;
}
function canLoadLegacySave(save){return readSaveProfile(save)===LEGACY_PROFILE;}
// Preview-only edit conversion. This does NOT convert terrain, entities,
// positions, sea level or multiplayer state and must never be auto-applied.
// Every record is validated before returning a detached, all-or-nothing plan.
function planLegacySaveMigration(save,{width=10000,depth=10000}={}){
  if(!canLoadLegacySave(save)||!Number.isSafeInteger(save.version)||save.version<5||
     save.worldSize!==width)throw new RangeError('Unsupported legacy save profile or version');
  const source=create({width,depth,minY:LEGACY.minY,maxY:LEGACY.maxY});
  const target=create({width,depth,minY:OVERWORLD.minY,maxY:OVERWORLD.maxY});
  function convert(records,to,label){
    if(!Array.isArray(records))throw new RangeError('Invalid '+label+' edit records');
    const edits=new Map();
    for(const pair of records){
      if(!Array.isArray(pair)||pair.length!==2||
         !Number.isSafeInteger(pair[0])||!source.decode(pair[0])||
         !Number.isSafeInteger(pair[1])||pair[1]<0||pair[1]>255||
         edits.has(pair[0]))throw new RangeError('Invalid or duplicate '+label+' edit');
      edits.set(pair[0],pair[1]);
    }
    return Object.freeze([...reindexEdits(edits,source,to)].map(pair=>Object.freeze(pair)));
  }
  // A migration must validate saved player/dimension positions before any
  // live switch. Coordinates remain absolute: do not shift old builds or
  // players by 64 blocks when the new index stride gains negative Y.
  // This preview is deliberately not an executable migration or a promise
  // that entity, collision and multiplayer state is already compatible.
  const position=(value,label)=>{
    if(value==null)return null;
    if(!value||typeof value!=='object'||Array.isArray(value)||
       ![value.x,value.y,value.z].every(Number.isFinite)||
       value.x<0||value.x>=width||value.z<0||value.z>=depth||
       value.y<source.minY||value.y>=source.maxY+1)
      throw new RangeError('Invalid '+label+' position in legacy save');
    return Object.freeze({x:value.x,y:value.y,z:value.z});
  };
  const dimension=save.dimension??'overworld';
  if(!['overworld','nether','end'].includes(dimension))
    throw new RangeError('Invalid saved player dimension');
  const positions=Object.freeze({
    player:position(save.player,'player'),
    overworld:position(save.overworldPosition,'overworld'),
    nether:position(save.netherPosition,'nether'),
    end:position(save.endPosition,'end')
  });
  // Furnace records are block-entity data, not linear world edits. A future
  // height migration must preserve all three inventories and absolute Y.
  // Validate them before returning a plan: a malformed/duplicate record
  // would otherwise be silently discarded by the live furnace restorer.
  // This is still preview-only; it never writes a world or changes its save.
  function previewFurnaces(){
    const records=save.furnaces??[];
    if(!Array.isArray(records))throw new RangeError('Invalid saved furnace collection');
    const seen=new Set();
    const validSlot=(value,label)=>{
      if(value==null)return null;
      if(!value||typeof value!=='object'||Array.isArray(value)||
         typeof value.key!=='string'||Object.hasOwn(Object.prototype,value.key)||
         !(/^[a-zA-Z][a-zA-Z0-9]*$/.test(value.key)||/^block:[1-9]\d{0,2}$/.test(value.key)||
           value.key.length<=192&&
           /^[a-z0-9][a-z0-9_.-]{0,63}:[a-z0-9_][a-z0-9_.-]*(?:\/[a-z0-9_][a-z0-9_.-]*)*$/.test(value.key)&&
           !value.key.startsWith('block:'))||
         !Number.isSafeInteger(value.qty)||value.qty<1||value.qty>64)
        throw new RangeError('Invalid saved furnace '+label+' stack');
      return Object.freeze({key:value.key,qty:value.qty});
    };
    return Object.freeze(records.map(record=>{
      if(!record||typeof record!=='object'||Array.isArray(record)||
         !['overworld','nether','end'].includes(record.dimension)||
         ![record.x,record.y,record.z].every(Number.isSafeInteger)||
         record.x<0||record.x>=width||record.z<0||record.z>=depth||
         record.y<LEGACY.minY||record.y>LEGACY.maxY)
        throw new RangeError('Invalid saved furnace position');
      const id=record.dimension+':'+record.x+','+record.y+','+record.z;
      if(seen.has(id))throw new RangeError('Duplicate saved furnace position');
      seen.add(id);
      const input=validSlot(record.input,'input');
      const fuel=validSlot(record.fuel,'fuel');
      const output=validSlot(record.output,'output');
      const kind=record.kind===undefined?'furnace':record.kind;
      if(!['furnace','smoker','blast'].includes(kind))
        throw new RangeError('Invalid saved furnace station kind');
      const burn=record.burn??0,burnTotal=record.burnTotal??0;
      const progress=record.progress??0;
      if(![burn,burnTotal,progress].every(Number.isFinite)||
         burn<0||burnTotal<0||burnTotal>1000||burn>burnTotal||
         progress<0||progress>=(kind==='furnace'?10:5)||(!input&&progress>0))
        throw new RangeError('Invalid saved furnace timers');
      return Object.freeze({dimension:record.dimension,
        x:record.x,y:record.y,z:record.z,input,fuel,output,
        burn,burnTotal,progress,...(record.kind===undefined?{}:{kind})});
    }));
  }
  // Dropped stacks and respawn points are player-owned state, not terrain
  // edits. The legacy loader silently filters invalid drops and clears invalid
  // beds; a future height migration must refuse that data loss instead.
  // Keep this preview detached and non-mutating until live entity migration.
  const bedSpawn=(()=>{
    const bed=save.bedSpawn;
    if(bed==null)return null;
    if(!bed||typeof bed!=='object'||Array.isArray(bed)||
       ![bed.x,bed.y,bed.z].every(Number.isSafeInteger)||
       bed.x<2||bed.x>=width-2||bed.z<2||bed.z>=depth-2||
       bed.y<1||bed.y>=source.maxY-1)
      throw new RangeError('Invalid saved bed respawn position');
    return Object.freeze({x:bed.x,y:bed.y,z:bed.z});
  })();
  // Preflight results must not share mutable nested metadata with a saved
  // entity. Shallow spreads previously froze only the outer record, allowing
  // callers to modify a future metadata object through the migration preview.
  // Copy JSON-compatible values without invoking getters, bound the work for
  // mobile browsers, and reject cycles/non-finite values rather than losing
  // player-owned state or returning a misleading preview.
  const copyOwnedRecord=(record,label,{maxArray=128,maxNodes=512}={})=>{
    const seen=new WeakSet();let budget=maxNodes;
    const invalid=()=>{throw new RangeError('Invalid saved '+label+' metadata');};
    const copy=(value,depth)=>{
      if(--budget<0||depth>8)invalid();
      if(value===null||typeof value==='string'||typeof value==='boolean')return value;
      if(typeof value==='number')return Number.isFinite(value)?value:invalid();
      if(!value||typeof value!=='object'||seen.has(value))invalid();
      const array=Array.isArray(value),proto=Object.getPrototypeOf(value);
      if(!array&&proto!==null&&Object.getPrototypeOf(proto)!==null)invalid();
      seen.add(value);
      let result;
      if(array){
        if(value.length>maxArray||Object.keys(value).length!==value.length)invalid();
        // Array.map would invoke an accessor installed on a numeric index.
        // Read only own data descriptors, just as for object metadata.
        const items=[];
        for(let index=0;index<value.length;index++){
          const descriptor=Object.getOwnPropertyDescriptor(value,String(index));
          if(!descriptor||!Object.hasOwn(descriptor,'value'))invalid();
          items.push(copy(descriptor.value,depth+1));
        }
        result=Object.freeze(items);
      }else{
        const keys=Object.keys(value);
        if(keys.length>128)invalid();
        result=Object.create(null);
        for(const key of keys){
          if(key==='__proto__'||key==='constructor'||key==='prototype')invalid();
          const descriptor=Object.getOwnPropertyDescriptor(value,key);
          if(!descriptor||!Object.hasOwn(descriptor,'value'))invalid();
          result[key]=copy(descriptor.value,depth+1);
        }
        Object.freeze(result);
      }
      seen.delete(value);
      return result;
    };
    return copy(record,0);
  };
  const droppedItems=(()=>{
    const records=save.droppedItems??[];
    if(!Array.isArray(records)||records.length>80)
      throw new RangeError('Invalid saved dropped-item collection');
    return Object.freeze(records.map(record=>{
      if(!record||typeof record!=='object'||Array.isArray(record)||
         typeof record.key!=='string'||Object.hasOwn(Object.prototype,record.key)||
         !(/^[a-zA-Z][a-zA-Z0-9]*$/.test(record.key)||/^block:[1-9]\d{0,2}$/.test(record.key))||
         !Number.isSafeInteger(record.count)||record.count<1||record.count>64||
         !['overworld','nether','end'].includes(record.dimension)||
         ![record.x,record.y,record.z].every(Number.isFinite)||
         record.x<1||record.x>width-1||record.z<1||record.z>depth-1||
         record.y<.2||record.y>source.maxY+1||
         ['vx','vy','vz','age','delay'].some(k=>
           record[k]!=null&&(!Number.isFinite(record[k])||
             ((k==='age'||k==='delay')&&record[k]<0))))
        throw new RangeError('Invalid saved dropped-item stack or position');
      // Retain velocity, pickup delay and detached future-compatible metadata.
      return copyOwnedRecord(record,'dropped-item');
    }));
  })();

  // Vehicles, tamed mounts and farm animals are player-owned entities.
  // Legacy loading can silently filter malformed records. A height migration
  // must instead preflight every record and retain its absolute coordinates.
  // These previews do not spawn entities or mutate the original save.
  const entityPoint=record=>[record.x,record.y,record.z].every(Number.isFinite)&&
    record.x>=0&&record.x<width&&record.z>=0&&record.z<depth&&
    record.y>=source.minY&&record.y<source.maxY+1;
  const previewEntities=(records,label,limit,valid)=>{
    const entries=records??[];
    if(!Array.isArray(entries)||entries.length>limit)
      throw new RangeError('Invalid saved '+label+' collection');
    return Object.freeze(entries.map(record=>{
      if(!record||typeof record!=='object'||Array.isArray(record)||!valid(record))
        throw new RangeError('Invalid saved '+label+' record');
      // Retain unknown metadata, but never expose mutable references to the
      // original save through a frozen preview.
      return copyOwnedRecord(record,label);
    }));
  };
  const vehicleKinds=['boat','raft','minecart','chestMinecart',
    'hopperMinecart','furnaceMinecart','spruceBoat','cherryBoat'];
  const rideKinds=['horse','donkey','mule','camel','llama','pig','strider',
    'skeleton_horse','zombie_horse','happy_ghast'];
  const vehicleIds=new Set();
  const vehicles=previewEntities(save.vehicles,'vehicle',80,record=>{
    if(!vehicleKinds.includes(record.kind)||!['overworld','nether','end'].includes(record.dimension)||
       !entityPoint(record)||!Number.isSafeInteger(record.id)||record.id<1||
       vehicleIds.has(record.id))return false;
    vehicleIds.add(record.id);
    return true;
  });
  const tamedMounts=previewEntities(save.tamedMounts,'tamed mount',60,record=>
    rideKinds.includes(record.kind)&&['overworld','nether','end'].includes(record.dimension)&&
    entityPoint(record)&&
    (record.tamed==null||typeof record.tamed==='boolean')&&
    (record.saddled==null||typeof record.saddled==='boolean'));
  const farmAnimals=previewEntities(save.farmAnimals,'farm animal',24,record=>
    ['cow','pig','sheep','chicken'].includes(record.kind)&&entityPoint(record)&&
    record.x>2&&record.x<width-2&&record.z>2&&record.z<depth-2&&
    record.y>=1&&record.y<source.maxY-2&&
    Number.isFinite(record.hp)&&record.hp>0&&
    (record.heading==null||Number.isFinite(record.heading))&&
    (record.growTimer==null||(Number.isFinite(record.growTimer)&&record.growTimer>=0))&&
    (record.breedCooldown==null||(Number.isFinite(record.breedCooldown)&&record.breedCooldown>=0))&&
    (record.baby==null||typeof record.baby==='boolean')&&
    (record.sheared==null||typeof record.sheared==='boolean'));
  // Preserve player-owned inventory and stack identities before any future
  // world-height migration. Legacy restorers can silently discard malformed
  // slots; the preview must instead fail without rewriting the original save.
  const playerItems=(()=>{
    const invalid=label=>{throw new RangeError('Invalid saved '+label);};
    const field=(object,name,label)=>{
      const descriptor=Object.getOwnPropertyDescriptor(object,name);
      if(!descriptor||!Object.hasOwn(descriptor,'value'))invalid(label);
      return descriptor.value;
    };
    const array=(value,label,limit,valid)=>{
      if(value==null)return null;
      if(!Array.isArray(value)||value.length>limit)invalid(label);
      const result=[];
      for(let i=0;i<value.length;i++){
        const descriptor=Object.getOwnPropertyDescriptor(value,String(i));
        if(!descriptor||!Object.hasOwn(descriptor,'value')||!valid(descriptor.value))
          invalid(label);
        result.push(descriptor.value);
      }
      return Object.freeze(result);
    };
    // Keep future player-owned custom items during a preview just as
    // furnace slots do. Only strict, bounded namespaced IDs are accepted;
    // malformed IDs must not silently disappear during height migration.
    const key=value=>typeof value==='string'&&
      !Object.hasOwn(Object.prototype,value)&&
      (/^[a-zA-Z][a-zA-Z0-9]*$/.test(value)||/^block:[1-9]\d{0,2}$/.test(value)||
       value.length<=192&&
       /^[a-z0-9][a-z0-9_.-]{0,63}:[a-z0-9_][a-z0-9_.-]*(?:\/[a-z0-9_][a-z0-9_.-]*)*$/.test(value)&&
       !value.startsWith('block:'));
    const id=value=>Number.isSafeInteger(value)&&value>0;
    const inventory=array(save.inventory,'inventory counters',2048,
      value=>Number.isSafeInteger(value)&&value>=0&&value<=65535);
    const seen=new Set();
    const rawStacks=save.itemStacks;
    const itemStacks=rawStacks==null?null:(()=>{
      if(!Array.isArray(rawStacks)||rawStacks.length>8192)
        invalid('item stacks');
      const result=[];
      for(let i=0;i<rawStacks.length;i++){
        const descriptor=Object.getOwnPropertyDescriptor(rawStacks,String(i));
        if(!descriptor||!Object.hasOwn(descriptor,'value'))invalid('item stacks');
        const stack=descriptor.value;
        if(!stack||typeof stack!=='object'||Array.isArray(stack))
          invalid('item stack');
        const stackId=field(stack,'id','item stack');
        const stackKey=field(stack,'key','item stack');
        const quantity=field(stack,'qty','item stack');
        if(!id(stackId)||seen.has(stackId)||!key(stackKey)||
           !Number.isSafeInteger(quantity)||quantity<1||quantity>64)
          invalid('item stack');
        seen.add(stackId);
        result.push(copyOwnedRecord(stack,'item stack'));
      }
      return Object.freeze(result);
    })();
    const hotbar=array(save.survivalHotbar,'survival hotbar',9,
      value=>value===null||id(value)||key(value));
    if(hotbar&&itemStacks)for(const ref of hotbar)
      if(id(ref)&&!seen.has(ref))invalid('survival hotbar stack reference');
    let javaInventory=null;
    if(save.javaInventory!=null){
      const raw=save.javaInventory;
      if(!raw||typeof raw!=='object'||Array.isArray(raw))
        invalid('Java inventory');
      const slots=array(field(raw,'slots','Java inventory'),'Java inventory slots',8192,
        value=>value===null||id(value));
      const offhand=field(raw,'offhand','Java inventory');
      const cursor=field(raw,'cursor','Java inventory');
      if(!slots||![offhand,cursor].every(value=>value===null||id(value)))
        invalid('Java inventory');
      const assigned=new Set();
      for(const ref of [...slots,offhand,cursor]){
        if(ref===null)continue;
        if(assigned.has(ref)||(itemStacks&&!seen.has(ref)))
          invalid('Java inventory stack reference');
        assigned.add(ref);
      }
      javaInventory=copyOwnedRecord(raw,'Java inventory',{maxArray:8192,maxNodes:12000});
    }
    return Object.freeze({inventory,itemStacks,survivalHotbar:hotbar,javaInventory});
  })();
  const furnaces=previewFurnaces();
  const edits=convert(save.edits,target,'overworld');
  const netherEdits=convert(save.netherEdits??[],source,'nether');
  const endEdits=convert(save.endEdits??[],source,'end');
  return Object.freeze({sourceProfile:LEGACY_PROFILE,targetProfile:DEEP_PROFILE,
    status:'preview-only',dimension,positions,bedSpawn,droppedItems,vehicles,tamedMounts,farmAnimals,edits,netherEdits,endEdits,furnaces,playerItems});
}

window.MineWorldWorldDepth=Object.freeze({LEGACY,OVERWORLD,LEGACY_PROFILE,DEEP_PROFILE,readSaveProfile,canLoadLegacySave,planLegacySaveMigration,create,reindexEdits,createDimensionCodec,reindexNetworkEdits,sectionizeChunk,createSectionStore,scanNonAirSections,countNonAirSections,updateSectionOccupancy});
})();