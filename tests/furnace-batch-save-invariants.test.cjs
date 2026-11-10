'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const furnace = require('../furnace-core.js');

// Independent original test data; no third-party game assets.
test('furnace 300-case batch equivalence with saved timers and blocked outputs', () => {
  const inputs = ['iron_ore', 'sand', 'raw_beef'];
  const fuels = ['coal', 'planks', 'lava_bucket', 'stick'];
  for (let i = 0; i < 300; i++) {
    const original = {
      input: { id: inputs[i % inputs.length], count: 1 + i % 4 },
      fuel: i % 5 === 0 ? null : { id: fuels[i % fuels.length], count: 1 },
      output: i % 7 === 0 ? { id: 'glass', count: 64 } : null,
      burn: i % 300,
      burnTotal: 300,
      progress: i % 199
    };
    const snapshot = JSON.stringify(original);
    const batch = furnace.tick(original, 600);
    let sequential = original;
    for (let tick = 0; tick < 600; tick++) sequential = furnace.tick(sequential, 1);
    assert.deepEqual(batch, sequential, 'batch mismatch in case ' + i);
    assert.equal(JSON.stringify(original), snapshot, 'caller input mutated in case ' + i);
    const saved = JSON.parse(JSON.stringify(furnace.serialize(batch)));
    assert.deepEqual(furnace.deserialize(saved), batch, 'save mismatch in case ' + i);
  }
});
