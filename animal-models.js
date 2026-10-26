/* MineWorld 6.0 — independent low-poly animal model library.
 * Proportions informed by Minecraft Wiki animal hitboxes; all geometry,
 * face details, patches, and colors independently authored in this file.
 * Coordinates are world blocks. Heading is Z-forward (negative Z at 0). */
(()=>{
'use strict';
const MODEL={
 cow:{width:.9,height:1.4,length:1.18,body:[.38,.29,.23],face:[.41,.31,.24],leg:[.28,.21,.19]},
 pig:{width:.9,height:.9,length:.92,body:[.93,.61,.70],face:[.97,.68,.74],leg:[.84,.48,.57]},
 sheep:{width:.9,height:1.3,length:1.13,body:[.90,.89,.81],face:[.40,.37,.34],leg:[.38,.34,.32]},
 chicken:{width:.4,height:.7,length:.52,body:[.96,.94,.85],face:[.99,.95,.83],leg:[.92,.64,.16]},
 horse:{width:1.1,height:1.6,length:1.39,body:[.46,.31,.21],face:[.50,.35,.25],leg:[.34,.23,.18]},
 donkey:{width:1.1,height:1.51,length:1.20,body:[.53,.49,.43],face:[.60,.55,.48],leg:[.39,.36,.34]},
 mule:{width:1.1,height:1.55,length:1.32,body:[.45,.34,.28],face:[.55,.41,.34],leg:[.34,.26,.22]},
 camel:{width:1.7,height:2.375,length:1.8,body:[.84,.69,.46],face:[.88,.72,.49],leg:[.65,.51,.34]},
 llama:{width:.9,height:1.87,length:1.25,body:[.77,.69,.57],face:[.80,.74,.62],leg:[.52,.47,.39]},
 skeleton_horse:{width:1.1,height:1.6,length:1.39,body:[.78,.79,.73],face:[.94,.93,.83],leg:[.78,.79,.73]},
 zombie_horse:{width:1.1,height:1.6,length:1.39,body:[.33,.44,.36],face:[.39,.54,.41],leg:[.29,.35,.32]}
};
const cool=c=>c.map(v=>Math.max(0,Math.min(1,v)));
function draw(m,write,time=0){
 const spec=MODEL[m.kind];if(!spec||typeof write!=='function')return false;
 const x=m.x,y=m.y,z=m.z,scale=m.baby?.55:1;
 const cy=Math.cos((m.heading||0)+Math.PI/2),sy=Math.sin((m.heading||0)+Math.PI/2);
 const body=spec.body,face=spec.face,leg=spec.leg;
 const pattern=(a,v)=>cool(a.map(n=>n*v));
 let boxes=0;
 function box(ox,oy,oz,w,h,d,color,part='body',hinge=null){
  // Render with a shared yaw transform. A cuboid remains solid six-sided.
  const rot=(px,pz)=>[x+(px*cy-pz*sy)*scale,z+(px*sy+pz*cy)*scale];
  const pts=[[ox,oy,oz],[ox+w,oy,oz],[ox+w,oy,oz+d],[ox,oy,oz+d],
             [ox,oy+h,oz],[ox+w,oy+h,oz],[ox+w,oy+h,oz+d],[ox,oy+h,oz+d]];
  const p=pts.map(v=>{
   let localY=v[1],localZ=v[2];
   if(hinge){
    // Rotate individual rigid parts around their shoulder/hip in model
    // space before turning the whole creature toward its world heading.
    const angle=Math.max(-.7,Math.min(.7,Number(hinge.angle)||0));
    const dy=localY-hinge.y,dz=localZ-hinge.z;
    localY=hinge.y+dy*Math.cos(angle)-dz*Math.sin(angle);
    localZ=hinge.z+dy*Math.sin(angle)+dz*Math.cos(angle);
   }
   const out=rot(v[0],localZ);return [out[0],y+localY*scale,out[1]];
  });
  // Vertex face directions are chosen to match the game's FACE shader shades.
  const faces=[[1,0,3,2],[4,5,6,7],[0,1,5,4],[3,2,6,7],[0,3,7,4],[2,1,5,6]];
  const shades=[.63,1,.78,.79,.85,.70];
  const faceNames=['bottom','top','front','back','left','right'];
  for(let f=0;f<faces.length;f++)for(const k of [0,1,2,0,2,3]){
   const point=p[faces[f][k]],shade=shades[f];
   write(point[0],point[1],point[2],color[0]*shade,color[1]*shade,color[2]*shade,part,faceNames[f],k);
  }
  boxes++;
 }
 const gait=m.moving===false?0:Math.sin((m.gait||time*6)+(m.id||0))*.28;
 function legs(w,d,h,color){
  for(const sx of [-1,1])for(const sz of [-1,1]){
   // Four diagonal legs swing around fixed hip joints. Hooves share the
   // leg's hinge instead of hopping vertically and disconnecting from it.
   const angle=sx===sz?gait:-gait,r=w*.17;
   const hinge={y:.03+h,z:sz*d*.32,angle};
   const legZ=sz*d*.32-r/2;
   box(sx*w*.30-r/2,.03,legZ,r,Math.max(.16,h),r,color,'leg',hinge);
   box(sx*w*.30-r/2,.025,legZ,r,.07,r,pattern(color,.78),'leg',hinge);
  }
 }
 if(m.kind==='chicken'){
  box(-.19,.28,-.22,.38,.38,.47,body);
  box(-.14,.49,-.32,.28,.25,.27,face,'head');
  // Wings bob subtly and the feet swing in opposite phases when walking.
  // Shared hinges keep each foot attached to its shin; idle poses stay still.
  for(const sx of [-1,1])box(sx*.15-.085,.29,-.1,.09,.17,.24,
    pattern(body,.93),'wing',{y:.45,z:-.10,angle:sx*gait*.65});
  box(-.09,.50,-.41,.18,.09,.12,[.94,.63,.13],'beak');
  box(-.045,.44,-.41,.09,.14,.09,[.72,.14,.13],'wattle');
  for(const sx of [-1,1]){
   const hinge={y:.295,z:-.02,angle:sx*gait};
   box(sx*.105-.016,.025,-.02,.032,.27,.035,[.84,.63,.21],'leg',hinge);
   box(sx*.105-.04,.015,-.15,.085,.04,.17,[.84,.63,.21],'leg',hinge);
   box(sx*.085-.022,.675,-.29,.045,.08,.06,[.79,.19,.18],'comb');
  }
  for(const sx of [-1,1])box(sx*.08-.027,.60,-.355,.055,.052,.035,[.14,.17,.17],'eye');
  box(-.10,.43,.27,.20,.18,.1,pattern(body,.85),'tail');
 }else if(m.kind==='pig'){
  legs(.78,.78,.30,leg);
  box(-.43,.29,-.44,.86,.56,.89,body);
  box(-.34,.43,-.63,.68,.44,.39,face,'head');
  box(-.24,.45,-.72,.48,.27,.14,[.87,.48,.56],'snout');
  for(const sx of [-1,1]){
   box(sx*.23-.045,.74,-.47,.09,.14,.1,body,'ear');
   box(sx*.18-.02,.68,-.656,.05,.055,.035,[.23,.18,.20],'eye');
   box(sx*.115-.025,.555,-.733,.05,.048,.014,[.62,.31,.39],'nostril');
  }
  box(.32,.56,.4,.11,.11,.18,[.94,.64,.71],'tail');
 }else if(m.kind==='cow'||m.kind==='sheep'){
  const sheep=m.kind==='sheep';
  legs(.77,.94,.64,leg);
  box(-.44,.60,-.51,.88,.64,1.02,sheep&&m.sheared?[.56,.51,.46]:sheep?body:pattern(body,.87));
  if(sheep){
   // Chunked overlapping tufts, not a flat generic sheep box.
   if(!m.sheared)for(const sx of [-1,0,1])for(const sz of [-1,0,1]){
    box(sx*.27-.15,1.15,sz*.29-.16,.29,.12,.29,pattern(body,1.02+(sx+sz)*.01),'wool');
   }
   box(-.31,.83,-.72,.62,.40,.36,face,'head');
   box(-.30,.92,-.83,.60,.40,.25,body,'wool');
   box(-.20,.87,-.87,.40,.16,.1,face,'muzzle');
  }else{
   box(-.33,.77,-.74,.66,.51,.42,face,'head');
   box(-.22,.80,-.87,.44,.23,.15,[.72,.54,.50],'muzzle');
   for(const sx of [-1,1]){
    box(sx*.30-.06,1.23,-.69,.13,.15,.13,[.78,.69,.56],'horn');
    box(sx*.21-.015,.94,-.873,.06,.07,.022,[.16,.16,.17],'eye');
   }
   box(-.19,.44,-.18,.38,.22,.34,[.74,.52,.49],'udder');
   for(const sx of [-1,1])box(sx*.29-.13,.94,-.49,.23,.23,.026,[.83,.79,.71],'ear');
   box(-.23,1.13,-.31,.27,.13,.27,[.87,.83,.73],'patch'); // white irregular coat patch
   box(.08,.77,.24,.28,.36,.28,[.79,.76,.70],'patch');
  }
  for(const sx of [-1,1])box(sx*.18-.022,1.02,-.735,.045,.07,.027,[.11,.11,.13],'eye');
  if(sheep)box(-.14,.72,.5,.28,.19,.08,body,'tail');
 }else{
  const camel=m.kind==='camel',llama=m.kind==='llama',
    undead=m.kind==='skeleton_horse'||m.kind==='zombie_horse',
    tall=camel||llama,donkey=m.kind==='donkey'||m.kind==='mule';
  const length=camel?1.75:llama?1.03:1.25,wide=camel?1.24:llama?.73:.92;
  const floor=tall?1.10:.84;
  legs(wide,length,floor,leg);
  box(-wide*.5,floor,-length*.50,wide,tall?.62:.52,length,body);
  if(camel){
   box(-.33,1.67,-.28,.65,.22,.70,pattern(body,.86)); // camel hump
   box(-.20,1.45,-.81,.40,.70,.42,face);
   box(-.20,2.05,-.92,.42,.28,.51,face);
   box(-.25,2.01,-1.11,.50,.20,.26,pattern(face,.94));
  }else if(llama){
   box(-.19,1.39,-.69,.38,.53,.33,face);
   box(-.20,1.68,-.83,.42,.31,.36,face);
   box(-.16,1.72,-.95,.32,.17,.23,pattern(face,.95));
  }else{
   box(-.19,1.20,-.69,.38,.36,.32,face);
   box(-.24,1.35,-.80,.48,.28,.35,face);
   box(-.21,1.23,-.98,.42,.19,.30,pattern(face,.87));
   box(-.12,1.42,-.54,.23,.21,.30,undead?face:[.25,.20,.19]);
  }
  const eyeY=camel?2.19:llama?1.82:1.49;
  const eyeZ=camel?-1.105:llama?-.961:-.998;
  for(const sx of [-1,1])box(sx*.16-.022,eyeY,eyeZ,.052,.075,.025,[.09,.09,.12]);
  const earsY=camel?2.27:llama?1.92:1.55;
  for(const sx of [-1,1]){
   box(sx*.17-.06,earsY,camel?-.92:-.76,.12,donkey||llama?.29:.16,.13,face);
  }
  const tailX=-.07,tailZ=length*.5;
  box(tailX,1.04,tailZ,.14,.26,.12,undead?leg:pattern(body,.70));
 }
 return boxes;
}
window.MineWorldAnimalModels=Object.freeze({MODELS:MODEL,draw});
})();