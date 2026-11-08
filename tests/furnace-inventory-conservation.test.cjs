/* Executable end-to-end furnace inventory conservation checks. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','furnace-engine.js'),'utf8'),sandbox,{timeout:2000});
const create=sandbox.window.MineWorldFurnace.create;
const p={dimension:'overworld',x:4,y:63,z:4};
const plain=v=>JSON.parse(JSON.stringify(v));
test('partial output collection and reload conserve every smelted item',()=>{
 const e=create();
 assert.equal(e.insert(p,'input','rawIron',4),4);
 assert.equal(e.insert(p,'fuel','coal',1),1);
 assert.equal(e.tick(40).completed,4);
 assert.deepEqual(plain(e.take(p,'output',2)),{key:'iron',qty:2});
 const restored=create();restored.restore(plain(e.snapshot()));
 assert.deepEqual(plain(restored.take(p,'output',64)),{key:'iron',qty:2});
 assert.equal(restored.take(p,'output',1),null);
 assert.equal(restored.status(p).input,null);
});
test('partially removed ingredients cannot produce more outputs than remain',()=>{
 const e=create();e.insert(p,'input','rawGold',4);e.insert(p,'fuel','coal',1);
 assert.equal(e.tick(5).completed,0);
 assert.deepEqual(plain(e.take(p,'input',3)),{key:'rawGold',qty:3});
 assert.equal(e.tick(5).completed,1);
 assert.equal(e.tick(40).completed,0);
 assert.deepEqual(plain(e.take(p,'output',64)),{key:'gold',qty:1});
});
test('independent stations across dimensions do not exchange inventory or fuel',()=>{
 const e=create(),nether={...p,dimension:'nether'},deep={...p,y:-64};
 for(const at of [p,nether,deep]){e.insert(at,'input','rawIron',1);e.insert(at,'fuel','coal',1);}
 assert.equal(e.tick(10).completed,3);
 const loaded=create();loaded.restore(plain(e.snapshot()));
 for(const at of [p,nether,deep]){
  assert.deepEqual(plain(loaded.take(at,'output',1)),{key:'iron',qty:1});
  assert.equal(loaded.take(at,'output',1),null);
 }
});
