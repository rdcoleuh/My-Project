/* MineWorld 6.39 — device-density framebuffer. CSS and block atlas sampling stay NEAREST. */
(()=>{
 'use strict';
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 function framebuffer(cssW,cssH,dpr,adaptive,touch=false,highRes=true){
   const w=clamp(Math.round(Number(cssW)||1),1,8192),h=clamp(Math.round(Number(cssH)||1),1,8192);
   const native=clamp(Number(dpr)||1,1,3),desired=highRes?clamp(Number(adaptive)||2,1,3):1;
   const capW=touch?2600:3200,capH=2600,pixels=touch?2700000:6200000;
   const scale=clamp(Math.min(native,desired,capW/w,capH/h,Math.sqrt(pixels/(w*h))),.1,3);
   return Object.freeze({width:Math.max(1,Math.round(w*scale)),height:Math.max(1,Math.round(h*scale)),scale});
 }
 window.MineWorldRenderClarity=Object.freeze({framebuffer});
})();