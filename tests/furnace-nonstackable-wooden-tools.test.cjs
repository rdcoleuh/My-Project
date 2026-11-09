'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const furnace=require('../furnace-core.js');
for(const id of ['wooden_pickaxe','wooden_axe','wooden_shovel','wooden_hoe','wooden_sword']){
 test(id+' fuel slot accepts only one nonstackable tool',()=>{
  const result=furnace.insert({},'fuel',{id,count:4});
  assert.equal(result.moved,1);
  assert.deepEqual(result.furnace.fuel,{id,count:1});
  assert.deepEqual(result.remainder,{id,count:3});
  const second=furnace.insert(result.furnace,'fuel',{id,count:1});
  assert.equal(second.moved,0);
  assert.deepEqual(second.remainder,{id,count:1});
 });
 test(id+' legacy stacked tools are preserved instead of silently consumed',()=>{
  const old={input:{id:'sand',count:1},fuel:{id,count:2}};
  const next=furnace.tick(old,1);
  assert.equal(next.burn,0);
  assert.deepEqual(next.fuel,{id,count:2});
  assert.deepEqual(next.input,{id:'sand',count:1});
 });
}
