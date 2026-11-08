/* Integration coverage for MineWorld's actual three-slot furnace engine.
 * Run: node --test tests/furnace-survival-integration.test.cjs
 * Original test code; no third-party assets. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'..','furnace-engine.js'),'utf8');
const sandbox={window:{}};
vm.runInNewContext(source,sandbox,{filename:'furnace-engine.js',timeout:2000});
const {create}=sandbox.window.MineWorldFurnace;
const p={dimension:'overworld',x:13,y:12,z:15};
const plain=x=>JSON.parse(JSON.stringify(x));
test('survival: insert, ignite, cook, save/reload, finish, withdraw',()=>{
 const engine=create();
 assert.equal(engine.insert(p,'input','rawIron',2),2);
 assert.equal(engine.insert(p,'fuel','coal',1),1);
 assert.equal(engine.status(p).readyToSmelt,true);
 assert.equal(engine.tick(5).completed,0);
 assert.equal(engine.status(p).burning,true);
 const restored=create();
 restored.restore(plain(engine.snapshot()));
 assert.equal(restored.tick(5).completed,1);
 assert.deepEqual(plain(restored.status(p).output),{key:'iron',qty:1});
 assert.equal(restored.tick(10).completed,1);
 assert.deepEqual(plain(restored.take(p,'output',2)),{key:'iron',qty:2});
 assert.equal(restored.status(p).output,null);
});
test('blocked output preserves input and saved output',()=>{
 const engine=create();
 engine.restore([{...p,kind:'furnace',input:{key:'rawIron',qty:1},
 fuel:{key:'coal',qty:1},output:{key:'gold',qty:64},burn:0,burnTotal:0,progress:0}]);
 assert.equal(engine.status(p).idleReason,'output_blocked');
 assert.equal(engine.tick(30).completed,0);
 assert.deepEqual(plain(engine.status(p).input),{key:'rawIron',qty:1});
 assert.deepEqual(plain(engine.status(p).output),{key:'gold',qty:64});
});
test('smoker restriction, fuel efficiency, and invalid legacy stacks',()=>{
 const engine=create();
 engine.ensure(p,'smoker');
 assert.equal(engine.insert(p,'input','rawIron',1),0);
 assert.equal(engine.insert(p,'input','chicken',2),2);
 assert.equal(engine.insert(p,'fuel','coal',1),1);
 assert.equal(engine.tick(10).completed,2);
 assert.equal(engine.status(p).output.qty,2);
 const legacy=create();
 legacy.restore([{...p,kind:'furnace',input:{key:'rawIron',qty:1},
 fuel:{key:'lavaBucket',qty:2},output:null,burn:0,burnTotal:0,progress:0}]);
 assert.equal(legacy.status(p).idleReason,'invalid_fuel_stack');
 assert.equal(legacy.tick(10).completed,0);
 assert.equal(legacy.take(p,'fuel',2).qty,2);
});
test('deep-world coordinates survive snapshots',()=>{
 const engine=create();
 const deep={dimension:'overworld',x:-4,y:-64,z:-7};
 assert.equal(engine.insert(deep,'input','rawIron',1),1);
 const loaded=create();
 loaded.restore(plain(engine.snapshot()));
 assert.deepEqual(plain(loaded.status(deep).input),{key:'rawIron',qty:1});
});
