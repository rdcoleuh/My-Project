'use strict';
// Deterministic state-machine regression: no third-party game assets.
const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../furnace-core.js');
const ingredients=['sand','iron_ore','raw_beef','unknown_input'];
const fuels=['coal','stick','lava_bucket','boat','unknown_fuel'];
test('batched furnace ticks match single ticks across 400 reproducible states',()=>{
 for(let i=0;i<400;i++){
  const raw={
   input:{id:ingredients[i%ingredients.length],count:1+i%3},
   fuel:{id:fuels[(i*7)%fuels.length],count:1+i%3},
   output:i%7===0?{id:'glass',count:64}:null,
   progress:i%200,burn:i%201,burnTotal:200
  };
  const snapshot=JSON.stringify(raw);
  const batch=core.tick(raw,300);
  let single=core.state(raw);
  for(let step=0;step<300;step++)single=core.tick(single,1);
  assert.deepEqual(batch,single,'batch mismatch at case '+i);
  assert.equal(JSON.stringify(raw),snapshot,'input mutated at case '+i);
 }
});
