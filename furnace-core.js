/* MineWorld original furnace simulation core; no bundled third-party assets. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.MineWorldFurnace=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const RECIPES=Object.freeze({iron_ore:'iron_ingot',deepslate_iron_ore:'iron_ingot',raw_iron:'iron_ingot',gold_ore:'gold_ingot',deepslate_gold_ore:'gold_ingot',raw_gold:'gold_ingot',copper_ore:'copper_ingot',deepslate_copper_ore:'copper_ingot',raw_copper:'copper_ingot',diamond_ore:'diamond',deepslate_diamond_ore:'diamond',emerald_ore:'emerald',deepslate_emerald_ore:'emerald',lapis_ore:'lapis_lazuli',deepslate_lapis_ore:'lapis_lazuli',redstone_ore:'redstone',deepslate_redstone_ore:'redstone',nether_quartz_ore:'quartz',ancient_debris:'netherite_scrap',sand:'glass',red_sand:'glass',cobbled_deepslate:'deepslate',basalt:'smooth_basalt',sandstone:'smooth_sandstone',red_sandstone:'smooth_red_sandstone',chorus_fruit:'popped_chorus_fruit',sea_pickle:'lime_dye',cobblestone:'stone',raw_beef:'cooked_beef',raw_porkchop:'cooked_porkchop',raw_chicken:'cooked_chicken',potato:'baked_potato',clay_ball:'brick',clay:'terracotta',stone:'smooth_stone',netherrack:'nether_brick',cactus:'green_dye',kelp:'dried_kelp',wet_sponge:'sponge',raw_mutton:'cooked_mutton',raw_rabbit:'cooked_rabbit',raw_cod:'cooked_cod',raw_salmon:'cooked_salmon',log:'charcoal'});
const FUELS=Object.freeze({coal:1600,charcoal:1600,planks:300,log:300,stick:100,wooden_pickaxe:200,wooden_axe:200,wooden_shovel:200,wooden_hoe:200,wooden_sword:200,sapling:100,bowl:100,bamboo:50,wooden_slab:150,crafting_table:300,chest:300,ladder:300,bookshelf:300,wooden_pressure_plate:300,wooden_button:100,wooden_door:200,wooden_trapdoor:300,wooden_fence:300,wooden_fence_gate:300,spruce_boat:1200,cherry_boat:1200,wooden_sign:200,wooden_hanging_sign:800,sign:200,boat:1200,raft:1200,blaze_rod:2400,coal_block:16000,lava_bucket:20000,dried_kelp_block:4000});
const SMELT_TICKS=200;
const NONSTACKABLE_FUELS=new Set(['lava_bucket','boat','spruce_boat','cherry_boat','raft']);
const MAX_BURN_TICKS=Math.max(...Object.values(FUELS));
function recipeFor(id){return Object.prototype.hasOwnProperty.call(RECIPES,id)?RECIPES[id]:null;}
function fuelTicks(id){return Object.prototype.hasOwnProperty.call(FUELS,id)?FUELS[id]:0;}
function stack(s){if(!s||typeof s!=='object'||typeof s.id!=='string'||!Number.isSafeInteger(s.count)||s.count<1||s.count>64)return null;return {id:s.id,count:s.count};}
function state(raw){raw=raw||{};const burn=Math.min(MAX_BURN_TICKS,nonnegative(raw.burn));const burnTotal=Math.max(burn,Math.min(MAX_BURN_TICKS,nonnegative(raw.burnTotal)));return {input:stack(raw.input),fuel:stack(raw.fuel),output:stack(raw.output),burn,burnTotal,progress:Math.min(SMELT_TICKS-1,nonnegative(raw.progress))};}
function nonnegative(n){return Number.isSafeInteger(n)&&n>=0?n:0;}
function canSmelt(s){const item=s.input&&recipeFor(s.input.id);return !!(item&&(!s.output||(s.output.id===item&&s.output.count<64)));}
function tick(raw,steps=1){const s=state(raw);if(!Number.isSafeInteger(steps)||steps<0||steps>12000)throw new RangeError('Invalid furnace tick count');
for(let i=0;i<steps;i++){
const possible=canSmelt(s);
if(s.burn===0&&possible&&s.fuel&&fuelTicks(s.fuel.id)){
const consumed=s.fuel.id;
// Legacy saves may contain stacked lava buckets. Do not burn one and
// silently discard its empty container; leave the stack withdrawable.
// Legacy saves can also contain overstacked boats/rafts. Keep these
// nonstackable items withdrawable rather than consuming an invalid stack.
if(!NONSTACKABLE_FUELS.has(consumed)||s.fuel.count===1){
s.burn=FUELS[consumed];s.burnTotal=s.burn;s.fuel.count--;if(!s.fuel.count)s.fuel=consumed==='lava_bucket'?{id:'bucket',count:1}:null;
}
}
const heated=s.burn>0;
if(heated)s.burn--;
if(possible&&heated){s.progress++;if(s.progress>=SMELT_TICKS){const id=RECIPES[s.input.id];s.input.count--;if(!s.input.count)s.input=null;if(s.output)s.output.count++;else s.output={id,count:1};s.progress=0;}}
else if(!heated&&possible){s.progress=Math.max(0,s.progress-2);}
else s.progress=0;
}return s;}
/* Atomic slot transfer: inventory UI can preview returned remainder without mutating its inputs. */
function insert(raw,slot,item){
if(slot!=='input'&&slot!=='fuel')throw new RangeError('Furnace output is read-only');
const s=state(raw), incoming=stack(item);
if(!incoming)throw new TypeError('Invalid item stack');
if(slot==='input'&&!recipeFor(incoming.id))return {furnace:s,remainder:incoming,moved:0};
if(slot==='fuel'&&!fuelTicks(incoming.id))return {furnace:s,remainder:incoming,moved:0};
const existing=s[slot];
if(existing&&existing.id!==incoming.id)return {furnace:s,remainder:incoming,moved:0};
const capacity=slot==='fuel'&&NONSTACKABLE_FUELS.has(incoming.id)?1:64;
const moved=Math.min(incoming.count,Math.max(0,capacity-(existing?existing.count:0)));
if(moved){if(existing)existing.count+=moved;else {s[slot]={id:incoming.id,count:moved};if(slot==='input')s.progress=0;}}
return {furnace:s,remainder:incoming.count===moved?null:{id:incoming.id,count:incoming.count-moved},moved};
}
function extract(raw,slot,count=64){
if(!['input','fuel','output'].includes(slot))throw new RangeError('Invalid furnace slot');
if(!Number.isSafeInteger(count)||count<1||count>64)throw new RangeError('Invalid extraction count');
const s=state(raw), existing=s[slot];
if(!existing)return {furnace:s,taken:null};
const amount=Math.min(count,existing.count);
const taken={id:existing.id,count:amount};
existing.count-=amount;if(!existing.count){s[slot]=null;if(slot==='input')s.progress=0;}
return {furnace:s,taken};
}
/* Versioned, JSON-safe furnace snapshots. Unknown future versions fail closed rather
   than silently discarding items or timers from a newer save format. */
const SAVE_VERSION=1;
function serialize(raw){
 const s=state(raw);
 return {version:SAVE_VERSION,input:s.input,fuel:s.fuel,output:s.output,
         burn:s.burn,burnTotal:s.burnTotal,progress:s.progress};
}
function deserialize(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return state({});
 if(Object.prototype.hasOwnProperty.call(raw,'version')&&raw.version!==SAVE_VERSION)
   throw new RangeError('Unsupported furnace save version');
 return state(raw);
}
return {RECIPES,FUELS,SMELT_TICKS,SAVE_VERSION,state,canSmelt,tick,insert,extract,serialize,deserialize};
});
