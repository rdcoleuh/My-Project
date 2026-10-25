/* MineWorld 6.8 — independently implemented Java-style melee timing.
 * No borrowed game source, textures, animations or audio.
 */
(()=>{
'use strict';
const TIER={none:0,wood:1,stone:2,iron:3,diamond:4,netherite:5};
const DAMAGE={
 sword:[1,4,5,6,7,8],
 axe:[1,7,9,9,9,10],
 pickaxe:[1,2,3,4,5,6],
 shovel:[1,2.5,3.5,4.5,5.5,6.5],
 hoe:[1,1,1,1,1,1]
};
const SPEED={
 sword:[4,1.6,1.6,1.6,1.6,1.6],
 axe:[4,.8,.8,.9,1,1],
 pickaxe:[4,1.2,1.2,1.2,1.2,1.2],
 shovel:[4,1,1,1,1,1],
 hoe:[4,1,2,3,4,4]
};
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
function stats(weapon,tier){
 const level=TIER[tier]||0,kind=Object.hasOwn(DAMAGE,weapon)?weapon:'fist';
 return {weapon:level?kind:'fist',damage:kind==='fist'?1:DAMAGE[kind][level],speed:kind==='fist'?4:SPEED[kind][level]};
}
function charge(elapsedMs,speed){
 const elapsed=elapsedMs===Infinity?1e9:Number.isFinite(elapsedMs)?Math.max(0,elapsedMs):0;
 return clamp((elapsed/1000+0.025)*clamp(Number(speed)||4,.2,20),0,1);
}
function strike({weapon='fist',tier='none',elapsedMs=Infinity,falling=false,grounded=true,sprinting=false,creative=false}={}){
 const s=stats(weapon,tier),power=creative?1:charge(elapsedMs,s.speed);
 const critical=!creative&&power>=.9&&falling&&!grounded&&!sprinting;
 const damage=creative?20:s.damage*(.2+.8*power*power)*(critical?1.5:1);
 const sweep=!creative&&s.weapon==='sword'&&grounded&&!sprinting&&power>=.9;
 return Object.freeze({
  weapon:s.weapon,base:s.damage,attackSpeed:s.speed,charge:power,
  damage:Math.round(damage*100)/100,critical,sweep,
  knockback:power>.9?(sprinting?2.2:1.1):.45,
  recoveryMs:1000/s.speed
 });
}
function knockback(yaw,power=1){
 const a=Number.isFinite(yaw)?yaw:0,k=clamp(Number(power)||0,0,3);
 return {x:Math.sin(a)*k,z:-Math.cos(a)*k};
}
// Java Edition melee reaches approximately three blocks from the player's
// eyes. Entity centers/feet are imperfect stand-ins for hitboxes, so allow a
// small horizontal margin and a one-block vertical overlap. Invalid remote
// positions never pass the check. This helper is shared by solo and PvP.
const REACH=3;
function inReach(attacker,target,margin=.35){
 const valid=p=>p&&[p.x,p.y,p.z].every(Number.isFinite);
 if(!valid(attacker)||!valid(target))return false;
 const allowance=clamp(Number.isFinite(margin)?margin:0,0,.75);
 const dx=attacker.x-target.x,dz=attacker.z-target.z;
 const dy=Math.max(0,Math.abs(attacker.y-target.y)-1.1);
 return Math.hypot(dx,dy,dz)<=REACH+allowance;
}
// Java-like sword sweeps affect nearby creatures at almost the same height
// as the primary hit, not mobs a full block above/below or far behind walls.
function sweepInRange(other,primary,attacker){
 const valid=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.z);
 if(!valid(other)||!valid(primary)||!valid(attacker))return false;
 return Math.hypot(other.x-primary.x,other.z-primary.z)<=1.05&&
   Math.abs(other.y-primary.y)<=.35&&
   Math.hypot(other.x-attacker.x,other.z-attacker.z)<=4.75;
}
// Smooth one-shot attack animation, independent of damage/cooldown calculations.
function swing(elapsedMs){
 if(!Number.isFinite(elapsedMs)||elapsedMs<0||elapsedMs>=420)return 0;
 const phase=elapsedMs/420;
 return Math.sin(Math.PI*phase);
}
window.MineWorldCombat=Object.freeze({stats,charge,strike,knockback,sweepInRange,swing,inReach,REACH});
})();