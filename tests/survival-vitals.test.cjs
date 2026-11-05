const test = require('node:test');
const assert = require('node:assert/strict');
const hud = require('../survival-vitals.js');

test('ten icons represent full, half and empty points', () => {
  assert.equal(hud.iconStates(20).length, 10);
  assert.deepEqual(hud.iconStates(20), Array(10).fill('full'));
  assert.deepEqual(hud.iconStates(19), [...Array(9).fill('full'), 'half']);
  assert.deepEqual(hud.iconStates(1), ['half', ...Array(9).fill('empty')]);
  assert.deepEqual(hud.iconStates(0), Array(10).fill('empty'));
});
test('values are clamped and non-finite values cannot corrupt HUD', () => {
  assert.equal(hud.clampPoints(900), 20);
  assert.equal(hud.clampPoints(-5), 0);
  assert.equal(hud.clampPoints(NaN), 0);
  assert.equal(hud.clampPoints(Infinity), 0);
  assert.equal(hud.clampPoints(7.9), 7);
});
test('accessible rendering replaces nodes rather than accumulating them', () => {
  const doc = { createElement() { return { className:'', dataset:{}, attributes:{}, setAttribute(k,v){this.attributes[k]=v;} }; } };
  const box = { ownerDocument:doc, dataset:{}, attributes:{}, replaceChildren(...nodes){this.children=nodes;}, setAttribute(k,v){this.attributes[k]=v;} };
  assert.equal(hud.update(box,'health',19),true);
  assert.equal(box.children.length,10);
  assert.equal(box.children[9].className,'mw-vital-icon mw-vital-health mw-vital-half');
  assert.equal(box.attributes['aria-label'],'Health: 19 of 20');
  hud.update(box,'hunger',3);
  assert.equal(box.children.length,10);
  assert.equal(box.attributes['aria-label'],'Food: 3 of 20');
  assert.equal(box.children[1].className,'mw-vital-icon mw-vital-hunger mw-vital-half');
});
