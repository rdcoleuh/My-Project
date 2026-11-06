const test = require('node:test');
const assert = require('node:assert/strict');
const furnace = require('../furnace-core.js');

test('dried kelp block provides exactly 4000 fuel ticks', () => {
  assert.equal(furnace.FUELS.dried_kelp_block, 4000);
});

test('one dried kelp block smelts exactly twenty items', () => {
  const initial = { input: { id: 'sand', count: 21 }, fuel: { id: 'dried_kelp_block', count: 1 } };
  const after = furnace.tick(initial, 4000);
  assert.deepEqual(after.output, { id: 'glass', count: 20 });
  assert.deepEqual(after.input, { id: 'sand', count: 1 });
  assert.equal(after.burn, 0);
  assert.equal(after.fuel, null);
  const cooled = furnace.tick(after, 200);
  assert.equal(cooled.output.count, 20);
  assert.equal(cooled.input.count, 1);
});
