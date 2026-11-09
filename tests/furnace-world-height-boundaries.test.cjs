'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../furnace-engine.js'), 'utf8');
function engine() {
  const context = { window: {} };
  vm.runInNewContext(source, context, { filename: 'furnace-engine.js', timeout: 2000 });
  return context.window.MineWorldFurnace.create();
}
const at = (y, x = -9999, z = 9999) => ({ dimension: 'overworld', x, y, z });

test('world-height boundary furnaces remain independent across saves', () => {
  const e = engine();
  const bottom = at(-64), top = at(319);
  assert.ok(e.ensure(bottom, 'furnace'));
  assert.ok(e.ensure(top, 'furnace'));
  assert.equal(e.insert(bottom, 'input', 'block:4', 2), 2);
  assert.equal(e.insert(top, 'input', 'block:61', 1), 1);
  assert.equal(e.insert(bottom, 'fuel', 'coal', 1), 1);
  assert.equal(e.insert(top, 'fuel', 'coal', 1), 1);
  const saved = JSON.parse(JSON.stringify(e.snapshot()));
  const loaded = engine();
  loaded.restore(saved);
  assert.equal(loaded.tick(10).completed, 2);
  assert.equal(loaded.status(bottom).output.key, 'block:9');
  assert.equal(loaded.status(top).output.key, 'block:3');
  assert.equal(loaded.status(bottom).input.qty, 1);
});

test('invalid vertical coordinates never create furnace state', () => {
  const e = engine();
  for (const y of [-65, 320, 0.5, NaN, Infinity]) {
    assert.equal(e.ensure(at(y), 'furnace'), null);
    assert.equal(e.insert(at(y), 'input', 'block:4', 1), 0);
  }
  assert.equal(e.snapshot().length, 0);
});

test('fuel-free boundary furnace cannot create output from saved progress', () => {
  const e = engine(), p = at(-64);
  e.restore([{ ...p, kind: 'furnace', input: { key: 'block:4', qty: 1 },
    fuel: null, output: null, burn: 0, burnTotal: 0, progress: 9 }]);
  assert.equal(e.tick(30).completed, 0);
  assert.equal(e.get(p).progress, 0);
  assert.equal(e.get(p).output, null);
});
