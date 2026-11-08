'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','furnace-engine.js'),'utf8'),context);
const engine=()=>context.window.MineWorldFurnace.create();
const p={dimension:'overworld',x:8,y:-64,z:-3};
test('restore clears stale progress when output belongs to a different recipe',()=>{
 const e=engine();
 e.restore([{...p,kind:'furnace',input:{key:'rawIron',qty:2},output:{key:'gold',qty:1},fuel:{key:'coal',qty:1},progress:9,burn:20,burnTotal:80}]);
 assert.equal(e.get(p).progress,0);
 assert.equal(e.get(p).output.key,'gold');
 assert.equal(e.get(p).input.qty,2);
 assert.equal(e.get(p).burn,20);
 assert.equal(e.status(p).idleReason,'output_blocked');
});
test('restore clears stale progress for a full matching output stack',()=>{
 const e=engine();
 e.restore([{...p,kind:'furnace',input:{key:'rawIron',qty:2},output:{key:'iron',qty:64},progress:8,burn:0,burnTotal:0}]);
 assert.equal(e.get(p).progress,0);
 assert.equal(e.get(p).output.qty,64);
 assert.equal(e.status(p).idleReason,'output_blocked');
});
test('restore preserves valid partial progress when output has room',()=>{
 const e=engine();
 e.restore([{...p,kind:'furnace',input:{key:'rawIron',qty:2},output:{key:'iron',qty:63},progress:8,burn:20,burnTotal:80}]);
 assert.equal(e.get(p).progress,8);
 assert.equal(e.tick(2).completed,1);
 assert.equal(e.get(p).output.qty,64);
 assert.equal(e.get(p).input.qty,1);
});
