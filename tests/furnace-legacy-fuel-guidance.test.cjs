'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../furnace-ui.js'), 'utf8');
const engineSource = fs.readFileSync(path.join(__dirname, '../furnace-engine.js'), 'utf8');
function guidance(machine, status) {
  const context = { window: {} };
  vm.runInNewContext(engineSource, context, { filename: 'furnace-engine.js' });
  // Exercise the production guidance and the same status decision used by render().
  const instrumented = source.replace(/\}\)\(\);\s*$/, [
    'window.__furnaceGuidance = (machine, status) => ({',
    '  hint: status?.idleReason === "invalid_fuel_stack" ?',
    '    furnaceWorkState(machine) : furnaceWorkState(machine)',
    '});',
    '})();'
  ].join('\n'));
  assert.notEqual(instrumented, source, 'UI test hook must attach to the real module');
  vm.runInNewContext(instrumented, context, { filename: 'furnace-ui.js' });
  return context.window.__furnaceGuidance(machine, status).hint;
}
const machine = fuel => ({
  kind: 'furnace', input: { key: 'block:4', qty: 1 },
  fuel, output: null, burn: 0, burnTotal: 0, progress: 0
});

test('legacy stacked lava buckets receive actionable withdrawal guidance', () => {
  assert.match(guidance(machine({ key: 'lavaBucket', qty: 2 }),
    { idleReason: 'invalid_fuel_stack' }), /excess lava buckets.*only one/i);
});
test('legacy stacked boats receive generic nonstackable withdrawal guidance', () => {
  assert.match(guidance(machine({ key: 'boat', qty: 3 }),
    { idleReason: 'invalid_fuel_stack' }), /excess nonstackable fuel/i);
});
test('unsupported saved fuel remains withdrawable with a clear explanation', () => {
  assert.match(guidance(machine({ key: 'customFuel', qty: 1 }),
    { idleReason: 'invalid_fuel' }), /Unknown fuel item.*Take it/i);
});

test('legacy stacked wooden tools receive nonstackable recovery guidance', () => {
  assert.match(guidance(machine({ key: 'wooden_pickaxe', qty: 2 }),
    { idleReason: 'invalid_fuel_stack' }), /excess nonstackable fuel/i);
});

test('wooden tool fuel is accepted one at a time and cooks without duplication', () => {
  const context = { window: {} };
  vm.runInNewContext(engineSource, context, { filename: 'furnace-engine.js' });
  const api = context.window.MineWorldFurnace;
  const furnace = api.create();
  const p = { dimension: 'overworld', x: 12, y: 63, z: 12 };
  furnace.ensure(p, 'furnace');
  assert.equal(api.slotCapacity('fuel', 'wooden_pickaxe'), 1);
  assert.equal(furnace.insert(p, 'input', 'block:4', 1), 1);
  assert.equal(furnace.insert(p, 'fuel', 'wooden_pickaxe', 2), 1);
  assert.equal(furnace.insert(p, 'fuel', 'wooden_pickaxe', 1), 0);
  assert.equal(furnace.tick(10).completed, 1);
  assert.equal(furnace.get(p).output.key, 'block:9');
  assert.equal(furnace.get(p).output.qty, 1);
  assert.equal(furnace.get(p).fuel, null);
});
test('legacy stacked wooden tools remain withdrawable and cannot ignite', () => {
  const context = { window: {} };
  vm.runInNewContext(engineSource, context, { filename: 'furnace-engine.js' });
  const furnace = context.window.MineWorldFurnace.create();
  const p = { dimension: 'overworld', x: 13, y: -64, z: 12 };
  furnace.restore([{ ...p, kind: 'furnace', input: {key:'block:4',qty:1},
    fuel: {key:'wooden_pickaxe',qty:2}, burn:0, burnTotal:0, progress:0 }]);
  assert.equal(furnace.status(p).idleReason, 'invalid_fuel_stack');
  assert.equal(furnace.tick(20).completed, 0);
  assert.equal(furnace.get(p).fuel.qty, 2);
  assert.equal(furnace.take(p,'fuel',1).qty, 1);
  assert.equal(furnace.tick(10).completed, 1);
});
