/* MineWorld — Wiki-informed hunger saturation and exhaustion, independent implementation.
 * Vanilla inspiration: exhaustion adds up to 4, spends saturation first, then hunger.
 * Functions do not touch localStorage/DOM and are independently testable. */
(()=>{
  'use strict';
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number.isFinite(n)?n:min));
  function consume(hunger,saturation,exhaustion,added){
    let food=clamp(hunger,0,20),reserve=clamp(saturation,0,food);
    let fatigue=clamp(exhaustion,0,4)+Math.max(0,Number(added)||0);
    while(fatigue>=4){
      fatigue-=4;
      if(reserve>0)reserve=Math.max(0,reserve-1);
      else food=Math.max(0,food-1);
    }
    reserve=Math.min(reserve,food);
    return {hunger:food,saturation:reserve,exhaustion:fatigue};
  }
  function eat(hunger,saturation,points,modifier=.55){
    const oldH=clamp(hunger,0,20);
    const newH=clamp(oldH+Math.max(0,Number(points)||0),0,20);
    const reserve=clamp(saturation,0,oldH);
    const gain=Math.max(0,Number(points)||0)*2*clamp(modifier,0,1);
    return {hunger:newH,saturation:Math.min(newH,reserve+gain)};
  }
  const EXHAUSTION=Object.freeze({sprintPerMeter:.1,sprintJump:.2,jump:.05,attack:.1,breakBlock:.005,swimPerMeter:.01});
  window.MineWorldHunger=Object.freeze({consume,eat,EXHAUSTION});
})();