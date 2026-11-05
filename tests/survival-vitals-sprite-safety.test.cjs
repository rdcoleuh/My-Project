const test = require('node:test');
const assert = require('node:assert/strict');
const hud = require('../survival-vitals.js');
function mockContainer() {
  const doc = { createElement() { return { dataset: {}, style: { values: {}, setProperty(k,v){this.values[k]=v;} }, setAttribute(){}, className:'' }; } };
  return { ownerDocument:doc, dataset:{}, children:[], attributes:{}, replaceChildren(...nodes){this.children=nodes;}, setAttribute(k,v){this.attributes[k]=v;} };
}
test('sprite URLs accept local player-imported PNG blobs/data only', () => {
  assert.equal(hud.safeSprite('blob:https://example.test/abc-123'),'blob:https://example.test/abc-123');
  assert.equal(hud.safeSprite('data:image/png;base64,iVBORw0KGgo='),'data:image/png;base64,iVBORw0KGgo=');
  for (const value of ['https://example.test/remote.png','javascript:alert(1)','data:image/svg+xml,<svg/>','blob:https://a.test/a")','']) assert.equal(hud.safeSprite(value),null);
});
test('imported sprites apply per state; absent sprites retain CSS fallback', () => {
  const c=mockContainer();
  const sprites={full:'blob:https://example.test/full',half:'blob:https://example.test/half'};
  assert.equal(hud.update(c,'health',3,sprites),true);
  assert.equal(c.children.length,10);
  assert.equal(c.children[0].dataset.importedSprite,'true');
  assert.equal(c.children[1].dataset.importedSprite,'true');
  assert.equal(c.children[2].dataset.importedSprite,undefined);
  assert.equal(c.attributes['aria-label'],'Health: 3 of 20');
  const same=c.children[0];hud.update(c,'health',3,sprites);assert.equal(c.children[0],same);
  hud.update(c,'health',3,{});assert.notEqual(c.children[0],same);
  assert.equal(c.children[0].dataset.importedSprite,undefined);
});
