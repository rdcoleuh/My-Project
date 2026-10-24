/* MineWorld 5.9 interactive voxel feature contract.
 * Run: node --test tests/*.test.cjs — no external dependencies. */
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const window={};vm.runInNewContext(fs.readFileSync(path.join(root,'classic-interactions.js'),'utf8'),{window});
const C=window.MineWorldClassicInteractions;
test('pick block selects existing Creative slots and replaces only the selected slot otherwise',()=>{
 const existing=C.pickPlan('creative',3,0,[1,2,3,4,5,6,7,8,9],[]);
 assert.equal(existing.type,'select');assert.equal(existing.slot,2);
 const replacement=C.pickPlan('creative',62,4,[1,2,3,4,5,6,7,8,9],[]);
 assert.equal(replacement.type,'replace');assert.equal(replacement.slot,4);
 assert.equal(replacement.block,62);
 assert.equal(C.pickPlan('creative',0,2,[1,2,3,4,5,6,7,8,9],[]).type,'none');
});
test('Survival pick block uses actual owned stack IDs — cannot create free items',()=>{
 const entries=[{id:13,key:'block:3',qty:12},{id:17,key:'block:40',qty:8}];
 const selected=C.pickPlan('survival',3,1,[null,13,null],entries);
 assert.equal(selected.type,'select');assert.equal(selected.slot,1);
 const equipped=C.pickPlan('survival',40,1,[null,13,null],entries);
 assert.equal(equipped.type,'equip');assert.equal(equipped.id,17);
 const unavailable=C.pickPlan('survival',9,1,[null,13,null],entries);
 assert.equal(unavailable.type,'none');
 const empty=C.pickPlan('survival',3,1,[null,null],[{id:1,key:'block:3',qty:0}]);
 assert.equal(empty.type,'none');
});
test('thrown items observe cooldown, gravity and close-range recovery',()=>{
 const d=C.createDrop({key:'block:2',count:64,x:5000,y:20,z:5000,yaw:0});
 assert.equal(d.count,64);assert.equal(d.dimension,'overworld');
 assert.ok(d.z<5000);
 assert.equal(C.shouldCollect(d,{x:d.x,y:d.y,z:d.z,dimension:'overworld'}),false,'drop delay');
 let now={...d};
 for(let i=0;i<25;i++)now=C.advanceDrop(now,.05,()=>false);
 assert.ok(now.y<d.y);
 assert.equal(now.delay,0);
 assert.equal(C.shouldCollect(now,{x:now.x,y:now.y-.7,z:now.z,dimension:'overworld'}),true);
 assert.equal(C.shouldCollect(now,{x:now.x+3,y:now.y,z:now.z,dimension:'overworld'}),false);
 assert.equal(C.shouldCollect(now,{x:now.x,y:now.y,z:now.z,dimension:'nether'}),false);
});
test('restored drops are finite, limited, dimension-scoped, and validated',()=>{
 const valid=C.sanitizeDrop({key:'block:9',count:12,x:5000.5,y:20,z:4999.5,dimension:'overworld'},k=>k==='block:9',10000,48);
 assert.equal(valid.count,12);
 assert.equal(valid.delay,0);
 assert.equal(C.sanitizeDrop({...valid,count:999},()=>true,10000,48),null);
 assert.equal(C.sanitizeDrop({...valid,x:1e20},()=>true,10000,48),null);
 assert.equal(C.sanitizeDrop({...valid,dimension:'jungle'},()=>true,10000,48),null);
 assert.equal(C.sanitizeDrop({...valid,key:'invalid'},k=>k==='block:9',10000,48),null);
});
test('mining crack stage grows without large meshes and directions match yaw',()=>{
 assert.equal(C.crackLines({x:1,y:1,z:1},0).length,0);
 const early=C.crackLines({x:1,y:1,z:1},.1),late=C.crackLines({x:1,y:1,z:1},.9);
 assert.ok(late.length>early.length);
 assert.ok(late.length<=120);
 for(const pt of late){assert.equal(pt.length,3);assert.ok(pt.every(Number.isFinite));}
 assert.equal(C.facing(0),'North');assert.equal(C.facing(Math.PI/2),'East');
 assert.equal(C.facing(Math.PI),'South');assert.equal(C.facing(-Math.PI/2),'West');
});
test('live page wires gameplay events, 3D feedback, UI and offline cache',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const worker=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 for(const marker of ['mineworld-selfhost-v1','MineWorldMovement.resolve','classic-interactions.js',
  'droppedItems:droppedItems.slice','classic.crackLines','classic.pickPlan','pickLookedAtBlock()',
  'tickDroppedItems(dt)','drawDroppedItems();','debug-toggle','quick-pick','MineWorld 6.0'])
   assert.ok(html.includes(marker),marker+' missing');
 assert.ok(worker.includes("'./classic-interactions.js'"));
 assert.ok(html.includes("survivalHotbar:[...survivalHotbar]"),'retain classic inventory save');
 assert.ok(html.includes("version:13"),'keep old save schema backwards compatible');
 assert.equal((html.match(/src="\.\/classic-interactions\.js"/g)||[]).length,1);
 for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){
  if(match[1].trim())new Function(match[1]);
 }
});