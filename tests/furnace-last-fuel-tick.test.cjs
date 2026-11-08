const test = require('node:test');
const assert = require('node:assert/strict');
const furnace = require('../furnace-core.js');

test('final burning tick contributes to smelting progress', () => {
  const start = furnace.state({
    input: {id:'sand', count:1},
    burn:1, burnTotal:300, progress:198
  });
  const after = furnace.tick(start);
  assert.equal(after.burn,0);
  assert.equal(after.progress,199);
  assert.equal(after.output,null);
});

test('smelting completes on the last available burning tick', () => {
  const after = furnace.tick({
    input:{id:'sand',count:1}, burn:1,burnTotal:300,progress:199
  });
  assert.deepEqual(after.output,{id:'glass',count:1});
  assert.equal(after.input,null);
  assert.equal(after.burn,0);
  assert.equal(after.progress,0);
});

test('without fuel, partial cooking cools rather than advancing', () => {
  const after = furnace.tick({
    input:{id:'sand',count:1}, burn:0, progress:199
  });
  assert.equal(after.progress,197);
  assert.equal(after.output,null);
});

test('unfueled progress eventually cools completely without creating output', () => {
  let state = {input:{id:'sand',count:1}, burn:0, progress:199};
  for (let i=0; i<110; i++) {
    state = furnace.tick(state);
    assert.equal(state.output,null);
  }
  assert.equal(state.progress,0);
  assert.deepEqual(state.input,{id:'sand',count:1});
});
