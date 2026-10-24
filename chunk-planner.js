/* MineWorld 4.7 — frame-budgeted visible chunk planner.
   The slider controls 10–50 nearby 16×16 map chunks, not a 50-chunk radius.
   This module does not depend on WebGL and can be tested independently. */
(()=>{
  'use strict';
  function limit(n){return Math.max(10,Math.min(50,Math.round(Number(n)||10)));}
  function choose(cx,cz,requested,width,height){
    const count=limit(requested);
    const maxX=Math.max(1,Math.ceil(width)),maxZ=Math.max(1,Math.ceil(height));
    // Expand rings until at least N valid world chunks are available.
    const out=[];
    const radius=Math.ceil(Math.sqrt(count))+2;
    for(let dx=-radius;dx<=radius;dx++){
      const x=cx+dx;if(x<0||x>=maxX)continue;
      for(let dz=-radius;dz<=radius;dz++){
        const z=cz+dz;if(z<0||z>=maxZ)continue;
        out.push({cx:x,cz:z,dist:dx*dx+dz*dz});
      }
    }
    out.sort((a,b)=>a.dist-b.dist||Math.abs(a.cz-cz)-Math.abs(b.cz-cz)||a.cx-b.cx||a.cz-b.cz);
    return out.slice(0,count);
  }
  function adapt(current,target,fps,isTouch,enabled=true){
    const max=limit(target);
    if(!enabled)return max;
    const min=10,low=isTouch?27:37,high=isTouch?52:56;
    if(fps<low)return Math.max(min,current-(fps<20?5:3));
    if(fps>high)return Math.min(max,current+2);
    return Math.max(min,Math.min(max,current));
  }
  window.MineWorldChunkPlanner={limit,choose,adapt};
})();