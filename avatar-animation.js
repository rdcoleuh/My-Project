/* MineWorld 6.10 — original third-person avatar locomotion animation.
 * Local-only visual transforms. Does not modify physics, saves or combat.
 */
(()=>{
'use strict';
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
function pose({time=0,moving=false,sprinting=false,crouching=false,grounded=true}={}){
 const t=Number.isFinite(time)?time:0;
 const speed=sprinting?13.5:crouching?6.2:9.2;
 const amplitude=!grounded?.18:moving?(sprinting?.78:crouching?.28:.53):0;
 const phase=t*speed;
 const stride=Math.sin(phase)*amplitude;
 // In Java-like biped movement the opposite arm and leg swing together.
 // A small idle arm movement prevents rigid statue poses.
 const idle=moving?0:Math.sin(t*1.8)*.025;
 return Object.freeze({
  legL:stride,legR:-stride,
  armL:-stride*.78+idle,armR:stride*.78-idle,
  bob:moving&&grounded?Math.abs(Math.cos(phase))*(sprinting?.035:.018):0
 });
}
function rotateLimb(name,py,pz,oy,oz,w,h,d,angles){
 if(!angles||!['legL','legR','armL','armR'].includes(name))return {y:py,z:pz};
 const angle=clamp(Number(angles[name])||0,-1.3,1.3);
 const pivotY=oy+h,pivotZ=oz+d*.5;
 const dy=py-pivotY,dz=pz-pivotZ;
 return {y:pivotY+dy*Math.cos(angle)-dz*Math.sin(angle),
         z:pivotZ+dy*Math.sin(angle)+dz*Math.cos(angle)};
}
window.MineWorldAvatarAnimation=Object.freeze({pose,rotateLimb});
})();
