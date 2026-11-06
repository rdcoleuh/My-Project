'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const furnace=require('../furnace-core.js');
test('lava bucket leaves an empty bucket in fuel slot after ignition',()=>{
 const result=furnace.tick({input:{id:'sand',count:1},fuel:{id:'lava_bucket',count:1}},1);
 assert.deepEqual(result.fuel,{id:'bucket',count:1});
 assert.equal(result.burn,19999);
 assert.equal(result.progress,1);
 assert.deepEqual(furnace.extract(result,'fuel',1).taken,{id:'bucket',count:1});
});
test('lava bucket fuel slot accepts at most one container',()=>{
 const first=furnace.insert({},'fuel',{id:'lava_bucket',count:3});
 assert.equal(first.moved,1);
 assert.deepEqual(first.remainder,{id:'lava_bucket',count:2});
 assert.equal(furnace.insert(first.furnace,'fuel',{id:'lava_bucket',count:1}).moved,0);
});
test('empty bucket cannot be burned as fuel',()=>{
 const result=furnace.tick({input:{id:'sand',count:1},fuel:{id:'bucket',count:1}},1);
 assert.equal(result.burn,0);
 assert.equal(result.progress,0);
 assert.deepEqual(result.fuel,{id:'bucket',count:1});
});
test('ordinary stackable coal still accepts full stack',()=>{
 const result=furnace.insert({},'fuel',{id:'coal',count:64});
 assert.equal(result.moved,64);
 assert.equal(result.furnace.fuel.count,64);
});
