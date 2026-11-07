'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const furnace=require('../furnace-core.js');
const recipes={red_sand:'glass',cobbled_deepslate:'deepslate',basalt:'smooth_basalt',sandstone:'smooth_sandstone',red_sandstone:'smooth_red_sandstone',chorus_fruit:'popped_chorus_fruit',sea_pickle:'lime_dye'};
for(const [input,output] of Object.entries(recipes)){
 test(input+' smelts into '+output,()=>{
  assert.equal(furnace.RECIPES[input],output);
  const end=furnace.tick({input:{id:input,count:1},fuel:{id:'coal',count:1}},200);
  assert.deepEqual(end.output,{id:output,count:1});
  assert.equal(end.input,null);
  assert.equal(end.burn,1400);
 });
 test(input+' does not overwrite incompatible output',()=>{
  const end=furnace.tick({input:{id:input,count:1},fuel:{id:'coal',count:1},output:{id:'glass_bottle',count:1}},200);
  assert.deepEqual(end.output,{id:'glass_bottle',count:1});
  assert.deepEqual(end.input,{id:input,count:1});
  assert.deepEqual(end.fuel,{id:'coal',count:1});
 });
}
test('wooden fence remains valid fuel',()=>assert.equal(furnace.FUELS.wooden_fence,300));
