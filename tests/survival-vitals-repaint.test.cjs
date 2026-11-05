const test = require('node:test');
const assert = require('node:assert/strict');
const hud = require('../survival-vitals.js');

test('unchanged health values avoid repeated DOM replacements while changes repaint', () => {
  let paints = 0;
  const doc = {createElement() {return {className:'',dataset:{},setAttribute(){}};}};
  const box = {ownerDocument:doc,dataset:{},children:[],setAttribute(){},
    replaceChildren(...nodes){paints++;this.children=nodes;}};
  assert.equal(hud.update(box,'health',20),true);
  assert.equal(paints,1);
  for(let i=0;i<60;i++) hud.update(box,'health',20);
  assert.equal(paints,1);
  hud.update(box,'health',19);
  assert.equal(paints,2);
  assert.match(box.children[9].className,/half/);
  hud.update(box,'hunger',19);
  assert.equal(paints,3,'changing kind repaints even when points match');
});
