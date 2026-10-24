/* MineWorld 5.5: perspective math for original third-person avatar.
 * Independent 3D camera geometry, no borrowed skins, animations or assets. */
(()=>{
'use strict';
const modes=['First person','Third person (rear)','Third person (front)'];
const norm=v=>{const l=Math.hypot(...v)||1;return v.map(n=>n/l);};
function compute({x,y,z,yaw=0,pitch=0,crouching=false,mode=0,isBlocked=()=>false}={}){
 const cp=Math.cos(pitch),sp=Math.sin(pitch),cy=Math.cos(yaw),sy=Math.sin(yaw);
 const aimForward=[sy*cp,sp,-cy*cp],aimEye=[x,y+(crouching?1.27:1.62),z];
 if(mode!==1&&mode!==2){
  return {eye:aimEye,aimEye,forward:aimForward,
   look:aimForward,right:[cy,0,sy],up:[-sy*sp,cp,cy*sp],mode:0};
 }
 const dir=mode===1?-1:1,base=mode===1?3.65:3.15;
 const offset=[dir*aimForward[0]*base,dir*aimForward[1]*base+.45,dir*aimForward[2]*base];
 const dist=Math.hypot(...offset),unit=norm(offset);
 let reach=dist;
 for(let t=.35;t<=dist+.001;t+=.18){
   const pt=[aimEye[0]+unit[0]*t,aimEye[1]+unit[1]*t,aimEye[2]+unit[2]*t];
   if(isBlocked(...pt)){reach=Math.max(0,t-.25);break;}
 }
 if(reach<.65)return {eye:aimEye,aimEye,forward:aimForward,
   look:aimForward,right:[cy,0,sy],up:[-sy*sp,cp,cy*sp],mode:0};
 const eye=aimEye.map((v,i)=>v+unit[i]*reach);
 const look=norm(aimEye.map((v,i)=>v-eye[i]));
 const h=Math.hypot(look[0],look[2])||1;
 const right=[-look[2]/h,0,look[0]/h];
 const up=norm([-right[2]*look[1],right[2]*look[0]-right[0]*look[2],right[0]*look[1]]);
 return {eye,aimEye,forward:aimForward,look,right,up,mode};
}
function next(mode){return ((Math.floor(Number(mode)||0)+1)%3+3)%3;}
window.MineWorldPerspective=Object.freeze({compute,next,modes});
})();