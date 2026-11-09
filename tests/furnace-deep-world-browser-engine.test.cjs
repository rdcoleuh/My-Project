'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

// Load the actual browser furnace engine without a DOM or external assets.
const source=fs.readFileSync(path.join(__dirname,'../furnace-engine.js'),'utf8');
function engine(){
  const context={window:{}};
  vm.runInNewContext(source,context,{filename:'furnace-engine.js',timeout:2000});
  return context.window.MineWorldFurnace.create();
}
const at=(y)=>({dimension:'overworld',x:4,y,z:7});

test('deep-world furnace at Y=-64 survives JSON save, resumes cooking, and preserves output',()=>{
  const e=engine(),p=at(-64);
  assert.ok(e.ensure(p,'furnace'));
  assert.equal(e.insert(p,'input','block:4',2),2);
  assert.equal(e.insert(p,'fuel','coal',1),1);
  assert.equal(e.tick(5).completed,0);
  const snapshot=JSON.parse(JSON.stringify(e.snapshot()));
  const loaded=engine();loaded.restore(snapshot);
  assert.equal(loaded.tick(5).completed,1);
  const s=loaded.status(p);
  assert.equal(s.output.key,'block:9');
  assert.equal(s.output.qty,1);
  assert.equal(s.input.qty,1);
  assert.equal(s.burnSecondsRemaining,70);
});

test('furnace at Y=319 cannot burn queued fuel against incompatible output',()=>{
  const e=engine(),p=at(319);
  e.restore([{...p,kind:'furnace',input:{key:'block:4',qty:1},
    fuel:{key:'coal',qty:1},output:{key:'brick',qty:1},
    burn:0,burnTotal:0,progress:9}]);
  const result=e.tick(30);
  assert.equal(result.completed,0);
  assert.equal(e.status(p).idleReason,'output_blocked');
  assert.equal(e.get(p).fuel.qty,1);
  assert.equal(e.get(p).progress,0);
});

test('legacy overstacked lava containers remain withdrawable, never ignite',()=>{
  const e=engine(),p=at(63);
  e.restore([{...p,kind:'furnace',input:{key:'block:4',qty:1},
    fuel:{key:'lavaBucket',qty:2},output:null,burn:0,burnTotal:0,progress:4}]);
  assert.equal(e.tick(30).completed,0);
  assert.equal(e.status(p).idleReason,'invalid_fuel_stack');
  assert.equal(e.get(p).fuel.qty,2);
  assert.equal(e.take(p,'fuel',2).qty,2);
});
