'use strict';
/* Original MineWorld furnace regression: long-running saves and bounded tick batches. */
const test=require('node:test');
const assert=require('node:assert/strict');
const furnace=require('../furnace-core.js');
const clone=s=>furnace.deserialize(JSON.parse(JSON.stringify(furnace.serialize(s))));

test('batched ticks and single ticks produce identical smelts, fuel and progress',()=>{
 const initial={input:{id:'sand',count:64},fuel:{id:'coal_block',count:1}};
 let batched=furnace.tick(initial,12000);
 let stepped=furnace.state(initial);
 for(let i=0;i<12000;i++)stepped=furnace.tick(stepped,1);
 assert.deepEqual(batched,stepped);
 assert.deepEqual(batched.output,{id:'glass',count:60});
 assert.deepEqual(batched.input,{id:'sand',count:4});
 assert.equal(batched.burn,4000);
});

test('save/reload across a large smelt batch does not duplicate output or burn',()=>{
 const initial={input:{id:'sand',count:64},fuel:{id:'coal_block',count:1}};
 const continuous=furnace.tick(initial,12000);
 let restored=furnace.tick(initial,6000);
 restored=clone(restored);
 restored=furnace.tick(restored,6000);
 assert.deepEqual(restored,continuous);
 assert.deepEqual(furnace.tick(restored,800).output,{id:'glass',count:64});
 assert.equal(furnace.tick(restored,800).input,null);
});

test('large tick counts are bounded and do not mutate caller state',()=>{
 const input={input:{id:'sand',count:1},fuel:{id:'coal',count:1}};
 const before=JSON.stringify(input);
 assert.throws(()=>furnace.tick(input,12001),RangeError);
 assert.equal(JSON.stringify(input),before);
});
