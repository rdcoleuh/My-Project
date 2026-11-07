'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const furnace=require('../furnace-core.js');
const fuels={
 wooden_door:200,wooden_trapdoor:300,wooden_fence:300,
 wooden_fence_gate:300,sign:200,boat:1200,raft:1200
};
for(const [name,duration] of Object.entries(fuels)){
 test(name+' has the intended burn duration',()=>{
  assert.equal(furnace.FUELS[name],duration);
 });
 test(name+' can cook one sand without duplicating fuel',()=>{
  const result=furnace.tick({input:{id:'sand',count:1},fuel:{id:name,count:1}},200);
  assert.deepEqual(result.output,{id:'glass',count:1});
  assert.equal(result.fuel,null);
  assert.equal(result.burn,duration-200);
 });
}
test('wooden door cannot be smelted as an ingredient',()=>{
 assert.equal(furnace.RECIPES.wooden_door,undefined);
 assert.equal(furnace.insert({},'input',{id:'wooden_door',count:1}).moved,0);
});
