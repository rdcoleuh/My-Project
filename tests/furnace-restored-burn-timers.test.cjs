const test=require('node:test');
const assert=require('node:assert/strict');
const furnace=require('../furnace-core.js');
test('restored fuel timer is bounded by the longest supported fuel',()=>{
 const s=furnace.state({input:{id:'sand',count:1},burn:Number.MAX_SAFE_INTEGER,burnTotal:Number.MAX_SAFE_INTEGER});
 assert.equal(s.burn,20000);
 assert.equal(s.burnTotal,20000);
});
test('restored burnTotal cannot be below remaining burn',()=>{
 const s=furnace.state({burn:140,burnTotal:10});
 assert.equal(s.burn,140);
 assert.equal(s.burnTotal,140);
});
test('legitimate partially burned fuel and smelting progress survive restoration',()=>{
 const s=furnace.state({input:{id:'sand',count:1},burn:1200,burnTotal:1600,progress:85});
 assert.deepEqual({burn:s.burn,burnTotal:s.burnTotal,progress:s.progress},{burn:1200,burnTotal:1600,progress:85});
 assert.equal(furnace.tick(s,1).progress,86);
});
