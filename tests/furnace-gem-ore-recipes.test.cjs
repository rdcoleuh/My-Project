'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const furnace=require('../furnace-core.js');
const recipes={
 diamond_ore:'diamond',deepslate_diamond_ore:'diamond',
 emerald_ore:'emerald',deepslate_emerald_ore:'emerald',
 lapis_ore:'lapis_lazuli',deepslate_lapis_ore:'lapis_lazuli',
 redstone_ore:'redstone',deepslate_redstone_ore:'redstone',
 nether_quartz_ore:'quartz'
};
for(const [ore,product] of Object.entries(recipes)){
 test(ore+' smelts into '+product,()=>{
  assert.equal(furnace.RECIPES[ore],product);
  const result=furnace.tick({input:{id:ore,count:1},fuel:{id:'coal',count:1}},200);
  assert.deepEqual(result.output,{id:product,count:1});
  assert.equal(result.input,null);
  assert.equal(result.fuel,null);
  assert.equal(result.burn,1400);
 });
}
test('different ore output blocks smelting without consuming ingredient',()=>{
 const result=furnace.tick({input:{id:'diamond_ore',count:1},fuel:{id:'coal',count:1},output:{id:'emerald',count:1}},200);
 assert.deepEqual(result.input,{id:'diamond_ore',count:1});
 assert.deepEqual(result.output,{id:'emerald',count:1});
 assert.deepEqual(result.fuel,{id:'coal',count:1});
});
test('ore output stack at capacity blocks smelting',()=>{
 const result=furnace.tick({input:{id:'emerald_ore',count:1},fuel:{id:'coal',count:1},output:{id:'emerald',count:64}},200);
 assert.deepEqual(result.input,{id:'emerald_ore',count:1});
 assert.equal(result.output.count,64);
 assert.equal(result.burn,0);
});
