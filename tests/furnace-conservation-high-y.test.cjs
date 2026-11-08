/* Executable conservation checks for furnace station transitions and saves. */
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'..','furnace-engine.js'),'utf8'),context);
const engine=context.window.MineWorldFurnace;
const at=(y=-64)=>({dimension:'overworld',x:-7,y,z:19});
test('furnace fuel and ingredient conservation across reload and output withdrawal',()=>{
 const f=engine.create(),p=at();
 assert.equal(f.insert(p,'input','rawIron',3),3);
 assert.equal(f.insert(p,'fuel','coal',1),1);
 assert.equal(f.tick(15).completed,1);
 let state=JSON.parse(JSON.stringify(f.snapshot()));
 const g=engine.create();g.restore(state);
 assert.equal(g.status(p).output.qty,1);
 assert.equal(g.status(p).input.qty,2);
 assert.equal(g.status(p).cookSecondsRemaining,5);
 assert.equal(g.take(p,'output',1).qty,1);
 assert.equal(g.tick(15).completed,2);
 assert.equal(g.status(p).output.qty,2);
 assert.equal(g.status(p).input,null);
 assert.equal(g.status(p).fuel,null);
});
test('full output does not consume queued fuel, then resumes after withdrawal',()=>{
 const f=engine.create(),p=at(319);
 f.restore([{...p,kind:'furnace',input:{key:'rawIron',qty:1},fuel:{key:'coal',qty:1},output:{key:'iron',qty:64},burn:0,burnTotal:0,progress:0}]);
 assert.equal(f.status(p).idleReason,'output_blocked');
 assert.equal(f.tick(20).completed,0);
 assert.equal(f.status(p).fuel.qty,1);
 assert.equal(f.take(p,'output',1).qty,1);
 assert.equal(f.tick(10).completed,1);
 assert.equal(f.status(p).output.qty,64);
});
