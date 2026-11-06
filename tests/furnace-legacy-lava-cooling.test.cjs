'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const furnace=require('../furnace-core.js');
test('legacy stacked lava fuel does not freeze partial smelting progress',()=>{
 const initial={input:{id:'sand',count:1},fuel:{id:'lava_bucket',count:2},progress:100};
 const result=furnace.tick(initial,10);
 assert.equal(result.progress,80);
 assert.equal(result.burn,0);
 assert.equal(result.output,null);
 assert.deepEqual(result.fuel,{id:'lava_bucket',count:2});
});
test('legacy stacked lava fuel remains withdrawable after cooling',()=>{
 const cooled=furnace.tick({input:{id:'sand',count:1},fuel:{id:'lava_bucket',count:2},progress:4},5);
 assert.equal(cooled.progress,0);
 assert.deepEqual(furnace.extract(cooled,'fuel',2).taken,{id:'lava_bucket',count:2});
});
test('ordinary coal still ignites and smelts after legacy guard',()=>{
 const result=furnace.tick({input:{id:'sand',count:1},fuel:{id:'coal',count:1}},200);
 assert.deepEqual(result.output,{id:'glass',count:1});
});
