/* MineWorld 5.5 camera geometry tests. */
const {test}=require('node:test'),assert=require('node:assert/strict'),
 vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const scope={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'perspective.js'),'utf8'),scope);
const M=scope.window.MineWorldPerspective;
function near(a,b,tol=.01){assert.ok(Math.abs(a-b)<tol,'expected '+a+' ≈ '+b);}
test('three original perspectives follow correct relative character position',()=>{
 const player={x:5000,y:19,z:5000,yaw:0,pitch:0,crouching:false};
 const one=M.compute({...player,mode:0});
 const rear=M.compute({...player,mode:1});
 const front=M.compute({...player,mode:2});
 near(one.eye[0],5000);near(one.eye[2],5000);
 assert.ok(rear.eye[2]>5003,'rear camera trails north-facing traveler');
 assert.ok(front.eye[2]<4997,'front camera looks at face of traveler');
 assert.ok(rear.look[2]<0&&front.look[2]>0,'cameras face the right way');
 for(const cam of [one,rear,front]){
  near(cam.aimEye[2],5000);
  near(cam.forward[2],-1);
  near(Math.hypot(...cam.look),1);
  near(Math.hypot(...cam.right),1);
  near(Math.hypot(...cam.up),1);
  near(cam.look.reduce((n,v,i)=>n+v*cam.right[i],0),0);
 }
 assert.equal(M.next(0),1);assert.equal(M.next(1),2);assert.equal(M.next(2),0);
});
test('wall-aware third-person camera pulls in safely near obstacles',()=>{
 const base={x:5000,y:19,z:5000,yaw:0,pitch:0,mode:1};
 const clear=M.compute(base);
 const behind=M.compute({...base,isBlocked:(x,y,z)=>z>5001.2});
 assert.ok(behind.eye[2]<clear.eye[2]);
 assert.ok(behind.eye[2]>5000);
 const blocked=M.compute({...base,isBlocked:()=>true});
 assert.equal(blocked.mode,0,'too-near obstacles gracefully fall back to first-person');
});
test('crouch eye height and front perspective preserve exact aiming direction',()=>{
 const stand=M.compute({x:5,y:8,z:9,mode:2,yaw:Math.PI/2,pitch:.11});
 const crouch=M.compute({x:5,y:8,z:9,mode:2,yaw:Math.PI/2,pitch:.11,crouching:true});
 near(stand.aimEye[1]-crouch.aimEye[1],.35);
 assert.ok(stand.forward[0]>.99);
 assert.ok(stand.look[0]<0,'front view faces avatar rather than aiming backwards');
});
test('the browser controls and cache include camera helper and legacy save compatibility',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 for(const key of ['perspective.js','perspective.compute','cameraMode','aimEye','drawOwnAvatar',
  'camera-btn','perspective-toggle','F5','mineworld-selfhost-v1','survivalHotbar'])
    assert.ok(html.includes(key),key+' missing');
 assert.ok(sw.includes("'./perspective.js'"));
 assert.ok(html.includes('cameraMode,advancements:advancementEngine.snapshot()'));assert.ok(html.includes('droppedItems:droppedItems.slice'));
});