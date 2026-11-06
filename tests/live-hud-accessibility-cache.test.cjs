// Regression: live HUD cache must repair accessibility metadata without repainting.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync(require('node:path').join(__dirname,'..','index.html'),'utf8');
test('cached live survival HUD restores role and numeric accessible label',()=>{
  const match=html.match(/if\(!packChanged&&node\.dataset\.mwStatSignature===signature\)\{([\s\S]*?)\n      \}/);
  assert.ok(match,'cache fast path must have an accessibility repair branch');
  assert.match(match[1],/setAttribute\('role','img'\)/);
  assert.match(match[1],/setAttribute\('aria-label',/);
  assert.match(match[1],/kind\+': '\+points\+' of 20'/);
  assert.ok(match[1].indexOf("setAttribute('aria-label'")<match[1].indexOf('return;'));
});
