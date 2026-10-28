/* Regression: mobs must not detect or attack through thin solid walls. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const ctx={window:{}};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'mob-ai-rules.js'),'utf8'),ctx);
const ray=ctx.window.MineWorldMobAIRules.rayClear;
const a=(x,y=1.5,z=1.5)=>({x,y,z});
test('thin adjacent wall blocks mob line of sight in both directions',()=>{
 const wall=(x,y,z)=>!(x===2&&y===1&&z===1);
 assert.equal(ray(a(1.5),a(3.5),wall),false);
 assert.equal(ray(a(3.5),a(1.5),wall),false);
 assert.equal(ray(a(1.5),a(3.5),()=>true),true);
});
test('diagonal corner contact cannot peek through a solid voxel',()=>{
 const solidCorner=(x,y,z)=>!(x===1&&y===0&&z===0);
 assert.equal(ray(a(.5,.5,.5),a(2.5,2.5,.5),solidCorner),false);
 assert.equal(ray(a(2.5,2.5,.5),a(.5,.5,.5),solidCorner),false);
});
test('ray traversal ignores occupied endpoint, rejects invalid and distant targets',()=>{
 assert.equal(ray(a(.5),a(1.5),()=>false),true,'endpoint is the target');
 assert.equal(ray(a(0),a(30),()=>true),false,'25-block sight limit');
 assert.equal(ray(a(0),a(1),null),false);
 assert.equal(ray(a(NaN),a(1),()=>true),false);
 assert.equal(ray(a(0),a(0),()=>true),false);
});
test('voxel traversal is bounded for long diagonal rays',()=>{
 let probes=0;
 assert.equal(ray(a(.5,.5,.5),a(14.5,14.5,14.5),()=>{
   probes++;return true;
 }),true);
 assert.ok(probes<=105,'avoid excessive block queries per mob');
});
test('host mob vision uses voxel traversal for detection and attacks',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.ok(html.includes('return mobAI.rayClear('));
 assert.ok(html.includes('if(chase&&m.attack<=0&&mobHasLineOfSight(m,target))'));
 assert.ok(html.includes('&&mobHasLineOfSight(m,target)'));
 assert.ok(fs.readFileSync(path.join(root,'scripts/browser-smoke.cjs'),'utf8')
   .includes('mobs must not see through thin walls or diagonal corners'));
});

test('rays exactly on a voxel face check solid cells on both sides',()=>{
 const faceStart=a(1,1.5,.5),faceEnd=a(1,1.5,3.5);
 const neighborWall=(x,y,z)=>!(x===0&&y===1&&z===2);
 assert.equal(ray(faceStart,faceEnd,neighborWall),false,
   'stationary x=1 face must not see through x=0 wall');
 assert.equal(ray(faceEnd,faceStart,neighborWall),false,'reverse ray is equally blocked');
 assert.equal(ray(a(1.001,1.5,.5),a(1.001,1.5,3.5),neighborWall),true,
   'ray just inside the open voxel should remain visible');
 assert.equal(ray(faceStart,faceEnd,()=>true),true);
});
test('rays on the intersection of two voxel faces check all touching columns',()=>{
 const edgeWall=(x,y,z)=>!(x===0&&y===0&&z===2);
 assert.equal(ray(a(1,1,.5),a(1,1,3.5),edgeWall),false);
 assert.equal(ray(a(1,1,3.5),a(1,1,.5),edgeWall),false);
 let probes=0;
 assert.equal(ray(a(1,1,.5),a(1,1,3.5),()=>{probes++;return true;}),true);
 assert.ok(probes<=12,'boundary handling stays constant-work per crossed cell');
});
