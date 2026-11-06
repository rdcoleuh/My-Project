'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(require.resolve('../furnace-engine.js'),'utf8'),sandbox);
const make=()=>sandbox.window.MineWorldFurnace.create();
const pos={dimension:'overworld',x:12,y:20,z:12};
test('legacy stacked lava cools partial progress without losing containers',()=>{
 const e=make();
 e.restore([{...pos,kind:'furnace',input:{key:'rawIron',qty:1},fuel:{key:'lavaBucket',qty:2},progress:8,burn:0,burnTotal:0}]);
 const result=e.tick(2);
 assert.equal(result.completed,0);
 assert.equal(result.changed,true);
 assert.equal(e.get(pos).progress,4);
 assert.equal(e.get(pos).fuel.qty,2);
 assert.equal(e.get(pos).burn,0);
 assert.equal(e.take(pos,'fuel',2).qty,2);
});
test('legacy stacked lava cools to zero and never produces an output',()=>{
 const e=make();
 e.restore([{...pos,kind:'furnace',input:{key:'rawIron',qty:1},fuel:{key:'lavaBucket',qty:3},progress:6}]);
 e.tick(5);
 assert.equal(e.get(pos).progress,0);
 assert.equal(e.get(pos).output,null);
 assert.equal(e.get(pos).fuel.qty,3);
});
test('single lava bucket still smelts and leaves empty bucket',()=>{
 const e=make();
 e.ensure(pos,'furnace');
 assert.equal(e.insert(pos,'input','rawIron',1),1);
 assert.equal(e.insert(pos,'fuel','lavaBucket',1),1);
 assert.equal(e.tick(10).completed,1);
 assert.equal(e.get(pos).output.key,'iron');
 assert.equal(e.get(pos).fuel.key,'bucket');
});
