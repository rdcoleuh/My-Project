const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const load=f=>{const window={};vm.runInNewContext(read(f),{window,Math,Object});return window;};
test('mob gait is idle at rest and alternates paired limbs during movement',()=>{
 const p=load('mob-motion.js').MineWorldMobMotion;
 const still=p.pose({kind:'zombie',id:2,moving:false},.2);
 const walk=p.pose({kind:'zombie',id:2,moving:true},.2);
 assert.equal(still.legL,0);assert.equal(still.legR,0);
 assert.notEqual(walk.legL,0);assert.equal(walk.legL,-walk.legR);
 assert.equal(still.armL,still.armR);
 assert.notEqual(walk.armL,walk.armR);
 const bent=p.rotateYZ(.2,.1,.8,.1,.5);
 assert.ok(Number.isFinite(bent.y));assert.notEqual(bent.z,.1);
});
test('quadrupeds keep their vertex count while animating legs at the hip',()=>{
 const lib=load('animal-models.js').MineWorldAnimalModels;
 const sample=(moving,gait)=>{
  const verts=[];
  lib.draw({id:5,kind:'cow',x:5,y:2,z:7,heading:0,moving,gait},
   (x,y,z,_r,_g,_b,part)=>{if(part==='leg')verts.push([x,y,z]);},.2);
  return verts;
 };
 const rest=sample(false,1.2),walk=sample(true,1.2);
 assert.ok(rest.length>100);assert.equal(rest.length,walk.length);
 assert.notDeepEqual(rest,walk,'moving leg boxes should rotate rather than bounce');
});
test('hostile animation preserves original mob skin UV assignments and save format',()=>{
 const html=read('index.html'),sw=read('sw.js');
 assert.match(html,/src="\.\/mob-motion\.js"/);
 assert.match(html,/MineWorldMobMotion\?\.pose\(m,dayClock\)/);
 assert.match(html,/MineWorldMobMotion\?\.rotateYZ/);
 assert.match(html,/Eight independently articulated legs/);
 assert.match(sw,/\.\/mob-motion\.js/);
 assert.doesNotMatch(read('mob-motion.js'),/localStorage|fetch\(|\.png|\.jar/);
});

test('cave spiders use articulated eight-leg rendering instead of humanoid limbs',()=>{
 const html=read('index.html');
 assert.match(html,/const spider=m\\.kind==='spider'\\|\\|m\\.kind==='cave_spider',creeper=m\\.kind==='creeper'/);
 const motion=load('mob-motion.js').MineWorldMobMotion;
 const moving=motion.pose({kind:'cave_spider',id:3,moving:true},.5);
 assert.notEqual(moving.spiderStride,0);
 assert.equal(motion.pose({kind:'cave_spider',id:3,moving:false},.5).spiderStride,0);
});
test('wither skeletons keep skeleton arm posture rather than zombie arms',()=>{
 const pose=load('mob-motion.js').MineWorldMobMotion.pose;
 const skeleton=pose({kind:'wither_skeleton',moving:false},0);
 const zombie=pose({kind:'zombie',moving:false},0);
 assert.equal(skeleton.armL,0);
 assert.equal(skeleton.armR,0);
 assert.ok(zombie.armL<0&&zombie.armR<0);
});
