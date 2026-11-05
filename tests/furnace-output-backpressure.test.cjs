/* Furnace output backpressure and fuel conservation regression. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const context=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','furnace-engine.js'),'utf8'),context);
const create=context.window.MineWorldFurnace.create;
const p={dimension:'overworld',x:12,y:-20,z:-3};
test('blocked output never consumes ingredients or ignites new fuel',()=>{
 const engine=create();
 engine.restore([{...p,kind:'furnace',input:{key:'rawIron',qty:2},
   fuel:{key:'coal',qty:1},output:{key:'gold',qty:1},
   burn:0,burnTotal:0,progress:0}]);
 const result=engine.tick(60);
 assert.equal(result.completed,0);
 const machine=engine.get(p);
 assert.equal(machine.input.qty,2);
 assert.equal(machine.fuel.qty,1);
 assert.equal(machine.output.key,'gold');
 assert.equal(machine.burn,0);
});
test('collecting blocked output resumes smelting without creating extra fuel',()=>{
 const engine=create();
 engine.restore([{...p,kind:'furnace',input:{key:'rawIron',qty:2},
   fuel:{key:'coal',qty:1},output:{key:'gold',qty:1},
   burn:0,burnTotal:0,progress:0}]);
 assert.equal(engine.tick(60).completed,0);
 assert.equal(engine.take(p,'output',1).qty,1);
 assert.equal(engine.tick(20).completed,2);
 const machine=engine.get(p);
 assert.equal(machine.input,null);
 assert.equal(machine.output.key,'iron');
 assert.equal(machine.output.qty,2);
 assert.equal(machine.fuel,null);
 assert.equal(machine.burn,60);
});
test('full output stack halts cooking until space is available',()=>{
 const engine=create();
 engine.restore([{...p,kind:'furnace',input:{key:'rawIron',qty:1},
   fuel:{key:'coal',qty:1},output:{key:'iron',qty:64},
   burn:0,burnTotal:0,progress:0}]);
 assert.equal(engine.tick(30).completed,0);
 assert.equal(engine.get(p).fuel.qty,1);
 assert.equal(engine.take(p,'output',1).qty,1);
 assert.equal(engine.tick(10).completed,1);
 assert.equal(engine.get(p).output.qty,64);
});
