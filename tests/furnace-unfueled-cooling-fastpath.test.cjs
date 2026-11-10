'use strict';
// Independent MineWorld regression tests for fast-forwarded furnace cooling.
const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../furnace-core.js');
function equivalent(initial,steps){
 const batch=core.tick(initial,steps);
 let single=core.state(initial);
 for(let i=0;i<steps;i++)single=core.tick(single,1);
 assert.deepEqual(batch,single);
 return batch;
}
test('unfueled cooking progress cools identically in large batches',()=>{
 const initial={input:{id:'sand',count:3},progress:199};
 assert.equal(equivalent(initial,1).progress,197);
 assert.equal(equivalent(initial,99).progress,1);
 assert.equal(equivalent(initial,100).progress,0);
 assert.equal(equivalent(initial,12000).progress,0);
});
test('unsupported fuel remains untouched during cooling',()=>{
 const initial={input:{id:'iron_ore',count:2},fuel:{id:'unsupported_custom_fuel',count:2},progress:125};
 const result=equivalent(initial,12000);
 assert.deepEqual(result.fuel,initial.fuel);
 assert.deepEqual(result.input,initial.input);
 assert.equal(result.burn,0);
});
test('legacy overstacked nonstackable fuel cannot ignite or vanish',()=>{
 for(const id of ['lava_bucket','boat','wooden_pickaxe']){
  const initial={input:{id:'sand',count:3},fuel:{id,count:2},progress:198};
  const result=equivalent(initial,12000);
  assert.deepEqual(result.fuel,initial.fuel);
  assert.equal(result.output,null);
  assert.equal(result.progress,0);
 }
});
test('usable fuel still ignites and completes smelting',()=>{
 const result=equivalent({input:{id:'sand',count:2},fuel:{id:'coal',count:1},progress:40},220);
 assert.deepEqual(result.output,{id:'glass',count:1});
});
