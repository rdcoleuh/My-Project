const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'..','furnace-engine.js'),'utf8');
const sandbox={window:{}};
vm.runInNewContext(source,sandbox,{timeout:2000});
const create=sandbox.window.MineWorldFurnace.create;
const p={dimension:'overworld',x:9,y:-64,z:4};
test('legacy positive burn total preserves already-paid remaining fuel',()=>{
 const e=create();
 e.restore([{...p,kind:'furnace',input:{key:'rawIron',qty:2},fuel:null,output:null,burn:140,burnTotal:10,progress:0}]);
 assert.equal(e.status(p).burnSecondsRemaining,140);
 assert.equal(e.snapshot()[0].burnTotal,140);
 assert.equal(e.tick(10).completed,1);
 assert.equal(e.status(p).burnSecondsRemaining,130);
});
test('missing total does not grant free burn from corrupted save',()=>{
 const e=create();
 e.restore([{...p,kind:'furnace',input:{key:'rawIron',qty:1},fuel:null,output:null,burn:140,progress:0}]);
 assert.equal(e.status(p).burnSecondsRemaining,0);
 assert.equal(e.tick(10).completed,0);
});
