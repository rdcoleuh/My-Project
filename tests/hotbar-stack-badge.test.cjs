'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
test('survival stack badges attach to slot buttons, outside clipped item art',()=>{
 assert.match(html,/if\(survival&&count>0\)button\.appendChild\(qty\)/);
 assert.doesNotMatch(html,/if\(survival&&count>0\)(?:swatch|icon)\.appendChild\(qty\)/);
 assert.match(html,/#hotbar \.hot-item > \.hot-stack-number\{/);
 assert.match(html,/z-index:5!important/);
 assert.match(html,/overflow:hidden!important/);
});
test('stack quantities retain accessible labels and survive asynchronous icon replacement',()=>{
 assert.match(html,/button\.setAttribute\('aria-label','Slot '\+\(i\+1\)/);
 assert.match(html,/button\.setAttribute\('aria-pressed',String\(i===selection\)\)/);
 assert.match(html,/icon\.replaceChildren\(art\)/);
 assert.match(html,/if\(survival&&count>0\)button\.appendChild\(qty\)/);
});
