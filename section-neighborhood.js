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

/*
 * Opt-in 384-layer chunk residency bridge. This connects the existing
 * generator, copy-on-write vertical sections, cross-chunk seam invalidation
 * and deep edit codec without switching legacy gameplay or rewriting saves.
 * A bounded LRU avoids retaining every 384-layer chunk on mobile GPUs.
 */
function createDeepChunkStream({maxLoaded=9,edits=new Map(),generator,
  width=10000,depth=10000,minX=0,minZ=0}={}){
  // Horizontal origins are opt-in, chunk-aligned and part of the edit codec.
  // Do not silently reinterpret legacy positive-coordinate saved indices.
  if(![width,depth,minX,minZ].every(Number.isSafeInteger)||
     width<16||depth<16||width%16!==0||depth%16!==0||
     minX%16!==0||minZ%16!==0||
     !Number.isSafeInteger(minX+width)||!Number.isSafeInteger(minZ+depth))
    throw new RangeError('Invalid signed deep-world horizontal profile');
  // The current built-in biome generator still accepts positive chunks only.
  // Signed worlds must supply an independent generator until it is migrated.
  if((minX<0||minZ<0)&&generator===undefined)
    throw new RangeError('Signed deep-world chunks require a custom generator');
  const maxX=minX+width,maxZ=minZ+depth;
  const minCX=minX/16,maxCX=maxX/16,minCZ=minZ/16,maxCZ=maxZ/16;
  if(!Number.isSafeInteger(maxLoaded)||maxLoaded<1||maxLoaded>64)
    throw new RangeError('Invalid deep chunk residency budget');
  if(Object.prototype.toString.call(edits)!=='[object Map]')
    throw new TypeError('Expected a Map of deep-world edits');
  const depthCodec=window.MineWorldWorldDepth;
  if(!depthCodec||typeof depthCodec.create!=='function')
    throw new Error('Deep-world coordinate codec unavailable');
  const codec=depthCodec.create({width,depth,minX,minZ,minY:-64,maxY:319,chunkSize:16});
  const make=generator===undefined?
    (cx,cz,chunkEdits)=>{
      const biomes=window.MineWorldBiomes;
      if(!biomes||typeof biomes.generateSectionStore!=='function')
        throw new Error('Deep-world chunk generator unavailable');
      return biomes.generateSectionStore({cx,cz,H:384,minY:-64,SEA:63,edits:chunkEdits});
    }:generator;
  if(typeof make!=='function')throw new TypeError('Invalid deep chunk generator');
  const grid=createSectionNeighborhood(),resident=new Map();
  const saved=new Map(),byChunk=new Map();
  const key=(cx,cz)=>cx+','+cz;
  const chunk=(cx,cz)=>{
    if(!Number.isSafeInteger(cx)||!Number.isSafeInteger(cz)||
       cx<minCX||cz<minCZ||cx>=maxCX||cz>=maxCZ)
      throw new RangeError('Chunk lies outside the Overworld');
    return key(cx,cz);
  };
  const addEdit=(index,block,cx,cz)=>{
    saved.set(index,block);
    const k=key(cx,cz);
    if(!byChunk.has(k))byChunk.set(k,new Map());
    byChunk.get(k).set(index,block);
  };
  // Validate the whole imported edit map before retaining any of it. Neither
  // the original Map nor its entries are ever rewritten by this bridge.
  for(const [index,block] of edits){
    const p=codec.decode(index);
    if(!p||!Number.isSafeInteger(block)||block<0||block>255)
      throw new RangeError('Invalid saved deep-world edit');
    addEdit(index,block,Math.floor(p.x/16),Math.floor(p.z/16));
  }
  // A generated store must be valid and unique before any resident is evicted.
  // loadAround preflights every missing chunk so a late generator failure cannot
  // leave the player's previously loaded neighborhood half-replaced.
  function generate(cx,cz,other=[]) {
    const k=key(cx,cz),store=make(cx,cz,new Map(byChunk.get(k)||[]));
    if(!store||store.minY!==-64||store.maxY!==319||
       store.chunkSize!==16||store.sectionHeight!==16||
       !Number.isSafeInteger(store.storeId)||
       typeof store.get!=='function'||typeof store.set!=='function'||
       typeof store.applyEdits!=='function'||
       typeof store.markNeighborBoundaryDirty!=='function'||
       typeof store.materializeClaimWithNeighbors!=='function'||
       typeof store.canInstallClaimWithNeighbors!=='function'||
       typeof store.stats!=='function'||
       [...resident.values(),...other].includes(store))
      throw new RangeError('Invalid generated deep-world section store');
    // A generator that ignores or partially applies saved edits must never
    // silently resurrect mined blocks or discard placed blocks on reload.
    // Validate the regenerated section *before* evicting any resident chunk.
    // This includes explicit air edits (block 0), which must stay mined.
    for(const [index,block] of byChunk.get(k)||[]){
      const p=codec.decode(index);
      if(!p||store.get(p.x-cx*16,p.y,p.z-cz*16)!==block)
        throw new RangeError('Generated deep-world chunk did not replay saved edits');
    }
    return store;
  }
  function install(cx,cz,store){
    if(resident.size>=maxLoaded){
      const oldest=resident.keys().next().value;
      const [ox,oz]=oldest.split(',').map(Number);
      grid.unregister(ox,oz);resident.delete(oldest);
    }
    grid.register(cx,cz,store);
    resident.set(key(cx,cz),store);
    return store;
  }
  function load(cx,cz){
    const k=chunk(cx,cz);
    if(resident.has(k)){
      const store=resident.get(k);
      resident.delete(k);resident.set(k,store);
      return store;
    }
    return install(cx,cz,generate(cx,cz));
  }
  function unload(cx,cz){
    const k=chunk(cx,cz);
    if(!resident.has(k))return false;
    grid.unregister(cx,cz);resident.delete(k);return true;
  }
  const inside=(x,y,z)=>codec.inside(x,y,z);
  function getWorld(x,y,z){
    if(!inside(x,y,z))return null;
    // A fresh stream (or one with its final chunk unloaded) has no
    // neighborhood profile. Missing terrain is not an exceptional state:
    // return null instead of letting grid.worldToChunk throw before load().
    const cx=Math.floor(x/16),cz=Math.floor(z/16);
    if(!resident.has(key(cx,cz)))return null;
    return grid.getWorld(x,y,z);
  }
  // Conservative, bounded collision sampling for the staged deep world.
  // The caller owns block hitbox rules (fluids, ladders and partial blocks
  // must not be guessed here). Unknown/unloaded terrain blocks movement
  // until streamed in; air is always passable. AABB maxima are exclusive,
  // so a player exactly touching a block face is not colliding with it.
  function sampleCollision(box,isSolid){
    if(!box||typeof box!=='object'||typeof isSolid!=='function')
      throw new TypeError('Expected a collision box and block predicate');
    const {minX,minY,minZ,maxX,maxY,maxZ}=box;
    if(![minX,minY,minZ,maxX,maxY,maxZ].every(v=>typeof v==='number'&&Number.isFinite(v))||
       minX<codec.minX||minZ<codec.minZ||minY< -64||
       maxX>codec.minX+codec.width||maxZ>codec.minZ+codec.depth||maxY>320||
       maxX<=minX||maxY<=minY||maxZ<=minZ)
      throw new RangeError('Invalid deep-world collision bounds');
    const x0=Math.floor(minX),y0=Math.floor(minY),z0=Math.floor(minZ);
    const x1=Math.ceil(maxX)-1,y1=Math.ceil(maxY)-1,z1=Math.ceil(maxZ)-1;
    // Prevent a malformed network/player box from scanning whole chunks.
    const cells=(x1-x0+1)*(y1-y0+1)*(z1-z0+1);
    if(!Number.isSafeInteger(cells)||cells>512)
      throw new RangeError('Deep-world collision query exceeds cell budget');
    for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++)
      for(let y=y0;y<=y1;y++){
        const block=getWorld(x,y,z);
        if(block===null)
          return Object.freeze({state:'unloaded',blocked:true,hit:Object.freeze({x,y,z})});
        if(block!==0&&isSolid(block,x,y,z))
          return Object.freeze({state:'solid',blocked:true,hit:Object.freeze({x,y,z,block})});
      }
    return Object.freeze({state:'clear',blocked:false,hit:null});
  }
  // Swept movement preflight for the 384-layer stream. Checking only the
  // destination AABB lets a sprinting or falling player tunnel through a
  // full voxel between frames. Sample at most quarter-block intervals,
  // including the starting box; unloaded chunks are solid barriers until
  // streamed. This staged API uses whole-block predicates, not custom
  // partial-block hitboxes, and is not yet wired into live movement.
  function sweepCollision(box,motion,isSolid){
    if(!motion||typeof motion!=='object'||Array.isArray(motion))
      throw new TypeError('Expected a deep-world motion vector');
    const {x:dx,y:dy,z:dz}=motion;
    if(![dx,dy,dz].every(v=>typeof v==='number'&&Number.isFinite(v)))
      throw new RangeError('Invalid deep-world motion vector');
    const distance=Math.max(Math.abs(dx),Math.abs(dy),Math.abs(dz));
    // Limit per-frame work to 64 steps. Physics callers must subdivide
    // teleport-sized displacements rather than skipping through terrain.
    if(distance>16)throw new RangeError('Deep-world sweep exceeds movement budget');
    if(!box||typeof box!=='object')
      throw new TypeError('Expected a collision box');
    const end={
      minX:box.minX+dx,maxX:box.maxX+dx,
      minY:box.minY+dy,maxY:box.maxY+dy,
      minZ:box.minZ+dz,maxZ:box.maxZ+dz
    };
    // Preflight both endpoints before reading any terrain, so malformed
    // network motion never partially advances a collision query.
    for(const b of [box,end]){
      if(![b.minX,b.minY,b.minZ,b.maxX,b.maxY,b.maxZ]
        .every(v=>typeof v==='number'&&Number.isFinite(v))||
        b.minX<codec.minX||b.minY< -64||b.minZ<codec.minZ||
        b.maxX>codec.minX+codec.width||b.maxY>320||
        b.maxZ>codec.minZ+codec.depth||
        b.maxX<=b.minX||b.maxY<=b.minY||b.maxZ<=b.minZ)
        throw new RangeError('Invalid deep-world sweep bounds');
    }
    const initial=sampleCollision(box,isSolid);
    if(initial.blocked)
      return Object.freeze({state:initial.state,blocked:true,
        fraction:0,hit:initial.hit,samples:1});
    const steps=Math.ceil(distance*4);
    if(!steps)
      return Object.freeze({state:'clear',blocked:false,
        fraction:1,hit:null,samples:1});
    for(let i=1;i<=steps;i++){
      const t=i/steps;
      const moved={
        minX:box.minX+dx*t,maxX:box.maxX+dx*t,
        minY:box.minY+dy*t,maxY:box.maxY+dy*t,
        minZ:box.minZ+dz*t,maxZ:box.maxZ+dz*t
      };
      const hit=sampleCollision(moved,isSolid);
      if(hit.blocked)
        return Object.freeze({state:hit.state,blocked:true,
          fraction:(i-1)/steps,hit:hit.hit,samples:i+1});
    }
    return Object.freeze({state:'clear',blocked:false,
      fraction:1,hit:null,samples:steps+1});
  }
  function applyWorldEdits(entries){
    if(!entries||typeof entries[Symbol.iterator]!=='function')
      throw new TypeError('Expected iterable absolute-world edits');
    const pending=new Map();
    // All-or-nothing validation, including loaded-chunk membership, precedes
    // any voxel or save edit. Last-write-wins for repeated network positions.
    for(const entry of entries){
      if(!Array.isArray(entry)||entry.length!==4)
        throw new RangeError('Invalid deep-world edit batch');
      const [x,y,z,block]=entry;
      if(!inside(x,y,z)||!Number.isSafeInteger(block)||block<0||block>255)
        throw new RangeError('Invalid deep-world edit batch');
      const cx=Math.floor(x/16),cz=Math.floor(z/16);
      if(!resident.has(key(cx,cz)))
        throw new RangeError('Cannot edit an unloaded deep-world chunk');
      const index=codec.index(x,y,z);
      pending.set(index,{x,y,z,block,cx,cz,index});
    }
    let changed=0;
    for(const p of pending.values()){
      if(grid.setWorld(p.x,p.y,p.z,p.block)){
        addEdit(p.index,p.block,p.cx,p.cz);
        changed++;
      }
    }
    return changed;
  }
  function setWorld(x,y,z,block){
    return applyWorldEdits([[x,y,z,block]])>0;
  }
  function loadAround(x,z,radius=1){
    if(!Number.isSafeInteger(x)||!Number.isSafeInteger(z)||
       x<minX||x>=maxX||z<minZ||z>=maxZ||
       !Number.isSafeInteger(radius)||radius<0||radius>4)
      throw new RangeError('Invalid deep-world streaming radius');
    const cx=Math.floor(x/16),cz=Math.floor(z/16),targets=[];
    for(let dx=-radius;dx<=radius;dx++)
      for(let dz=-radius;dz<=radius;dz++)
        if(cx+dx>=minCX&&cx+dx<maxCX&&cz+dz>=minCZ&&cz+dz<maxCZ)
          targets.push({cx:cx+dx,cz:cz+dz,distance:dx*dx+dz*dz});
    if(targets.length>maxLoaded)
      throw new RangeError('Deep-world streaming radius exceeds residency budget');
    targets.sort((a,b)=>a.distance-b.distance||a.cx-b.cx||a.cz-b.cz);
    const targetKeys=new Set(targets.map(p=>key(p.cx,p.cz))),staged=new Map();
    // No LRU touch, eviction or seam invalidation until every new chunk
    // has been generated and checked. Also reject a generator that returns
    // the same mutable store for two different chunk coordinates.
    for(const p of targets){
      const k=key(p.cx,p.cz);
      if(!resident.has(k))
        staged.set(k,generate(p.cx,p.cz,staged.values()));
    }
    // Only evict chunks outside the requested view. Otherwise a newly
    // generated center chunk can evict a target-edge chunk before its turn.
    for(const k of [...resident.keys()]){
      if(resident.size+staged.size<=maxLoaded)break;
      if(targetKeys.has(k))continue;
      const [ox,oz]=k.split(',').map(Number);
      grid.unregister(ox,oz);resident.delete(k);
    }
    for(const p of targets){
      const k=key(p.cx,p.cz);
      if(resident.has(k))load(p.cx,p.cz);
      else install(p.cx,p.cz,staged.get(k));
    }
    return Object.freeze(targets.map(({cx,cz})=>Object.freeze({cx,cz})));
  }
  function stats(){
    let payloadBytes=0;
    for(const store of resident.values())payloadBytes+=store.stats().payloadBytes;
    return Object.freeze({loaded:resident.size,maxLoaded,edits:saved.size,payloadBytes});
  }
  return Object.freeze({load,unload,loadAround,getWorld,setWorld,sampleCollision,applyWorldEdits,
    sweepCollision,snapshotEdits:()=>new Map(saved),loadedChunks:()=>Object.freeze([...resident.keys()]),
    stats,grid,codec});
}

window.MineWorldSectionNeighborhood=Object.freeze({createSectionNeighborhood,createDeepChunkStream});
})();
