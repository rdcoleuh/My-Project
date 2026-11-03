/* MineWorld 6.10: third-person biped animation and mobile integration. */
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
function animation(){
 const window={};
 vm.runInNewContext(read('avatar-animation.js'),{window,Math,Number,Object});
 return window.MineWorldAvatarAnimation;
}
test('walking legs counter-rotate and arms oppose same-side legs',()=>{
 const a=animation(),p=a.pose({time:Math.PI/(2*9.2),moving:true,grounded:true});
 assert.ok(p.legL>.5);
 assert.equal(p.legR,-p.legL);
 assert.ok(p.armL<0&&p.armR>0);
 assert.ok(Math.abs(p.armL+p.armR)<1e-10);
});
test('sprinting increases stride, crouching reduces it, airborne limits it',()=>{
 const a=animation(),t=Math.PI/(2*9.2);
 const normal=a.pose({time:t,moving:true});
 const sprint=a.pose({time:Math.PI/(2*13.5),moving:true,sprinting:true});
 const crouch=a.pose({time:Math.PI/(2*6.2),moving:true,crouching:true});
 const airborne=a.pose({time:t,moving:true,grounded:false});
 assert.ok(Math.abs(sprint.legL)>Math.abs(normal.legL));
 assert.ok(Math.abs(crouch.legL)<Math.abs(normal.legL));
 assert.ok(Math.abs(airborne.legL)<Math.abs(normal.legL));
 assert.ok(normal.bob>=0);
});
test('idle limbs do not walk and mobile-friendly input does not affect saves',()=>{
 const a=animation(),idle=a.pose({time:1,moving:false});
 assert.equal(idle.legL,0);assert.equal(idle.legR,0);
 assert.ok(Math.abs(idle.armL)<.03);
 assert.equal(a.pose({time:NaN,moving:true}).legL,0);
 const html=read('index.html');
 assert.ok(html.includes("src=\"./avatar-animation.js\""));
 assert.ok(html.includes("Math.hypot(movement.x,movement.y)>.08"));
 assert.ok(html.includes("MineWorldAvatarAnimation.pose({"));
 assert.ok(html.includes("MineWorldAvatarAnimation.rotateLimb(name,py,pz,oy,oz,w,h,d,avatarPose)"));
 for(const key of ["worldLibrary.key(mode,'original')","mineworld-selfhost-v1"])
  assert.ok(html.includes(key),'Existing world save identity changed');
});
test('leg vertex rotates about hip while retaining box dimensions',()=>{
 const a=animation(),box={oy:.13,oz:-.125,w:.25,h:.75,d:.25};
 const atRest=a.rotateLimb('legL',box.oy,0,box.oy,box.oz,box.w,box.h,box.d,{legL:0});
 assert.equal(atRest.y,box.oy);
 const rotated=a.rotateLimb('legL',box.oy,0,box.oy,box.oz,box.w,box.h,box.d,{legL:Math.PI/4});
 assert.ok(rotated.y>box.oy);
 assert.ok(rotated.z<0);
 const head=a.rotateLimb('head',1,2,box.oy,box.oz,box.w,box.h,box.d,{legL:1});
 assert.equal(head.y,1);assert.equal(head.z,2);
});
test('offline cache includes avatar animation for mobile',()=>{
 const sw=read('sw.js');
 assert.ok(sw.includes("'./avatar-animation.js'"));
});

test('mining swing repeats while digging, ends on release, and is independent of combat',()=>{
 const a=animation();
 assert.equal(a.miningSwing(0,true),0);
 assert.ok(a.miningSwing(85,true)>.6);
 assert.ok(a.miningSwing(170,true)>.99);
 assert.ok(a.miningSwing(425,true)>.6,'repeated stroke during a long dig');
 assert.equal(a.miningSwing(340,false),0,'instant break stroke settles');
 assert.equal(a.miningSwing(1000,false),0);
 assert.equal(a.miningSwing(-1,true),0);
 assert.equal(a.miningSwing(Infinity,true),0);
 const html=read('index.html');
 assert.ok(html.includes('MineWorldAvatarAnimation.miningSwing('));
 assert.ok(html.includes('mineJob?mineJob.elapsed*1000:now-lastMineTapAt,!!mineJob'));
 assert.ok(html.includes('lastMineTapAt=performance.now();breakBlockNow(aim);return;'));
 assert.ok(html.includes('const swing=Math.max(attackSwing,toolSwing)'));
 assert.ok(html.includes('const hit=window.MineWorldCombat.strike({'));
});

test('malformed imported animation angles cannot displace avatar geometry',()=>{
 const a=animation(),args=['legL',.2,.3,.1,-.125,.25,.75,.25];
 for(const invalid of [Infinity,-Infinity,NaN,'Infinity',{},null]){
  const p=a.rotateLimb(...args,{legL:invalid});
  assert.equal(p.y,.2);assert.equal(p.z,.3);
 }
 const valid=a.rotateLimb(...args,{legL:0.5});
 assert.ok(Number.isFinite(valid.y)&&Number.isFinite(valid.z));
});

test('very large finite animation clocks never produce nonfinite avatar coordinates',()=>{
 const a=animation();
 for(const time of [1e100,Number.MAX_VALUE,-Number.MAX_VALUE]){
  for(const flags of [{moving:true},{moving:true,sprinting:true},{moving:false}]){
   const p=a.pose({time,...flags});
   for(const [key,value] of Object.entries(p))
    assert.ok(Number.isFinite(value),key+' became nonfinite at '+time);
  }
 }
});

test('missing or null animation state safely produces a resting pose',()=>{
 const a=animation();
 for(const input of [undefined,null,0,false,'invalid']){
  const p=a.pose(input);
  assert.equal(p.legL,0);
  assert.equal(p.legR,0);
  for(const value of Object.values(p))assert.ok(Number.isFinite(value));
 }
});
