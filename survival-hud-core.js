/* MineWorld original, asset-independent survival HUD model. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.MineWorldSurvivalHUD=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function normalize(value){return Number.isFinite(value)?Math.max(0,Math.min(20,Math.floor(value*2)/2)):0;}
function icons(value){const v=normalize(value);return Array.from({length:10},(_,i)=>{const remaining=v-i*2;return remaining>=2?'full':remaining>=1?'half':'empty';});}
function model(health,food){const h=normalize(health),f=normalize(food);return {health:h,food:f,hearts:icons(h),hunger:icons(f),healthLabel:'Health '+h+' of 20',foodLabel:'Food '+f+' of 20'};}
return {normalize,icons,model};
});
