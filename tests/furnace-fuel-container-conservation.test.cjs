'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const furnace = require('../furnace-core.js');

test('lava bucket becomes an empty bucket after ignition and survives save/load', () => {
  const inserted = furnace.insert({input:{id:'sand',count:2}}, 'fuel', {id:'lava_bucket',count:1});
  assert.equal(inserted.moved,1);
  const ignited = furnace.tick(inserted.furnace,1);
  assert.equal(ignited.burn, furnace.FUELS.lava_bucket-1);
  assert.deepEqual(ignited.fuel,{id:'bucket',count:1});
  const restored = furnace.deserialize(JSON.parse(JSON.stringify(furnace.serialize(ignited))));
  assert.deepEqual(restored.fuel,{id:'bucket',count:1});
  assert.equal(restored.burn,ignited.burn);
  const cooked = furnace.tick(restored,199);
  assert.deepEqual(cooked.output,{id:'glass',count:1});
  assert.deepEqual(cooked.fuel,{id:'bucket',count:1});
});

test('stacked legacy lava buckets cannot ignite or lose a container', () => {
  const legacy={input:{id:'sand',count:1},fuel:{id:'lava_bucket',count:2}};
  const result=furnace.tick(legacy,200);
  assert.equal(result.burn,0);
  assert.deepEqual(result.fuel,legacy.fuel);
  assert.deepEqual(result.input,legacy.input);
  assert.equal(result.output,null);
});

test('furnace does not consume fuel while output is blocked', () => {
  const raw={input:{id:'sand',count:1},fuel:{id:'coal',count:1},output:{id:'stone',count:64}};
  const result=furnace.tick(raw,200);
  assert.deepEqual(result.fuel,raw.fuel);
  assert.deepEqual(result.input,raw.input);
  assert.equal(result.burn,0);
  assert.equal(result.progress,0);
});
