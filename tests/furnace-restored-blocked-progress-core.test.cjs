'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const furnace=require('../furnace-core.js');
test('restored blocked output cannot retain nearly complete cooking progress',()=>{
 const saved={input:{id:'raw_iron',count:2},output:{id:'gold_ingot',count:1},fuel:{id:'coal',count:1},burn:10,burnTotal:1600,progress:199};
 const restored=furnace.deserialize(saved);
 assert.equal(restored.progress,0);
 assert.deepEqual(restored.output,{id:'gold_ingot',count:1});
 assert.equal(restored.input.count,2);
 assert.equal(furnace.tick(restored,1).progress,0);
});
test('full output clears stale progress and preserves queued fuel',()=>{
 const saved={input:{id:'sand',count:2},output:{id:'glass',count:64},fuel:{id:'coal',count:1},progress:199};
 const restored=furnace.deserialize(saved);
 assert.equal(restored.progress,0);
 const next=furnace.tick(restored,10);
 assert.deepEqual(next.fuel,{id:'coal',count:1});
 assert.equal(next.output.count,64);
 assert.equal(next.input.count,2);
});
test('valid partial progress and remaining burn survive save round trip',()=>{
 const saved={input:{id:'sand',count:2},output:{id:'glass',count:63},burn:100,burnTotal:1600,progress:150};
 const restored=furnace.deserialize(furnace.serialize(saved));
 assert.equal(restored.progress,150);
 assert.equal(restored.burn,100);
 const next=furnace.tick(restored,50);
 assert.equal(next.output.count,64);
 assert.equal(next.input.count,1);
});
