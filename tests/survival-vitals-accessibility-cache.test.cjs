const test = require('node:test');
const assert = require('node:assert/strict');
const hud = require('../survival-vitals.js');

function container() {
  const attrs = {};
  const doc = {
    createElement() {
      return {
        dataset: {},
        style: { setProperty() {} },
        setAttribute(name, value) { this[name] = value; }
      };
    }
  };
  return {
    ownerDocument: doc,
    dataset: {},
    children: [],
    attrs,
    setAttribute(name, value) { attrs[name] = value; },
    replaceChildren(...nodes) { this.children = nodes; }
  };
}

test('cached HUD repairs missing or stale accessibility metadata without repainting', () => {
  const target = container();
  assert.equal(hud.update(target, 'health', 19), true);
  assert.equal(target.children.length, 10);
  assert.equal(target.children[9].className.includes('mw-vital-half'), true);
  const nodes = target.children;
  target.attrs['aria-label'] = 'stale';
  target.attrs.role = 'none';
  assert.equal(hud.update(target, 'health', 19), true);
  assert.equal(target.children, nodes);
  assert.equal(target.attrs.role, 'img');
  assert.equal(target.attrs['aria-label'], 'Health: 19 of 20');
});

test('changing kind refreshes accessible label and icon classes', () => {
  const target = container();
  hud.update(target, 'health', 20);
  hud.update(target, 'hunger', 1);
  assert.equal(target.attrs['aria-label'], 'Food: 1 of 20');
  assert.equal(target.children[0].className.includes('mw-vital-half'), true);
  assert.equal(target.children[1].className.includes('mw-vital-empty'), true);
});
