/* Java-style collision dimensions and ray/volume regressions.
 * All data is independent and source dimensions are publicly documented.
 */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=n=>fs.readFileSync(path.join(root,n),'utf8');
const sandbox={window:{}};vm.runInNewContext(read('entity-hitboxes.js'),sandbox);
const h=sandbox.window.MineWorldEntityHitboxes;
const size=(type,baby=false,pose='')=>h.dimensions(type,baby,pose);
test('player stance and a representative Java entity catalog use exact width and height',()=>{
 assert.deepEqual({...size('player')},{width:.6,height:1.8});
 assert.deepEqual({...size('player',false,'crouching')},{width:.6,height:1.5});
 assert.deepEqual({...size('player',false,'swimming')},{width:.6,height:.6});
 assert.deepEqual({...size('player',false,'sleeping')},{width:.2,height:.2});
 for(const [kind,w,t] of [['cow',.9,1.4],['chicken',.4,.7],['pig',.9,.9],
  ['horse',1.3965,1.6],['camel',1.7,2.375],['rabbit',.4,.5],
  ['creeper',.6,1.7],['zombie',.6,1.95],['spider',1.4,.9],
  ['enderman',.6,2.9],['warden',.9,2.9],['iron_golem',1.4,2.7]]){
  assert.deepEqual({...size(kind)},{width:w,height:t},kind);
 }
 assert.deepEqual({...size('cow',true)},{width:.45,height:.7});
 assert.deepEqual({...size('shulker',false,'open')},{width:1,height:2});
 assert.deepEqual({...size('pufferfish',false,'half')},{width:.49,height:.49});
 assert.ok(Object.keys(h.DATA).length>=75);
});
test('ray hits only actual mob box volume, including animals shorter than eye level',()=>{
 const chicken=h.box({kind:'chicken',x:3,y:0,z:0});
 assert.equal(h.rayDistance([0,1.62,0],[1,0,0],chicken,4),null,'high crosshair misses chicken');
 assert.ok(Math.abs(h.rayDistance([0,.5,0],[1,0,0],chicken,4)-2.8)<1e-8);
 const cow=h.box({kind:'cow',x:3,y:0,z:0});
 assert.ok(Math.abs(h.rayDistance([0,1,0],[1,0,0],cow,4)-2.55)<1e-8);
 assert.equal(h.rayDistance([0,1,0],[1,0,0],cow,2),null,'outside melee reach');
 assert.equal(h.rayDistance([0,1,2],[1,0,0],cow,4),null,'parallel miss');
 assert.equal(h.rayDistance([0,1,0],[0,0,0],cow,4),null);
 assert.equal(h.rayDistance([0,1,0],[NaN,0,1],cow,4),null);
});
test('width-aware occupancy checks both sides and head against partial-block shapes',()=>{
 const cubes=new Map([['5,1,5',3],['6,1,5',3]]);
 const block=(x,y,z)=>cubes.get(x+','+y+','+z)||0;
 const shape=id=>id===12?{left:0,right:1,bottom:0,top:.5,front:0,back:1}:
  {left:0,right:1,bottom:0,top:1,front:0,back:1};
 const fits=(e)=>h.canOccupy(e,block,shape,id=>id!==0,{width:10,height:6,depth:10});
 assert.equal(fits({kind:'cow',x:4.6,y:1,z:5.5}),false,'wide cow clips wall beside its center');
 assert.equal(fits({kind:'chicken',x:4.6,y:1,z:5.5}),true,'chicken narrower than cow');
 assert.equal(fits({kind:'camel',x:6.5,y:0,z:5.5}),false,'tall camel hits ceiling');
 assert.equal(fits({kind:'player',x:9.9,y:1,z:5}),false,'world edges reject unsafe movement');
 assert.equal(fits({kind:'player',x:2.5,y:1,z:5}),true);
 assert.equal(h.canOccupy({kind:'cow',x:4.6,y:1,z:5.5},
   (x,y,z)=>x===5&&y===0&&z===5?12:0,shape,id=>id!==0),true,'half slab below feet');
});
test('world integration uses shared boxes for movement, placement and three-block combat',()=>{
 const html=read('index.html'),sw=read('sw.js');
 assert.ok(html.includes('src="./entity-hitboxes.js"'));
 assert.ok(sw.includes("'./entity-hitboxes.js'"));
 assert.ok(html.includes('entityHitboxes.canOccupy({x,y,z,kind,baby,hitboxState:heightState}'));
 assert.ok(html.includes('function blockAtFeet(x,y,z,height=isCrouching?1.5:1.8)'));
 assert.ok(html.includes('entityHitboxes.intersects(body,'));
 assert.ok(html.includes('entityHitboxes.rayDistance(eye,forward,entityHitboxes.box(m),window.MineWorldCombat.REACH+.35)'));
 assert.ok(html.includes('entityHitboxes.box({...p,pose:p.crouching?'));
 assert.ok(html.includes('collisionFree(nx,ground,nz,m.kind'));
 assert.ok(html.includes('collisionFree(x,y,z,kind)'));
 assert.ok(html.includes('version:13'), 'existing worlds must keep their save schema');
});

test('Java F3+B hitbox debug shares targeting bounds and includes mobile toggle',()=>{
 const box=h.box({kind:'cow',x:4,y:2,z:5});
 const lines=h.wireframe(box);
 assert.equal(lines.length,24,'twelve debug edges');
 assert.ok(lines.every(p=>p.length===3&&p.every(Number.isFinite)));
 assert.ok(Math.abs(h.distanceToBox([0,3,5],box)-3.55)<1e-8);
 assert.equal(h.distanceToBox([4,3,5],box),0);
 assert.equal(h.distanceToBox([NaN,0,0],box),Infinity);
 const html=read('index.html');
 assert.ok(html.includes('function drawEntityHitboxes()'));
 assert.ok(html.includes('drawEntityHitboxes();'));
 assert.ok(html.includes("if(keys.has('F3')){showHitboxes=!showHitboxes"));
 assert.ok(html.includes("btn.id='mw-hitbox-toggle'"));
 assert.ok(html.includes('entityHitboxes.rayDistance(eye,dir,'));
 assert.ok(html.includes("entityHitboxes.box({x:vx,y:v.y,z:vz,kind:'villager'})"));
 assert.ok(html.includes('entityHitboxes.distanceToBox([player.x,player.y+'));
});
