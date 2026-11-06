/* MineWorld original furnace simulation core; no bundled third-party assets. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.MineWorldFurnace=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const RECIPES=Object.freeze({iron_ore:'iron_ingot',raw_iron:'iron_ingot',gold_ore:'gold_ingot',raw_gold:'gold_ingot',sand:'glass',cobblestone:'stone',raw_beef:'cooked_beef',raw_porkchop:'cooked_porkchop',raw_chicken:'cooked_chicken',potato:'baked_potato',clay_ball:'brick',log:'charcoal'});
const FUELS=Object.freeze({coal:1600,charcoal:1600,planks:300,log:300,stick:100,wooden_pickaxe:200,lava_bucket:20000});
const SMELT_TICKS=200;
function stack(s){if(!s||typeof s!=='object'||typeof s.id!=='string'||!Number.isSafeInteger(s.count)||s.count<1||s.count>64)return null;return {id:s.id,count:s.count};}
function state(raw){raw=raw||{};return {input:stack(raw.input),fuel:stack(raw.fuel),output:stack(raw.output),burn:nonnegative(raw.burn),burnTotal:nonnegative(raw.burnTotal),progress:Math.min(SMELT_TICKS-1,nonnegative(raw.progress))};}
function nonnegative(n){return Number.isSafeInteger(n)&&n>=0?n:0;}
function canSmelt(s){const item=s.input&&RECIPES[s.input.id];return !!(item&&(!s.output||(s.output.id===item&&s.output.count<64)));}
function tick(raw,steps=1){const s=state(raw);if(!Number.isSafeInteger(steps)||steps<0||steps>12000)throw new RangeError('Invalid furnace tick count');
for(let i=0;i<steps;i++){
const possible=canSmelt(s);
if(s.burn===0&&possible&&s.fuel&&FUELS[s.fuel.id]){
s.burn=FUELS[s.fuel.id];s.burnTotal=s.burn;s.fuel.count--;if(!s.fuel.count)s.fuel=null;
}
const heated=s.burn>0;
if(heated)s.burn--;
if(possible&&heated){s.progress++;if(s.progress>=SMELT_TICKS){const id=RECIPES[s.input.id];s.input.count--;if(!s.input.count)s.input=null;if(s.output)s.output.count++;else s.output={id,count:1};s.progress=0;}}
else s.progress=0;
}return s;}
return {RECIPES,FUELS,SMELT_TICKS,state,canSmelt,tick};
});
