/* Regressions for held mining, partial-block crack bounds, and blocked animal gait. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const src=read('index.html');
const window={};
vm.runInNewContext(read('classic-interactions.js'),{window});
const classic=window.MineWorldClassicInteractions;
test('breaking progress is mapped to partial-block bounds instead of floating beyond textures',()=>{
 const target={x:4,y:10,z:8};
 const full=classic.crackLines(target,.9);
 const shape={left:.3125,right:.6875,bottom:0,top:.625,front:.3125,back:.6875};
 const partial=classic.crackLines(target,.9,shape);
 assert.equal(partial.length,full.length);
 for(let i=0;i<full.length;i++){
  for(let j=0;j<3;j++)assert.ok(Number.isFinite(partial[i][j]));
  assert.ok(partial[i][0]>target.x+shape.left-.02&&partial[i][0]<target.x+shape.right+.02);
  assert.ok(partial[i][1]>target.y-.02&&partial[i][1]<target.y+shape.top+.02);
  assert.ok(partial[i][2]>target.z+shape.front-.02&&partial[i][2]<target.z+shape.back+.02);
 }
 assert.ok(partial.some((pt,i)=>pt[1]!==full[i][1]));
 assert.equal(classic.crackLines(target,0,shape).length,0);
});
test('highlight bounding box and mining fracture use real block geometry with imported textures',()=>{
 assert.ok(src.includes('const shape=window.MineWorldBlockModels.shape(target.b);'));
 assert.ok(src.includes('const x0=x+shape.left-e,x1=x+shape.right+e;'));
 assert.ok(src.includes('const y0=y+shape.bottom-e,y1=y+shape.top+e;'));
 assert.ok(src.includes('classic.crackLines(target,mineJob.elapsed/Math.max(.01,mineJob.total),shape)'));
});
test('mouse and mobile releases cancel mining instead of leaving a ghost breaking job',()=>{
 assert.ok(src.includes("window.addEventListener('mouseup',e=>{if(e.button===0){mouseMiningHeld=false;cancelMining();}});"));
 assert.ok(src.includes("b.addEventListener('pointerup',()=>{touchHold[verb]=false;if(verb==='mine')cancelMining();});"));
 assert.ok(src.includes("b.addEventListener('pointercancel',()=>{touchHold[verb]=false;if(verb==='mine')cancelMining();});"));
 assert.ok(src.includes("const completed=mineJob;\n      cancelMining();\n      breakBlockNow(completed);"));
 assert.ok(src.includes("if((touchHold.mine||mouseMiningHeld)&&!mineJob&&timers.mine<=0)"));
});
test('stalled animals do not fake a walk cycle and riders do not keep old movement frames',()=>{
 assert.ok(src.includes('const beforeX=m.x,beforeZ=m.z;'));
 assert.ok(src.includes('m.moving=Math.hypot(m.x-beforeX,m.z-beforeZ)>.001;'));
 assert.ok(src.includes('if(m.moving&&animals.FOOD[m.kind])m.gait='));
 assert.ok(!src.includes('m.moving=Math.hypot(nx-m.x,nz-m.z)>.001;'));
 assert.ok(src.includes('m.step=4;m.moving=false;continue;'));
 assert.ok(!src.includes('m.gait=(m.gait||0)+dt*(m.following?8.1:m.fleeTime>0?10:3.7);\n        if(m.baby)'));
});

test('animal clearance checks feet and head before walking into a low roof',()=>{
 const ctx={window:{}};vm.runInNewContext(read('animal-behavior.js'),ctx);
 const can=ctx.window.MineWorldAnimalBehavior.canOccupy;
 const wall=(x,y,z)=>x===3&&z===4&&y===11;
 assert.equal(can(3.5,10,4.5,.7,wall),true,'chicken fits under overhang');
 assert.equal(can(3.5,10,4.5,1.4,wall),false,'cow cannot clip into roof');
 assert.equal(can(3.5,10,4.5,2.375,wall),false,'camel needs head room');
 assert.equal(can(2.5,10,4.5,2.375,wall),true);
 assert.equal(can(NaN,10,4,1.4,wall),false);
 assert.ok(src.includes('collisionFree(nx,ground,nz,m.kind'));
 assert.ok(src.includes('collisionFree(x,y,z,kind)'));
 assert.ok(src.includes("b.addEventListener('lostpointercapture',()=>{touchHold[verb]=false;if(verb==='mine')cancelMining();});"));
});
