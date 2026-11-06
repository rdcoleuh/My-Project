'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const furnace=require('../furnace-core.js');
test('legacy stacked lava buckets cannot silently lose empty containers',()=>{
 const original={input:{id:'sand',count:2},fuel:{id:'lava_bucket',count:3}};
 const result=furnace.tick(original,400);
 assert.deepEqual(result.fuel,{id:'lava_bucket',count:3});
 assert.equal(result.burn,0);
 assert.equal(result.progress,0);
 assert.equal(result.output,null);
});
test('single lava bucket still burns and retains its empty bucket',()=>{
 const result=furnace.tick({input:{id:'sand',count:1},fuel:{id:'lava_bucket',count:1}},200);
 assert.deepEqual(result.fuel,{id:'bucket',count:1});
 assert.deepEqual(result.output,{id:'glass',count:1});
});
test('stacked lava buckets can be withdrawn without loss',()=>{
 const result=furnace.extract({fuel:{id:'lava_bucket',count:3}},'fuel',2);
 assert.deepEqual(result.taken,{id:'lava_bucket',count:2});
 assert.deepEqual(result.furnace.fuel,{id:'lava_bucket',count:1});
});
