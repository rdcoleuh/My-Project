/* MineWorld movement controls — independently authored, wiki-informed speeds.
 * Classic block-grid walking ~=4.32 blocks/s, sprint ~=5.61, sneak ~=1.295.
 * MineWorld's existing walking baseline remains 4.8 blocks/s for old saves. */
(()=>{
'use strict';
const WALK=4.8;
const SPRINT_RATIO=5.612/4.317;
const CROUCH_RATIO=1.295/4.317;
const SPRINT_EXHAUSTION_PER_METER=.1; // Minecraft Wiki: 0.1 exhaustion / meter while sprinting.
function resolve({forward=0,strafe=0,holdSprint=false,toggleSprint=false,holdCrouch=false,toggleCrouch=false,
                  wasCrouching=false,canStand=true,flying=false,mounted=false,hunger=20,survival=true}={}){
  const moving=Math.hypot(forward,strafe)>.08;
  const wantsCrouch=!flying&&!mounted&&(holdCrouch||toggleCrouch);
  const crouching=!flying&&!mounted&&(wantsCrouch||(wasCrouching&&!canStand));
  const sprinting=!mounted&&!crouching&&moving&&forward>.05&&(holdSprint||toggleSprint)&&(!survival||hunger>6);
  const speed=WALK*(crouching?CROUCH_RATIO:sprinting?SPRINT_RATIO:1)*(flying?1.35:1);
  return {crouching,sprinting,speed,eyeHeight:crouching?1.27:1.62,bodyHeight:crouching?1.5:1.8};
}
function sprintHunger(distance,sprinting,survival=true){
  return sprinting&&survival&&Number.isFinite(distance)?Math.max(0,distance)*SPRINT_EXHAUSTION_PER_METER:0;
}
window.MineWorldMovement=Object.freeze({resolve,sprintHunger,WALK,SPRINT_RATIO,CROUCH_RATIO});
})();
