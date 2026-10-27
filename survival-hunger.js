/* MineWorld — saturation and exhaustion with bounded, deterministic processing.
 * Each four exhaustion points consume one saturation point before food.
 * Pure logic; no save-format changes or DOM dependencies. */
(()=>{
  'use strict';
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number.isFinite(n)?n:min));
  const positive=n=>Number.isFinite(n)&&n>0?n:0;
  function consume(hunger,saturation,exhaustion,added){
    let food=clamp(hunger,0,20),reserve=clamp(saturation,0,food);
    const input=Number(added);
    let fatigue=clamp(exhaustion,0,4)+positive(input);
    if(!Number.isFinite(fatigue))fatigue=Number.MAX_VALUE;
    const ticks=Math.floor(fatigue/4);
    if(ticks>0){
      // A fractional saturation point still absorbs one entire tick.
      const saturationTicks=Math.min(ticks,Math.ceil(reserve));
      reserve=Math.max(0,reserve-saturationTicks);
      food=Math.max(0,food-(ticks-saturationTicks));
      fatigue%=4;
    }
    reserve=Math.min(reserve,food);
    return {hunger:food,saturation:reserve,exhaustion:fatigue};
  }
  function eat(hunger,saturation,points,modifier=.55){
    const oldH=clamp(hunger,0,20);
    const amount=positive(Number(points));
    const newH=clamp(oldH+amount,0,20);
    const reserve=clamp(saturation,0,oldH);
    const gain=amount*2*clamp(modifier,0,1);
    return {hunger:newH,saturation:Math.min(newH,reserve+gain)};
  }
  const EXHAUSTION=Object.freeze({sprintPerMeter:.1,sprintJump:.2,jump:.05,attack:.1,breakBlock:.005,swimPerMeter:.01});
  window.MineWorldHunger=Object.freeze({consume,eat,EXHAUSTION});
})();
