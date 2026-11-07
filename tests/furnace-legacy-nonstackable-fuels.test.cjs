'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const furnace=require('../furnace-core.js');
const invalid=['lava_bucket','boat','spruce_boat','cherry_boat','raft'];
for(const fuel of invalid){
 test('legacy stacked '+fuel+' remains withdrawable and cannot ignite',()=>{
  const saved={input:{id:'sand',count:2},fuel:{id:fuel,count:2},output:null,burn:0,burnTotal:0,progress:0};
  const after=furnace.tick(saved,300);
  assert.deepEqual(after.fuel,{id:fuel,count:2});
  assert.deepEqual(after.input,{id:'sand',count:2});
  assert.equal(after.output,null);
  assert.equal(after.burn,0);
  const taken=furnace.extract(after,'fuel',2);
  assert.deepEqual(taken.taken,{id:fuel,count:2});
 });
 test('single '+fuel+' ignites and cooks normally',()=>{
  const initial={input:{id:'sand',count:1},fuel:{id:fuel,count:1}};
  const after=furnace.tick(initial,200);
  assert.deepEqual(after.output,{id:'glass',count:1});
  assert.equal(after.input,null);
 });
}
test('regular stackable coal remains valid',()=>{
 const after=furnace.tick({input:{id:'sand',count:1},fuel:{id:'coal',count:2}},200);
 assert.deepEqual(after.output,{id:'glass',count:1});
 assert.deepEqual(after.fuel,{id:'coal',count:1});
});
