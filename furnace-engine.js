/* Original MineWorld furnace logic: per-block slots, fuel and saved progress. */
(()=>{'use strict';
const RECIPES=Object.freeze({clay:'brick',rawIron:'iron',rawGold:'gold',rawCopper:'copper',raw:'cooked',chicken:'cookedChicken',mutton:'cookedMutton',fish:'cookedFish',potato:'bakedPotato',kelp:'driedKelp',ancientDebris:'netheriteScrap','block:85':'netheriteScrap','block:4':'block:9','block:61':'block:3','block:5':'charcoal',
 // Smelt placeable ore blocks obtained with silk-touch/creative as well as raw drops.
 // IDs are MineWorld's own block registry, not an external asset mapping.
 'block:18':'coal','block:19':'iron','block:83':'quartz','block:84':'goldNugget',
 'block:95':'copper','block:96':'gold','block:97':'redstone','block:98':'lapis',
 // Harvested cactus (block 44) cooks into MineWorld's generic dye item.
 // This is a regular-furnace recipe, not a metal/ore blast-furnace recipe.
 'block:44':'dye',
 // MineWorld's generic glazed terracotta is fired from existing terracotta.
 // No second dye input exists in the three-slot furnace; dye is not fuel.
 'block:25':'glazedTerracotta',
 'block:99':'diamond','block:100':'emerald',
 'block:101':'coal','block:102':'iron','block:103':'copper','block:104':'gold',
 'block:105':'redstone','block:106':'lapis','block:107':'diamond','block:108':'emerald',
 'block:26':'block:9','block:57':'block:25',
 // Every registered log type produces charcoal, not only oak.
 // Netherrack (block 50) is neither a log nor a fuel; planks are fuel only.
 'block:15':'charcoal','block:30':'charcoal','block:32':'charcoal',
 'block:34':'charcoal','block:36':'charcoal','block:38':'charcoal',
 'block:40':'charcoal','block:42':'charcoal'});
const FUEL=Object.freeze({coal:80,charcoal:80,'block:5':15,'block:11':15,'block:52':15,sticks:5,bamboo:2.5,'block:15':15,'block:30':15,'block:32':15,'block:34':15,
 'block:36':15,'block:38':15,'block:40':15,'block:42':15,
 // Craftable MineWorld fuel blocks and inventory items; durations in seconds.
 // A coal block fuels 80 smelts, a blaze rod 12, and a boat/raft six.
 'block:116':800,blazeRod:120,lavaBucket:1000,
 boat:60,spruceBoat:60,cherryBoat:60,raft:60,
 // Craftable wooden stations, wooden accessories and harvestable bamboo.
 // These are MineWorld inventory keys; the old bamboo item remains valid.
 'block:45':2.5,'block:119':15,'block:155':15,'block:160':15,'block:168':15,
 ladder:15,fence:15,gate:15,door:10,trapdoor:15,sign:10,
 button:5,pressurePlate:15,bowl:5});
const COOK=10;
const KINDS=Object.freeze({furnace:Object.freeze({cook:10}),smoker:Object.freeze({cook:5}),blast:Object.freeze({cook:5})});
const FOOD=new Set(['raw','chicken','mutton','fish','potato','kelp']);
const ORE=new Set(['rawIron','rawGold','rawCopper','ancientDebris',...Object.keys(RECIPES).filter(k=>/^block:/.test(k)&&!['block:4','block:5','block:15','block:26','block:30','block:32','block:34','block:36','block:38','block:40','block:42','block:44','block:25','block:57','block:61'].includes(k))]);
const canSmelt=(kind,item)=>Object.hasOwn(RECIPES,item)&&(kind==='furnace'||kind==='smoker'&&FOOD.has(item)||kind==='blast'&&ORE.has(item));
// Namespaced IDs may arrive in saves from future/custom resource-pack content.
// Preserve them as inert, withdrawable stacks; only registered recipes/fuels run.
const namespaced=k=>k.length<=192&&
 /^[a-z0-9][a-z0-9_.-]{0,63}:[a-z0-9_][a-z0-9_.-]*(?:\/[a-z0-9_][a-z0-9_.-]*)*$/.test(k)&&
 !k.startsWith('block:');
const key=k=>typeof k==='string'&&!Object.hasOwn(Object.prototype,k)&&
 (/^[a-zA-Z][a-zA-Z0-9]*$/.test(k)||/^block:[1-9]\d{0,2}$/.test(k)||namespaced(k));
// Keep the legacy Y=0..47 range and permit future deep-world furnaces.
// The future chunk stream supports negative X/Z. Bound furnace positions to
// the same 10,000-block radius used by the current world, retaining all legacy
// positive positions while allowing deep-world stations west/north of origin.
// Y is absolute, not a dense-array offset.
const pos=p=>p&&['overworld','nether','end'].includes(p.dimension)&&
  [p.x,p.y,p.z].every(Number.isSafeInteger)&&
  p.x>=-9999&&p.x<10000&&p.z>=-9999&&p.z<10000&&p.y>=-64&&p.y<=319;
const id=p=>p.dimension+':'+p.x+','+p.y+','+p.z;
const blank=(p,kind='furnace')=>({kind,dimension:p.dimension,x:p.x,y:p.y,z:p.z,input:null,fuel:null,output:null,burn:0,burnTotal:0,progress:0});
const slot=s=>s&&key(s.key)&&Number.isInteger(s.qty)&&s.qty>0&&s.qty<=64?{key:s.key,qty:s.qty}:null;
// Nonstackable fuel containers share one capacity contract with the UI.
// Never reserve 64 buckets for a furnace slot that holds only one.
// Lava buckets, boats and rafts are individually handled fuel items.
// Do not truncate legacy saved stacks: old saves remain withdrawable and
// consumable, but new UI/engine deposits cannot add to an overfull slot.
const NONSTACKABLE_FUELS=new Set(['lavaBucket','boat','spruceBoat','cherryBoat','raft']);
const slotCapacity=(which,item)=>!['input','fuel'].includes(which)?0:
 which==='fuel'&&NONSTACKABLE_FUELS.has(item)?1:64;
function create(){
 const machines=new Map();
 const get=p=>pos(p)?machines.get(id(p))||null:null;
 function ensure(p,kind){
  // Omitted kind means "get or create", not "convert to a furnace".
  // UI openings pass an explicit kind so a restored/replaced station can
  // transition in either direction (including smoker/blast -> furnace).
  if(!pos(p)||(kind!==undefined&&!Object.hasOwn(KINDS,kind)))return null;
  const existing=get(p);
  if(existing){
   if(kind!==undefined&&existing.kind!==kind){
    // A smoker/blast furnace burns fuel twice as fast as a normal furnace.
    // Keep the remaining fuel's smelting capacity when correcting a saved
    // station type, rather than granting extra smelts or losing paid fuel.
    const oldRate=existing.kind==='furnace'?1:0.5;
    const newRate=kind==='furnace'?1:0.5;
    const ratio=newRate/oldRate;
    existing.burn*=ratio;
    existing.burnTotal*=ratio;
    existing.kind=kind;
    // A partial cook from a different recipe duration must not complete
    // instantly or be counted twice after the station changes type.
    existing.progress=0;
   }
   return existing;
  }
  const machine=blank(p,kind===undefined?'furnace':kind);
  machines.set(id(p),machine);return machine;
 }
 function insert(p,which,item,n=1){
  if(!['input','fuel'].includes(which)||!key(item)||!Number.isInteger(n)||n<1)return 0;
  if(which==='input'&&!canSmelt(get(p)?.kind||'furnace',item)||which==='fuel'&&!Object.hasOwn(FUEL,item))return 0;
  const m=ensure(p);if(!m||m[which]&&m[which].key!==item)return 0;
  // Lava buckets are non-stackable fuel containers. The empty bucket
  // remains in the fuel slot after ignition and can be withdrawn.
  const capacity=slotCapacity(which,item);
  const moved=Math.max(0,Math.min(n,capacity-(m[which]?.qty||0)));
  if(moved)m[which]={key:item,qty:(m[which]?.qty||0)+moved};return moved;
 }
 function take(p,which,n=64){
  if(!['input','fuel','output'].includes(which)||!Number.isInteger(n)||n<1)return null;
  const m=get(p),s=m?.[which];if(!s)return null;
  const moved=Math.min(n,s.qty),out={key:s.key,qty:moved};
  s.qty-=moved;if(!s.qty)m[which]=null;if(which==='input'&&!m.input)m.progress=0;return out;
 }
 function tick(seconds){
  // Reject malformed frame deltas before touching any furnace. Infinity used
  // to be clamped to 60 seconds, instantly burning fuel and smelting six items.
  // A numeric string must not be silently interpreted as elapsed game time.
  const elapsed=typeof seconds==='number'&&Number.isFinite(seconds)&&seconds>0?
   Math.min(seconds,60):0;
  if(!elapsed)return {changed:false,completed:0};
  let changed=false,completed=0;
  for(const m of machines.values()){
   let remaining=elapsed;
   while(remaining>1e-7){
    const product=m.input&&canSmelt(m.kind,m.input.key)&&RECIPES[m.input.key];
    if(!product||m.output&&(m.output.key!==product||m.output.qty>=64)){
     if(m.progress){m.progress=0;changed=true;}
     if(m.burn){m.burn=Math.max(0,m.burn-remaining);changed=true;}break;
    }
    // Floating-point fuel remnants below the simulation's 0.1 microsecond
    // step threshold must be exhausted, not treated as perpetually burning.
    // Otherwise a furnace can become stuck forever with burn > 0 but too
    // little fuel to advance even one tick.
    if(m.burn>0&&m.burn<1e-7){m.burn=0;changed=true;}
    if(m.burn<=0){
     if(!m.fuel||!FUEL[m.fuel.key]){
      // A stopped cook cools off at twice real time. Without this,
      // unfueled furnaces could preserve 99% progress indefinitely.
      if(m.progress>0){m.progress=Math.max(0,m.progress-remaining*2);changed=true;}
      break;
     }
     // Specialized stations cook twice as fast, but also burn fuel twice as fast.
     // One coal therefore smelts eight items in every station, not sixteen.
     // An older or malformed save can contain a stacked lava bucket.
     // Do not consume one and silently discard its empty container.
     if(m.fuel.key==='lavaBucket'&&m.fuel.qty!==1)break;
     const usedFuel=m.fuel.key;
     m.burn=m.burnTotal=FUEL[usedFuel]*(m.kind==='furnace'?1:0.5);
     if(!--m.fuel.qty)m.fuel=usedFuel==='lavaBucket'?{key:'bucket',qty:1}:null;
     changed=true;
    }
    const cook=KINDS[m.kind].cook;
    const gap=cook-m.progress;
    // A saved or accumulated cook can be within floating-point epsilon of
    // completion. Finish that item rather than looping forever on a tiny step.
    if(gap>=0&&gap<1e-7){
     m.progress=cook;changed=true;
    }else{
     const step=Math.min(remaining,m.burn,gap);
     if(step<1e-7){
      if(m.burn<1e-7){m.burn=0;changed=true;continue;}
      break;
     }
     m.burn=Math.max(0,m.burn-step);m.progress+=step;remaining-=step;changed=true;
    }
    if(m.progress>=cook-1e-7){
     if(!--m.input.qty)m.input=null;
     if(m.output)m.output.qty++;else m.output={key:product,qty:1};
     m.progress=0;completed++;
    }
   }
  }
  return {changed,completed};
 }
 // Upgrade only previously saved blast furnaces mistakenly placed as
 // cartography-table block 158. Unopened block 158 placements are ambiguous:
 // they may be real cartography tables, so never change them without a saved
 // blast-furnace machine record. Maps retain all other edits and inventories.
 function migrateLegacyBlastBlocks(editsByDimension,worldIndex){
  if(!editsByDimension||typeof worldIndex!=='function')return 0;
  let converted=0;
  for(const m of machines.values()){
   // Legacy array indices cannot represent negative X/Z. A signed
   // deep-world furnace must never alias a positive legacy block index.
   if(m.kind!=='blast'||m.y<0||m.y>=48||m.x<0||m.z<0)continue;
   const edits=editsByDimension[m.dimension];
   if(!edits||typeof edits.get!=='function'||typeof edits.set!=='function')continue;
   const index=worldIndex(m.x,m.y,m.z);
   if(Number.isSafeInteger(index)&&edits.get(index)===158){
    edits.set(index,156);converted++;
   }
  }
  return converted;
 }
 function remove(p){const m=get(p);if(!m)return [];machines.delete(id(p));
  return ['input','fuel','output'].map(k=>m[k]).filter(Boolean).map(s=>({...s}));}
 // Never silently drop player-owned furnaces from a saved world.
 function snapshot(){return [...machines.values()].map(m=>({...m,input:slot(m.input),fuel:slot(m.fuel),output:slot(m.output)}));}
 function restore(records){machines.clear();if(!Array.isArray(records))return;
  for(const r of records){
   if(!pos(r))continue;
   // Duplicate saved positions must not replace an already-restored machine:
   // last-wins loading silently erased its ingredient, fuel and output stacks.
   if(machines.has(id(r)))continue;
   const m=blank(r,Object.hasOwn(KINDS,r.kind)?r.kind:'furnace');
   m.input=slot(r.input);m.fuel=slot(r.fuel);m.output=slot(r.output);
   // Preserve well-formed stacks even if this build no longer recognizes
   // their recipe or fuel. Dropping unknown items on load permanently destroys
   // materials from newer saves or older modded worlds. Unknown inputs cannot
   // smelt and unknown fuel cannot ignite, but players can retrieve both.
   // An unrecognized output must also remain intact and block incompatible
   // smelting rather than being overwritten by a new product.
   // Burn remaining is meaningful only relative to the fuel's recorded
   // total. Corrupt or partial saves used to restore burn=1000 with no
   // burnTotal, manufacturing up to 100 free smelts without any fuel.
   // Normal snapshots always store both numeric fields, including 800s coal.
   const total=typeof r.burnTotal==='number'&&Number.isFinite(r.burnTotal)?
    Math.max(0,Math.min(1000,r.burnTotal)):0;
   const remaining=typeof r.burn==='number'&&Number.isFinite(r.burn)?
    Math.max(0,Math.min(1000,r.burn)):0;
   m.burnTotal=total;
   m.burn=Math.min(remaining,total);
   // A completed cook frame cannot be resumed at exactly COOK: tick would
   // otherwise take a zero-length step forever, leaving the furnace stuck.
   // Saved progress is a duration, never a string, boolean or array.
   // Number(...) coerced malformed values (e.g. "9" or [9]) into almost
   // finished smelts, giving unearned cooking time after a reload.
   const savedProgress=typeof r.progress==='number'&&Number.isFinite(r.progress)?
    r.progress:0;
   m.progress=Math.max(0,Math.min(KINDS[m.kind].cook,savedProgress));
   if(m.progress>=KINDS[m.kind].cook||!m.input||!canSmelt(m.kind,m.input.key))m.progress=0;
   // A saved progress timer without any ingredient would otherwise grant
   // a newly inserted item free cooking time after a world reload.
   machines.set(id(m),m);
  }
 }
 return {get,ensure,insert,take,tick,remove,snapshot,restore,canSmelt,migrateLegacyBlastBlocks,clear:()=>machines.clear()};
}
window.MineWorldFurnace=Object.freeze({create,RECIPES,FUEL,COOK,KINDS,canSmelt,slotCapacity});
})();