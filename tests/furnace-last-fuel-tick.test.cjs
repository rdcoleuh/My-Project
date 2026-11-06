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

test('without fuel or stored burn progress does not advance', () => {
  const after = furnace.tick({
    input:{id:'sand',count:1}, burn:0, progress:199
  });
  assert.equal(after.progress,0);
  assert.equal(after.output,null);
});
