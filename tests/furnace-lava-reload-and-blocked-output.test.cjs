'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const furnace = require('../furnace-core.js');

test('fuel remains conserved across repeated save/reload during an active lava burn', () => {
  let s = furnace.insert({input:{id:'sand',count:3}}, 'fuel', {id:'lava_bucket',count:1}).furnace;
  s = furnace.tick(s,100);
  assert.deepEqual(s.fuel,{id:'bucket',count:1});
  assert.equal(s.burn,19900);
  for(let i=0;i<3;i++){
    s = furnace.deserialize(JSON.parse(JSON.stringify(furnace.serialize(s))));
    s = furnace.tick(s,100);
  }
  assert.deepEqual(s.output,{id:'glass',count:2});
  assert.deepEqual(s.input,{id:'sand',count:1});
  assert.deepEqual(s.fuel,{id:'bucket',count:1});
  assert.equal(s.burn,19600);
});

test('a blocked output does not ignite queued coal after previously stored heat expires', () => {
  const raw={input:{id:'sand',count:2},fuel:{id:'coal',count:1},output:{id:'stone',count:1},burn:2,burnTotal:1600,progress:150};
  const s=furnace.tick(raw,20);
  assert.deepEqual(s.input,raw.input);
  assert.deepEqual(s.fuel,raw.fuel);
  assert.deepEqual(s.output,raw.output);
  assert.equal(s.burn,0);
  assert.equal(s.progress,0);
});

test('output extraction does not remove the remaining lava container', () => {
  let s=furnace.tick({input:{id:'sand',count:1},fuel:{id:'lava_bucket',count:1}},200);
  const result=furnace.extract(s,'output',1);
  assert.deepEqual(result.taken,{id:'glass',count:1});
  assert.deepEqual(result.furnace.fuel,{id:'bucket',count:1});
  assert.equal(result.furnace.burn,19800);
});
