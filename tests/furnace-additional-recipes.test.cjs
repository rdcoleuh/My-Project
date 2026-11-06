'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../furnace-core.js');
const recipes={
 clay:'terracotta',stone:'smooth_stone',netherrack:'nether_brick',
 cactus:'green_dye',kelp:'dried_kelp',wet_sponge:'sponge',
 raw_mutton:'cooked_mutton',raw_rabbit:'cooked_rabbit',
 raw_cod:'cooked_cod',raw_salmon:'cooked_salmon'
};
for(const [input,output] of Object.entries(recipes)){
 test('smelts '+input+' to '+output,()=>{
  const result=core.tick({input:{id:input,count:1},fuel:{id:'coal',count:1}},200);
  assert.deepEqual(result.output,{id:output,count:1});
  assert.equal(result.input,null);
 });
}
test('unregistered input never burns fuel',()=>{
 const result=core.tick({input:{id:'unregistered',count:1},fuel:{id:'coal',count:1}},200);
 assert.equal(result.burn,0);
 assert.deepEqual(result.fuel,{id:'coal',count:1});
});
test('different output blocks new recipe without consuming fuel',()=>{
 const result=core.tick({input:{id:'kelp',count:1},fuel:{id:'coal',count:1},output:{id:'glass',count:1}},200);
 assert.deepEqual(result.output,{id:'glass',count:1});
 assert.equal(result.burn,0);
});
