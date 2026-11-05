const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const css = fs.readFileSync(path.join(__dirname, '..', 'survival-vitals.css'), 'utf8');
test('imported sprite styling is opt-in, never a bundled texture', () => {
  assert.match(css, /\[data-imported-sprite="true"\]/);
  assert.match(css, /var\(--mw-vital-sprite,none\)/);
  assert.doesNotMatch(css, /url\(\s*['"]?https?:/i);
});
test('imported sprite uses nearest-neighbor and preserves procedural fallback', () => {
  assert.match(css, /image-rendering:pixelated/);
  assert.match(css, /:not\(\[data-imported-sprite="true"\]\)/);
  assert.match(css, /\.mw-vital-icon::before,\.mw-vital-icon::after/);
});
