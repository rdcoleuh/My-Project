const test = require('node:test');
const assert = require('node:assert/strict');
const hud = require('../survival-vitals.js');

function fixture() {
  const target = {
    dataset: {}, children: [], attrs: {},
    ownerDocument: {
      createElement() {
        const properties = new Map();
        return {
          dataset: {}, className: '',
          style: {
            setProperty(key, value) { properties.set(key, value); },
            getPropertyValue(key) { return properties.get(key) || ''; }
          },
          setAttribute(key, value) { this[key] = value; }
        };
      }
    },
    setAttribute(key, value) { this.attrs[key] = value; },
    replaceChildren(...children) { this.children = children; this.repaints++; },
    repaints: 0
  };
  return target;
}

test('unchanged icons avoid unnecessary repaint', () => {
  const target = fixture();
  hud.update(target, 'health', 19);
  hud.update(target, 'health', 19);
  assert.equal(target.repaints, 1);
  assert.equal(target.children[9].className, 'mw-vital-icon mw-vital-health mw-vital-half');
});

test('cached update repairs tampered classes and slot metadata', () => {
  const target = fixture();
  hud.update(target, 'hunger', 3);
  target.children[0].className = 'broken';
  hud.update(target, 'hunger', 3);
  assert.equal(target.repaints, 2);
  assert.match(target.children[0].className, /mw-vital-hunger mw-vital-full/);
  target.children[1].dataset.slot = '999';
  hud.update(target, 'hunger', 3);
  assert.equal(target.repaints, 3);
  assert.equal(target.children[1].dataset.slot, '1');
});

test('cached update repairs missing imported sprite without replacing valid icons', () => {
  const target = fixture();
  const sprite = 'data:image/png;base64,AAAA';
  const sprites = { full: sprite, half: sprite, empty: sprite };
  hud.update(target, 'health', 20, sprites);
  hud.update(target, 'health', 20, sprites);
  assert.equal(target.repaints, 1);
  target.children[0].style.setProperty('--mw-vital-sprite', 'none');
  hud.update(target, 'health', 20, sprites);
  assert.equal(target.repaints, 2);
  assert.equal(target.children[0].style.getPropertyValue('--mw-vital-sprite'), 'url("' + sprite + '")');
});
