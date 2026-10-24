/* MineWorld 5.1: original Wiki-informed survival world rules.
 * 20-minute daylight cycle, bed spawn/sleep, XP levels, deterministic weather.
 * Rain durations are shortened for MineWorld; no third-party artwork. */
(()=>{'use strict';
 const DAY=1200;
 const dayTicks=clock=>Math.floor(((((Number(clock)||0)%DAY)+DAY)%DAY)/DAY*24000);
 const sunlight=clock=>Math.sin(((((Number(clock)||0)%DAY)+DAY)%DAY)/DAY*Math.PI*2);
 const canSleep=(clock,weather='clear')=>weather==='thunder'||(dayTicks(clock)>=12523&&dayTicks(clock)<=23477);
 const nextMorning=clock=>(Math.floor(Math.max(0,Number(clock)||0)/DAY)+1)*DAY;
 function totalForLevel(level){
  const n=Math.max(0,Math.floor(Number(level)||0));
  return n<=16?n*n+6*n:n<=31?Math.round(2.5*n*n-40.5*n+360):Math.round(4.5*n*n-162.5*n+2220);
 }
 function progress(xp){
  const n=Math.max(0,Math.min(2000000,Math.floor(Number(xp)||0)));
  let lo=0,hi=1000;
  while(lo<hi){const m=Math.ceil((lo+hi+1)/2);if(totalForLevel(m)<=n)lo=m;else hi=m-1;}
  const floor=totalForLevel(lo),next=totalForLevel(lo+1);
  return {level:lo,into:n-floor,need:next-floor,ratio:(n-floor)/(next-floor),xp:n};
 }
 function random(seed,n){
  let h=(Math.imul(Math.floor(seed)||0,1664525)^Math.imul(n+31,1013904223))|0;
  h=Math.imul(h^(h>>>16),2246822507);return ((h^(h>>>13))>>>0)/4294967295;
 }
 const newWeather=seed=>({type:'clear',seconds:180+random(seed,1)*170,step:0});
 function validWeather(state,seed){
  if(!state||!['clear','rain','thunder'].includes(state.type)||!Number.isFinite(state.seconds))return newWeather(seed);
  return {type:state.type,seconds:Math.max(0,Math.min(2000,state.seconds)),step:Math.max(0,Math.min(10000,Math.floor(state.step)||0))};
 }
 function advanceWeather(state,seconds,seed){
  const next=validWeather(state,seed);next.seconds-=Math.max(0,Math.min(2,Number(seconds)||0));
  if(next.seconds>0)return next;
  next.step++;
  if(next.type==='clear'){
   next.type=random(seed,next.step*7)>.79?'thunder':'rain';
   next.seconds=75+random(seed,next.step*7+1)*95;
  }else{next.type='clear';next.seconds=210+random(seed,next.step*7+2)*280;}
  return next;
 }
 function weatherLabel(type,biome=''){
  if(type==='clear')return 'Clear';
  if(/snow|frozen|ice|grove|cold|taiga/i.test(biome))return 'Snow';
  return type==='thunder'?'Thunderstorm':'Rain';
 }
 window.MineWorldSurvivalRules=Object.freeze({DAY,dayTicks,sunlight,canSleep,nextMorning,totalForLevel,progress,newWeather,validWeather,advanceWeather,weatherLabel});
})();