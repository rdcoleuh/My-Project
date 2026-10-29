/* Original MineWorld furnace logic: per-block slots, fuel and saved progress. */
(()=>{'use strict';
const RECIPES=Object.freeze({rawIron:'iron',rawGold:'gold',rawCopper:'copper',raw:'cooked',chicken:'cookedChicken',mutton:'cookedMutton',fish:'cookedFish',potato:'bakedPotato',kelp:'driedKelp',ancientDebris:'netheriteScrap','block:85':'netheriteScrap','block:4':'block:9','block:61':'block:3','block:5':'charcoal'});
const FUEL=Object.freeze({coal:80,charcoal:80,'block:5':15,'block:11':15,'block:52':15,sticks:5,bamboo:2.5,'block:15':15,'block:30':15,'block:32':15});
const COOK=10,key=k=>typeof k==='string'&&(/^[a-zA-Z][a-zA-Z0-9]*$/.test(k)||/^block:[1-9]\d{0,2}$/.test(k));
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
  s.qty-=moved;if(!s.qty)m[which]=null;if(which==='input')m.progress=0;return out;
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
     if(!m.fuel||!FUEL[m.fuel.key])break;
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
  for(const r of records){if(!pos(r))continue;const m=blank(r);
   m.input=slot(r.input);m.fuel=slot(r.fuel);m.output=slot(r.output);
   if(m.input&&!Object.hasOwn(RECIPES,m.input.key))m.input=null;
   if(m.fuel&&!Object.hasOwn(FUEL,m.fuel.key))m.fuel=null;
   if(m.output&&!Object.values(RECIPES).includes(m.output.key))m.output=null;
   m.burn=Math.max(0,Math.min(1000,Number(r.burn)||0));
   m.burnTotal=Math.max(0,Math.min(1000,Number(r.burnTotal)||0));
   // A completed cook frame cannot be resumed at exactly COOK: tick would
   // otherwise take a zero-length step forever, leaving the furnace stuck.
   m.progress=Math.max(0,Math.min(COOK,Number(r.progress)||0));
   if(m.progress>=COOK)m.progress=0;
   machines.set(id(m),m);
  }
 }
 return {get,ensure,insert,take,tick,remove,snapshot,restore,clear:()=>machines.clear()};
}
window.MineWorldFurnace=Object.freeze({create,RECIPES,FUEL,COOK});
})();