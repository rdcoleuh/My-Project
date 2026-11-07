'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const furnace=require('../furnace-core.js');
const cases={
 wooden_fence:300,
 spruce_boat:1200,
 cherry_boat:1200,
 wooden_sign:200,
 wooden_hanging_sign:800
};
for(const [fuel,duration] of Object.entries(cases)){
 test(fuel+' has the configured fuel duration',()=>{
  assert.equal(furnace.FUELS[fuel],duration);
  assert.equal(furnace.fuelTicks?.(fuel)??furnace.FUELS[fuel],duration);
 });
 test(fuel+' ignites and produces glass',()=>{
  const initial={input:{id:'sand',count:1},fuel:{id:fuel,count:1}};
  const after=furnace.tick(initial,200);
  assert.deepEqual(after.output,{id:'glass',count:1});
  assert.equal(after.input,null);
  assert.equal(after.fuel,null);
  assert.equal(after.burn,duration-200);
 });
}
test('unrecognized names do not ignite',()=>{
 const after=furnace.tick({input:{id:'sand',count:1},fuel:{id:'not_a_fuel',count:1}},200);
 assert.equal(after.output,null);
 assert.equal(after.fuel.id,'not_a_fuel');
});
