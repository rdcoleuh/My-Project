'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../furnace-core.js');
function stepwise(raw,steps){
 let s=core.state(raw);
 for(let i=0;i<steps;i++)s=core.tick(s,1);
 return s;
}
test('last paid burn tick followed by unfueled cooling matches single ticks',()=>{
 for(const progress of [0,1,17,198,199]){
  for(const burn of [1,2,199,200]){
   const raw={input:{id:'sand',count:3},burn,burnTotal:1600,progress};
   assert.deepEqual(core.tick(raw,12000),stepwise(raw,12000),JSON.stringify({progress,burn}));
  }
 }
});
test('unsupported fuel and invalid overstacked lava remain unconsumed after paid burn',()=>{
 for(const fuel of [{id:'unknown_fuel',count:2},{id:'lava_bucket',count:2}]){
  const raw={input:{id:'iron_ore',count:2},fuel,burn:1,burnTotal:1600,progress:198};
  const batched=core.tick(raw,12000);
  assert.deepEqual(batched,stepwise(raw,12000));
  assert.deepEqual(batched.fuel,fuel);
  assert.equal(batched.output,null);
 }
});
test('last burn tick completes a smelt and cools without inventing another',()=>{
 const raw={input:{id:'sand',count:2},burn:1,burnTotal:1600,progress:199};
 const result=core.tick(raw,12000);
 assert.deepEqual(result,stepwise(raw,12000));
 assert.deepEqual(result.output,{id:'glass',count:1});
 assert.deepEqual(result.input,{id:'sand',count:1});
 assert.equal(result.progress,0);
});
