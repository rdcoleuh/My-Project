/* MineWorld furnace boundary tests: executable with node --test. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','furnace-engine.js'),'utf8'),context,{timeout:2000});
const create=context.window.MineWorldFurnace.create;
const at={dimension:'overworld',x:-19,y:-64,z:-27};
const plain=x=>JSON.parse(JSON.stringify(x));
test('lava bucket returns empty bucket after ignition and survives reload',()=>{
 const e=create();e.insert(at,'input','rawIron',2);
 assert.equal(e.insert(at,'fuel','lavaBucket',2),1);
 assert.equal(e.tick(10).completed,1);
 assert.deepEqual(plain(e.get(at).fuel),{key:'bucket',qty:1});
 const loaded=create();loaded.restore(plain(e.snapshot()));
 assert.deepEqual(plain(loaded.take(at,'fuel',1)),{key:'bucket',qty:1});
 assert.equal(loaded.tick(10).completed,1);
 assert.deepEqual(plain(loaded.take(at,'output',64)),{key:'iron',qty:2});
});
test('blocked output never consumes input and unblocking resumes safely',()=>{
 const e=create();e.restore([{...at,kind:'furnace',input:{key:'rawIron',qty:2},
  fuel:{key:'coal',qty:1},output:{key:'gold',qty:1},burn:0,burnTotal:0,progress:5}]);
 assert.equal(e.tick(60).completed,0);
 assert.deepEqual(plain(e.get(at).input),{key:'rawIron',qty:2});
 assert.equal(e.get(at).progress,0);
 assert.deepEqual(plain(e.take(at,'output',1)),{key:'gold',qty:1});
 assert.equal(e.tick(20).completed,2);
 assert.deepEqual(plain(e.take(at,'output',64)),{key:'iron',qty:2});
});
test('invalid nonstackable legacy fuel is withdrawable but never ignites',()=>{
 const e=create();e.restore([{...at,kind:'furnace',input:{key:'rawIron',qty:1},
  fuel:{key:'lavaBucket',qty:3},output:null,burn:0,burnTotal:0,progress:4}]);
 assert.equal(e.tick(10).completed,0);
 assert.equal(e.status(at).idleReason,'invalid_fuel_stack');
 assert.deepEqual(plain(e.take(at,'fuel',3)),{key:'lavaBucket',qty:3});
});
