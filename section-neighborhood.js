/*
 * Experimental cross-chunk coordinator for the deep-world section store.
 * Original MineWorld code; does not change live save data or world height.
 * Callers register generated chunk stores, then route boundary edits through
 * this coordinator so neighboring mesh jobs cannot silently become stale.
 */
(()=>{'use strict';
const sides=Object.freeze([
  ['west',-1,0],['east',1,0],['north',0,-1],['south',0,1]
]);
function createSectionNeighborhood(){
  const stores=new Map();
  let profile=null;
  const key=(cx,cz)=>{
    if(!Number.isSafeInteger(cx)||!Number.isSafeInteger(cz))
      throw new RangeError('Invalid chunk coordinates');
    return `${cx},${cz}`;
  };
  const at=(cx,cz)=>stores.get(key(cx,cz))||null;
  // Neighbor offsets can overflow Number.MAX_SAFE_INTEGER even when the
  // registered chunk itself is valid. Treat that side as unloaded instead
  // of throwing after a block was already changed or a chunk registered.
  const offsetAt=(cx,cz,dx,dz)=>{
    const nx=cx+dx,nz=cz+dz;
    return Number.isSafeInteger(nx)&&Number.isSafeInteger(nz)?at(nx,nz):null;
  };
  const compatible=store=>!!store&&Number.isSafeInteger(store.storeId)&&
    Number.isSafeInteger(store.minY)&&Number.isSafeInteger(store.maxY)&&
    Number.isSafeInteger(store.chunkSize)&&store.chunkSize>0&&
    Number.isSafeInteger(store.sectionHeight)&&store.sectionHeight>0&&
    typeof store.get==='function'&&typeof store.set==='function'&&
    typeof store.applyEdits==='function'&&
    typeof store.markNeighborBoundaryDirty==='function'&&
    typeof store.materializeClaimWithNeighbors==='function'&&
    typeof store.canInstallClaimWithNeighbors==='function';
  const dimensions=store=>[store.minY,store.maxY,store.chunkSize,store.sectionHeight];
  function neighborsOf(cx,cz){
    key(cx,cz);
    const result={};
    for(const [side,dx,dz] of sides)result[side]=offsetAt(cx,cz,dx,dz);
    return result;
  }
  function dirtyWhole(store){
    for(let y=store.minY;y<=store.maxY;y+=store.sectionHeight)
      store.markNeighborBoundaryDirty(y);
  }
  function register(cx,cz,store){
    const k=key(cx,cz);
    if(!compatible(store))throw new TypeError('Expected a writable section store');
    const next=dimensions(store);
    if(profile&&next.some((n,i)=>n!==profile[i]))
      throw new RangeError('Incompatible chunk section profile');
    const old=stores.get(k);
    if(old===store)return false;
    for(const [position,existing] of stores)
      if(position!==k&&existing===store)
        throw new RangeError('Section store already registered in another chunk');
    if(!profile)profile=next;
    stores.set(k,store);
    // Loading or replacing a neighbor changes exposed faces even when no
    // voxel edit occurred. Invalidate both sides of every vertical slice.
    dirtyWhole(store);
    for(const neighbor of Object.values(neighborsOf(cx,cz)))
      if(neighbor)dirtyWhole(neighbor);
    return true;
  }
  function unregister(cx,cz){
    const k=key(cx,cz);
    if(!stores.delete(k))return false;
    for(const neighbor of Object.values(neighborsOf(cx,cz)))
      if(neighbor)dirtyWhole(neighbor);
    if(!stores.size)profile=null;
    return true;
  }
  function requireStore(cx,cz){
    const store=at(cx,cz);
    if(!store)throw new RangeError('Chunk section store is not registered');
    return store;
  }
  function notifyEdges(cx,cz,x,y,z,store){
    const size=store.chunkSize;
    if(x===0){const n=offsetAt(cx,cz,-1,0);if(n)n.markNeighborBoundaryDirty(y);}
    if(x===size-1){const n=offsetAt(cx,cz,1,0);if(n)n.markNeighborBoundaryDirty(y);}
    if(z===0){const n=offsetAt(cx,cz,0,-1);if(n)n.markNeighborBoundaryDirty(y);}
    if(z===size-1){const n=offsetAt(cx,cz,0,1);if(n)n.markNeighborBoundaryDirty(y);}
  }
  function set(cx,cz,x,y,z,block){
    const store=requireStore(cx,cz);
    const changed=store.set(x,y,z,block);
    if(changed)notifyEdges(cx,cz,x,y,z,store);
    return changed;
  }
  function applyEdits(cx,cz,edits){
    const store=requireStore(cx,cz);
    if(!edits||typeof edits[Symbol.iterator]!=='function')
      throw new TypeError('Expected iterable section edits');
    const batch=Array.from(edits),original=new Map(),size=store.chunkSize;
    // Keep only the first pre-edit value for repeated positions. A batch
    // that changes a boundary and then restores it needs no neighbor rebuild.
    for(const entry of batch){
      if(!Array.isArray(entry)||entry.length!==4)continue;
      const [x,y,z]=entry;
      if(x!==0&&x!==size-1&&z!==0&&z!==size-1)continue;
      const id=`${x},${y},${z}`;
      if(!original.has(id))original.set(id,{x,y,z,block:store.get(x,y,z)});
    }
    // The underlying store validates the entire batch before applying any
    // edits. Invalid batches therefore cannot dirty neighboring chunks.
    const changed=store.applyEdits(batch);
    for(const {x,y,z,block} of original.values())
      if(block!==store.get(x,y,z))notifyEdges(cx,cz,x,y,z,store);
    return changed;
  }
  // Translate absolute horizontal world coordinates into signed chunk
  // coordinates and nonnegative local offsets. Math.floor is essential:
  // truncation maps world X=-1 into chunk zero and breaks seam edits.
  // This staging bridge never changes legacy saves or live terrain.
  function worldToChunk(x,y,z){
    if(!profile)throw new RangeError('No section profile registered');
    if(![x,y,z].every(Number.isSafeInteger))
      throw new RangeError('Invalid absolute world coordinates');
    const size=profile[2],cx=Math.floor(x/size),cz=Math.floor(z/size);
    return Object.freeze({cx,cz,x:x-cx*size,y,z:z-cz*size});
  }
  // An unloaded chunk is distinct from a loaded air block (0). Return null
  // for missing chunks, but never silently create a chunk on a world edit.
  function getWorld(x,y,z){
    const p=worldToChunk(x,y,z),store=at(p.cx,p.cz);
    return store?store.get(p.x,p.y,p.z):null;
  }
  function setWorld(x,y,z,block){
    const p=worldToChunk(x,y,z);
    return set(p.cx,p.cz,p.x,p.y,p.z,block);
  }
  function snapshot(cx,cz,job){
    const store=requireStore(cx,cz);
    return store.materializeClaimWithNeighbors(job,neighborsOf(cx,cz));
  }
  function canInstall(cx,cz,store,job,snapshotData){
    return !!store&&at(cx,cz)===store&&
      store.canInstallClaimWithNeighbors(job,snapshotData,neighborsOf(cx,cz));
  }
  // Bridge section-store claims to a detached, packed exposed-face plan.
  // Validate both before and after planning; never acknowledge stale work.
  function planMesh(cx,cz,job,options){
    const store=requireStore(cx,cz);
    const planner=window.MineWorldSectionFaces;
    if(!planner||typeof planner.plan!=='function')return null;
    const frame=snapshot(cx,cz,job);
    if(!frame||!canInstall(cx,cz,store,job,frame))return null;
    const plan=planner.plan(frame,options);
    return canInstall(cx,cz,store,job,frame)?Object.freeze({snapshot:frame,plan}):null;
  }
  return Object.freeze({register,unregister,get:at,neighborsOf,set,applyEdits,
    worldToChunk,getWorld,setWorld,snapshot,canInstall,planMesh,size:()=>stores.size});
}
window.MineWorldSectionNeighborhood=Object.freeze({createSectionNeighborhood});
})();
