/* Original MineWorld furnace logic: per-block slots, fuel and saved progress. */
(()=>{'use strict';
const RECIPES=Object.freeze({rawIron:'iron',rawGold:'gold',rawCopper:'copper',raw:'cooked',chicken:'cookedChicken',mutton:'cookedMutton',fish:'cookedFish',potato:'bakedPotato',kelp:'driedKelp',ancientDebris:'netheriteScrap','block:85':'netheriteScrap','block:4':'block:9','block:61':'block:3','block:5':'charcoal',
 // Smelt placeable ore blocks obtained with silk-touch/creative as well as raw drops.
 // IDs are MineWorld's own block registry, not an external asset mapping.
 'block:18':'coal','block:19':'iron','block:83':'quartz','block:84':'goldNugget',
 'block:95':'copper','block:96':'gold','block:97':'redstone','block:98':'lapis',
 'block:99':'diamond','block:100':'emerald',
 'block:101':'coal','block:102':'iron','block:103':'copper','block:104':'gold',
 'block:105':'redstone','block:106':'lapis','block:107':'diamond','block:108':'emerald',
 'block:26':'block:9','block:57':'block:25'});
const FUEL=Object.freeze({coal:80,charcoal:80,'block:5':15,'block:11':15,'block:52':15,sticks:5,bamboo:2.5,'block:15':15,'block:30':15,'block:32':15,'block:34':15,
 'block:36':15,'block:38':15,'block:40':15,'block:42':15,
 // Craftable MineWorld fuel blocks and inventory items; durations in seconds.
 // A coal block fuels 80 smelts, a blaze rod 12, and a boat/raft six.
 'block:50':15,'block:116':800,blazeRod:120,
 boat:60,spruceBoat:60,cherryBoat:60,raft:60});
const COOK=10,key=k=>typeof k==='string'&&!Object.hasOwn(Object.prototype,k)&&(/^[a-zA-Z][a-zA-Z0-9]*$/.test(k)||/^block:[1-9]\d{0,2}$/.test(k));
// Keep the legacy Y=0..47 range and permit future deep-world furnaces.
// X/Z remain inside the current 10,000-block world; Y is absolute, not an array offset.
const pos=p=>p&&['overworld','nether','end'].includes(p.dimension)&&
  [p.x,p.y,p.z].every(Number.isInteger)&&p.x>=0&&p.x<10000&&p.z>=0&&p.z<10000&&p.y>=-64&&p.y<=319;
const id=p=>p.dimension+':'+p.x+','+p.y+','+p.z;
const blank=p=>({dimension:p.dimension,x:p.x,y:p.y,z:p.z,input:null,fuel:null,output:null,burn:0,burnTotal:0,progress:0});
const slot=s=>s&&key(s.key)&&Number.isInteger(s.qty)&&s.qty>0&&s.qty<=64?{key:s.key,qty:s.qty}:null;
function create(){
 const machines=new Map();
 const get=p=>pos(p)?machines.get(id(p))||null:null;
 function ensure(p){if(!pos(p))return null;if(!get(p))machines.set(id(p),blank(p));return get(p);}
 function insert(p,which,item,n=1){
  if(!['input','fuel'].includes(which)||!key(item)||!Number.isInteger(n)||n<1)return 0;
  if(which==='input'&&!Object.hasOwn(RECIPES,item)||which==='fuel'&&!Object.hasOwn(FUEL,item))return 0;
  const m=ensure(p);if(!m||m[which]&&m[which].key!==item)return 0;
  const moved=Math.min(n,64-(m[which]?.qty||0));
  if(moved)m[which]={key:item,qty:(m[which]?.qty||0)+moved};return moved;
 }
 function take(p,which,n=64){
  if(!['input','fuel','output'].includes(which)||!Number.isInteger(n)||n<1)return null;
  const m=get(p),s=m?.[which];if(!s)return null;
  const moved=Math.min(n,s.qty),out={key:s.key,qty:moved};
  s.qty-=moved;if(!s.qty)m[which]=null;if(which==='input'&&!m.input)m.progress=0;return out;
 }
 function tick(seconds){
  let changed=false,completed=0;
  for(const m of machines.values()){
   let remaining=Math.max(0,Math.min(60,Number(seconds)||0));
   while(remaining>1e-7){
    const product=m.input&&Object.hasOwn(RECIPES,m.input.key)&&RECIPES[m.input.key];
    if(!product||m.output&&(m.output.key!==product||m.output.qty>=64)){
     if(m.progress){m.progress=0;changed=true;}
     if(m.burn){m.burn=Math.max(0,m.burn-remaining);changed=true;}break;
    }
    if(m.burn<=0){
     if(!m.fuel||!FUEL[m.fuel.key]){
      // A stopped cook cools off at twice real time. Without this,
      // unfueled furnaces could preserve 99% progress indefinitely.
      if(m.progress>0){m.progress=Math.max(0,m.progress-remaining*2);changed=true;}
      break;
     }
     m.burn=m.burnTotal=FUEL[m.fuel.key];if(!--m.fuel.qty)m.fuel=null;changed=true;
    }
    const step=Math.min(remaining,m.burn,COOK-m.progress);if(step<1e-7)break;
    m.burn=Math.max(0,m.burn-step);m.progress+=step;remaining-=step;changed=true;
    if(m.progress>=COOK-1e-7){
     if(!--m.input.qty)m.input=null;
     if(m.output)m.output.qty++;else m.output={key:product,qty:1};
     m.progress=0;completed++;
    }
   }
  }
  return {changed,completed};
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
   const m=blank(r);
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
   m.progress=Math.max(0,Math.min(COOK,Number(r.progress)||0));
   if(m.progress>=COOK||!m.input)m.progress=0;
   // A saved progress timer without any ingredient would otherwise grant
   // a newly inserted item free cooking time after a world reload.
   machines.set(id(m),m);
  }
 }
 return {get,ensure,insert,take,tick,remove,snapshot,restore,clear:()=>machines.clear()};
}
window.MineWorldFurnace=Object.freeze({create,RECIPES,FUEL,COOK});
})();