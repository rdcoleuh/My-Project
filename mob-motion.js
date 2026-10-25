/* MineWorld 6.45 — independently authored low-poly creature locomotion.
   Visual only: never changes world simulation, network authority, or saves. */
(()=>{
 'use strict';
 const finite=(x,def=0)=>Number.isFinite(x)?x:def;
 function pose(m={},time=0){
  const kind=String(m.kind||'');
  const moving=!!m.moving;
  const t=finite(time),id=finite(m.id);
  const stride=moving?Math.sin(t*8.6+id*.61)*.48:0;
  // Skeletons swing their arms while walking; zombies hold them out
  // and exaggerate alternating strikes. Both use the same joint system.
  const zombie=/zombie|husk|drowned|piglin|wither_skeleton/.test(kind);
  const armRest=zombie?-.66:0;
  const limp=kind==='spider'||kind==='cave_spider'? .22:.55;
  return Object.freeze({
   legL:stride*limp,legR:-stride*limp,
   armL:armRest-stride*.60,armR:armRest+stride*.60,
   spiderStride:moving?Math.sin(t*9.2+id*.41)*.22:0
  });
 }
 function rotateYZ(y,z,pivotY,pivotZ,angle){
  if(![y,z,pivotY,pivotZ,angle].every(Number.isFinite))return {y,z};
  const a=Math.max(-.85,Math.min(.85,angle));
  const dy=y-pivotY,dz=z-pivotZ;
  return {y:pivotY+dy*Math.cos(a)-dz*Math.sin(a),
          z:pivotZ+dy*Math.sin(a)+dz*Math.cos(a)};
 }
 window.MineWorldMobMotion=Object.freeze({pose,rotateYZ});
})();
