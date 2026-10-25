/* MineWorld 6.38 — original event-driven 3D voxel effects.
 * Wiki-informed: block dust, damage and critical star bursts, sword sweep,
 * item pickup flashes. Uses the selected local pack's GPU block atlas where
 * available; no Bedrock/Java textures, particle files or code are embedded.
 * Effects never enter world saves or multiplayer snapshots.
 */
(()=>{
'use strict';
const MAX=240, MAX_FLASH=48, alive=[],flashes=new Map();
let clock=0,lastChip=-Infinity,serial=0;
const rand=()=>Math.random(),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function add(p){
 if(alive.length>=MAX)alive.shift();
 alive.push({...p,age:0,seed:rand(),spin:(rand()-.5)*7});
}
function dust(x,y,z,block=3,count=18,dimension='overworld'){
 if(!Number.isInteger(block)||block<1||block>169)return 0;
 const n=clamp(Math.floor(Number(count)||0),0,32);
 for(let i=0;i<n;i++){
  const face=i%5===0?0:1;
  const u=rand()*.68,v=rand()*.68;
  add({kind:'dust',dimension,block,face,u,v,
   x:x+rand(),y:y+rand(),z:z+rand(),
   vx:(rand()-.5)*2.3,vy:.6+rand()*2.6,vz:(rand()-.5)*2.3,
   gravity:6.8,life:.43+rand()*.4,size:.055+rand()*.06});
 }
 return n;
}
function chip(x,y,z,block=3,dimension='overworld'){
 if(clock-lastChip<.105)return 0;
 lastChip=clock;
 return dust(x+.29,y+.24,z+.29,block,2,dimension);
}
function burst(kind,x,y,z,n,dimension,opts={}){
 const count=clamp(n,0,30),critical=kind==='crit';
 const palette=kind==='crit'?[[1,.94,.56],[1,.85,.24],[1,1,1]]:
  kind==='hurt'?[[1,.24,.26],[1,.50,.42],[.94,.92,.80]]:
  kind==='pickup'?[[.85,1,.61],[1,1,1],[.55,.96,.84]]:
  [[1,.95,.73],[.9,.93,1],[1,1,1]];
 for(let i=0;i<count;i++){
  const a=rand()*Math.PI*2,v=rand(),c=palette[i%palette.length];
  add({kind,dimension,x:x+(rand()-.5)*.45,y:y+(rand()-.5)*.4,z:z+(rand()-.5)*.45,
   vx:Math.cos(a)*(critical?1.9:1.25)*(.4+v),vy:.8+rand()*(critical?1.4:1.0),
   vz:Math.sin(a)*(critical?1.9:1.25)*(.4+v),
   gravity:kind==='pickup'?.9:critical?2.2:3.5,life:.23+rand()*.43,
   size:critical?.095:.055+rand()*.045,color:c});
 }
 return count;
}
function hit(id,x,y,z,{critical=false,dead=false,dimension='overworld'}={}){
 if(Number.isInteger(id)&&flashes.size<MAX_FLASH)flashes.set(id,clock+.26);
 burst('hurt',x,y,z,dead?13:7,dimension);
 if(critical)burst('crit',x,y+.22,z,11,dimension);
 if(dead)burst('poof',x,y+.25,z,12,dimension);
}
function sweep(x,y,z,yaw,dimension='overworld'){
 if(![x,y,z,yaw].every(Number.isFinite))return 0;
 for(let i=0;i<10;i++){
  const a=yaw-.95+i*.19;
  const r=1.06+Math.sin(i/9*Math.PI)*.12;
  add({kind:'sweep',dimension,x:x+Math.sin(a)*r,
   y:y+.9+Math.sin(i/9*Math.PI)*.28,z:z-Math.cos(a)*r,
   vx:Math.sin(a)*.18,vy:.24,vz:-Math.cos(a)*.18,
   gravity:0,life:.16+i*.008,size:.095,color:[.96,.98,1]});
 }
 return 10;
}
function pickup(x,y,z,dimension='overworld'){return burst('pickup',x,y+.35,z,7,dimension);}
function hurtPlayer(x,y,z,dimension='overworld'){return burst('hurt',x,y+1.2,z,7,dimension);}
function flash(id){
 if(!Number.isInteger(id))return 0;
 const remaining=(flashes.get(id)||0)-clock;
 return clamp(remaining/.26,0,1);
}
function tick(dt){
 const step=clamp(Number(dt)||0,0,.1);
 clock+=step;
 for(const [id,until]of flashes)if(until<=clock)flashes.delete(id);
 for(let i=alive.length-1;i>=0;i--){
  const p=alive[i];p.age+=step;
  if(p.age>=p.life){alive.splice(i,1);continue;}
  p.x+=p.vx*step;p.y+=p.vy*step;p.z+=p.vz*step;
  p.vy-=p.gravity*step;p.vx*=Math.max(.4,1-1.7*step);
  p.vz*=Math.max(.4,1-1.7*step);
 }
}
function geometry(eye,atlasUV,dimension='overworld'){
 const textured=[],plain=[];
 if(!eye||![eye.x,eye.y,eye.z].every(Number.isFinite))return {textured,plain};
 for(const p of alive){
  if(p.dimension!==dimension||Math.hypot(p.x-eye.x,p.z-eye.z)>32)continue;
  const dx=eye.x-p.x,dz=eye.z-p.z,dist=Math.hypot(dx,dz)||1;
  const rx=dz/dist,rz=-dx/dist;
  const shrink=clamp((p.life-p.age)/Math.min(p.life,.17),0,1);
  const radius=p.size*shrink;
  const angle=p.spin*p.age,cs=Math.cos(angle),sn=Math.sin(angle);
  const points=[[-1,-1],[-1,1],[1,1],[1,-1]].map(([x,y])=>{
    const ux=(x*cs-y*sn)*radius,uy=(x*sn+y*cs)*radius;
    return [p.x+ux*rx,p.y+uy,p.z+ux*rz];
  });
  const indices=[0,1,2,0,2,3];
  if(p.kind==='dust'&&typeof atlasUV==='function'){
    const tl=atlasUV(p.block,p.face,0),br=atlasUV(p.block,p.face,2);
    if(!tl||!br||!tl.every(Number.isFinite)||!br.every(Number.isFinite))continue;
    const us=[p.u,p.u,p.u+.25,p.u+.25],vs=[p.v,p.v+.25,p.v+.25,p.v];
    for(const j of indices){
      const pt=points[j],u=tl[0]+(br[0]-tl[0])*us[j],v=tl[1]+(br[1]-tl[1])*vs[j];
      textured.push(...pt,.95,.95,.95,u,v);
    }
  }else{
    const color=p.color||[1,1,1];
    for(const j of indices)plain.push(...points[j],...color);
    // Small crossed spark faces create a recognizable critical hit silhouette.
    if(p.kind==='crit'){
      const scale=.45;
      const pp=points.map(q=>[p.x+(q[0]-p.x)*scale,p.y+(q[1]-p.y)*1.6,p.z+(q[2]-p.z)*scale]);
      for(const j of indices)plain.push(...pp[j],...color);
    }
  }
 }
 return {textured,plain};
}
function stats(){return {particles:alive.length,flashes:flashes.size,clock,serial};}
function reset(){alive.length=0;flashes.clear();lastChip=-Infinity;serial++;}
window.MineWorldImpactEffects=Object.freeze({dust,chip,hit,sweep,pickup,hurtPlayer,flash,tick,geometry,stats,reset});
})();