'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const core=require('../furnace-core.js');
for(const fuel of ['lava_bucket','boat','spruce_boat','cherry_boat','raft']){
 test(fuel+' fuel slot holds one and returns overflow',()=>{
  const incoming={id:fuel,count:4};
  const first=core.insert({},'fuel',incoming);
  assert.equal(first.moved,1);
  assert.deepEqual(first.furnace.fuel,{id:fuel,count:1});
  assert.deepEqual(first.remainder,{id:fuel,count:3});
  assert.deepEqual(incoming,{id:fuel,count:4});
  const second=core.insert(first.furnace,'fuel',{id:fuel,count:2});
  assert.equal(second.moved,0);
  assert.deepEqual(second.remainder,{id:fuel,count:2});
 });
 test(fuel+' still smelts one sand after insertion',()=>{
  const loaded=core.insert({},'input',{id:'sand',count:1}).furnace;
  const inserted=core.insert(loaded,'fuel',{id:fuel,count:2});
  const cooked=core.tick(inserted.furnace,200);
  assert.deepEqual(cooked.output,{id:'glass',count:1});
 });
}
test('stackable coal retains 64 item fuel capacity',()=>{
 const result=core.insert({},'fuel',{id:'coal',count:64});
 assert.equal(result.moved,64);
 assert.equal(result.remainder,null);
});
