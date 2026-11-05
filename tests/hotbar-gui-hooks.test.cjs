/* Contract checks for user-imported hotbar GUI hooks and safe fallbacks. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const css=fs.readFileSync(path.join(__dirname,'..','java-inventory.css'),'utf8');
test('hotbar uses optional local pack slot art with no network dependency',()=>{
 assert.match(css,/background-image:var\(--mw-hotbar-slot-image,none\)!important/);
 assert.match(css,/background-repeat:no-repeat!important/);
 assert.match(css,/background-size:100% 100%!important/);
});
test('selected slot supports distinct imported GUI art and falls back to slot art',()=>{
 assert.match(css,/background-image:var\(--mw-hotbar-selected-image,var\(--mw-hotbar-slot-image,none\)\)!important/);
 assert.match(css,/#hotbar \.hot-item\.active/);
});
test('imported icons stay crisp and accessible focus remains visible',()=>{
 assert.match(css,/image-rendering:pixelated!important/);
 assert.match(css,/#hotbar \.hot-item:focus-visible/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
