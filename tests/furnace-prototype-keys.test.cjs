'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const furnace=require('../furnace-core.js');
test('prototype names are not furnace recipes',()=>{
 for(const id of ['constructor','toString','__proto__','hasOwnProperty']){
  const initial=furnace.state({input:{id,count:1},fuel:{id:'coal',count:1}});
  assert.equal(furnace.canSmelt(initial),false,id);
  assert.equal(furnace.insert({},'input',{id,count:1}).moved,0,id);
  const after=furnace.tick(initial,250);
  assert.equal(after.output,null,id);
  assert.equal(after.fuel.count,1,id);
 }
});
test('prototype names cannot be burned as fuel',()=>{
 for(const id of ['constructor','toString','__proto__','hasOwnProperty']){
  assert.equal(furnace.insert({},'fuel',{id,count:1}).moved,0,id);
  const after=furnace.tick({input:{id:'sand',count:1},fuel:{id,count:1}},250);
  assert.equal(after.output,null,id);
  assert.equal(after.burn,0,id);
 }
});
test('valid recipes and fuels still work',()=>{
 const after=furnace.tick({input:{id:'sand',count:1},fuel:{id:'coal',count:1}},200);
 assert.deepEqual(after.output,{id:'glass',count:1});
});
